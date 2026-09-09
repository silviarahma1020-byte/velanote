"use client";
// ============================================================
// UjianView — Kalender Ujian.
//
// REVISI Batch 7 (poin 4):
// 1. Sub-materi sekarang bisa dipisah pakai TANDA KOMA **atau**
//    ENTER (baris baru) — dulu cuma bisa koma.
// 2. Field "Progres persiapan (%)" yang diketik manual DIHAPUS.
//    Progres sekarang otomatis dihitung dari berapa sub-materi yang
//    sudah kamu tandai "sudah dipelajari" (klik chip-nya di kartu
//    ujian) dibanding total sub-materi — jadi selalu jujur mengikuti
//    materi yang benar-benar sudah dipelajari, bukan angka manual.
// ============================================================
import { useEffect, useRef, useState } from "react";
import { useLang } from "@/context/LangContext";
import { useToast } from "@/context/ToastContext";
import { useModal } from "@/context/ModalContext";
import { useRegisterPageAction } from "@/context/PageActionContext";
import { useExams } from "@/context/ExamsContext";
import { daysLeft } from "@/data/utils";
import { ExamData, ExamTopic } from "@/data/types";

type ExamFormValues = { name: string; date: string; loc: string; topicsText: string };

// REVISI Batch 7 (poin 4): pisah per baris ATAU koma, buang yang kosong.
function parseTopicsText(text: string): { raw: string; weak: boolean; name: string }[] {
  return text
    .split(/[,\n]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((raw) => {
      const weak = /:weak$/i.test(raw);
      const name = raw.replace(/:weak$/i, "").trim();
      return { raw, weak, name };
    })
    .filter((tp) => tp.name.length > 0);
}

function topicsToText(topics: ExamTopic[]): string {
  return topics.map((tp) => tp.name + (tp.weak ? ":weak" : "")).join("\n");
}

function ExamForm({
  initial,
  registerSubmit,
}: {
  initial: ExamFormValues;
  registerSubmit: (getValues: () => ExamFormValues) => void;
}) {
  const { t } = useLang();
  const [name, setName] = useState(initial.name);
  const [date, setDate] = useState(initial.date);
  const [loc, setLoc] = useState(initial.loc);
  const [topicsText, setTopicsText] = useState(initial.topicsText);

  useEffect(() => {
    registerSubmit(() => ({ name, date, loc, topicsText }));
  }, [name, date, loc, topicsText, registerSubmit]);

  return (
    <>
      <div className="form-field">
        <label>Nama ujian</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="misal: UTS Kalkulus II" />
      </div>
      <div className="form-row2">
        <div className="form-field">
          <label>Tanggal</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="form-field">
          <label>Lokasi</label>
          <input type="text" value={loc} onChange={(e) => setLoc(e.target.value)} placeholder="misal: B301" />
        </div>
      </div>
      <div className="form-field">
        {/* REVISI Batch 7 (poin 4): boleh koma ATAU enter */}
        <label>{t("topikHint")}</label>
        <textarea
          value={topicsText}
          onChange={(e) => setTopicsText(e.target.value)}
          placeholder={t("topikPlaceholder")}
          rows={5}
        />
        <div className="hint-text" style={{ marginTop: 4 }}>{t("progresOtomatisHint")}</div>
      </div>
    </>
  );
}

export default function UjianView() {
  const { t, lang } = useLang();
  const { show: toast } = useToast();
  const { open, close } = useModal();
  const { exams, addExam, updateExam, deleteExam, toggleTopicDone } = useExams();
  const submitRef = useRef<(() => ExamFormValues) | null>(null);

  function openExamModal(ex: ExamData | null) {
    const isEdit = !!ex;
    const initial: ExamFormValues = {
      name: isEdit ? ex!.name : "",
      date: isEdit ? ex!.date : "",
      loc: isEdit ? ex!.loc : "",
      topicsText: isEdit ? topicsToText(ex!.topics) : "",
    };

    const handleSave = (v: ExamFormValues) => {
      const name = v.name.trim();
      if (!name || !v.date) { toast("Nama dan tanggal wajib diisi"); return; }
      // REVISI Batch 7 (poin 4): pertahankan status "sudah dipelajari"
      // untuk sub-materi yang namanya tidak berubah saat diedit ulang;
      // sub-materi baru/berganti nama mulai dari status belum dipelajari.
      const prevByName = new Map((ex?.topics ?? []).map((tp) => [tp.name, tp]));
      const topics: ExamTopic[] = parseTopicsText(v.topicsText).map(({ name: tName, weak }) => ({
        name: tName,
        weak,
        done: prevByName.get(tName)?.done ?? false,
      }));
      const payload = {
        name,
        date: v.date,
        loc: v.loc.trim() || "-",
        topics,
      };
      if (isEdit) { updateExam(ex!.id, payload); toast("Ujian diperbarui"); }
      else { addExam(payload); toast("Ujian ditambahkan"); }
      close();
    };

    open({
      title: isEdit ? t("ubahUjian") : t("tambahUjian"),
      body: <ExamForm initial={initial} registerSubmit={(fn) => { submitRef.current = fn; }} />,
      onSave: () => { if (submitRef.current) handleSave(submitRef.current()); },
      onDelete: isEdit ? () => { deleteExam(ex!.id); toast("Ujian dihapus"); } : undefined,
    });
  }

  useRegisterPageAction(t("tambahUjian"), () => openExamModal(null));

  return (
    <div className="page-view">
      <div className="exam-grid">
        {!exams.length ? (
          <div className="empty-state">{t("belumAdaUjianTombol")}</div>
        ) : (
          exams.map((ex) => {
            const dl = daysLeft(ex.date);
            const dateFmt = new Date(ex.date + "T00:00:00").toLocaleDateString(
              lang === "id" ? "id-ID" : "en-US",
              { weekday: "long", day: "numeric", month: "long" }
            );
            // REVISI Batch 7 (poin 4): progres otomatis dari sub-materi
            // yang sudah ditandai selesai, bukan lagi angka manual.
            const total = ex.topics.length;
            const doneCount = ex.topics.filter((tp) => tp.done).length;
            const progress = total ? Math.round((doneCount / total) * 100) : 0;
            return (
              <div className="exam-card" key={ex.id}>
                <div className="exam-top">
                  <div>
                    <div className="exam-name">{ex.name}</div>
                    <div className="exam-date">{dateFmt} · {ex.loc}</div>
                  </div>
                  <div className="exam-actions">
                    <button type="button" className="icon-btn" onClick={() => openExamModal(ex)}>✎</button>
                  </div>
                </div>
                <div className="countdown">
                  {dl >= 0 ? dl : 0}
                  <span>{dl >= 0 ? t("hariLagi") : t("sudahLewat")}</span>
                </div>
                <div className="exam-progress-track">
                  <div className="exam-progress-fill" style={{ width: progress + "%" }} />
                </div>
                <div className="hint-text" style={{ margin: "2px 0 6px" }}>
                  {total ? `${doneCount}/${total} ${t("subMateriSelesai")} · ${progress}%` : t("belumAdaSubMateri")}
                </div>
                <div className="exam-topics">
                  {ex.topics.map((tp, i) => (
                    <button
                      type="button"
                      key={tp.name + i}
                      className={"topic-chip" + (tp.weak ? " weak" : "") + (tp.done ? " done" : "")}
                      title={tp.done ? t("tandaiBelumDipelajari") : t("tandaiSudahDipelajari")}
                      onClick={() => toggleTopicDone(ex.id, i)}
                    >
                      {tp.done ? "✓ " : ""}{tp.name}
                    </button>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}