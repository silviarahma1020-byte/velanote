"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { TaskData, Priority } from "@/data/types";
import { groupFromDeadline, uid } from "@/data/utils";
import { createClient } from "@/lib/supabase/client";

interface TasksContextValue {
  tasks: TaskData[];
  addTask: (title: string, subject: string, priority: Priority, deadline: string) => void;
  toggleDone: (id: number) => void;
  deleteTask: (id: number) => void;
  deleteTasks: (ids: Set<number>) => void;
}

const TasksContext = createContext<TasksContextValue | null>(null);

export function TasksProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const supabase = createClient();

  useEffect(() => {
    let active = true;
    (async () => {
      const { data, error } = await supabase.from("tasks").select("*").order("id");
      if (!active) return;
      if (error) { console.error(error); return; }
      setTasks(
        (data ?? []).map((row) => ({
          id: row.id,
          title: row.title,
          subject: row.subject,
          deadline: row.deadline,
          priority: row.priority as Priority,
          done: row.done,
          group: groupFromDeadline(row.deadline),
        }))
      );
    })();
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addTask = async (title: string, subject: string, priority: Priority, deadline: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const id = uid();
    const optimistic: TaskData = { id, title, subject, deadline, priority, done: false, group: groupFromDeadline(deadline) };
    setTasks((prev) => [...prev, optimistic]);
    const { error } = await supabase
      .from("tasks")
      .insert({ id, user_id: user.id, title, subject, deadline, priority, done: false });
    if (error) {
      console.error(error);
      setTasks((prev) => prev.filter((t) => t.id !== id)); // batalkan kalau gagal
    }
  };

  const toggleDone = (id: number) => {
    setTasks((prev) => {
      const next = prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t));
      const updated = next.find((t) => t.id === id);
      if (updated) supabase.from("tasks").update({ done: updated.done }).eq("id", id).then();
      return next;
    });
  };

  const deleteTask = (id: number) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    supabase.from("tasks").delete().eq("id", id).then();
  };

  const deleteTasks = (ids: Set<number>) => {
    setTasks((prev) => prev.filter((t) => !ids.has(t.id)));
    supabase.from("tasks").delete().in("id", Array.from(ids)).then();
  };

  return (
    <TasksContext.Provider value={{ tasks, addTask, toggleDone, deleteTask, deleteTasks }}>
      {children}
    </TasksContext.Provider>
  );
}

export function useTasks() {
  const ctx = useContext(TasksContext);
  if (!ctx) throw new Error("useTasks harus dipakai di dalam <TasksProvider>");
  return ctx;
}