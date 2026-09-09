"use client";
// ============================================================
// ToastContext — pengganti fungsi toast() global dari js/helpers.js.
// Panggil useToast().show("pesan") dari komponen manapun.
// ============================================================
import { createContext, useContext, useRef, useState, ReactNode } from "react";

interface ToastContextValue {
  show: (msg: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState("");
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = (msg: string) => {
    setMessage(msg);
    setVisible(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setVisible(false), 2200);
  };

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className={"toast" + (visible ? " show" : "")}>{message}</div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast harus dipakai di dalam <ToastProvider>");
  return ctx;
}