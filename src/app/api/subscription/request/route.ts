import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const subscriptionSchema = z.object({
  hotel_name: z.string().min(1, "Le nom de l'hôtel est requis"),
  contact_name: z.string().min(1, "Le nom est requis"),
  email: z.string().email("E-mail invalide"),
  phone: z.string().min(1, "Le téléphone est requis"),
  desired_plan: z.string().optional().default("starter"),
  message: z.string().optional().default(""),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = subscriptionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { hotel_name, contact_name, email, phone, desired_plan, message } = parsed.data;

    const supabase = await createClient();

    const { error } = await supabase.from("subscription_requests").insert({
      hotel_name,
      contact_name,
      email,
      phone,
      desired_plan,
      message,
      status: "pending",
    });

    if (error) {
      return NextResponse.json(
        { error: "Erreur lors de l'enregistrement de la demande." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Demande d'abonnement envoyée avec succès !" },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Erreur serveur. Veuillez réessayer." },
      { status: 500 }
    );
  }
}
