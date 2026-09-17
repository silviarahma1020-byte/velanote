"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import BrandMark from "@/components/layout/Brandmark";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 44c5.3 0 10.1-2 13.7-5.3l-6.3-5.3C29.3 35.4 26.8 36 24 36c-5.3 0-9.7-3.1-11.3-7.6l-6.6 5.1C9.6 39.7 16.3 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.2 5.7l6.3 5.3C39.8 37.4 44 31.4 44 24c0-1.3-.1-2.7-.4-3.5z"/>
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [needsConfirm, setNeedsConfirm] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendDone, setResendDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNeedsConfirm(false);
    setLoading(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (signInError) {
      const msg = signInError.message.toLowerCase();
      if (msg.includes("email not confirmed")) setNeedsConfirm(true);
      else if (msg.includes("invalid login credentials")) setError("Email atau password salah.");
      else setError(signInError.message);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  async function handleResend() {
    setResending(true);
    await supabase.auth.resend({ type: "signup", email });
    setResending(false);
    setResendDone(true);
  }

  async function handleGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  return (
    <div className="auth-card">
      <div className="auth-logo-wrap"><BrandMark size={64} /></div>
      <h1 className="auth-title">Masuk</h1>
      <p className="auth-subtitle">Fokus, satu layar</p>

      {needsConfirm ? (
        <div className="auth-notice">
          <p>Email kamu belum dikonfirmasi. Cek kotak masuk (atau folder spam) untuk link konfirmasi dari Supabase.</p>
          <button type="button" className="auth-btn-secondary" onClick={handleResend} disabled={resending || resendDone}>
            {resendDone ? "Email terkirim ✓" : resending ? "Mengirim…" : "Kirim ulang email konfirmasi"}
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="auth-form">
          <label className="auth-label">Email</label>
          <input type="email" className="auth-input" placeholder="email@contoh.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <label className="auth-label">Password</label>
          <div className="auth-input-wrap">
            <input type={showPassword ? "text" : "password"} className="auth-input" placeholder="Masukkan password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
            <button type="button" className="auth-eye" onClick={() => setShowPassword((v) => !v)} aria-label="Tampilkan password">{showPassword ? "🙈" : "👁"}</button>
          </div>
          {error && <div className="auth-error">{error}</div>}
          <button type="submit" className="auth-btn-primary" disabled={loading}>{loading ? "Memproses…" : "Masuk →"}</button>
        </form>
      )}

      <div className="auth-divider"><span>atau masuk dengan</span></div>
      <button type="button" className="auth-btn-google" onClick={handleGoogle}><GoogleIcon /> Lanjutkan dengan Google</button>

      <p className="auth-footer">Belum punya akun? <Link href="/register">Daftar gratis</Link></p>
    </div>
  );
}