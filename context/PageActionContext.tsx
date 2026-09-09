"use client";
// ============================================================
// PageActionContext — pengganti #pageActionSlot + renderPageAction()
// dari js/nav.js. Dulu: setView(name) tahu tombol apa yang harus
// dipasang di top bar untuk tiap halaman (mis. "+ Tambah jadwal").
// Sekarang: tiap halaman (JadwalView, UjianView, GrupView) yang
// "mendaftarkan" tombolnya sendiri lewat usePageAction() saat aktif,
// dan otomatis dilepas saat pindah halaman. TopBar tinggal
// menampilkan apa yang terdaftar.
// ============================================================
import { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface PageAction {
  label: string;
  onClick: () => void;
}

interface PageActionContextValue {
  action: PageAction | null;
  setAction: (action: PageAction | null) => void;
}

const PageActionContext = createContext<PageActionContextValue | null>(null);

export function PageActionProvider({ children }: { children: ReactNode }) {
  const [action, setAction] = useState<PageAction | null>(null);
  return (
    <PageActionContext.Provider value={{ action, setAction }}>
      {children}
    </PageActionContext.Provider>
  );
}

function usePageActionCtx() {
  const ctx = useContext(PageActionContext);
  if (!ctx) throw new Error("Harus dipakai di dalam <PageActionProvider>");
  return ctx;
}

/** Dipanggil oleh TopBar untuk menampilkan tombol yang aktif saat ini. */
export function usePageAction() {
  return usePageActionCtx().action;
}

/**
 * Dipanggil oleh komponen halaman (mis. JadwalView) untuk mendaftarkan
 * tombol aksinya sendiri selama halaman itu ditampilkan.
 */
export function useRegisterPageAction(label: string, onClick: () => void) {
  const { setAction } = usePageActionCtx();
  useEffect(() => {
    setAction({ label, onClick });
    return () => setAction(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [label]);
}