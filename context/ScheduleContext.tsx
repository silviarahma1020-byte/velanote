"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { ScheduleEvent, EventColor } from "@/data/types";
import { uid } from "@/data/utils";
import { createClient } from "@/lib/supabase/client";

interface ScheduleContextValue {
  events: ScheduleEvent[];
  addEvent: (data: Omit<ScheduleEvent, "id">) => void;
  updateEvent: (id: number, data: Omit<ScheduleEvent, "id">) => void;
  deleteEvent: (id: number) => void;
}

const ScheduleContext = createContext<ScheduleContextValue | null>(null);

export function ScheduleProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const supabase = createClient();

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from("schedule_events").select("*").order("id");
      if (error) { console.error(error); return; }
      setEvents(
        (data ?? []).map((r) => ({
          id: r.id, day: r.day, start: r.start, end: r.end,
          title: r.title, loc: r.loc, color: r.color as EventColor,
        }))
      );
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addEvent = async (data: Omit<ScheduleEvent, "id">) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const id = uid();
    setEvents((prev) => [...prev, { id, ...data }]);
    const { error } = await supabase.from("schedule_events").insert({ id, user_id: user.id, ...data });
    if (error) {
      console.error(error);
      setEvents((prev) => prev.filter((e) => e.id !== id));
    }
  };

  const updateEvent = (id: number, data: Omit<ScheduleEvent, "id">) => {
    setEvents((prev) => prev.map((e) => (e.id === id ? { id, ...data } : e)));
    supabase.from("schedule_events").update(data).eq("id", id).then();
  };

  const deleteEvent = (id: number) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
    supabase.from("schedule_events").delete().eq("id", id).then();
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