import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Anton, Outfit, DM_Mono } from "next/font/google";
import "./globals.css";

const anton = Anton({ weight: "400", subsets: ["latin"], variable: "--font-display" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-body" });
const mono = DM_Mono({ weight: ["400", "500"], subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "Pronos Coupe du Monde 2026",
  description: "Le concours de pronostics des équipes pour le Mondial 2026.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body className={`${anton.variable} ${outfit.variable} ${mono.variable}`}>{children}</body>
    </html>
  );
}
