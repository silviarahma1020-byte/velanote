"use client";
// ============================================================
// ThemeContext — REVISI Batch 3 (poin 9 & 16).
// Menyimpan 2 preferensi tampilan:
// - `mode`: "light" | "dark" — dipasang sebagai atribut
//   data-mode="dark" di <html>, lalu app/globals.css mendefinisikan
//   ulang variable warna dasar di bawah selector itu.
// - `accentId`: index warna tema terpilih dari THEME_BASE_COLORS
//   (null = pakai warna default bawaan aplikasi). Diterapkan lewat
//   CSS variable custom di <html> (bukan mengubah file CSS), jadi
//   bisa berubah instan tanpa reload halaman.
// Kedua preferensi disimpan di localStorage supaya tidak hilang
// saat halaman di-refresh.
// ============================================================
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { THEME_BASE_COLORS, deriveTheme } from "@/data/themeColors";

export type ThemeMode = "light" | "dark";

interface ThemeContextValue {
  mode: ThemeMode;
  toggleMode: () => void;
  accentId: number | null;
  setAccent: (id: number | null) => void;
  colors: string[];
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const MODE_KEY = "velanote-theme-mode";
const ACCENT_KEY = "velanote-theme-accent";

function applyAccent(id: number | null) {
  const root = document.documentElement;
  if (id === null || !THEME_BASE_COLORS[id]) {
    root.style.removeProperty("--amber");
    root.style.removeProperty("--amber-soft");
    root.style.removeProperty("--purple-deep");
    root.style.removeProperty("--blue-deep");
    return;
  }
  const theme = deriveTheme(THEME_BASE_COLORS[id]);
  root.style.setProperty("--amber", theme.primary);
  root.style.setProperty("--amber-soft", theme.primarySoft);
  root.style.setProperty("--purple-deep", theme.deep);
  root.style.setProperty("--blue-deep", theme.blue);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>("light");
  const [accentId, setAccentIdState] = useState<number | null>(null);
  const [ready, setReady] = useState(false);

  // Muat preferensi tersimpan sekali saat aplikasi pertama dibuka.
  useEffect(() => {
    try {
      const savedMode = window.localStorage.getItem(MODE_KEY);
      const savedAccent = window.localStorage.getItem(ACCENT_KEY);
      if (savedMode === "dark" || savedMode === "light") setModeState(savedMode);
      if (savedAccent !== null && savedAccent !== "") {
        const id = Number(savedAccent);
        if (!Number.isNaN(id)) setAccentIdState(id);
      }
    } catch {
      // localStorage tidak tersedia (mis. mode browsing privat) — lanjut pakai default.
    }
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-mode", mode);
    if (ready) {
      try { window.localStorage.setItem(MODE_KEY, mode); } catch {}
    }
  }, [mode, ready]);

  useEffect(() => {
    applyAccent(accentId);
    if (ready) {
      try { window.localStorage.setItem(ACCENT_KEY, accentId === null ? "" : String(accentId)); } catch {}
    }
  }, [accentId, ready]);

  const toggleMode = () => setModeState((m) => (m === "light" ? "dark" : "light"));
  const setAccent = (id: number | null) => setAccentIdState(id);

  return (
    <ThemeContext.Provider value={{ mode, toggleMode, accentId, setAccent, colors: THEME_BASE_COLORS }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme harus dipakai di dalam <ThemeProvider>");
  return ctx;
} 