"use client";
// ============================================================
// LangContext — pengganti variabel global `lang` + fungsi `t()`
// dari js/i18n.js. Komponen manapun bisa panggil useLang() untuk
// baca bahasa aktif, ganti bahasa, atau menerjemahkan teks.
// ============================================================
import { createContext, useContext, useState, ReactNode } from "react";
import { Lang } from "@/data/types";
import { translate } from "@/data/translations";

interface LangContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
}

const LangContext = createContext<LangContextValue | null>(null);

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("id");
  const t = (key: string) => translate(lang, key);
  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang harus dipakai di dalam <LangProvider>");
  return ctx;
}