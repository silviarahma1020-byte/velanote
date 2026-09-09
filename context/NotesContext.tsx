"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { NoteData, OverlayElement } from "@/data/types";
import { uid } from "@/data/utils";
import { createClient } from "@/lib/supabase/client";

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
  const [notes, setNotes] = useState<NoteData[]>([]);
  const [currentNoteId, setCurrentNoteId] = useState(0);
  const supabase = createClient();

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from("notes").select("*").order("id");
      if (error) { console.error(error); return; }
      setNotes(
        (data ?? []).map((r) => ({
          id: r.id, title: r.title, subject: r.subject, date: r.date, pinned: r.pinned,
          paperType: r.paper_type, dark: r.dark, template: r.template,
          canvasData: r.canvas_data, elements: r.elements ?? [],
        }))
      );
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentNote = notes.find((n) => n.id === currentNoteId);

  function addNote(title: string, subject: string): number {
    const id = uid();
    const nn: NoteData = {
      id, title, subject,
      date: new Date().toLocaleDateString("id-ID", { day: "numeric", month: "short" }),
      pinned: false, paperType: "garis", dark: false, template: "kosong",
      canvasData: null, elements: [],
    };
    setNotes((prev) => [...prev, nn]);

    // Kirim ke Supabase di belakang layar — TIDAK di-await, supaya
    // fungsi ini tetap bisa langsung `return id` seperti sebelumnya.
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { error } = await supabase.from("notes").insert({
        id, user_id: user.id, title: nn.title, subject: nn.subject, date: nn.date,
        pinned: nn.pinned, paper_type: nn.paperType, dark: nn.dark, template: nn.template,
        canvas_data: nn.canvasData, elements: nn.elements,
      });
      if (error) console.error(error);
    })();

    return id;
  }

  const togglePin = (id: number) => {
    setNotes((prev) => {
      const next = prev.map((n) => (n.id === id ? { ...n, pinned: !n.pinned } : n));
      const updated = next.find((n) => n.id === id);
      if (updated) supabase.from("notes").update({ pinned: updated.pinned }).eq("id", id).then();
      return next;
    });
  };

  const updateNote = (id: number, patch: Partial<NoteData>) => {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, ...patch } : n)));
    const dbPatch: Record<string, unknown> = {};
    if (patch.title !== undefined) dbPatch.title = patch.title;
    if (patch.subject !== undefined) dbPatch.subject = patch.subject;
    if (patch.pinned !== undefined) dbPatch.pinned = patch.pinned;
    if (patch.paperType !== undefined) dbPatch.paper_type = patch.paperType;
    if (patch.dark !== undefined) dbPatch.dark = patch.dark;
    if (patch.template !== undefined) dbPatch.template = patch.template;
    if (patch.canvasData !== undefined) dbPatch.canvas_data = patch.canvasData;
    if (patch.elements !== undefined) dbPatch.elements = patch.elements;
    if (Object.keys(dbPatch).length) supabase.from("notes").update(dbPatch).eq("id", id).then();
  };

  const setElements = (id: number, elements: OverlayElement[]) => {
    updateNote(id, { elements });
  };

  return (
    <NotesContext.Provider value={{ notes, currentNoteId, setCurrentNoteId, currentNote, addNote, togglePin, updateNote, setElements }}>
      {children}
    </NotesContext.Provider>
  );
}

export function useNotes() {
  const ctx = useContext(NotesContext);
  if (!ctx) throw new Error("useNotes harus dipakai di dalam <NotesProvider>");
  return ctx;
}