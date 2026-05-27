import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerClient } from "@/lib/supabase/server";
import { z } from "zod";

// ─── Schéma de validation ─────────────────────────────────────────────
const createEmployeeSchema = z.object({
  email: z
    .string()
    .email("Adresse email invalide.")
    .min(5, "L'email est trop court."),
  full_name: z
    .string()
    .min(2, "Le nom complet doit contenir au moins 2 caractères.")
    .max(100, "Le nom complet ne doit pas dépasser 100 caractères."),
  phone: z
    .string()
    .max(20, "Le numéro de téléphone est trop long.")
    .nullable()
    .optional(),
  role: z.enum(["manager", "receptionist"], {
    message: "Le rôle doit être 'manager' ou 'réceptionniste'.",
  }),
  password: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères.")
    .max(64, "Le mot de passe est trop long."),
});

type CreateEmployeeBody = z.infer<typeof createEmployeeSchema>;

// ─── Générer un mot de passe aléatoire sécurisé ────────────────────────
function generateSecurePassword(length = 12): string {
  const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lower = "abcdefghijklmnopqrstuvwxyz";
  const digits = "0123456789";
  const special = "!@#$%&*";
  const all = upper + lower + digits + special;

  // Garantir au moins un de chaque type
  let pwd = "";
  pwd += upper[Math.floor(Math.random() * upper.length)];
  pwd += lower[Math.floor(Math.random() * lower.length)];
  pwd += digits[Math.floor(Math.random() * digits.length)];
  pwd += special[Math.floor(Math.random() * special.length)];

  // Compléter le reste
  for (let i = pwd.length; i < length; i++) {
    pwd += all[Math.floor(Math.random() * all.length)];
  }

  // Mélanger (Fisher-Yates)
  const arr = pwd.split("");
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  return arr.join("");
}

// ─── Helper : vérification commune auth + rôle + hotel_id ──────────────
async function verifyHotelAdmin() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: NextResponse.json({ error: "Non authentifié." }, { status: 401 }) };

  const admin = createAdminClient();
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("role, hotel_id, full_name")
    .eq("id", user.id)
    .single();

  if (profileError || !profile || profile.role !== "hotel_admin") {
    return { error: NextResponse.json({ error: "Accès réservé à l'administrateur de l'hôtel." }, { status: 403 }) };
  }

  if (!profile.hotel_id) {
    return { error: NextResponse.json({ error: "Aucun hôtel rattaché." }, { status: 403 }) };
  }

  return { user, admin, profile, hotelId: profile.hotel_id };
}

// ─── GET /api/hotel-admin/employees ──────────────────────────────────
// Retourne la liste des employés + informations de quota
export async function GET() {
  try {
    const result = await verifyHotelAdmin();
    if (result.error) return result.error;
    const { admin, hotelId } = result;

    // ─── Récupérer les employés + abonnement en parallèle ─────────
    const [employeesRes, subscriptionRes] = await Promise.all([
      admin
        .from("profiles")
        .select("id, email, full_name, phone, role, is_active, created_at, avatar_url")
        .eq("hotel_id", hotelId)
        .neq("role", "hotel_admin")
        .order("created_at", { ascending: false }),

      admin
        .from("subscriptions")
        .select("max_users, plans(max_users)")
        .eq("hotel_id", hotelId)
        .in("status", ["active", "trial"])
        .order("created_at", { ascending: false })
        .limit(1)
        .single(),
    ]);

    const employees = employeesRes.data ?? [];
    const activeCount = employees.filter((e: { is_active: boolean }) => e.is_active).length;
    const totalCount = employees.length;

    let maxUsers = 2;
    if (subscriptionRes.data) {
      maxUsers = (subscriptionRes.data as { max_users: number }).max_users;
    }

    return NextResponse.json(
      {
        employees,
        quota: {
          used: totalCount,
          active: activeCount,
          max: maxUsers,
          remaining: Math.max(0, maxUsers - totalCount),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur liste employés:", error);
    return NextResponse.json({ error: "Une erreur inattendue s'est produite." }, { status: 500 });
  }
}

// ─── POST /api/hotel-admin/employees ──────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyHotelAdmin();
    if (authResult.error) return authResult.error;
    const { user, admin, profile, hotelId } = authResult;

    // ─── Valider le corps de la requête ───────────────────────────
    let body: CreateEmployeeBody;
    try {
      const raw = await request.json();
      body = createEmployeeSchema.parse(raw);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return NextResponse.json(
          {
            error: "Données invalides.",
            details: err.flatten().fieldErrors,
          },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: "Corps de requête invalide." },
        { status: 400 }
      );
    }

    // ─── Vérifier le quota d'utilisateurs ─────────────────────────
    const [existingCountRes, subscriptionRes] = await Promise.all([
      // Nombre d'utilisateurs actuels de l'hôtel (tous rôles sauf hotel_admin)
      admin
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("hotel_id", hotelId)
        .neq("role", "hotel_admin"),

      // Abonnement actif pour le quota
      admin
        .from("subscriptions")
        .select("max_users")
        .eq("hotel_id", hotelId)
        .in("status", ["active", "trial"])
        .order("created_at", { ascending: false })
        .limit(1)
        .single(),
    ]);

    const currentCount = existingCountRes.count ?? 0;
    let maxUsers = 2; // par défaut

    if (subscriptionRes.data) {
      maxUsers = (subscriptionRes.data as { max_users: number }).max_users;
    }

    if (currentCount >= maxUsers) {
      return NextResponse.json(
        {
          error: `Quota d'utilisateurs atteint (${currentCount}/${maxUsers}). Veuillez mettre à niveau votre abonnement.`,
          quota: { used: currentCount, max: maxUsers },
        },
        { status: 403 }
      );
    }

    // ─── Vérifier que l'email n'est pas déjà utilisé ─────────────
    const { data: existingProfile } = await admin
      .from("profiles")
      .select("id, email, hotel_id")
      .eq("email", body.email.toLowerCase().trim())
      .single();

    if (existingProfile) {
      if (existingProfile.hotel_id === hotelId) {
        return NextResponse.json(
          { error: "Cet email est déjà utilisé dans votre hôtel." },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: "Cet email est déjà utilisé par un autre utilisateur." },
        { status: 409 }
      );
    }

    // ─── Déterminer le mot de passe ───────────────────────────────
    const password = body.password || generateSecurePassword();

    // ─── Créer l'utilisateur Auth + Profil ────────────────────────
    const { data: authUser, error: authError } = await admin.auth.admin.createUser({
      email: body.email.toLowerCase().trim(),
      password,
      email_confirm: true,
      user_metadata: {
        full_name: body.full_name.trim(),
      },
    });

    if (authError || !authUser) {
      console.error("Erreur création auth user:", authError);

      // Gérer les erreurs spécifiques
      if (authError?.message?.includes("already registered")) {
        return NextResponse.json(
          { error: "Cet email est déjà enregistré." },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: "Impossible de créer le compte utilisateur." },
        { status: 500 }
      );
    }

    // ─── Mettre à jour le profil avec hotel_id + rôle ─────────────
    const { error: updateError } = await admin
      .from("profiles")
      .update({
        role: body.role,
        hotel_id: hotelId,
        full_name: body.full_name.trim(),
        phone: body.phone?.trim() || null,
        is_active: true,
      })
      .eq("id", authUser.user.id);

    if (updateError) {
      console.error("Erreur mise à jour profil:", updateError);
      // Tenter de nettoyer l'utilisateur créé
      await admin.auth.admin.deleteUser(authUser.user.id);
      return NextResponse.json(
        { error: "Impossible de finaliser la création du profil." },
        { status: 500 }
      );
    }

    // ─── Journal d'activité ──────────────────────────────────────
    await admin.from("activity_logs").insert({
      hotel_id: hotelId,
      user_id: user.id,
      user_role: "hotel_admin",
      action: "create",
      entity_type: "employee",
      entity_id: authUser.user.id,
      details: {
        employee_email: body.email.toLowerCase().trim(),
        employee_name: body.full_name.trim(),
        employee_role: body.role,
        created_by: profile.full_name,
      },
    });

    // ─── Réponse : retourner les infos SANS le mot de passe en clair
    // Le mot de passe n'est renvoyé que si c'est un auto-généré
    return NextResponse.json(
      {
        message: `Employé ${body.full_name.trim()} créé avec succès.`,
        employee: {
          id: authUser.user.id,
          email: body.email.toLowerCase().trim(),
          full_name: body.full_name.trim(),
          role: body.role,
          is_active: true,
          created_at: new Date().toISOString(),
        },
        // Ne renvoyer le mot de passe que s'il a été auto-généré
        ...(body.password ? {} : { generated_password: password }),
        quota: {
          used: currentCount + 1,
          max: maxUsers,
          remaining: Math.max(0, maxUsers - (currentCount + 1)),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erreur création employé:", error);
    return NextResponse.json(
      { error: "Une erreur inattendue s'est produite." },
      { status: 500 }
    );
  }
}
