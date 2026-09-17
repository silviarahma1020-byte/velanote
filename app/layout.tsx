import type { Metadata } from "next";
import "./globals.css";
import { AppProviders } from "@/context/AppProviders";

export const metadata: Metadata = {
  title: "Velanote — Catatan & Jadwal",
  description: "Fokus, satu layar",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
} 