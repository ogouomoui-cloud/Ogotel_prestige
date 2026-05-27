import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerClient } from "@/lib/supabase/server";

/**
 * POST /api/admin/hotels/[id]/suspend
 *
 * Suspendre un hôtel et désactiver tous ses utilisateurs (super_admin uniquement).
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

    if (!hotel.is_active) {
      return NextResponse.json(
        { error: "Cet hôtel est déjà suspendu." },
        { status: 400 }
      );
    }

    // ─── Parser le body ───────────────────────────────────────
    const body = await request.json().catch(() => ({}));
    const { reason } = body as { reason?: string };

    // ─── Suspendre l'hôtel ───────────────────────────────────
    const { error: updateHotelError } = await admin
      .from("hotels")
      .update({ is_active: false })
      .eq("id", id);

    if (updateHotelError) {
      console.error("Erreur suspension hôtel:", updateHotelError);
      return NextResponse.json(
        { error: "Erreur lors de la suspension de l'hôtel." },
        { status: 500 }
      );
    }

    // ─── Désactiver tous les utilisateurs de l'hôtel ─────────
    await admin
      .from("profiles")
      .update({ is_active: false })
      .eq("hotel_id", id);

    // ─── Journaliser l'action ────────────────────────────────
    await admin.from("activity_logs").insert({
      hotel_id: id,
      user_id: user.id,
      user_role: "super_admin",
      action: "suspend",
      entity_type: "hotel",
      entity_id: id,
      details: {
        hotel_name: hotel.name,
        reason: reason || "Non spécifiée",
      },
      ip_address: request.headers.get("x-forwarded-for"),
    });

    return NextResponse.json(
      {
        success: true,
        message: "Hôtel suspendu avec succès.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur suspension hôtel:", error);
    return NextResponse.json(
      { error: "Une erreur inattendue s'est produite." },
      { status: 500 }
    );
  }
}
