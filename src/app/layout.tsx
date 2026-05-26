import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "OGOTEL Prestige — Gestion Hôtelière Premium",
    template: "%s | OGOTEL Prestige",
  },
  description:
    "OGOTEL Prestige est la solution de gestion hôtelière tout-en-un conçue pour les hôtels de la Côte d'Ivoire. Réservations, facturation, personnel — tout en un seul endroit.",
  keywords: [
    "OGOTEL",
    "Prestige",
    "gestion hôtelière",
    "Côte d'Ivoire",
    "Abidjan",
    "PMS",
    "hôtel",
    "réservation",
    "SaaS",
  ],
  authors: [{ name: "OGOTEL Prestige" }],
  icons: { icon: "/logo.svg" },
  openGraph: {
    title: "OGOTEL Prestige — Gestion Hôtelière Premium",
    description:
      "La solution de gestion hôtelière tout-en-un pour les hôtels de la Côte d'Ivoire.",
    type: "website",
    locale: "fr_CI",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${playfairDisplay.variable} antialiased font-sans bg-background text-foreground`}
      >
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
