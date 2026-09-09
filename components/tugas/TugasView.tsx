"use client";
// ============================================================
// TugasView — Halaman Tugas Saya.
// REVISI Batch 8 (poin 2): tambah ikon 🗑️ di atas daftar tugas.
// Klik ikon itu → masuk "mode pilih": tiap kartu tugas menampilkan
// checkbox (menggantikan lingkaran centang "selesai" sementara),
// tugas yang dicentang bisa dihapus sekaligus lewat tombol
// "Hapus terpilih". Tombol hapus satuan ("×") tetap ada di luar
// mode pilih untuk hapus cepat satu per satu seperti sebelumnya.
// ============================================================
import { useMemo, useState } from "react";
import { useLang } from "@/context/LangContext";
import { useToast } from "@/context/ToastContext";
import { useTasks } from "@/context/TasksContext";
import { useSchedule } from "@/context/ScheduleContext";
import { Priority, TaskGroup } from "@/data/types";
import { fmtDate } from "@/data/utils";

function priorityLabel(t: (k: string) => string, p: Priority) {
  return p === "high" ? t("prioTinggiShort") : p === "med" ? t("prioSedangShort") : t("prioRendahShort");
}

function todayStr() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const GROUPS_ORDER: TaskGroup[] = ["Hari ini", "Besok", "Minggu ini", "Nanti"];

// REVISI Batch 8 (poin 2): ikon tempat sampah sederhana.
function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" width="18" height="18">
      <path d="M4 7h16" />
      <path d="M9 7V4h6v3" />
      <path d="M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}

export default function TugasView() {
  const { t, lang } = useLang();
  const { show: toast } = useToast();
  const { tasks, addTask, toggleDone, deleteTask, deleteTasks } = useTasks();
  const { events } = useSchedule();

  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("Umum");
  const [priority, setPriority] = useState<Priority>("med");
  const [deadline, setDeadline] = useState(todayStr());

  // REVISI Batch 8 (poin 2): state mode pilih & seleksi.
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const subjectOptions = useMemo(
    () => Array.from(new Set(events.map((e) => e.title))).filter(Boolean),
    [events]
  );

  const groupLabel: Record<TaskGroup, string> = {
    "Hari ini": t("hariIni"),
    Besok: t("besok"),
    "Minggu ini": t("mingguIni"),
    Nanti: t("nanti"),
  };

  function submit() {
    const name = title.trim();
    if (!name) { toast(t("tulisNamaTugas")); return; }
    addTask(name, subject, priority, deadline || todayStr());
    setTitle("");
    setDeadline(todayStr());
    toast(t("tugasDitambahkan"));
  }

  function toggleSelectMode() {
    setSelectMode((v) => !v);
    setSelected(new Set());
  }

  function toggleSelected(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function submitDeleteSelected() {
    if (!selected.size) { toast(t("pilihTugasDulu")); return; }
    deleteTasks(selected);
    setSelected(new Set());
    setSelectMode(false);
    toast(t("tugasTerpilihDihapus"));
  }

  return (
    <div className="page-view">
      <div className="task-add">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
          placeholder={t("taskInputPh")}
        />
        <select value={subject} onChange={(e) => setSubject(e.target.value)}>
          <option>{t("umum")}</option>
          {subjectOptions.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
          <option value="high">{t("prioTinggi")}</option>
          <option value="med">{t("prioSedang")}</option>
          <option value="low">{t("prioRendah")}</option>
        </select>
        <input
          type="date"
          value={deadline}
          title={t("tenggatTugas")}
          onChange={(e) => setDeadline(e.target.value)}
        />
        <button onClick={submit}>{t("tambahBtn")}</button>
      </div>

      {/* REVISI Batch 8 (poin 2): bar ikon tempat sampah + aksi pilih/hapus */}
      {tasks.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "10px 0" }}>
          <button
            type="button"
            className="icon-btn"
            title={selectMode ? t("batalPilihTugas") : t("pilihHapusTugas")}
            onClick={toggleSelectMode}
            style={selectMode ? { color: "var(--danger, #D64545)" } : undefined}
          >
            <TrashIcon />
          </button>
          {selectMode && (
            <>
              <span className="hint-text">{selected.size} / {tasks.length}</span>
              <button type="button" className="btn-danger-sm" onClick={submitDeleteSelected}>
                {t("hapusTugasTerpilih")}
              </button>
              <button type="button" className="link-action" onClick={toggleSelectMode}>
                {t("batalPilih")}
              </button>
            </>
          )}
        </div>
      )}

      <div className="task-groups">
        {!tasks.length ? (
          <div className="empty-state">{t("belumAdaTugas")}</div>
        ) : (
          GROUPS_ORDER.map((g) => {
            const items = tasks.filter((tk) => tk.group === g);
            if (!items.length) return null;
            return (
              <div key={g}>
                <div className="task-group-label">{groupLabel[g]}</div>
                {items.map((tk) => (
                  <div className="task-card" key={tk.id}>
                    {selectMode ? (
                      <input
                        type="checkbox"
                        checked={selected.has(tk.id)}
                        onChange={() => toggleSelected(tk.id)}
                        style={{ width: 18, height: 18, marginRight: 2, cursor: "pointer" }}
                      />
                    ) : (
                      <div
                        className={"task-check" + (tk.done ? " done" : "")}
                        onClick={() => toggleDone(tk.id)}
                      />
                    )}
                    <div className="task-body">
                      <div className={"task-title" + (tk.done ? " done" : "")}>{tk.title}</div>
                      <div className="task-meta">
                        <span className={"pill " + tk.priority}>{priorityLabel(t, tk.priority)}</span>
                        <span className="task-sub">{tk.subject} · {fmtDate(tk.deadline, lang)}</span>
                      </div>
                    </div>
                    {!selectMode && (
                      <button
                        className="task-del"
                        onClick={() => { deleteTask(tk.id); toast(t("tugasDihapus")); }}
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}