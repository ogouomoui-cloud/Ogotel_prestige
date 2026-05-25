import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const supabase = await createServerClient();
    await supabase.auth.signOut();

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Erreur déconnexion:", error);
    return NextResponse.json(
      { error: "Une erreur inattendue s'est produite lors de la déconnexion." },
      { status: 500 }
    );
  }
}
