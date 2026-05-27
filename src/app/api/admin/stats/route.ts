import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerClient } from "@/lib/supabase/server";

export async function GET() {
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
      .select("role, full_name")
      .eq("id", user.id)
      .single();

    if (profileError || !profile || profile.role !== "super_admin") {
      return NextResponse.json(
        { error: "Accès réservé au super administrateur." },
        { status: 403 }
      );
    }

    // ─── Statistiques ────────────────────────────────────────
    const [
      totalHotelsRes,
      activeHotelsRes,
      pendingRequestsRes,
      activeSubscriptionsRes,
      totalUsersRes,
      recentLogsRes,
      subscriptionsByStatusRes,
    ] = await Promise.all([
      admin
        .from("hotels")
        .select("id", { count: "exact", head: true }),
      admin
        .from("hotels")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true),
      admin
        .from("subscription_requests")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),
      admin
        .from("subscriptions")
        .select("id", { count: "exact", head: true })
        .in("status", ["active", "trial"]),
      admin
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true),
      admin
        .from("activity_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10),
      admin
        .from("subscriptions")
        .select("status"),
    ]);

    // Grouper les abonnements par statut
    const subscriptionsByStatus: Record<string, number> = {};
    const subs = subscriptionsByStatusRes.data || [];
    for (const sub of subs) {
      subscriptionsByStatus[sub.status] =
        (subscriptionsByStatus[sub.status] || 0) + 1;
    }

    return NextResponse.json(
      {
        role: profile.role,
        full_name: profile.full_name,
        total_hotels: totalHotelsRes.count ?? 0,
        active_hotels: activeHotelsRes.count ?? 0,
        pending_requests: pendingRequestsRes.count ?? 0,
        active_subscriptions: activeSubscriptionsRes.count ?? 0,
        total_users: totalUsersRes.count ?? 0,
        recent_activity: recentLogsRes.data || [],
        subscriptions_by_status: subscriptionsByStatus,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur statistiques administrateur:", error);
    return NextResponse.json(
      { error: "Une erreur inattendue s'est produite." },
      { status: 500 }
    );
  }
}
