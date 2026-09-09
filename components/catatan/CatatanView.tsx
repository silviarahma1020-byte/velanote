"use client";
// ============================================================
// CatatanView — daftar catatan + seluruh toolbar.
//
// REVISI Batch 13:
// - poin 1 (Layar Penuh benar-benar berfungsi): `toggleFullscreen`
//   sekarang memakai Fullscreen API bawaan browser
//   (`element.requestFullscreen()` / `document.exitFullscreen()`),
//   bukan cuma toggle class CSS yang rapuh. Status `isFullscreen`
//   disinkronkan otomatis lewat event `fullscreenchange` — termasuk
//   saat pengguna menekan Esc, tanpa kode tambahan. Label "Selamat
//   Belajar" tetap hanya tampil saat `isFullscreen` true, tapi
//   sekarang nilainya akurat mengikuti status layar penuh
//   sesungguhnya.
// - poin 2b (dropdown Jenis Font & Ketebalan Font tidak berfungsi):
//   `onMouseDown={(e) => e.preventDefault()}` yang keliru ditambahkan
//   di Batch 12 pada dua `<select>` ini SUDAH DIHAPUS — itu bug yang
//   sama persis dengan kasus Batch 7 dulu (preventDefault pada
//   mousedown membuat `<select>` gagal terbuka di banyak browser).
//   Trik preventDefault itu TETAP dipertahankan hanya pada tombol
//   swatch warna teks (itu memang benar & perlu di sana).
// Semua revisi Batch 1–12 lainnya tetap ada.
// ============================================================
import { useRef, useState, useEffect } from "react";
import { useLang } from "@/context/LangContext";
import { useToast } from "@/context/ToastContext";
import { useModal } from "@/context/ModalContext";
import { useNotes } from "@/context/NotesContext";
import { emojiList } from "@/data/seed";
import DrawingCanvas, { DrawingCanvasHandle, Tool } from "./DrawingCanvas";

const SWATCHES = [
  { color: "#1F2233", title: "Hitam" }, { color: "#5B5F73", title: "Abu-abu" },
  { color: "#D64545", title: "Merah" }, { color: "#E8734A", title: "Oranye" },
  { color: "#F5A623", title: "Amber" }, { color: "#F0CB3E", title: "Kuning" },
  { color: "#3FA66E", title: "Hijau" }, { color: "#1F9E85", title: "Teal" },
  { color: "#3D7DD6", title: "Biru" }, { color: "#3E5FCE", title: "Biru Indigo" },
  { color: "#6C5CE0", title: "Ungu" }, { color: "#8A6FE0", title: "Violet" },
  { color: "#B75CC9", title: "Magenta" }, { color: "#E0559C", title: "Pink" },
  { color: "#8B5E3C", title: "Cokelat" }, { color: "#FFFFFF", title: "Putih" },
];

const TEXT_COLOR_SWATCHES = [
  { color: "#1F2233", title: "Hitam" }, { color: "#FFFFFF", title: "Putih" },
  { color: "#D64545", title: "Merah" }, { color: "#F5A623", title: "Amber" },
  { color: "#F0CB3E", title: "Kuning" }, { color: "#3FA66E", title: "Hijau" },
  { color: "#3D7DD6", title: "Biru" }, { color: "#6C5CE0", title: "Ungu" },
  { color: "#E0559C", title: "Pink" }, { color: "#5B5F73", title: "Abu-abu" },
];

const TOOLS: { name: Tool; title: string; icon: React.ReactNode }[] = [
  { name: "pen", title: "Pulpen", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/></svg> },
  { name: "pencil", title: "Pensil", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><path d="M17 3l4 4L7 21H3v-4L17 3z"/><path d="M14 6l4 4"/></svg> },
  { name: "marker", title: "Spidol", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><path d="M8 21h4l8-8-4-4-8 8v4z"/><path d="M15 6l3-3 3 3-3 3"/></svg> },
  { name: "highlighter", title: "Stabilo", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><path d="M9 11l6 6-4 4H5v-6l4-4z"/><path d="M14.5 5.5l4 4L12 16l-4-4 6.5-6.5z"/><path d="M2 22h6"/></svg> },
  { name: "pan", title: "Geser (Tangan) — klik-tahan lalu geser untuk menggulir kertas", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><path d="M18 11V6a2 2 0 0 0-4 0v5"/><path d="M14 10V4a2 2 0 0 0-4 0v7"/><path d="M10 10.5V6a2 2 0 0 0-4 0v10c0 3.3 2.7 6 6 6h2a6 6 0 0 0 6-6v-4a2 2 0 0 0-4 0"/></svg> },
  { name: "ruler", title: "Penggaris (garis lurus)", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><rect x="2" y="8" width="20" height="8" rx="1.5" transform="rotate(-20 12 12)"/><path d="M8.5 8l1.3 3.6M12 6.5l1.3 3.6M15.5 5l1.3 3.6" transform="rotate(-20 12 12)"/></svg> },
  { name: "text", title: "Ketik teks", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><path d="M4 6h16M12 6v14M9 20h6"/></svg> },
  { name: "eraser", title: "Penghapus", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><path d="M20 20H8l-6-6 10.5-10.5a2 2 0 0 1 2.8 0l5.2 5.2a2 2 0 0 1 0 2.8L14 18"/><path d="M6 14l6 6"/></svg> },
];

function NewNoteForm({ registerSubmit }: { registerSubmit: (get: () => { title: string; subject: string }) => void }) {
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  useEffect(() => registerSubmit(() => ({ title, subject })), [title, subject, registerSubmit]);
  return (
    <>
      <div className="form-field">
        <label>Judul catatan</label>
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="misal: Reaksi Redoks" />
      </div>
      <div className="form-field">
        <label>Mata pelajaran</label>
        <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="misal: Kimia" />
      </div>
    </>
  );
}

export default function CatatanView() {
  const { t } = useLang();
  const { show: toast } = useToast();
  const { open, close } = useModal();
  const { notes, currentNoteId, setCurrentNoteId, currentNote, addNote, togglePin, updateNote, setElements } = useNotes();

  const canvasHandleRef = useRef<DrawingCanvasHandle>(null);
  const newNoteSubmitRef = useRef<(() => { title: string; subject: string }) | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const [tool, setTool] = useState<Tool>("pen");
  const [color, setColor] = useState("#1F2233");
  const [size, setSize] = useState(3);
  const [zoomPct, setZoomPct] = useState(100);
  const [showEmojiPop, setShowEmojiPop] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [palmModeOn, setPalmModeOn] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [toolbarOpen, setToolbarOpen] = useState(true);
  const [textDefaults, setTextDefaults] = useState({ family: "'Cormorant Garamond', serif", size: 18, weight: "400", color: "#1F2233" });
  const [activeTextStyle, setActiveTextStyle] = useState<{ id: number; fontFamily: string; fontSize: number; fontWeight: string; fontColor: string } | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // REVISI Batch 13 (poin 1): sinkronkan `isFullscreen` langsung dari
  // event resmi browser `fullscreenchange` — ini terpicu baik saat
  // tombol "Layar Penuh" diklik MAUPUN saat pengguna menekan Esc
  // (Fullscreen API menangani Esc otomatis, kita cukup mendengarkan).
  useEffect(() => {
    function onFsChange() {
      const active = !!document.fullscreenElement && document.fullscreenElement === cardRef.current;
      setIsFullscreen(active);
      cardRef.current?.classList.toggle("fullscreen-mode", active);
    }
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  useEffect(() => {
    setActiveTextStyle(null);
  }, [currentNote?.id]);

  // REVISI Batch 13 (poin 1): pakai Fullscreen API bawaan browser —
  // dijamin benar-benar memenuhi layar, tidak bergantung pada CSS
  // kustom apa pun. Kalau browser/perangkat tidak mendukung API ini
  // (jarang terjadi), jatuh ke cara lama (toggle class CSS) sebagai
  // cadangan supaya tombolnya tetap memberi reaksi.
  async function toggleFullscreen() {
    if (!cardRef.current) return;
    try {
      if (!document.fullscreenElement) {
        await cardRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error("Fullscreen API gagal, pakai mode cadangan:", err);
      const isFull = cardRef.current.classList.toggle("fullscreen-mode");
      setIsFullscreen(isFull);
    }
  }

  // REVISI Batch 13 (poin 2b): bungkus try/catch tetap dipertahankan
  // dari Batch 11-12 — kalau applyColorToSelection gagal, jatuh ke
  // cara cadangan (warnai seluruh kotak teks aktif / warna default
  // teks baru), bukan berhenti total.
  function applyFontChange(patch: { family?: string; size?: number; weight?: string; color?: string }) {
    if (patch.color !== undefined && activeTextStyle && currentNote) {
      let appliedToSelection = false;
      try {
        appliedToSelection = !!canvasHandleRef.current?.applyColorToSelection(activeTextStyle.id, patch.color);
      } catch (err) {
        console.error("Gagal menerapkan warna ke seleksi:", err);
      }
      if (appliedToSelection) {
        return;
      }
    }
    if (activeTextStyle && currentNote) {
      const updated = {
        ...activeTextStyle,
        ...(patch.family !== undefined ? { fontFamily: patch.family } : {}),
        ...(patch.size !== undefined ? { fontSize: patch.size } : {}),
        ...(patch.weight !== undefined ? { fontWeight: patch.weight } : {}),
        ...(patch.color !== undefined ? { fontColor: patch.color } : {}),
      };
      setActiveTextStyle(updated);
      setElements(
        currentNote.id,
        currentNote.elements.map((el) =>
          el.id === activeTextStyle.id && el.type === "text"
            ? { ...el, fontFamily: updated.fontFamily, fontSize: updated.fontSize, fontWeight: updated.fontWeight, fontColor: updated.fontColor }
            : el
        )
      );
    } else {
      setTextDefaults((d) => ({
        ...d,
        ...(patch.family !== undefined ? { family: patch.family } : {}),
        ...(patch.size !== undefined ? { size: patch.size } : {}),
        ...(patch.weight !== undefined ? { weight: patch.weight } : {}),
        ...(patch.color !== undefined ? { color: patch.color } : {}),
      }));
    }
  }

  function switchNote(id: number) {
    if (canvasHandleRef.current && currentNote) {
      const dataUrl = canvasHandleRef.current.exportDataUrl();
      updateNote(currentNote.id, { canvasData: dataUrl });
    }
    setCurrentNoteId(id);
  }

  function createNewNote() {
    open({
      title: "Catatan baru",
      body: <NewNoteForm registerSubmit={(fn) => { newNoteSubmitRef.current = fn; }} />,
      onSave: () => {
        const v = newNoteSubmitRef.current?.();
        if (!v) return;
        const title = v.title.trim();
        if (!title) { toast("Judul catatan wajib diisi"); return; }
        const subject = v.subject.trim() || "Umum";
        const id = addNote(title, subject);
        switchNote(id);
        close();
        toast("Catatan baru dibuat");
      },
    });
  }

  async function handleExportPdf() {
    if (!canvasHandleRef.current || isExportingPdf) return;
    setIsExportingPdf(true);
    try {
      await canvasHandleRef.current.exportPdf();
      toast(t("pdfBerhasilDiunduh"));
    } catch (err) {
      console.error(err);
      toast(t("pdfGagal"));
    } finally {
      setIsExportingPdf(false);
    }
  }

  const sortedNotes = [...notes].sort((a, b) => Number(b.pinned) - Number(a.pinned));
  const activeColor = activeTextStyle?.fontColor ?? textDefaults.color;

  return (
    <div className="page-view">
      <div className="notes-layout">
        <div className="notes-list">
          {sortedNotes.map((n) => (
            <div key={n.id} className={"note-entry" + (n.id === currentNoteId ? " active" : "")} onClick={() => switchNote(n.id)}>
              <div className="ne-text"><b>{n.title}</b><span>{n.subject} · {n.date}</span></div>
              <button
                type="button"
                className={"pin-btn" + (n.pinned ? " pinned" : "")}
                title="Sematkan catatan penting"
                onClick={(e) => { e.stopPropagation(); togglePin(n.id); }}
              >
                📌
              </button>
            </div>
          ))}
          <button type="button" className="new-note-btn" onClick={createNewNote}>{t("catatanBaruBtn")}</button>
        </div>

        {!currentNote ? (
          <div className="canvas-card" style={{ alignItems: "center", justifyContent: "center", display: "flex" }}>
            <div className="empty-state">
              <div style={{ fontWeight: 700, marginBottom: 6 }}>{t("catatanKosongJudul")}</div>
              <div style={{ marginBottom: 14 }}>{t("catatanKosongHint")}</div>
              <button type="button" className="page-action" onClick={createNewNote}>{t("catatanBaruBtn")}</button>
            </div>
          </div>
        ) : (
        <div className="canvas-card" ref={cardRef} style={{ position: "relative" }}>

          {/* REVISI Batch 13 (poin 1): label muncul HANYA saat
              isFullscreen benar-benar true — sekarang akurat karena
              disinkronkan dari event fullscreenchange resmi browser. */}
          {isFullscreen && (
            <div
              style={{
                position: "fixed",
                top: 16,
                right: 26,
                fontFamily: "'Alex Brush', cursive",
                fontSize: 30,
                color: currentNote.dark ? "#F0CB3E" : "#6C5CE0",
                opacity: 0.9,
                pointerEvents: "none",
                zIndex: 60,
                letterSpacing: 0.5,
                textShadow: currentNote.dark ? "0 1px 6px rgba(240,203,62,0.35)" : "0 1px 6px rgba(108,92,224,0.25)",
              }}
            >
              Selamat Belajar ✨
            </div>
          )}

          <button
            type="button"
            className="text-btn"
            style={{ alignSelf: "flex-start", margin: "2px 0 4px" }}
            onClick={() => setToolbarOpen((v) => !v)}
          >
            {toolbarOpen ? t("sembunyikanToolbar") : t("tampilkanToolbar")}
          </button>

          {toolbarOpen && (
          <>
          <div className="toolbar">
            {TOOLS.map((tb) => (
              <button
                type="button"
                key={tb.name}
                className={"tool-btn" + (tool === tb.name ? " active" : "")}
                title={tb.title}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setTool(tb.name)}
              >
                {tb.icon}
              </button>
            ))}

            <div className="divider" />
            <div className="swatches">
              {SWATCHES.map((sw) => (
                <div
                  key={sw.color}
                  className={"swatch" + (color === sw.color ? " selected" : "")}
                  style={{ background: sw.color, border: sw.color === "#FFFFFF" ? "1.5px solid var(--line)" : undefined }}
                  title={sw.title}
                  onClick={() => setColor(sw.color)}
                />
              ))}
              <label className="swatch swatch-custom" title="Warna kustom">
                <span>+</span>
                <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
              </label>
            </div>

            <div className="divider" />
            <div className="thickness">
              <label>Ukuran</label>
              <input type="range" min={1} max={40} value={size} onChange={(e) => setSize(+e.target.value)} />
            </div>

            <div className="divider" />
            <div className="text-font-group" title={t("warnaFontBlokHint")}>
              <label>{t("jenisFont")}</label>
              {/* REVISI Batch 13 (poin 2b): onMouseDown preventDefault
                  DIHAPUS dari sini — itu yang membuat dropdown gagal
                  terbuka. */}
              <select
                value={activeTextStyle?.fontFamily ?? textDefaults.family}
                onChange={(e) => applyFontChange({ family: e.target.value })}
              >
                <option value="'Cormorant Garamond', serif">Cormorant Garamond</option>
                <option value="'Playfair Display', serif">Playfair Display</option>
                <option value="'Alex Brush', cursive">Alex Brush</option>
                <option value="'Tangerine', cursive">Tangerine</option>
                <option value="Georgia, serif">Georgia</option>
                <option value="Arial, sans-serif">Arial</option>
                <option value="'Times New Roman', serif">Times New Roman</option>
                <option value="'Courier New', monospace">Courier New</option>
              </select>
              <label>{t("ukuranFont")}</label>
              <input
                type="number"
                min={10}
                max={72}
                value={activeTextStyle?.fontSize ?? textDefaults.size}
                onChange={(e) => applyFontChange({ size: +e.target.value || 18 })}
              />
              <label>{t("ketebalanFont")}</label>
              {/* REVISI Batch 13 (poin 2b): onMouseDown preventDefault
                  DIHAPUS dari sini juga, dengan alasan yang sama. */}
              <select
                value={activeTextStyle?.fontWeight ?? textDefaults.weight}
                onChange={(e) => applyFontChange({ weight: e.target.value })}
              >
                <option value="400">{t("beratNormal")}</option>
                <option value="600">{t("beratSedang")}</option>
                <option value="700">{t("beratTebal")}</option>
                <option value="800">{t("beratEkstraTebal")}</option>
              </select>

              <label>{t("warnaFont")}</label>
              <div style={{ display: "flex", gap: 4, alignItems: "center", flexWrap: "wrap" }}>
                {TEXT_COLOR_SWATCHES.map((sw) => (
                  <button
                    type="button"
                    key={sw.color}
                    title={sw.title}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => applyFontChange({ color: sw.color })}
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 5,
                      background: sw.color,
                      border: sw.color === "#FFFFFF" ? "1.5px solid var(--line)" : (activeColor === sw.color ? "2px solid #6C5CE0" : "1.5px solid rgba(0,0,0,.15)"),
                      cursor: "pointer",
                      padding: 0,
                    }}
                  />
                ))}
                <label
                  title="Warna kustom (membuka dialog — sebaiknya dipakai tanpa blok teks aktif)"
                  style={{ width: 20, height: 20, borderRadius: 5, border: "1.5px dashed var(--line)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 12, lineHeight: 1 }}
                >
                  +
                  <input
                    type="color"
                    value={activeColor}
                    onChange={(e) => applyFontChange({ color: e.target.value })}
                    style={{ width: 0, height: 0, opacity: 0, position: "absolute" }}
                  />
                </label>
              </div>
            </div>

            <div className="divider" />
            <button type="button" className="tool-btn" title="Tambah stiker" onClick={() => setShowEmojiPop((v) => !v)}>😀</button>
            <button
              type="button"
              className="tool-btn"
              title="Tambah sticky note"
              onClick={() =>
                setElements(currentNote.id, [
                  ...currentNote.elements,
                  { id: Date.now(), type: "sticky", text: "Catatan penting…", x: 220 + Math.random() * 200, y: 260 + Math.random() * 200 },
                ])
              }
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><path d="M5 3h11l5 5v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M16 3v5h5"/></svg>
            </button>
            <button type="button" className="tool-btn" title="Unggah gambar" onClick={() => imageInputRef.current?.click()}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
            </button>
            <input
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              ref={imageInputRef}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = () =>
                  setElements(currentNote.id, [
                    ...currentNote.elements,
                    { id: Date.now(), type: "image", src: reader.result as string, x: 240, y: 240 },
                  ]);
                reader.readAsDataURL(file);
                e.target.value = "";
              }}
            />
            {showEmojiPop && (
              <div className="emoji-pop show">
                {emojiList.map((em) => (
                  <button
                    type="button"
                    key={em}
                    onClick={() => {
                      setElements(currentNote.id, [
                        ...currentNote.elements,
                        { id: Date.now(), type: "sticker", emoji: em, x: 200 + Math.random() * 200, y: 200 + Math.random() * 200 },
                      ]);
                      setShowEmojiPop(false);
                    }}
                  >
                    {em}
                  </button>
                ))}
              </div>
            )}

            <div className="toolbar-right">
              <div className="zoom-group">
                <button type="button" className="text-btn" onClick={() => canvasHandleRef.current?.zoomOut()}>−</button>
                <span className="zoom-label">{zoomPct}%</span>
                <button type="button" className="text-btn" onClick={() => canvasHandleRef.current?.zoomIn()}>+</button>
                <button type="button" className="text-btn" onClick={() => canvasHandleRef.current?.zoomReset()}>{t("reset")}</button>
              </div>
              <button type="button" className="text-btn" onClick={toggleFullscreen}>
                {isFullscreen ? t("keluarLayarPenuh") : t("layarPenuh")}
              </button>
              <button
                type="button"
                className="text-btn"
                onClick={() => { const ok = canvasHandleRef.current?.undo(); if (ok === false) toast(t("tidakAdaUntukDiurungkan")); }}
              >
                {t("urungkan")}
              </button>
              <button
                type="button"
                className="text-btn"
                onClick={() => { const ok = canvasHandleRef.current?.redo(); if (ok === false) toast(t("tidakAdaUntukDiulangi")); }}
              >
                {t("ulangi")}
              </button>
              <button
                type="button"
                className="text-btn"
                onClick={() => { canvasHandleRef.current?.clear(); toast(t("kanvasDibersihkan")); }}
              >
                {t("bersihkan")}
              </button>
              <button type="button" className="text-btn" onClick={handleExportPdf} disabled={isExportingPdf}>
                {isExportingPdf ? t("menyiapkanPdf") : t("unduhPdf")}
              </button>
            </div>
          </div>

          <div className="toolbar2">
            <div className="toolbar2-group">
              <label>Jenis kertas</label>
              <select
                value={currentNote.paperType}
                onChange={(e) => updateNote(currentNote.id, { paperType: e.target.value as typeof currentNote.paperType })}
              >
                <option value="garis">Bergaris</option>
                <option value="kotak">Kotak-kotak</option>
                <option value="dot">Dot grid</option>
                <option value="polos">Polos</option>
              </select>
            </div>
            <div className="toolbar2-group">
              <label>{t("latarKertas")}</label>
              <select
                value={currentNote.dark ? "gelap" : "terang"}
                onChange={(e) => updateNote(currentNote.id, { dark: e.target.value === "gelap" })}
              >
                <option value="terang">{t("latarTerang")}</option>
                <option value="gelap">{t("latarGelap")}</option>
              </select>
            </div>
            <div className="toolbar2-group">
              <label>Template</label>
              <select
                value={currentNote.template}
                onChange={(e) => updateNote(currentNote.id, { template: e.target.value as typeof currentNote.template })}
              >
                <option value="kosong">Bebas</option>
                <option value="cornell">Cornell (isyarat / catatan / ringkasan)</option>
                <option value="garis-tengah">{t("templateGarisTengah")}</option>
              </select>
            </div>
            <label className="focus-alarm-toggle" title={t("modePenaHint")}>
              <input type="checkbox" checked={palmModeOn} onChange={(e) => setPalmModeOn(e.target.checked)} />
              <span>{t("modePena")}</span>
            </label>
            <div className="hint-text" style={{ marginLeft: "auto" }}>Geser area kertas untuk melihat bagian yang belum terlihat.</div>
          </div>
          </>
          )}

          <DrawingCanvas
            ref={canvasHandleRef}
            note={currentNote}
            tool={tool}
            color={color}
            size={size}
            textDefaults={textDefaults}
            palmModeOn={palmModeOn}
            onActiveTextChange={setActiveTextStyle}
            onElementsChange={(elements) => setElements(currentNote.id, elements)}
            onZoomChange={(z) => setZoomPct(Math.round(z * 100))}
          />
        </div>
        )}
      </div>
    </div>
  );
}