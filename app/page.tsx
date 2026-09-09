import { redirect } from "next/navigation";

// ============================================================
// Halaman utama "/" — dulu di versi vanilla, saat aplikasi
// pertama dibuka langsung menampilkan halaman Jadwal
// (setView('dashboard') sebenarnya dipanggil terakhir di init.js,
// jadi Dashboard-lah yang tampil pertama). Di sini kita pakai
// redirect asli Next.js supaya URL "/" otomatis mengarah ke
// "/dashboard".
// ============================================================
export default function Home() {
  redirect("/dashboard");
}