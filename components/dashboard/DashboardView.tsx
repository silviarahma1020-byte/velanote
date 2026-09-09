"use client";
// ============================================================
// DashboardView — porting dari js/dashboard.js (fungsi
// renderDashboard, priorityLabel) + partials/dashboard.html.
// Struktur/class HTML dijaga persis sama dengan versi vanilla
// supaya semua styling di css/dashboard.css tetap berlaku tanpa
// perubahan apa pun.
// ============================================================
import Link from "next/link";
import { useLang } from "@/context/LangContext";
import { useSchedule } from "@/context/ScheduleContext";
import { useTasks } from "@/context/TasksContext";
import { useExams } from "@/context/ExamsContext";
import { useNotes } from "@/context/NotesContext";
import { colors } from "@/data/seed";
import { fmtTime, daysLeft, todayIndex } from "@/data/utils";
import { Priority } from "@/data/types";

function priorityLabel(t: (k: string) => string, p: Priority) {
  return p === "high" ? t("prioTinggiShort") : p === "med" ? t("prioSedangShort") : t("prioRendahShort");
}

export default function DashboardView() {
  const { t } = useLang();
  const { events } = useSchedule();
  const { tasks } = useTasks();
  const { exams } = useExams();
  const { notes } = useNotes();

  const doneCount = tasks.filter((tk) => tk.done).length;
  const pendingCount = tasks.length - doneCount;

  const todayIdx = todayIndex();
  const todayEvents = events.filter((e) => e.day === todayIdx).sort((a, b) => a.start - b.start);

  const pendingTasks = tasks.filter((tk) => !tk.done).slice(0, 4);

  const nearestExam = exams.length
    ? [...exams].sort((a, b) => daysLeft(a.date) - daysLeft(b.date))[0]
    : undefined;
  // REVISI Batch 7 (poin 4): `ExamData.progress` sudah tidak ada lagi
  // (progres sekarang dihitung otomatis dari sub-materi yang ditandai
  // "sudah dipelajari", lihat ExamsContext.tsx/UjianView.tsx) — hitung
  // dengan cara yang sama di sini supaya kartu di dashboard konsisten.
  const nearestExamProgress = nearestExam && nearestExam.topics.length
    ? Math.round((nearestExam.topics.filter((tp) => tp.done).length / nearestExam.topics.length) * 100)
    : 0;

  const pinnedNote = notes.find((n) => n.pinned) || notes[0];

  return (
    <div className="page-view">
      <div className="stat-row">
        <div className="stat-box"><b>{pendingCount}</b><span>{t("tugasBelumSelesai")}</span></div>
        <div className="stat-box"><b>{events.length}</b><span>{t("jadwalMingguIni")}</span></div>
        <div className="stat-box"><b>{exams.length}</b><span>{t("ujianAkanDatang")}</span></div>
      </div>

      <div className="dash-grid">
        <div className="dash-col">
          <div className="dash-card">
            <h3>
              <span>{t("dashJadwalHariIni")}</span>
              <Link href="/jadwal">{t("lihatSemua")}</Link>
            </h3>
            <div>
              {todayEvents.length ? (
                todayEvents.map((e) => (
                  <div className="mini-row" key={e.id}>
                    <span className="mini-dot" style={{ background: colors[e.color] }} />
                    <b>{e.title}</b>
                    <span className="mm">{fmtTime(e.start)}</span>
                  </div>
                ))
              ) : (
                <div className="hint-text">{t("tidakAdaJadwalHariIni")}</div>
              )}
            </div>
          </div>

          <div className="dash-card">
            <h3>
              <span>{t("dashTugasMendesak")}</span>
              <Link href="/tugas">{t("lihatSemua")}</Link>
            </h3>
            <div>
              {pendingTasks.length ? (
                pendingTasks.map((tk) => (
                  <div className="mini-row" key={tk.id}>
                    <span className={"pill " + tk.priority}>{priorityLabel(t, tk.priority)}</span>
                    <b>{tk.title}</b>
                  </div>
                ))
              ) : (
                <div className="hint-text">{t("semuaTugasSelesai")}</div>
              )}
            </div>
          </div>
        </div>

        <div className="dash-col">
          <div className="dash-card">
            <h3>
              <span>{t("dashUjianTerdekat")}</span>
              <Link href="/ujian">{t("lihatSemua")}</Link>
            </h3>
            <div>
              {nearestExam ? (
                <>
                  <div className="mini-row">
                    <b>{nearestExam.name}</b>
                    <span className="mm">{daysLeft(nearestExam.date)} {t("hariLagi")}</span>
                  </div>
                  <div className="exam-progress-track" style={{ marginTop: 8 }}>
                    <div className="exam-progress-fill" style={{ width: nearestExamProgress + "%" }} />
                  </div>
                </>
              ) : (
                <div className="hint-text">{t("belumAdaUjianDijadwalkan")}</div>
              )}
            </div>
          </div>

          <div className="dash-card">
            <h3>
              <span>{t("dashCatatanDisematkan")}</span>
              <Link href="/catatan">{t("buka")}</Link>
            </h3>
            <div>
              {pinnedNote ? (
                <>
                  <div className="mini-row">
                    <b>{pinnedNote.title}</b>
                    <span className="mm">{pinnedNote.subject}</span>
                  </div>
                  <div className="hint-text" style={{ marginTop: 6 }}>{t("klikBukaUntukMenulis")}</div>
                </>
              ) : (
                <div className="hint-text">{t("belumAdaCatatan")}</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}