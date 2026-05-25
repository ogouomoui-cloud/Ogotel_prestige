import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

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
  title: "OGOTEL Prestige | Luxury Hotel & Resort",
  description:
    "Experience unparalleled luxury at OGOTEL Prestige. Discover our world-class suites, fine dining, spa, and breathtaking views. Your extraordinary stay awaits.",
  keywords: [
    "OGOTEL",
    "Prestige",
    "luxury hotel",
    "resort",
    "5-star hotel",
    "suite",
    "spa",
    "fine dining",
    "vacation",
  ],
  authors: [{ name: "OGOTEL Prestige" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "OGOTEL Prestige | Luxury Hotel & Resort",
    description:
      "Experience unparalleled luxury at OGOTEL Prestige. Your extraordinary stay awaits.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${playfairDisplay.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
