import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerClient } from "@/lib/supabase/server";
import { z } from "zod";

// ─── Constantes locales ────────────────────────────────────────────
const VALID_METHODS = ["especes", "carte", "mobile_money", "virement", "cheque"] as const;
const VALID_STATUSES = ["en_attente", "payee", "annulee", "remboursee"] as const;

// ─── Schéma de validation création paiement ─────────────────────────
const createPaymentSchema = z.object({
  reservation_id: z
    .string()
    .min(1, "L'identifiant de réservation est requis."),
  amount: z
    .number({ invalid_type_error: "Le montant doit être un nombre." })
    .int("Le montant doit être un entier.")
    .min(1, "Le montant minimum est 1 FCFA.")
    .max(50_000_000, "Le montant maximum est 50 000 000 FCFA."),
  method: z.enum(VALID_METHODS, {
    errorMap: () => ({ message: "Méthode de paiement invalide." }),
  }),
  status: z.enum(VALID_STATUSES).default("payee"),
  reference: z
    .string()
    .max(100, "La référence ne doit pas dépasser 100 caractères.")
    .nullable()
    .optional(),
  paid_by: z
    .string()
    .max(200, "Le nom du payeur ne doit pas dépasser 200 caractères.")
    .nullable()
    .optional(),
  notes: z
    .string()
    .max(500, "Les notes ne doivent pas dépasser 500 caractères.")
    .nullable()
    .optional(),
});

type CreatePaymentBody = z.infer<typeof createPaymentSchema>;

// ─── Helper : vérification auth + rôle + hotel_id ──────────────────
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
      error: NextResponse.json({ error: "Accès non autorisé." }, { status: 403 }),
    };
  }

  if (!profile.hotel_id) {
    return { error: NextResponse.json({ error: "Aucun hôtel rattaché." }, { status: 403 }) };
  }

  return { user, admin, profile, hotelId: profile.hotel_id };
}

// ─── GET /api/hotel-admin/payments ──────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const result = await verifyHotelAccess();
    if (result.error) return result.error;
    const { admin, hotelId } = result;

    const { searchParams } = new URL(request.url);
    const reservation_id = searchParams.get("reservation_id")?.trim() || "";
    const guest_id = searchParams.get("guest_id")?.trim() || "";
    const method = searchParams.get("method") || "";
    const status = searchParams.get("status") || "";
    const date_from = searchParams.get("date_from")?.trim() || "";
    const date_to = searchParams.get("date_to")?.trim() || "";

    // ─── Query de base avec jointures ──────────────────────────────
    let query = admin
      .from("payments")
      .select(`
        *,
        reservation:reservations!inner(
          id,
          guest_name,
          room_id,
          rooms(
            number
          )
        )
      `)
      .eq("hotel_id", hotelId)
      .order("paid_at", { ascending: false });

    // ─── Filtres ─────────────────────────────────────────────────
    if (reservation_id) {
      query = query.eq("reservation_id", reservation_id);
    }
    if (guest_id) {
      query = query.eq("guest_id", guest_id);
    }
    if (method && VALID_METHODS.includes(method as typeof VALID_METHODS[number])) {
      query = query.eq("method", method);
    }
    if (status && VALID_STATUSES.includes(status as typeof VALID_STATUSES[number])) {
      query = query.eq("status", status);
    }
    if (date_from) {
      query = query.gte("paid_at", date_from);
    }
    if (date_to) {
      query = query.lte("paid_at", date_to);
    }

    const { data: payments, error } = await query;

    if (error) {
      console.error("Erreur récupération paiements:", error);
      return NextResponse.json(
        { error: "Impossible de charger les paiements." },
        { status: 500 }
      );
    }

    // ─── Calcul du total ─────────────────────────────────────────
    const total = (payments ?? []).reduce((sum: number, p: { amount: number }) => sum + p.amount, 0);

    return NextResponse.json(
      {
        payments: payments ?? [],
        total,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur liste paiements:", error);
    return NextResponse.json({ error: "Une erreur inattendue s'est produite." }, { status: 500 });
  }
}

// ─── POST /api/hotel-admin/payments ─────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyHotelAccess();
    if (authResult.error) return authResult.error;
    const { user, admin, profile, hotelId } = authResult;

    // ─── Valider le corps de la requête ───────────────────────────
    let body: CreatePaymentBody;
    try {
      const raw = await request.json();
      body = createPaymentSchema.parse(raw);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return NextResponse.json(
          { error: "Données invalides.", details: err.flatten().fieldErrors },
          { status: 400 }
        );
      }
      return NextResponse.json({ error: "Corps de requête invalide." }, { status: 400 });
    }

    // ─── 1. Vérifier que la réservation existe et appartient à l'hôtel ─
    const { data: reservation, error: reservationError } = await admin
      .from("reservations")
      .select("id, hotel_id, guest_id, total_amount, paid_amount, status")
      .eq("id", body.reservation_id)
      .single();

    if (reservationError || !reservation) {
      return NextResponse.json(
        { error: "Réservation introuvable." },
        { status: 404 }
      );
    }

    if (reservation.hotel_id !== hotelId) {
      return NextResponse.json(
        { error: "Cette réservation n'appartient pas à votre hôtel." },
        { status: 403 }
      );
    }

    // ─── 2-3. Vérifier le montant par rapport au solde ─────────────
    const currentPaid = reservation.paid_amount ?? 0;
    const totalAmount = reservation.total_amount ?? 0;
    const newPaidAmount = currentPaid + body.amount;
    const isOverpayment = newPaidAmount > totalAmount;

    // ─── 4. Insérer le paiement ────────────────────────────────────
    const { data: payment, error: insertError } = await admin
      .from("payments")
      .insert({
        hotel_id: hotelId,
        reservation_id: body.reservation_id,
        guest_id: reservation.guest_id,
        amount: body.amount,
        method: body.method,
        status: body.status ?? "payee",
        reference: body.reference?.trim() || null,
        paid_by: body.paid_by?.trim() || null,
        paid_at: new Date().toISOString(),
        notes: body.notes?.trim() || null,
      })
      .select("*")
      .single();

    if (insertError) {
      console.error("Erreur création paiement:", insertError);
      return NextResponse.json(
        { error: "Impossible d'enregistrer le paiement." },
        { status: 500 }
      );
    }

    // ─── 5. Mettre à jour le paid_amount de la réservation ────────
    const { error: updateError } = await admin
      .from("reservations")
      .update({ paid_amount: newPaidAmount })
      .eq("id", body.reservation_id);

    if (updateError) {
      console.error("Erreur mise à jour paid_amount:", updateError);
      return NextResponse.json(
        { error: "Paiement enregistré mais erreur de mise à jour du solde." },
        { status: 500 }
      );
    }

    // ─── 6. Journal : paiement intégralement payé ─────────────────
    const isFullyPaid = newPaidAmount >= totalAmount;
    if (isFullyPaid && reservation.status === "en_cours") {
      await admin.from("activity_logs").insert({
        hotel_id: hotelId,
        user_id: user.id,
        user_role: profile.role,
        action: "update",
        entity_type: "reservation",
        entity_id: body.reservation_id,
        details: {
          info: "Réservation entièrement payée",
          reservation_id: body.reservation_id,
          paid_amount: newPaidAmount,
          total_amount: totalAmount,
          created_by: profile.full_name,
        },
      });
    }

    // ─── Journal d'activité : création du paiement ─────────────────
    await admin.from("activity_logs").insert({
      hotel_id: hotelId,
      user_id: user.id,
      user_role: profile.role,
      action: "create",
      entity_type: "payment",
      entity_id: payment.id,
      details: {
        reservation_id: body.reservation_id,
        amount: body.amount,
        method: body.method,
        status: body.status ?? "payee",
        reference: body.reference?.trim() || null,
        created_by: profile.full_name,
      },
    });

    // ─── Réponse ──────────────────────────────────────────────────
    const remaining = Math.max(0, totalAmount - newPaidAmount);

    return NextResponse.json(
      {
        message: isOverpayment
          ? "Paiement enregistré. Attention : le montant dépasse le solde restant de la réservation."
          : "Paiement enregistré avec succès.",
        payment,
        reservation: {
          paid_amount: newPaidAmount,
          total_amount: totalAmount,
          remaining,
        },
        ...(isOverpayment && { warning: `Le montant payé (${body.amount} FCFA) dépasse le solde restant (${totalAmount - currentPaid} FCFA).` }),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erreur création paiement:", error);
    return NextResponse.json({ error: "Une erreur inattendue s'est produite." }, { status: 500 });
  }
}
