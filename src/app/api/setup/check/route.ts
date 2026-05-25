import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const supabaseAdmin = createAdminClient();

    const { data, error } = await supabaseAdmin.rpc("is_db_initialized");

    if (error) {
      // La fonction RPC n'existe pas encore = base non initialisée
      return NextResponse.json({ initialized: false }, { status: 200 });
    }

    return NextResponse.json({ initialized: !!data }, { status: 200 });
  } catch (error) {
    console.error("Erreur vérification initialisation:", error);
    return NextResponse.json({ initialized: false }, { status: 200 });
  }
}
