"use client";
// ============================================================
// ExamsContext — pengganti `examsData`/`nextExamId` dari
// js/state.js + fungsi CRUD dari js/ujian.js.
//
// REVISI Batch 7 (poin 4): tambah `toggleTopicDone` — dipanggil saat
// pengguna klik salah satu chip sub-materi di kartu ujian untuk
// menandai "sudah dipelajari". Progres persiapan ujian sekarang
// dihitung OTOMATIS dari sini (lihat UjianView.tsx), bukan lagi
// angka % yang diketik manual.
// ============================================================
import { createContext, useContext, useState, useRef, ReactNode } from "react";
import { ExamData } from "@/data/types";
import { seedExams, seedNextExamId } from "@/data/seed";
// (ReactNode diimpor di atas dan dipakai untuk tipe children di bawah)

interface ExamsContextValue {
  exams: ExamData[];
  addExam: (data: Omit<ExamData, "id">) => void;
  updateExam: (id: number, data: Omit<ExamData, "id">) => void;
  deleteExam: (id: number) => void;
  toggleTopicDone: (examId: number, topicIndex: number) => void;
}

const ExamsContext = createContext<ExamsContextValue | null>(null);

export function ExamsProvider({ children }: { children: ReactNode }) {
  const [exams, setExams] = useState<ExamData[]>(seedExams);
  const nextIdRef = useRef(seedNextExamId);

  const addExam = (data: Omit<ExamData, "id">) => {
    setExams((prev) => [...prev, { id: nextIdRef.current++, ...data }]);
  };
  const updateExam = (id: number, data: Omit<ExamData, "id">) => {
    setExams((prev) => prev.map((e) => (e.id === id ? { id, ...data } : e)));
  };
  const deleteExam = (id: number) => {
    setExams((prev) => prev.filter((e) => e.id !== id));
  };
  const toggleTopicDone = (examId: number, topicIndex: number) => {
    setExams((prev) =>
      prev.map((e) =>
        e.id === examId
          ? { ...e, topics: e.topics.map((tp, i) => (i === topicIndex ? { ...tp, done: !tp.done } : tp)) }
          : e
      )
    );
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