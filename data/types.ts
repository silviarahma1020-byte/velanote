// ============================================================
// TYPES — semua bentuk data dipakai di seluruh aplikasi Velanote.
// REVISI Batch 8:
// - poin 1: elemen teks di Catatan sekarang punya `fontColor`
//   terpisah dari warna pena, supaya bisa dipilih warna terang
//   (putih/kuning dsb) saat latar kertas gelap.
// - poin 5: GroupTask ditambah `myDraftLink` (link Drive/lainnya)
//   dan `myDraftFile` (file PDF/foto/video yang diunggah, disimpan
//   sebagai data URL base64 — lihat catatan keterbatasan di
//   GrupView.tsx).
// ============================================================

export type EventColor =
  | "amber" | "sky" | "lavender" | "mint" | "coral"
  | "rose" | "sunflower" | "leaf" | "teal" | "ocean"
  | "indigo" | "plum" | "berry" | "clay" | "slate";

export interface ScheduleEvent {
  id: number;
  day: number;
  start: number;
  end: number;
  title: string;
  loc: string;
  color: EventColor;
}

export type OverlayElement =
  | { id: number; type: "sticker"; emoji: string; x: number; y: number }
  | { id: number; type: "sticky"; text: string; x: number; y: number; width?: number; height?: number }
  | { id: number; type: "image"; src: string; x: number; y: number; width?: number; height?: number }
  | {
      id: number;
      type: "text";
      text: string;
      x: number;
      y: number;
      fontFamily: string;
      fontSize: number;
      fontWeight: string;
      fontColor: string;
    };
    
export interface NoteData {
  id: number;
  title: string;
  subject: string;
  date: string;
  pinned: boolean;
  paperType: "polos" | "garis" | "kotak" | "dot";
  dark: boolean;
  template: "kosong" | "cornell" | "garis-tengah";
  canvasData: string | null;
  elements: OverlayElement[];
}

export type Priority = "high" | "med" | "low";
export type TaskGroup = "Hari ini" | "Besok" | "Minggu ini" | "Nanti";

export interface TaskData {
  id: number;
  title: string;
  subject: string;
  deadline: string;
  priority: Priority;
  group: TaskGroup;
  done: boolean;
}

export interface ExamTopic {
  name: string;
  weak: boolean;
  done: boolean;
}

export interface ExamData {
  id: number;
  name: string;
  date: string;
  loc: string;
  topics: ExamTopic[];
}

/** REVISI Batch 8 (poin 5) — file yang diunggah untuk draf tugas kelompok. */
export interface GroupTaskDraftFile {
  name: string;
  dataUrl: string; // base64 data URL dari file yang diunggah
  type: string; // MIME type, mis. "application/pdf", "image/png", "video/mp4"
}

export interface GroupTask {
  id: number;
  title: string;
  done: boolean;
  deadline?: string;
  submissionLink?: string;
  referenceLink?: string;
  myDraft?: string;
  /** REVISI Batch 8 (poin 5) */
  myDraftLink?: string;
  myDraftFile?: GroupTaskDraftFile | null;
}

export interface GroupData {
  id: number;
  name: string;
  subject: string;
  members: string[];
  tasks: GroupTask[];
  invitedEmails: string[];
}

export type Lang = "id" | "en";

export type ViewName =
  | "dashboard"
  | "jadwal"
  | "catatan"
  | "tugas"
  | "ujian"
  | "fokus"
  | "grup"
  | "ai";