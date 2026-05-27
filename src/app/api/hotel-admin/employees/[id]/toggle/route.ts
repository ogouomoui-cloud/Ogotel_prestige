import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerClient } from "@/lib/supabase/server";
import type { Role } from "@/lib/constants";
import { z } from "zod";

// ─── Schéma de validation ─────────────────────────────────────────────
const toggleSchema = z.object({
  is_active: z.boolean(),
  role: z.enum(["manager", "receptionist"]).optional(),
});

// ─── PATCH /api/hotel-admin/employees/[id]/toggle ──────────────────────
// Active ou désactive un employé. Peut aussi modifier son rôle.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
    }

    const admin = createAdminClient();

    // ─── Vérifier le rôle hotel_admin ─────────────────────────────
    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("role, hotel_id, full_name")
      .eq("id", user.id)
      .single();

    if (profileError || !profile || profile.role !== "hotel_admin") {
      return NextResponse.json(
        { error: "Accès réservé à l'administrateur de l'hôtel." },
        { status: 403 }
      );
    }

    if (!profile.hotel_id) {
      return NextResponse.json(
        { error: "Aucun hôtel rattaché." },
        { status: 403 }
      );
    }

    const hotelId = profile.hotel_id;
    const { id: employeeId } = await params;

    // ─── Vérifier que l'employé appartient bien à cet hôtel ────────
    const { data: employee, error: empError } = await admin
      .from("profiles")
      .select("id, email, full_name, role, is_active, hotel_id")
      .eq("id", employeeId)
      .eq("hotel_id", hotelId)
      .single();

    if (empError || !employee) {
      return NextResponse.json(
        { error: "Employé introuvable." },
        { status: 404 }
      );
    }

    // ─── Empêcher la modification d'un hotel_admin ───────────────
    if (employee.role === "hotel_admin" || employee.role === "super_admin") {
      return NextResponse.json(
        { error: "Vous ne pouvez pas modifier ce compte." },
        { status: 403 }
      );
    }

    // ─── Valider le corps ────────────────────────────────────────
    let body: z.infer<typeof toggleSchema>;
    try {
      body = toggleSchema.parse(await request.json());
    } catch (err) {
      if (err instanceof z.ZodError) {
        return NextResponse.json(
          { error: "Données invalides.", details: err.flatten().fieldErrors },
          { status: 400 }
        );
      }
      return NextResponse.json({ error: "Corps de requête invalide." }, { status: 400 });
    }

    // ─── Construire les données de mise à jour ────────────────────
    const updateData: Record<string, unknown> = {
      is_active: body.is_active,
    };

    if (body.role) {
      updateData.role = body.role;
    }

    // ─── Appliquer la mise à jour ─────────────────────────────────
    const { data: updated, error: updateError } = await admin
      .from("profiles")
      .update(updateData)
      .eq("id", employeeId)
      .select("id, email, full_name, phone, role, is_active, created_at, avatar_url")
      .single();

    if (updateError) {
      console.error("Erreur mise à jour employé:", updateError);
      return NextResponse.json(
        { error: "Impossible de mettre à jour l'employé." },
        { status: 500 }
      );
    }

    // ─── Journal d'activité ──────────────────────────────────────
    await admin.from("activity_logs").insert({
      hotel_id: hotelId,
      user_id: user.id,
      user_role: "hotel_admin",
      action: "update",
      entity_type: "employee",
      entity_id: employeeId,
      details: {
        employee_email: employee.email,
        employee_name: employee.full_name,
        previous_role: employee.role,
        new_role: body.role ?? employee.role,
        previous_status: employee.is_active ? "actif" : "inactif",
        new_status: body.is_active ? "actif" : "inactif",
        modified_by: profile.full_name,
      },
    });

    // ─── Si désactivation, révoquer la session ────────────────────
    if (!body.is_active) {
      try {
        await admin.auth.admin.signOut(employeeId);
      } catch {
        // L'utilisateur peut ne pas avoir de session active — c'est normal
      }
    }

    return NextResponse.json(
      {
        message: body.is_active
          ? `${updated.full_name} a été activé.`
          : `${updated.full_name} a été désactivé.`,
        employee: updated,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur toggle employé:", error);
    return NextResponse.json(
      { error: "Une erreur inattendue s'est produite." },
      { status: 500 }
    );
  }
}
