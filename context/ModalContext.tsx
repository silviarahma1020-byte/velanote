"use client";
// ============================================================
// ModalContext — pengganti openModal()/closeModal() + elemen
// #modalOverlay dari js/helpers.js. Bedanya dengan versi vanilla:
// dulu "bodyHtml" berupa string HTML lalu inputnya dibaca lewat
// document.getElementById(...) saat Simpan diklik. Di React, body
// berupa komponen React biasa yang mengatur state form-nya sendiri
// lewat useState, lalu onSave tinggal membaca state itu — alurnya
// (buka modal -> isi form -> Simpan/Hapus -> tutup) tetap sama persis.
// ============================================================
import { createContext, useContext, useState, ReactNode } from "react";
import { useLang } from "./LangContext";

interface OpenModalOptions {
  title: string;
  body: ReactNode;
  onSave?: () => void;
  onDelete?: () => void;
}

interface ModalContextValue {
  open: (opts: OpenModalOptions) => void;
  close: () => void;
}

const ModalContext = createContext<ModalContextValue | null>(null);

export function ModalProvider({ children }: { children: ReactNode }) {
  const { t } = useLang();
  const [state, setState] = useState<OpenModalOptions | null>(null);

  const open = (opts: OpenModalOptions) => setState(opts);
  const close = () => setState(null);

  return (
    <ModalContext.Provider value={{ open, close }}>
      {children}
      <div
        className={"modal-overlay" + (state ? " show" : "")}
        onClick={(e) => {
          if (e.target === e.currentTarget) close();
        }}
      >
        <div className="modal-box">
          <div className="modal-title">{state?.title}</div>
          <div>{state?.body}</div>
          <div className="modal-actions">
            {state?.onDelete && (
              <button
                className="btn-danger"
                onClick={() => {
                  state.onDelete?.();
                  close();
                }}
              >
                {t("hapus")}
              </button>
            )}
            <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
              <button className="btn-ghost" onClick={close}>
                {t("batal")}
              </button>
              <button
                className="btn-primary"
                onClick={() => state?.onSave?.()}
              >
                {t("simpan")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </ModalContext.Provider>
  );
}

export function useModal() {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error("useModal harus dipakai di dalam <ModalProvider>");
  return ctx;
}