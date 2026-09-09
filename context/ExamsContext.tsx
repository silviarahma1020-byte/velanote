"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { ExamData } from "@/data/types";
import { uid } from "@/data/utils";
import { createClient } from "@/lib/supabase/client";

interface ExamsContextValue {
  exams: ExamData[];
  addExam: (data: Omit<ExamData, "id">) => void;
  updateExam: (id: number, data: Omit<ExamData, "id">) => void;
  deleteExam: (id: number) => void;
  toggleTopicDone: (examId: number, topicIndex: number) => void;
}

const ExamsContext = createContext<ExamsContextValue | null>(null);

export function ExamsProvider({ children }: { children: ReactNode }) {
  const [exams, setExams] = useState<ExamData[]>([]);
  const supabase = createClient();

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from("exams").select("*").order("id");
      if (error) { console.error(error); return; }
      setExams((data ?? []).map((r) => ({ id: r.id, name: r.name, date: r.date, loc: r.loc, topics: r.topics ?? [] })));
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addExam = async (data: Omit<ExamData, "id">) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const id = uid();
    setExams((prev) => [...prev, { id, ...data }]);
    const { error } = await supabase.from("exams").insert({ id, user_id: user.id, ...data });
    if (error) {
      console.error(error);
      setExams((prev) => prev.filter((e) => e.id !== id));
    }
  };

  const updateExam = (id: number, data: Omit<ExamData, "id">) => {
    setExams((prev) => prev.map((e) => (e.id === id ? { id, ...data } : e)));
    supabase.from("exams").update(data).eq("id", id).then();
  };

  const deleteExam = (id: number) => {
    setExams((prev) => prev.filter((e) => e.id !== id));
    supabase.from("exams").delete().eq("id", id).then();
  };

  const toggleTopicDone = (examId: number, topicIndex: number) => {
    setExams((prev) => {
      const next = prev.map((e) =>
        e.id === examId
          ? { ...e, topics: e.topics.map((tp, i) => (i === topicIndex ? { ...tp, done: !tp.done } : tp)) }
          : e
      );
      const updated = next.find((e) => e.id === examId);
      if (updated) supabase.from("exams").update({ topics: updated.topics }).eq("id", examId).then();
      return next;
    });
  };

  return (
    <ExamsContext.Provider value={{ exams, addExam, updateExam, deleteExam, toggleTopicDone }}>
      {children}
    </ExamsContext.Provider>
  );
}

export function useExams() {
  const ctx = useContext(ExamsContext);
  if (!ctx) throw new Error("useExams harus dipakai di dalam <ExamsProvider>");
  return ctx;
}