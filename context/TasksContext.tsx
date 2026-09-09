"use client";
// ============================================================
// TasksContext — pengganti `tasksData`/`nextTaskId`.
// REVISI Batch 8 (poin 2): tambah `deleteTasks` untuk hapus banyak
// tugas sekaligus (dipakai oleh mode "pilih & hapus" di TugasView).
// ============================================================
import { createContext, useContext, useState, useRef, ReactNode } from "react";
import { TaskData, Priority } from "@/data/types";
import { seedTasks, seedNextTaskId } from "@/data/seed";
import { groupFromDeadline } from "@/data/utils";

interface TasksContextValue {
  tasks: TaskData[];
  addTask: (title: string, subject: string, priority: Priority, deadline: string) => void;
  toggleDone: (id: number) => void;
  deleteTask: (id: number) => void;
  /** REVISI Batch 8 (poin 2) */
  deleteTasks: (ids: Set<number>) => void;
}

const TasksContext = createContext<TasksContextValue | null>(null);

export function TasksProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<TaskData[]>(seedTasks);
  const nextIdRef = useRef(seedNextTaskId);

  const addTask = (
    title: string,
    subject: string,
    priority: Priority,
    deadline: string
  ) => {
    setTasks((prev) => [
      ...prev,
      { id: nextIdRef.current++, title, subject, deadline, priority, group: groupFromDeadline(deadline), done: false },
    ]);
  };

  const toggleDone = (id: number) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  };

  const deleteTask = (id: number) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  // REVISI Batch 8 (poin 2)
  const deleteTasks = (ids: Set<number>) => {
    setTasks((prev) => prev.filter((t) => !ids.has(t.id)));
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