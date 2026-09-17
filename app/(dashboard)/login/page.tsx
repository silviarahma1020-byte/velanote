"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    setError("");
    setInfo("");
    const supabase = createClient();

    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) { setError(error.message); return; }
      router.push("/dashboard");
      router.refresh();
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      setLoading(false);
      if (error) { setError(error.message); return; }
      // Kalau Confirm Email masih aktif di project Supabase-mu (default),
      // akun baru butuh klik link konfirmasi di email dulu sebelum bisa
      // login. Lihat catatan di bawah form untuk mematikan ini saat masih
      // development.
      setInfo("Akun dibuat. Cek email kamu untuk konfirmasi, lalu masuk.");
      setMode("signin");
    }
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ width: 340, display: "flex", flexDirection: "column", gap: 12 }}>
        <h1 style={{ margin: 0 }}>Velanote</h1>
        <p style={{ margin: 0, color: "#888", fontSize: 14 }}>
          {mode === "signin" ? "Masuk ke akunmu" : "Buat akun baru"}
        </p>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
        />
        <input
          type="password"
          placeholder="Password (min. 6 karakter)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
        />
        {error && <div style={{ color: "#D64545", fontSize: 13 }}>{error}</div>}
        {info && <div style={{ color: "#3FA66E", fontSize: 13 }}>{info}</div>}
        <button onClick={submit} disabled={loading}>
          {loading ? "Memproses…" : mode === "signin" ? "Masuk" : "Daftar"}
        </button>
        <button
          type="button"
          onClick={() => { setMode((m) => (m === "signin" ? "signup" : "signin")); setError(""); setInfo(""); }}
          style={{ background: "none", border: "none", color: "#3D7DD6", cursor: "pointer" }}
        >
          {mode === "signin" ? "Belum punya akun? Daftar di sini" : "Sudah punya akun? Masuk di sini"}
        </button>
      </div>
    </div>
  );
}