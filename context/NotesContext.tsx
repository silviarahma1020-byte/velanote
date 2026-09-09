"use client";
// ============================================================
// NotesContext — pengganti `notesData`, `nextNoteId`, `currentNoteId`
// dari js/state.js, plus fungsi-fungsi manajemen catatan dari
// js/catatan.js (bukan yang gambar kanvas — itu ada di komponen
// DrawingCanvas sendiri karena butuh akses langsung ke <canvas>).
// ============================================================
import { createContext, useContext, useState, useRef, ReactNode } from "react";
import { NoteData, OverlayElement } from "@/data/types";
import { seedNotes, seedNextNoteId, seedCurrentNoteId } from "@/data/seed";

interface NotesContextValue {
  notes: NoteData[];
  currentNoteId: number;
  setCurrentNoteId: (id: number) => void;
  currentNote: NoteData | undefined;
  addNote: (title: string, subject: string) => number;
  togglePin: (id: number) => void;
  updateNote: (id: number, patch: Partial<NoteData>) => void;
  setElements: (id: number, elements: OverlayElement[]) => void;
}

const NotesContext = createContext<NotesContextValue | null>(null);

export function NotesProvider({ children }: { children: ReactNode }) {
  const [notes, setNotes] = useState<NoteData[]>(seedNotes);
  const [currentNoteId, setCurrentNoteId] = useState(seedCurrentNoteId);
  const nextIdRef = useRef(seedNextNoteId);

  const currentNote = notes.find((n) => n.id === currentNoteId);

  const addNote = (title: string, subject: string) => {
    const id = nextIdRef.current++;
    const nn: NoteData = {
      id,
      title,
      subject,
      date: new Date().toLocaleDateString("id-ID", { day: "numeric", month: "short" }),
      pinned: false,
      paperType: "garis",
      dark: false,
      template: "kosong",
      canvasData: null,
      elements: [],
    };
    setNotes((prev) => [...prev, nn]);
    return id;
  };

  const togglePin = (id: number) => {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, pinned: !n.pinned } : n)));
  };

  const updateNote = (id: number, patch: Partial<NoteData>) => {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, ...patch } : n)));
  };

  const setElements = (id: number, elements: OverlayElement[]) => {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, elements } : n)));
  };

  return (
    <NotesContext.Provider
      value={{ notes, currentNoteId, setCurrentNoteId, currentNote, addNote, togglePin, updateNote, setElements }}
    >
      {children}
    </NotesContext.Provider>
  );
}

export function useNotes() {
  const ctx = useContext(NotesContext);
  if (!ctx) throw new Error("useNotes harus dipakai di dalam <NotesProvider>");
  return ctx;
}