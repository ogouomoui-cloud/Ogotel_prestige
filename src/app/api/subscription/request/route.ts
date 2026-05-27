import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { z } from "zod";
import { SITE } from "@/lib/constants";

const subscriptionSchema = z.object({
  hotel_name: z.string().min(1, "Le nom de l'hôtel est requis"),
  contact_name: z.string().min(1, "Le nom est requis"),
  email: z.string().email("E-mail invalide"),
  phone: z.string().min(1, "Le téléphone est requis"),
  whatsapp: z.string().optional(),
  city: z.string().optional(),
  room_count: z.number().int().positive().optional(),
  desired_plan: z.enum(["starter", "pro", "prestige"]).default("starter"),
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

    const {
      hotel_name,
      contact_name,
      email,
      phone,
      whatsapp,
      city,
      room_count,
      desired_plan,
      message,
    } = parsed.data;

    const supabase = await createServerClient();

    // ─── 1. Insérer la demande dans Supabase ─────────────────────
    const { error: insertError } = await supabase
      .from("subscription_requests")
      .insert({
        hotel_name,
        contact_name,
        email,
        phone,
        whatsapp: whatsapp || null,
        city: city || null,
        room_count: room_count || null,
        desired_plan,
        message,
        status: "pending",
      });

    if (insertError) {
      console.error("[subscription/request] Erreur Supabase:", insertError.message);
      return NextResponse.json(
        { error: "Erreur lors de l'enregistrement de la demande." },
        { status: 500 }
      );
    }

    // ─── 2. Notification email via Resend (optionnel) ──────────
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      try {
        const { Resend } = await import("resend");
        const resend = new Resend(resendKey);
        const adminEmail = process.env.SUPER_ADMIN_EMAIL || SITE.email;

        // Escaper les données utilisateur pour prévenir le XSS
        const esc = (s: string) =>
          s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

        await resend.emails.send({
          from: "OGOTEL Prestige <onboarding@resend.dev>",
          to: adminEmail,
          subject: `Nouvelle demande d'abonnement — ${esc(hotel_name)}`,
          html: `
            <h2>Nouvelle demande d'abonnement</h2>
            <table style="border-collapse:collapse; margin-top:16px;">
              <tr><td style="padding:8px 16px 8px 0;font-weight:bold;">Hôtel :</td><td>${esc(hotel_name)}</td></tr>
              <tr><td style="padding:8px 16px 8px 0;font-weight:bold;">Contact :</td><td>${esc(contact_name)}</td></tr>
              <tr><td style="padding:8px 16px 8px 0;font-weight:bold;">E-mail :</td><td>${esc(email)}</td></tr>
              <tr><td style="padding:8px 16px 8px 0;font-weight:bold;">Téléphone :</td><td>${esc(phone)}</td></tr>
              ${whatsapp ? `<tr><td style="padding:8px 16px 8px 0;font-weight:bold;">WhatsApp :</td><td>${esc(whatsapp)}</td></tr>` : ""}
              ${city ? `<tr><td style="padding:8px 16px 8px 0;font-weight:bold;">Ville :</td><td>${esc(city)}</td></tr>` : ""}
              ${room_count ? `<tr><td style="padding:8px 16px 8px 0;font-weight:bold;">Nb chambres :</td><td>${room_count}</td></tr>` : ""}
              <tr><td style="padding:8px 16px 8px 0;font-weight:bold;">Plan :</td><td>${esc(desired_plan)}</td></tr>
              <tr><td style="padding:8px 16px 8px 0;font-weight:bold;">Message :</td><td>${esc(message || "Aucun")}</td></tr>
            </table>
          `,
        });
      } catch (emailError) {
        console.error("[subscription/request] Erreur Resend:", emailError);
        // L'insertion a réussi — on continue même si l'email échoue
      }
    }

    // ─── 3. Lien WhatsApp pour suivi ────────────────────────────
    const whatsappMessage = encodeURIComponent(
      `Bonjour, je viens de soumettre une demande d'abonnement ${desired_plan} pour ${hotel_name}. Mon nom : ${contact_name}.`
    );
    const whatsappUrl = `https://wa.me/${SITE.whatsapp}?text=${whatsappMessage}`;

    return NextResponse.json(
      {
        message: "Demande d'abonnement envoyée avec succès !",
        whatsapp_url: whatsappUrl,
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Erreur serveur. Veuillez réessayer." },
      { status: 500 }
    );
  }
}
