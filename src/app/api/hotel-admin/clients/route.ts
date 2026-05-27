import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerClient } from "@/lib/supabase/server";
import { z } from "zod";

// ─── Schéma de validation création ────────────────────────────────────
const createGuestSchema = z.object({
  first_name: z
    .string()
    .min(2, "Le prénom doit contenir au moins 2 caractères.")
    .max(100, "Le prénom est trop long."),
  last_name: z
    .string()
    .min(2, "Le nom doit contenir au moins 2 caractères.")
    .max(100, "Le nom est trop long."),
  phone: z
    .string()
    .min(1, "Le numéro de téléphone est requis.")
    .max(20, "Le numéro de téléphone est trop long."),
  email: z
    .string()
    .email("Adresse e-mail invalide.")
    .max(255, "L'adresse e-mail est trop longue.")
    .nullable()
    .optional(),
  nationality: z
    .string()
    .max(100, "La nationalité est trop longue.")
    .default("Ivoirienne"),
  city: z
    .string()
    .max(100, "La ville est trop longue.")
    .nullable()
    .optional(),
  id_document_type: z
    .string()
    .max(50, "Le type de document est trop long.")
    .nullable()
    .optional(),
  id_document_number: z
    .string()
    .max(100, "Le numéro de document est trop long.")
    .nullable()
    .optional(),
  notes: z
    .string()
    .max(500, "Les notes ne doivent pas dépasser 500 caractères.")
    .nullable()
    .optional(),
  is_vip: z.boolean().default(false),
});

// ─── Helper : vérification auth + rôle + hotel_id ─────────────────────
// Réception : hotel_admin, manager ET receptionist
async function verifyHotelAccess() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: NextResponse.json({ error: "Non authentifié." }, { status: 401 }) };
  }

  const admin = createAdminClient();
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("role, hotel_id, full_name")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return { error: NextResponse.json({ error: "Profil introuvable." }, { status: 403 }) };
  }

  if (!["hotel_admin", "manager", "receptionist"].includes(profile.role)) {
    return {
      error: NextResponse.json(
        { error: "Accès réservé au personnel de l'hôtel." },
        { status: 403 }
      ),
    };
  }

  if (!profile.hotel_id) {
    return { error: NextResponse.json({ error: "Aucun hôtel rattaché." }, { status: 403 }) };
  }

  return { user, admin, profile, hotelId: profile.hotel_id };
}

// ─── GET /api/hotel-admin/clients ─────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const result = await verifyHotelAccess();
    if (result.error) return result.error;
    const { admin, hotelId } = result;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() || "";
    const is_vip = searchParams.get("is_vip") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));
    const offset = (page - 1) * limit;

    // ─── Query de base ────────────────────────────────────────────
    let query = admin
      .from("guests")
      .select("*", { count: "exact" })
      .eq("hotel_id", hotelId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // ─── Filtres ─────────────────────────────────────────────────
    if (search) {
      query = query.or(
        `first_name.ilike.%${search}%,last_name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`
      );
    }
    if (is_vip === "true") {
      query = query.eq("is_vip", true);
    } else if (is_vip === "false") {
      query = query.eq("is_vip", false);
    }

    const { data: guests, count, error } = await query;

    if (error) {
      console.error("Erreur récupération clients:", error);
      return NextResponse.json(
        { error: "Impossible de charger les clients." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        guests: guests ?? [],
        total: count ?? 0,
        pagination: {
          page,
          limit,
          total_pages: Math.ceil((count ?? 0) / limit),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur liste clients:", error);
    return NextResponse.json(
      { error: "Une erreur inattendue s'est produite." },
      { status: 500 }
    );
  }
}

// ─── POST /api/hotel-admin/clients ────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyHotelAccess();
    if (authResult.error) return authResult.error;
    const { user, admin, profile, hotelId } = authResult;

    // ─── Valider le corps de la requête ───────────────────────────
    let body: z.infer<typeof createGuestSchema>;
    try {
      const raw = await request.json();
      body = createGuestSchema.parse(raw);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return NextResponse.json(
          { error: "Données invalides.", details: err.flatten().fieldErrors },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: "Corps de requête invalide." },
        { status: 400 }
      );
    }

    // ─── Insérer le client ────────────────────────────────────────
    const { data: guest, error: insertError } = await admin
      .from("guests")
      .insert({
        hotel_id: hotelId,
        first_name: body.first_name.trim(),
        last_name: body.last_name.trim(),
        phone: body.phone.trim(),
        email: body.email?.trim() || null,
        nationality: body.nationality?.trim() || "Ivoirienne",
        city: body.city?.trim() || null,
        id_document_type: body.id_document_type?.trim() || null,
        id_document_number: body.id_document_number?.trim() || null,
        notes: body.notes?.trim() || null,
        is_vip: body.is_vip ?? false,
      })
      .select("*")
      .single();

    if (insertError) {
      console.error("Erreur création client:", insertError);
      return NextResponse.json(
        { error: "Impossible de créer le client." },
        { status: 500 }
      );
    }

    // ─── Journal d'activité ──────────────────────────────────────
    await admin.from("activity_logs").insert({
      hotel_id: hotelId,
      user_id: user.id,
      user_role: profile.role,
      action: "create",
      entity_type: "guest",
      entity_id: guest.id,
      details: {
        guest_name: `${body.first_name.trim()} ${body.last_name.trim()}`,
        guest_phone: body.phone.trim(),
        email: body.email?.trim() || null,
        is_vip: body.is_vip ?? false,
        created_by: profile.full_name,
      },
    });

    return NextResponse.json(
      {
        message: `Client ${body.first_name.trim()} ${body.last_name.trim()} créé avec succès.`,
        guest,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erreur création client:", error);
    return NextResponse.json(
      { error: "Une erreur inattendue s'est produite." },
      { status: 500 }
    );
  }
}
