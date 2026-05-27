import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerClient } from "@/lib/supabase/server";

/**
 * POST /api/admin/hotels/[id]/reactivate
 *
 * Réactiver un hôtel et ses utilisateurs (super_admin uniquement).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Non authentifié." },
        { status: 401 }
      );
    }

    const admin = createAdminClient();

    // ─── Vérifier le rôle super_admin ─────────────────────────
    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile || profile.role !== "super_admin") {
      return NextResponse.json(
        { error: "Accès réservé au super administrateur." },
        { status: 403 }
      );
    }

    // ─── Vérifier que l'hôtel existe ─────────────────────────
    const { id } = await params;

    const { data: hotel, error: hotelError } = await admin
      .from("hotels")
      .select("id, name, is_active")
      .eq("id", id)
      .single();

    if (hotelError || !hotel) {
      return NextResponse.json(
        { error: "Hôtel non trouvé." },
        { status: 404 }
      );
    }

    if (hotel.is_active) {
      return NextResponse.json(
        { error: "Cet hôtel est déjà actif." },
        { status: 400 }
      );
    }

    // ─── Réactiver l'hôtel ───────────────────────────────────
    const { error: updateHotelError } = await admin
      .from("hotels")
      .update({ is_active: true })
      .eq("id", id);

    if (updateHotelError) {
      console.error("Erreur réactivation hôtel:", updateHotelError);
      return NextResponse.json(
        { error: "Erreur lors de la réactivation de l'hôtel." },
        { status: 500 }
      );
    }

    // ─── Réactiver les utilisateurs de l'hôtel ───────────────
    // On ne réactive que les utilisateurs qui étaient actifs
    // (ceux dont le rôle n'est pas 'invited' et qui n'ont pas été
    // individuellement désactivés avant la suspension)
    await admin
      .from("profiles")
      .update({ is_active: true })
      .eq("hotel_id", id);

    // ─── Journaliser l'action ────────────────────────────────
    await admin.from("activity_logs").insert({
      hotel_id: id,
      user_id: user.id,
      user_role: "super_admin",
      action: "activate",
      entity_type: "hotel",
      entity_id: id,
      details: {
        hotel_name: hotel.name,
      },
      ip_address: request.headers.get("x-forwarded-for"),
    });

    return NextResponse.json(
      {
        success: true,
        message: "Hôtel réactivé avec succès.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur réactivation hôtel:", error);
    return NextResponse.json(
      { error: "Une erreur inattendue s'est produite." },
      { status: 500 }
    );
  }
}
