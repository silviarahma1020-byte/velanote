"use client";
// ============================================================
// AiView — porting dari js/ai.js (sendMsg, attach image, chip
// quick-replies) + partials/ai.html.
// ============================================================
import { useEffect, useRef, useState } from "react";
import { useLang } from "@/context/LangContext";

interface ChatMsg {
  id: number;
  from: "user" | "ai";
  text?: string;
  image?: string;
}

const AI_REPLIES = [
  "Baik, aku cek catatan terkait dulu, lalu kususun jawabannya dalam beberapa poin ringkas.",
  "Sudah kubuatkan. Kalau masih ada bagian yang belum jelas, tanya lagi saja ya.",
  "Ini rangkumannya — coba cocokkan dengan catatan aslinya supaya lebih yakin.",
];

const INITIAL_MESSAGES: ChatMsg[] = [
  { id: 1, from: "ai", text: 'Halo! Aku sudah baca catatan "Turunan & Limit" kamu. Mau aku rangkum, atau buatkan soal latihan dari situ?' },
  { id: 2, from: "user", text: "Buatkan 3 soal latihan turunan ya" },
  {
    id: 3, from: "ai",
    text: "Oke, ini 3 soal berdasarkan catatanmu:\n1. Tentukan turunan dari f(x) = 3x⁴ − 2x²\n2. Cari nilai limit mendekati turunan pada x = 2\n3. Jelaskan hubungan turunan dengan kemiringan garis singgung",
  },
];

export default function AiView() {
  const { t } = useLang();
  const [messages, setMessages] = useState<ChatMsg[]>(INITIAL_MESSAGES);
  const [text, setText] = useState("");
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const nextIdRef = useRef(100);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  function sendMsg(raw: string) {
    const value = raw.trim();
    if (!value && !attachedImage) return;
    const userMsg: ChatMsg = { id: nextIdRef.current++, from: "user", text: value || undefined, image: attachedImage || undefined };
    setMessages((prev) => [...prev, userMsg]);
    setText("");
    setAttachedImage(null);
    setTimeout(() => {
      const reply = AI_REPLIES[Math.floor(Math.random() * AI_REPLIES.length)];
      setMessages((prev) => [...prev, { id: nextIdRef.current++, from: "ai", text: reply }]);
    }, 500);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAttachedImage(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  return (
    <div className="page-view">
      <div className="chat-card">
        <div className="chat-messages" ref={scrollRef}>
          {messages.map((m) => (
            <div className={"msg " + m.from} key={m.id}>
              {m.from === "ai" && <div className="msg-label">Asisten Belajar</div>}
              {m.image && <img className="msg-image" src={m.image} alt="Gambar terlampir" />}
              {m.text && (
                <div className={m.from === "user" ? undefined : "msg-text"}>
                  {m.text.split("\n").map((line, i) => (
                    <span key={i}>
                      {line}
                      {i < m.text!.split("\n").length - 1 && <br />}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="chat-quick">
          <button className="chip-btn" onClick={() => sendMsg(t("chipRangkum"))}>{t("chipRangkum")}</button>
          <button className="chip-btn" onClick={() => sendMsg(t("chipSederhana"))}>{t("chipSederhana")}</button>
          <button className="chip-btn" onClick={() => sendMsg(t("chipFlashcard"))}>{t("chipFlashcard")}</button>
        </div>

        {attachedImage && (
          <div className="chat-attach-preview" style={{ display: "flex" }}>
            <img src={attachedImage} alt="" />
            <button type="button" title={t("hapusLampiran")} onClick={() => setAttachedImage(null)}>✕</button>
          </div>
        )}

        <div className="chat-input-row">
          <button className="attach-btn" type="button" title={t("lampirkanGambar")} onClick={() => fileInputRef.current?.click()}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
          </button>
          <input type="file" accept="image/*" style={{ display: "none" }} ref={fileInputRef} onChange={handleFileChange} />
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") sendMsg(text); }}
            placeholder={t("chatInputPh")}
          />
          <button className="send-btn" onClick={() => sendMsg(text)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 2L11 13" />
              <path d="M22 2l-7 20-4-9-9-4 20-7z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}