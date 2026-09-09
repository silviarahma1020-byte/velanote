"use client";
// ============================================================
// ScheduleContext — pengganti variabel global `scheduleEvents` +
// `nextEventId` dari js/state.js, dan fungsi CRUD dari js/jadwal.js.
// ============================================================
import { createContext, useContext, useState, useRef, ReactNode } from "react";
import { ScheduleEvent } from "@/data/types";
import { seedScheduleEvents, seedNextEventId } from "@/data/seed";

interface ScheduleContextValue {
  events: ScheduleEvent[];
  addEvent: (data: Omit<ScheduleEvent, "id">) => void;
  updateEvent: (id: number, data: Omit<ScheduleEvent, "id">) => void;
  deleteEvent: (id: number) => void;
}

const ScheduleContext = createContext<ScheduleContextValue | null>(null);

export function ScheduleProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<ScheduleEvent[]>(seedScheduleEvents);
  // useRef supaya nilainya tetap "ingat" di render berikutnya (bukan direset
  // tiap kali komponen re-render) — pengganti variabel global `nextEventId`.
  const nextIdRef = useRef(seedNextEventId);

  const addEvent = (data: Omit<ScheduleEvent, "id">) => {
    setEvents((prev) => [...prev, { id: nextIdRef.current++, ...data }]);
  };
  const updateEvent = (id: number, data: Omit<ScheduleEvent, "id">) => {
    setEvents((prev) => prev.map((e) => (e.id === id ? { id, ...data } : e)));
  };
  const deleteEvent = (id: number) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  };

  return (
    <ScheduleContext.Provider value={{ events, addEvent, updateEvent, deleteEvent }}>
      {children}
    </ScheduleContext.Provider>
  );
}

export function useSchedule() {
  const ctx = useContext(ScheduleContext);
  if (!ctx) throw new Error("useSchedule harus dipakai di dalam <ScheduleProvider>");
  return ctx;
}