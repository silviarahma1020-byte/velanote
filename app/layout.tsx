import type { Metadata } from "next";
import "./globals.css";
import { AppProviders } from "@/context/AppProviders";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";

export const metadata: Metadata = {
  title: "Velanote — Catatan & Jadwal",
  description: "Fokus, satu layar",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>
        <AppProviders>
          <div className="app">
            <Sidebar />
            <main>
              <TopBar />
              {children}
            </main>
          </div>
        </AppProviders>
      </body>
    </html>
  );
}