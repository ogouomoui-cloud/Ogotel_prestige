import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerClient } from "@/lib/supabase/server";
import { z } from "zod";

// ─── Schéma de validation modification ────────────────────────────────
const updateGuestSchema = z.object({
  first_name: z
    .string()
    .min(2, "Le prénom doit contenir au moins 2 caractères.")
    .max(100, "Le prénom est trop long.")
    .optional(),
  last_name: z
    .string()
    .min(2, "Le nom doit contenir au moins 2 caractères.")
    .max(100, "Le nom est trop long.")
    .optional(),
  phone: z
    .string()
    .min(1, "Le numéro de téléphone est requis.")
    .max(20, "Le numéro de téléphone est trop long.")
    .optional(),
  email: z
    .string()
    .email("Adresse e-mail invalide.")
    .max(255, "L'adresse e-mail est trop longue.")
    .nullable()
    .optional(),
  nationality: z
    .string()
    .max(100, "La nationalité est trop longue.")
    .optional(),
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
  is_vip: z.boolean().optional(),
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

// ─── GET /api/hotel-admin/clients/[id] ────────────────────────────────
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const result = await verifyHotelAccess();
    if (result.error) return result.error;
    const { admin, hotelId } = result;
    const { id } = await params;

    // ─── Récupérer le client ──────────────────────────────────────
    const { data: guest, error } = await admin
      .from("guests")
      .select("*")
      .eq("id", id)
      .eq("hotel_id", hotelId)
      .single();

    if (error || !guest) {
      return NextResponse.json({ error: "Client introuvable." }, { status: 404 });
    }

    // ─── Statistiques du client ───────────────────────────────────
    const { count: totalReservations } = await admin
      .from("reservations")
      .select("id", { count: "exact", head: true })
      .eq("guest_id", id)
      .eq("hotel_id", hotelId);

    const { data: payments } = await admin
      .from("payments")
      .select("amount")
      .eq("guest_id", id)
      .eq("hotel_id", hotelId)
      .eq("status", "payee");

    const totalSpent = payments?.reduce((sum: number, p: { amount: number }) => sum + p.amount, 0) ?? 0;

    const { data: reservationNights } = await admin
      .from("reservations")
      .select("number_of_nights")
      .eq("guest_id", id)
      .eq("hotel_id", hotelId)
      .in("status", ["confirmee", "en_cours", "terminee"]);

    const totalNights = reservationNights?.reduce(
      (sum: number, r: { number_of_nights: number }) => sum + r.number_of_nights,
      0
    ) ?? 0;

    return NextResponse.json(
      {
        guest,
        stats: {
          total_reservations: totalReservations ?? 0,
          total_spent: totalSpent,
          total_nights: totalNights,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur récupération client:", error);
    return NextResponse.json(
      { error: "Une erreur inattendue s'est produite." },
      { status: 500 }
    );
  }
}

// ─── PUT /api/hotel-admin/clients/[id] ────────────────────────────────
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await verifyHotelAccess();
    if (authResult.error) return authResult.error;
    const { user, admin, profile, hotelId } = authResult;
    const { id } = await params;

    // ─── Vérifier que le client existe et appartient à l'hôtel ─────
    const { data: existingGuest, error: fetchError } = await admin
      .from("guests")
      .select("*")
      .eq("id", id)
      .eq("hotel_id", hotelId)
      .single();

    if (fetchError || !existingGuest) {
      return NextResponse.json({ error: "Client introuvable." }, { status: 404 });
    }

    // ─── Valider le corps de la requête ───────────────────────────
    const raw = await request.json();
    const parsed = updateGuestSchema.safeParse(raw);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides.", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (parsed.data.first_name !== undefined) updateData.first_name = parsed.data.first_name.trim();
    if (parsed.data.last_name !== undefined) updateData.last_name = parsed.data.last_name.trim();
    if (parsed.data.phone !== undefined) updateData.phone = parsed.data.phone.trim();
    if (parsed.data.email !== undefined) updateData.email = parsed.data.email?.trim() || null;
    if (parsed.data.nationality !== undefined) updateData.nationality = parsed.data.nationality.trim();
    if (parsed.data.city !== undefined) updateData.city = parsed.data.city?.trim() || null;
    if (parsed.data.id_document_type !== undefined)
      updateData.id_document_type = parsed.data.id_document_type?.trim() || null;
    if (parsed.data.id_document_number !== undefined)
      updateData.id_document_number = parsed.data.id_document_number?.trim() || null;
    if (parsed.data.notes !== undefined) updateData.notes = parsed.data.notes?.trim() || null;
    if (parsed.data.is_vip !== undefined) updateData.is_vip = parsed.data.is_vip;

    // ─── Mettre à jour le client ──────────────────────────────────
    const { data: guest, error: updateError } = await admin
      .from("guests")
      .update(updateData)
      .eq("id", id)
      .select("*")
      .single();

    if (updateError) {
      console.error("Erreur mise à jour client:", updateError);
      return NextResponse.json(
        { error: "Impossible de mettre à jour le client." },
        { status: 500 }
      );
    }

    // ─── Journal d'activité ──────────────────────────────────────
    const changedFields = Object.keys(parsed.data);
    await admin.from("activity_logs").insert({
      hotel_id: hotelId,
      user_id: user.id,
      user_role: profile.role,
      action: "update",
      entity_type: "guest",
      entity_id: id,
      details: {
        guest_name: `${existingGuest.first_name} ${existingGuest.last_name}`,
        changed_fields: changedFields,
        old_values: {
          first_name: existingGuest.first_name,
          last_name: existingGuest.last_name,
          phone: existingGuest.phone,
          email: existingGuest.email,
          is_vip: existingGuest.is_vip,
        },
        new_values: {
          first_name: guest.first_name,
          last_name: guest.last_name,
          phone: guest.phone,
          email: guest.email,
          is_vip: guest.is_vip,
        },
        updated_by: profile.full_name,
      },
    });

    return NextResponse.json(
      {
        message: `Client ${guest.first_name} ${guest.last_name} mis à jour.`,
        guest,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur mise à jour client:", error);
    return NextResponse.json(
      { error: "Une erreur inattendue s'est produite." },
      { status: 500 }
    );
  }
}
