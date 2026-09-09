"use client";
// ============================================================
// Sidebar — menu navigasi kiri.
// REVISI Batch 4 (poin 14): 3 grup quick-link (Akses Belajar,
// Dokumen & Kolaborasi, Belajar & Referensi) sekarang jadi
// dropdown yang bisa dibuka/tutup (default tertutup). Ditambah
// link Canva di grup Dokumen & Kolaborasi.
// (Kontrol mode gelap & warna tema dari Batch 3 tetap ada,
// tidak diubah.)
// ============================================================
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useLang } from "@/context/LangContext";
import { useModal } from "@/context/ModalContext";
import { useToast } from "@/context/ToastContext";
import { useTheme } from "@/context/ThemeContext";
import { ViewName } from "@/data/types";

const NAV_ITEMS: { name: ViewName; icon: React.ReactNode }[] = [
  {
    name: "dashboard",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="3" width="7" height="9" rx="1.5" />
        <rect x="14" y="3" width="7" height="5" rx="1.5" />
        <rect x="14" y="12" width="7" height="9" rx="1.5" />
        <rect x="3" y="16" width="7" height="5" rx="1.5" />
      </svg>
    ),
  },
  {
    name: "jadwal",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M8 3v4M16 3v4M3 10h18" />
      </svg>
    ),
  },
  {
    name: "catatan",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    ),
  },
  {
    name: "tugas",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    ),
  },
  {
    name: "ujian",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </svg>
    ),
  },
  {
    name: "fokus",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v4l3 1.5" />
      </svg>
    ),
  },
  {
    name: "grup",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="9" cy="8" r="3" />
        <path d="M2 20c0-3.5 3-6 7-6s7 2.5 7 6" />
        <circle cx="17" cy="8" r="2.5" />
        <path d="M16 14.2c2.6.4 4.7 2.3 5 5.8" />
      </svg>
    ),
  },
  {
    name: "ai",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 2l1.8 5.6L19 9l-5.2 1.4L12 16l-1.8-5.6L5 9l5.2-1.4L12 2z" />
        <path d="M19 15l.9 2.6L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.4L19 15z" />
      </svg>
    ),
  },
];

const NAV_LABEL_KEY: Record<ViewName, string> = {
  dashboard: "navDashboard",
  jadwal: "navJadwal",
  catatan: "navCatatan",
  tugas: "navTugas",
  ujian: "navUjian",
  fokus: "navFokus",
  grup: "navGrup",
  ai: "navAi",
};

const EXT_ICON = (
  <svg className="ql-ext" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M7 17L17 7M8 7h9v9" />
  </svg>
);

const CHEVRON = (
  <svg className="chevron" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
    <path d="M9 6l6 6-6 6" />
  </svg>
);

// ---- REVISI Batch 3: isi modal palet 100 warna (tidak berubah dari Batch 3) ----
function ThemeColorPickerBody({ onPick }: { onPick: (id: number | null) => void }) {
  const { t } = useLang();
  const { colors, accentId } = useTheme();
  return (
    <>
      <div className="hint-text" style={{ marginBottom: 10 }}>{t("pilihWarnaTemaHint")}</div>
      <div className="theme-swatch-grid">
        <button
          type="button"
          className={"theme-swatch theme-swatch-default" + (accentId === null ? " selected" : "")}
          title={t("warnaDefault")}
          onClick={() => onPick(null)}
        />
        {colors.map((c, i) => (
          <button
            type="button"
            key={c + i}
            className={"theme-swatch" + (accentId === i ? " selected" : "")}
            style={{ background: c }}
            title={c}
            onClick={() => onPick(i)}
          />
        ))}
      </div>
    </>
  );
}

// REVISI Batch 4 (poin 14): satu grup quick-link yang bisa dibuka/tutup.
function QuickLinkGroup({
  label,
  open,
  onToggle,
  children,
}: {
  label: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <>
      <button type="button" className={"nav-group-toggle" + (open ? " open" : "")} onClick={onToggle}>
        <span className="nav-group-label" style={{ padding: 0 }}>{label}</span>
        {CHEVRON}
      </button>
      {open && <nav className="quick-link-nav">{children}</nav>}
    </>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const { lang, setLang, t } = useLang();
  const { open, close } = useModal();
  const { show: toast } = useToast();
  const { mode, toggleMode, setAccent } = useTheme();

  // REVISI Batch 4 (poin 14): default semua grup quick-link tertutup.
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    akses: false, dokumen: false, referensi: false,
  });
  const toggleGroup = (key: string) => setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }));

  function openThemeModal() {
    open({
      title: t("pilihWarnaTema"),
      body: (
        <ThemeColorPickerBody
          onPick={(id) => {
            setAccent(id);
            close();
            toast(t("temaDiterapkan"));
          }}
        />
      ),
    });
  }

  return (
    <aside className="sidebar">
      <div className="brand">
        <svg className="brand-mark" viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="logoFace" x1="4" y1="2" x2="40" y2="40" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#9C87F0" />
              <stop offset="45%" stopColor="#6C5CE0" />
              <stop offset="100%" stopColor="#3E5FCE" />
            </linearGradient>
            <linearGradient id="logoSide" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3E3486" />
              <stop offset="100%" stopColor="#2A2C68" />
            </linearGradient>
            <linearGradient id="logoTopHi" x1="6" y1="4" x2="30" y2="16" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </linearGradient>
            <radialGradient id="logoGlow" cx="30%" cy="22%" r="75%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </radialGradient>
          </defs>
          <path d="M6 13 L6 32 Q6 36 10 37.6 L20 41.5 Q22 42.2 24 41.5 L34 37.6 Q38 36 38 32 L38 13 Z" fill="url(#logoSide)" />
          <rect x="5" y="4" width="34" height="30" rx="11" fill="url(#logoFace)" />
          <rect x="5" y="4" width="34" height="30" rx="11" fill="url(#logoGlow)" />
          <path d="M5 15 V11 A11 11 0 0 1 16 4 H28 A11 11 0 0 1 39 15 Z" fill="url(#logoTopHi)" />
          <path d="M22 12L31 16L22 20L13 16L22 12Z" fill="#FFFFFF" opacity="0.98" />
          <path d="M15.5 17.7V23.4C15.5 25 18.4 26.6 22 26.6C25.6 26.6 28.5 25 28.5 23.4V17.7" stroke="#FFFFFF" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.98" />
          <path d="M32.6 15.6V21.6" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" opacity="0.92" />
          <circle cx="32.6" cy="23.2" r="1.25" fill="#FFFFFF" opacity="0.92" />
          <ellipse cx="14" cy="9.5" rx="7" ry="3.2" fill="#FFFFFF" opacity="0.35" />
        </svg>
        <div>
          <div className="brand-name">Velanote</div>
          <div className="brand-sub">{t("brandSub")}</div>
        </div>
      </div>

      <div className="lang-toggle">
        <button className={"lang-btn" + (lang === "id" ? " active" : "")} type="button" onClick={() => setLang("id")}>
          ID
        </button>
        <button className={"lang-btn" + (lang === "en" ? " active" : "")} type="button" onClick={() => setLang("en")}>
          EN
        </button>
      </div>

      <div className="appearance-row">
        <button type="button" className="mode-toggle-btn" onClick={toggleMode}>
          <span>{mode === "dark" ? "☀️" : "🌙"}</span>
          <span>{mode === "dark" ? t("modeTerang") : t("modeGelap")}</span>
        </button>
        <button type="button" className="theme-color-btn" onClick={openThemeModal}>
          <span>🎨</span>
          <span>{t("temaWarna")}</span>
        </button>
      </div>

      <nav>
        {NAV_ITEMS.map((item) => {
          const href = "/" + item.name;
          const active = pathname === href;
          return (
            <Link key={item.name} href={href} className={"nav-item" + (active ? " active" : "")}>
              {item.icon}
              <span>{t(NAV_LABEL_KEY[item.name])}</span>
            </Link>
          );
        })}
      </nav>

      {/* REVISI Batch 4 (poin 14): dropdown, default tertutup */}
      <QuickLinkGroup label={t("grpAksesBelajar")} open={openGroups.akses} onToggle={() => toggleGroup("akses")}>
        <a className="nav-item quick-link-item" href="https://zoom.us/join" target="_blank" rel="noopener noreferrer" title="Buka Zoom di tab baru">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <rect x="2" y="6" width="14" height="12" rx="2.5" />
            <path d="M16 10.5l5-3v9l-5-3" />
          </svg>
          Zoom
          {EXT_ICON}
        </a>
        <a className="nav-item quick-link-item" href="https://meet.google.com" target="_blank" rel="noopener noreferrer" title="Buka Google Meet di tab baru">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <rect x="3" y="5" width="12" height="14" rx="2.5" />
            <path d="M15 10l6-4v12l-6-4" />
            <circle cx="9" cy="12" r="2" />
          </svg>
          Google Meet
          {EXT_ICON}
        </a>
      </QuickLinkGroup>

      <QuickLinkGroup label={t("grpDokumen")} open={openGroups.dokumen} onToggle={() => toggleGroup("dokumen")}>
        <a className="nav-item quick-link-item" href="https://drive.google.com" target="_blank" rel="noopener noreferrer" title="Buka Google Drive di tab baru">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M8 3h8l6 10.5-4 7H6l-4-7L8 3z" />
            <path d="M8 3l6 10.5M16 3l-9.5 17M4 13.5h16" />
          </svg>
          Google Drive
          {EXT_ICON}
        </a>
        <a className="nav-item quick-link-item" href="https://www.notion.so" target="_blank" rel="noopener noreferrer" title="Buka Notion di tab baru">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M5 3h10l4 4v14H5V3z" />
            <path d="M15 3v4h4" />
            <path d="M8 11h8M8 15h8M8 7h4" />
          </svg>
          Notion
          {EXT_ICON}
        </a>
        {/* REVISI poin 14: tambahan Canva */}
        <a className="nav-item quick-link-item" href="https://www.canva.com" target="_blank" rel="noopener noreferrer" title="Buka Canva di tab baru">
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="9.4" fill="#00C4CC" />
            <path d="M12 6.4c-3.1 0-5.6 2.5-5.6 5.6 0 3.1 2.4 5.5 5.4 5.6.7 0 1.3-.5 0.9-1.3-.2-.4-.4-.9-.4-1.5 0-1.6 1.3-2.9 2.9-2.9.5 0 1 .1 1.4.4.6.3 1.3-.1 1.2-.8-.4-2.8-2.8-5.1-5.8-5.1z" fill="#FFFFFF" />
          </svg>
          Canva
          {EXT_ICON}
        </a>
        <a className="nav-item quick-link-item" href="https://discord.com/app" target="_blank" rel="noopener noreferrer" title="Buka Discord di tab baru">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <rect x="3" y="5" width="18" height="13" rx="4" />
            <circle cx="9" cy="11.5" r="1.3" fill="currentColor" stroke="none" />
            <circle cx="15" cy="11.5" r="1.3" fill="currentColor" stroke="none" />
            <path d="M8 15.5c1.2.8 2.6 1.2 4 1.2s2.8-.4 4-1.2" />
          </svg>
          Discord
          {EXT_ICON}
        </a>
      </QuickLinkGroup>

      <QuickLinkGroup label={t("grpBelajarRef")} open={openGroups.referensi} onToggle={() => toggleGroup("referensi")}>
        <a className="nav-item quick-link-item" href="https://www.google.com/chrome/" target="_blank" rel="noopener noreferrer" title="Buka Google Chrome di tab baru">
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="9.2" fill="#FFFFFF" />
            <path d="M12 12 L20.4 12 A8.4 8.4 0 0 1 8.9 19.6 Z" fill="#3E5FCE" />
            <path d="M12 12 L6.2 21.4 A8.4 8.4 0 0 1 8.9 4.4 Z" fill="#6C5CE0" />
            <path d="M12 12 L17.8 4.4 A8.4 8.4 0 0 1 20.4 12 Z" fill="#8A6FE0" />
            <circle cx="12" cy="12" r="3.6" fill="#FFFFFF" />
            <circle cx="12" cy="12" r="2.6" fill="#3E5FCE" />
          </svg>
          Chrome
          {EXT_ICON}
        </a>
        <a className="nav-item quick-link-item" href="https://www.youtube.com" target="_blank" rel="noopener noreferrer" title="Buka YouTube di tab baru">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <rect x="2" y="5" width="20" height="14" rx="4" />
            <path d="M10 9l6 3-6 3V9z" fill="currentColor" stroke="none" />
          </svg>
          YouTube
          {EXT_ICON}
        </a>
        <a className="nav-item quick-link-item" href="https://scholar.google.com" target="_blank" rel="noopener noreferrer" title="Buka Google Scholar di tab baru">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M2 9l10-5 10 5-10 5L2 9z" />
            <path d="M6 11v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5" />
            <path d="M22 9v6" />
          </svg>
          Google Scholar
          {EXT_ICON}
        </a>
        <a className="nav-item quick-link-item" href="https://quizlet.com" target="_blank" rel="noopener noreferrer" title="Buka Quizlet di tab baru">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <rect x="7" y="3" width="14" height="10" rx="2" />
            <rect x="3" y="9" width="14" height="10" rx="2" />
          </svg>
          Quizlet
          {EXT_ICON}
        </a>
      </QuickLinkGroup>

      <div className="side-footer">
        <b>{t("sesiBerikutnya")}</b>
        <span>
          Kalkulus II · 13:00
          <br />
          Ruang B301
        </span>
      </div>
    </aside>
  );
}