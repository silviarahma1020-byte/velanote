// ============================================================
// UTILS — fungsi bantuan kecil yang dipakai lintas fitur.
// Dipindahkan dari js/dashboard.js (fmtTime, daysLeft) dan
// js/helpers.js (uid).
// ============================================================

export function fmtTime(h: number): string {
  const hh = Math.floor(h);
  const mm = h % 1 ? "30" : "00";
  return String(hh).padStart(2, "0") + ":" + mm;
}

export function daysLeft(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr + "T00:00:00");
  return Math.round((d.getTime() - today.getTime()) / 86400000);
}

// REVISI Batch 7 (poin 3): kelompok tugas ("Hari ini"/"Besok"/"Minggu
// ini"/"Nanti") sekarang DIHITUNG OTOMATIS dari tanggal tenggat asli
// yang dipilih pengguna lewat <input type="date">, bukan dipilih
// manual dari dropdown terpisah seperti sebelumnya (dulu dropdown itu
// tidak tersambung ke tanggal apa pun — makanya field "deadline"
// selalu berisi teks tetap, bukan tanggal beneran).

export function uid(): number {
  return Date.now() + Math.floor(Math.random() * 1000);
}

/** 0 = Senin ... 5 = Sabtu, -1 = Minggu (di luar grid jadwal) */
export function todayIndex(): number {
  const jsDay = new Date().getDay(); // 0 = Minggu
  return jsDay === 0 ? -1 : jsDay - 1;
}

// REVISI Batch 7 (poin 3): format tanggal tenggat tugas jadi teks
// tanggal asli ("Sen, 8 Sep 2026") — menggantikan label relatif lama
// ("Besok"/"Minggu ini") yang dulu ditampilkan sebagai isi `deadline`.
export function fmtDate(dateStr: string, lang: "id" | "en" = "id"): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr + "T00:00:00");
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString(lang === "id" ? "id-ID" : "en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// REVISI Batch 7 (poin 3): kelompok tugas ("Hari ini"/"Besok"/"Minggu
// ini"/"Nanti") sekarang dihitung OTOMATIS dari tanggal tenggat asli,
// bukan dipilih manual lewat dropdown — supaya tidak ada lagi tenggat
// yang isinya cuma teks tetap "besok"/"minggu depan" tanpa tanggal
// sungguhan di baliknya.
export function groupFromDeadline(dateStr: string): "Hari ini" | "Besok" | "Minggu ini" | "Nanti" {
  const diff = daysLeft(dateStr);
  if (diff <= 0) return "Hari ini"; // termasuk tugas yang tenggatnya sudah lewat
  if (diff === 1) return "Besok";
  if (diff <= 7) return "Minggu ini";
  return "Nanti";
}