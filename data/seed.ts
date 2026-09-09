// ============================================================
// SEED — REVISI poin 1: aplikasi dimulai dari keadaan KOSONG.
// Semua array data contoh sengaja dikosongkan supaya pengguna
// input semuanya sendiri sejak pertama kali membuka aplikasi.
// Konstanta non-data (hari, jam, warna, daftar emoji) TETAP ada
// karena itu bukan "data inputan pengguna", tapi konfigurasi
// tampilan aplikasi.
// ============================================================
import {
  ScheduleEvent,
  NoteData,
  TaskData,
  ExamData,
  GroupData,
} from "./types";

export const days = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
export const startHour = 7;
export const endHour = 20;

// REVISI Batch 7 (poin 3): dari 5 jadi 15 pilihan warna kotak jadwal.
// 5 warna pertama TETAP memakai variabel CSS tema (`var(--amber)` dst)
// supaya jadwal lama yang sudah dibuat tidak berubah tampilannya dan
// tetap ikut berubah kalau kamu mengganti warna tema aplikasi. 10
// warna baru memakai kode warna tetap (tidak ikut berubah oleh tema)
// supaya selalu ada variasi warna yang jelas berbeda satu sama lain
// untuk membedakan banyak mata kuliah/kegiatan sekaligus.
export const colors: Record<string, string> = {
  amber: "var(--amber)",
  sky: "var(--sky)",
  lavender: "var(--lavender)",
  mint: "var(--mint)",
  coral: "var(--coral)",
  rose: "#E77FA1",
  sunflower: "#E8B94A",
  leaf: "#6FAF6E",
  teal: "#3FA9A0",
  ocean: "#4E92C9",
  indigo: "#5D6FD1",
  plum: "#9B6FC9",
  berry: "#C15B8E",
  clay: "#C97A4A",
  slate: "#8590A6",
};

export const seedScheduleEvents: ScheduleEvent[] = [];
export const seedNextEventId = 1;

export const seedNotes: NoteData[] = [];
export const seedNextNoteId = 1;
// 0 = sengaja tidak ada catatan aktif di awal (belum ada catatan sama sekali)
export const seedCurrentNoteId = 0;

export const seedTasks: TaskData[] = [];
export const seedNextTaskId = 1;

export const seedExams: ExamData[] = [];
export const seedNextExamId = 1;

export const seedGroups: GroupData[] = [];
export const seedNextGroupId = 1;
export const seedNextGroupTaskId = 1;

export function avatarClass(i: number): string {
  return "avatar-c" + (i % 6);
}

export const emojiList = [
  "📌", "⭐", "✅", "🔥", "💡", "❗", "📚", "🧠", "⏰", "🎯",
  "✏️", "🔑", "💬", "🧪", "📐", "➗", "🌟", "👍",
  "😀", "😄", "😅", "😂", "🥹", "😊", "😉", "😍", "🤔", "😴",
  "😭", "😡", "🤯", "🥳", "😎", "🤓", "👀", "🙏", "👏", "🙌",
  "✍️", "📖", "📝", "🖊️", "📒", "📓", "🗂️", "📎", "📅", "🔖",
  "💯", "❤️", "💛", "💚", "💙", "💜", "🖤", "🤍", "✨", "⚡",
  "🚀", "🏆", "🥇", "🎓", "🧩", "🔬", "🧮", "🌱", "☕", "🍀",
  "⚠️", "❌", "❓", "❕", "🔺", "🔻", "🔵", "🟢", "🟡", "🔴",
];