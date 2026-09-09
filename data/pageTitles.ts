// ============================================================
// PAGE TITLES — pengganti object `titles` di js/nav.js.
// ============================================================
import { Lang, ViewName } from "./types";

export const pageTitles: Record<Lang, Record<ViewName, [string, string]>> = {
  id: {
    dashboard: ["Dashboard", "Ringkasan hari ini dalam satu layar"],
    jadwal: ["Jadwal Minggu Ini", "Semua kelas dan deadline dalam satu tampilan"],
    catatan: ["Catatan", "Tulis, sorot, dan tempel apa saja — tersimpan otomatis per catatan"],
    tugas: ["Tugas Saya", "Semua tugas dan PR, terurut dari yang paling mendesak"],
    ujian: ["Kalender Ujian", "Hitung mundur dan progres persiapan menuju UTS/UAS"],
    fokus: ["Mode Fokus", "Timer belajar terfokus dengan siklus istirahat"],
    grup: ["Grup Belajar", "Belajar bareng teman satu kelas"],
    ai: ["Tanya Asisten Belajar", "Rangkum, jelaskan, atau buat soal latihan dari catatanmu sendiri"],
  },
  en: {
    dashboard: ["Dashboard", "Today's overview in a single screen"],
    jadwal: ["This Week's Schedule", "All classes and deadlines in one view"],
    catatan: ["Notes", "Write, highlight, and paste anything — auto-saved per note"],
    tugas: ["My Tasks", "All tasks and homework, sorted by urgency"],
    ujian: ["Exam Calendar", "Countdown and prep progress toward your midterms/finals"],
    fokus: ["Focus Mode", "A focused study timer with break cycles"],
    grup: ["Study Groups", "Study together with your classmates"],
    ai: ["Ask Study Assistant", "Summarize, explain, or generate practice questions from your own notes"],
  },
};