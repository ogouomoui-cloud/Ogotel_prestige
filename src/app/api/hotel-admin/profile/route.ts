import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerClient } from "@/lib/supabase/server";
import { z } from "zod";

// ─── Schéma de mise à jour du profil ──────────────────────────────────
const updateProfileSchema = z.object({
  full_name: z
    .string()
    .min(2, "Le nom doit contenir au moins 2 caractères.")
    .max(100, "Le nom ne doit pas dépasser 100 caractères."),
  phone: z
    .string()
    .max(20, "Le téléphone ne doit pas dépasser 20 caractères.")
    .nullable()
    .optional(),
});

// ─── GET /api/hotel-admin/profile ────────────────────────────────────
export async function GET() {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
    }

    const admin = createAdminClient();
    const { data: profile, error } = await admin
      .from("profiles")
      .select("*, hotels(name)")
      .eq("id", user.id)
      .single();

    if (error || !profile) {
      return NextResponse.json(
        { error: "Profil introuvable." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      profile: {
        ...profile,
        email: user.email,
        hotel_name: (profile as { hotels?: { name: string } | null }).hotels?.name ?? null,
      },
    });
  } catch (error) {
    console.error("Erreur profil:", error);
    return NextResponse.json(
      { error: "Une erreur inattendue s'est produite." },
      { status: 500 }
    );
  }
}

// ─── PATCH /api/hotel-admin/profile ──────────────────────────────────
export async function PATCH(request: Request) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
    }

    // ─── Valider le corps ──────────────────────────────────────────
    let body: z.infer<typeof updateProfileSchema>;
    try {
      const raw = await request.json();
      body = updateProfileSchema.parse(raw);
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

    // ─── Mettre à jour le profil ──────────────────────────────────
    const admin = createAdminClient();
    const updates: Record<string, unknown> = { full_name: body.full_name };
    if (body.phone !== undefined) updates.phone = body.phone;

    const { data: profile, error } = await admin
      .from("profiles")
      .update(updates)
      .eq("id", user.id)
      .select("*, hotels(name)")
      .single();

    if (error) {
      console.error("Erreur mise à jour profil:", error);
      return NextResponse.json(
        { error: "Impossible de mettre à jour le profil." },
        { status: 500 }
      );
    }

    // ─── Mettre à jour aussi le user Supabase (display_name) ─────
    await supabase.auth.updateUser({
      data: { full_name: body.full_name },
    });

    return NextResponse.json({
      message: "Profil mis à jour avec succès.",
      profile: {
        ...profile,
        email: user.email,
        hotel_name: (profile as { hotels?: { name: string } | null }).hotels?.name ?? null,
      },
    });
  } catch (error) {
    console.error("Erreur mise à jour profil:", error);
    return NextResponse.json(
      { error: "Une erreur inattendue s'est produite." },
      { status: 500 }
    );
  }
}
