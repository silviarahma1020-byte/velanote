"use client";
// ============================================================
// JadwalView — Halaman Jadwal (grid mingguan + modal tambah/ubah).
// REVISI Batch 6 (item 3): kotak "legenda" warna di atas halaman
// sebelumnya berisi teks tetap (Kalkulus, Fisika Dasar, Pemrograman,
// Bahasa Inggris, Tugas/Deadline) — sisa dari data contoh lama yang
// kelewat saat pengosongan data di Batch 1. Sekarang legenda dibuat
// otomatis dari jadwal yang benar-benar kamu buat sendiri: kosong
// kalau belum ada jadwal, terisi otomatis begitu kamu menambahkan.
// ============================================================
import { useEffect, useMemo, useRef, useState } from "react";
import { useLang } from "@/context/LangContext";
import { useToast } from "@/context/ToastContext";
import { useModal } from "@/context/ModalContext";
import { useRegisterPageAction } from "@/context/PageActionContext";
import { useSchedule } from "@/context/ScheduleContext";
import { days, startHour, endHour, colors } from "@/data/seed";
import { fmtTime, todayIndex } from "@/data/utils";
import { EventColor, ScheduleEvent } from "@/data/types";

const rowH = 52;
// REVISI Batch 7 (poin 3): tinggi baris judul hari ("Sen", "Sel", dst)
// di atas grid jadwal. Dulu kotak jadwal diposisikan pakai
// `top: (jam - startHour) * rowH` yang DIHITUNG DARI PALING ATAS
// `.grid-wrap` — padahal baris judul hari itu sendiri juga ada di
// dalam `.grid-wrap` yang sama, jadi jadwal jam PERTAMA (jam 7, sama
// dengan startHour) selalu jatuh tepat di atas baris judul hari itu
// (top: 0), menutupinya. Sekarang tinggi baris judul diberi nilai
// tetap (harus SAMA PERSIS dengan `.grid-head` di app/globals.css)
// lalu ditambahkan ke perhitungan `top` supaya kotak jadwal jam
// berapa pun (termasuk jam pertama) selalu jatuh DI BAWAH baris
// judul hari, bukan menimpanya.
const headerH = 34;

function EventForm({
  initial,
  registerSubmit,
}: {
  initial: { title: string; day: number; color: EventColor; start: number; end: number; loc: string };
  registerSubmit: (getValues: () => typeof initial) => void;
}) {
  const [title, setTitle] = useState(initial.title);
  const [day, setDay] = useState(initial.day);
  const [color, setColor] = useState<EventColor>(initial.color);
  const [start, setStart] = useState(initial.start);
  const [end, setEnd] = useState(initial.end);
  const [loc, setLoc] = useState(initial.loc);

  useEffect(() => {
    registerSubmit(() => ({ title, day, color, start, end, loc }));
  }, [title, day, color, start, end, loc, registerSubmit]);

  return (
    <>
      <div className="form-field">
        <label>Nama kegiatan</label>
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="misal: Kalkulus II" />
      </div>
      <div className="form-row2">
        <div className="form-field">
          <label>Hari</label>
          <select value={day} onChange={(e) => setDay(+e.target.value)}>
            {days.map((d, i) => (
              <option key={d} value={i}>{d}</option>
            ))}
          </select>
        </div>
        <div className="form-field">
          <label>Warna / kategori</label>
          <select value={color} onChange={(e) => setColor(e.target.value as EventColor)}>
            {Object.keys(colors).map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="form-row2">
        <div className="form-field">
          <label>Jam mulai</label>
          <input type="number" min={startHour} max={endHour} step={0.5} value={start} onChange={(e) => setStart(+e.target.value)} />
        </div>
        <div className="form-field">
          <label>Jam selesai</label>
          <input type="number" min={startHour} max={endHour} step={0.5} value={end} onChange={(e) => setEnd(+e.target.value)} />
        </div>
      </div>
      <div className="form-field">
        <label>Lokasi</label>
        <input type="text" value={loc} onChange={(e) => setLoc(e.target.value)} placeholder="misal: B301" />
      </div>
    </>
  );
}

export default function JadwalView() {
  const { t } = useLang();
  const { show: toast } = useToast();
  const { open, close } = useModal();
  const { events, addEvent, updateEvent, deleteEvent } = useSchedule();
  const submitRef = useRef<(() => { title: string; day: number; color: EventColor; start: number; end: number; loc: string }) | null>(null);

  const todayIdx = todayIndex();
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  // REVISI Batch 6 (item 3): legenda dinamis dari jadwal yang ada,
  // bukan teks tetap. Satu nama kegiatan unik = satu baris legenda,
  // dengan warna sesuai yang dipilih pengguna saat menambahkannya.
  const legendItems = useMemo(() => {
    const map = new Map<string, EventColor>();
    events.forEach((ev) => {
      if (!map.has(ev.title)) map.set(ev.title, ev.color);
    });
    return Array.from(map.entries());
  }, [events]);

  function openEventModal(ev: ScheduleEvent | null, prefDay = 0, prefHour = 8) {
    const isEdit = !!ev;
    const initial = {
      title: isEdit ? ev!.title : "",
      day: isEdit ? ev!.day : prefDay,
      color: isEdit ? ev!.color : ("amber" as EventColor),
      start: isEdit ? ev!.start : prefHour,
      end: isEdit ? ev!.end : prefHour + 1.5,
      loc: isEdit ? ev!.loc : "",
    };

    const handleSave = (data: typeof initial) => {
      const title = data.title.trim();
      if (!title) { toast("Nama kegiatan wajib diisi"); return; }
      if (data.end <= data.start) { toast("Jam selesai harus setelah jam mulai"); return; }
      const payload = { title, day: data.day, color: data.color, start: data.start, end: data.end, loc: data.loc.trim() || "-" };
      if (isEdit) { updateEvent(ev!.id, payload); toast("Jadwal diperbarui"); }
      else { addEvent(payload); toast("Jadwal ditambahkan"); }
      close();
    };

    open({
      title: isEdit ? t("ubahJadwal") : t("tambahJadwal"),
      body: <EventForm initial={initial} registerSubmit={(fn) => { submitRef.current = fn; }} />,
      onSave: () => { if (submitRef.current) handleSave(submitRef.current()); },
      onDelete: isEdit ? () => { deleteEvent(ev!.id); toast("Jadwal dihapus"); } : undefined,
    });
  }

  useRegisterPageAction(t("tambahJadwal"), () => openEventModal(null, 0, 8));

  const hours = useMemo(() => {
    const arr: number[] = [];
    for (let h = startHour; h < endHour; h++) arr.push(h);
    return arr;
  }, []);

  const nowHour = now ? now.getHours() + now.getMinutes() / 60 : -1;
  const showNowLine = now && nowHour >= startHour && nowHour <= endHour && todayIdx >= 0;

  return (
    <div className="page-view">
      <div className="legend">
        {!legendItems.length ? (
          <span className="hint-text">{t("legendKosong")}</span>
        ) : (
          legendItems.map(([legendTitle, legendColor]) => (
            <div className="legend-item" key={legendTitle}>
              <span className="dot" style={{ background: colors[legendColor] }} />
              {legendTitle}
            </div>
          ))
        )}
      </div>
      <div className="hint-text">{t("hintJadwal")}</div>
      <div className="schedule-card">
        <div className="grid-wrap" style={{ position: "relative" }}>
          <div className="grid-head" />
          {days.map((d, i) => (
            <div key={d} className={"grid-head" + (i === todayIdx ? " today" : "")}>{d}</div>
          ))}
          {hours.map((h) => (
            <div key={h} style={{ display: "contents" }}>
              <div className="time-col">{String(h).padStart(2, "0")}:00</div>
              {[0, 1, 2, 3, 4, 5].map((d) => (
                <div
                  key={d}
                  className="cell"
                  onClick={() => openEventModal(null, d, h)}
                />
              ))}
            </div>
          ))}

          {events.map((ev) => {
            const top = headerH + (ev.start - startHour) * rowH;
            const height = Math.max((ev.end - ev.start) * rowH - 4, 20);
            return (
              <div
                key={ev.id}
                className="block"
                style={{
                  top,
                  height,
                  background: colors[ev.color],
                  left: `calc(56px + (100% - 56px) * ${ev.day}/6 + 4px)`,
                  width: `calc((100% - 56px)/6 - 8px)`,
                }}
                onClick={(e) => { e.stopPropagation(); openEventModal(ev); }}
              >
                {ev.title}
                <div className="t">{fmtTime(ev.start)} · {ev.loc}</div>
              </div>
            );
          })}

          {showNowLine && (
            <div
              className="now-line"
              style={{
                top: headerH + (nowHour - startHour) * rowH,
                left: `calc(56px + (100% - 56px)*${todayIdx}/6)`,
                width: "calc((100% - 56px)/6)",
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}