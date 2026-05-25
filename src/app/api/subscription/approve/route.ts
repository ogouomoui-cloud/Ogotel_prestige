import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerClient } from "@/lib/supabase/server";

function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") +
    "-" +
    Date.now().toString(36)
  );
}

export async function POST(request: NextRequest) {
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

    const supabaseAdmin = createAdminClient();

    // Vérifier le rôle super_admin
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Profil non trouvé." },
        { status: 401 }
      );
    }

    if (profile.role !== "super_admin") {
      return NextResponse.json(
        { error: "Accès non autorisé." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { request_id, notes } = body;

    if (!request_id || typeof request_id !== "string") {
      return NextResponse.json(
        { error: "L'identifiant de la demande est requis." },
        { status: 400 }
      );
    }

    // Récupérer la demande
    const { data: subRequest, error: reqError } = await supabaseAdmin
      .from("subscription_requests")
      .select("*")
      .eq("id", request_id)
      .single();

    if (reqError || !subRequest) {
      return NextResponse.json(
        { error: "Demande non trouvée." },
        { status: 404 }
      );
    }

    if (subRequest.status === "approved") {
      return NextResponse.json(
        { error: "Cette demande a déjà été approuvée." },
        { status: 400 }
      );
    }

    // Générer le code d'activation
    const { data: codeResult, error: codeError } = await supabaseAdmin.rpc(
      "generate_activation_code"
    );

    if (codeError || !codeResult) {
      console.error("Erreur génération code:", codeError);
      return NextResponse.json(
        { error: "Erreur lors de la génération du code d'activation." },
        { status: 500 }
      );
    }

    const activationCode = codeResult as string;

    // Créer l'hôtel
    const { error: hotelError } = await supabaseAdmin.from("hotels").insert({
      name: subRequest.hotel_name,
      slug: slugify(subRequest.hotel_name),
      email: subRequest.email,
      phone: subRequest.phone,
      subscription_plan: subRequest.desired_plan,
      subscription_status: "pending",
      activation_code: activationCode,
      created_by: user.id,
    });

    if (hotelError) {
      console.error("Erreur création hôtel:", hotelError);
      return NextResponse.json(
        { error: "Erreur lors de la création de l'hôtel." },
        { status: 500 }
      );
    }

    // Mettre à jour la demande
    await supabaseAdmin
      .from("subscription_requests")
      .update({
        status: "approved",
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        notes: notes?.trim() || null,
      })
      .eq("id", request_id);

    // Formater le code pour l'affichage (ex: XXXX-XXXX-XXXX)
    const formattedCode = activationCode.replace(
      /(.{4})(?=.)/g,
      "$1-"
    );

    return NextResponse.json(
      {
        success: true,
        activation_code: activationCode,
        hotel_name: subRequest.hotel_name,
        message: `Demande approuvée. Code: ${formattedCode}`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur approbation demande:", error);
    return NextResponse.json(
      { error: "Une erreur inattendue s'est produite." },
      { status: 500 }
    );
  }
}
