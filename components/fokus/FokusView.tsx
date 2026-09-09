"use client";
// ============================================================
// FokusView — Mode Fokus (timer pomodoro + alarm suara).
//
// REVISI poin 10: field menit Fokus & Istirahat sekarang pakai
// state `number | ""` supaya benar-benar bisa dikosongkan dulu
// sebelum mengetik angka baru (pola yang sama seperti perbaikan
// progres ujian di poin 7). Saat kosong, timer tetap memakai nilai
// default (25 menit fokus / 5 menit istirahat) sampai kamu isi lagi.
// ============================================================
import { useEffect, useRef, useState } from "react";
import { useLang } from "@/context/LangContext";
import { useToast } from "@/context/ToastContext";

type Mode = "work" | "break";
interface FocusState {
  mode: Mode;
  secondsLeft: number;
  running: boolean;
  sessions: number;
  totalMinutes: number;
}

export default function FokusView() {
  const { t } = useLang();
  const { show: toast } = useToast();

  const [workMin, setWorkMin] = useState<number | "">(25);
  const [breakMin, setBreakMin] = useState<number | "">(5);
  const [alarmOn, setAlarmOn] = useState(true);

  const stateRef = useRef<FocusState>({
    mode: "work",
    secondsLeft: 25 * 60,
    running: false,
    sessions: 0,
    totalMinutes: 0,
  });
  const [, forceRender] = useState(0);
  const rerender = () => forceRender((n) => n + 1);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  function getAudioCtx() {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    if (audioCtxRef.current.state === "suspended") audioCtxRef.current.resume();
    return audioCtxRef.current;
  }

  function beep(delayMs: number, freq: number, durationMs: number, vol: number) {
    const ctx = getAudioCtx();
    const t0 = ctx.currentTime + delayMs / 1000;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(vol, t0 + 0.015);
    gain.gain.linearRampToValueAtTime(0, t0 + durationMs / 1000);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + durationMs / 1000 + 0.03);
  }

  function playAlarm() {
    [0, 380, 760].forEach((base) => {
      beep(base, 880, 160, 0.35);
      beep(base + 190, 1175, 160, 0.35);
    });
  }

  function toggleRunning() {
    const st = stateRef.current;
    st.running = !st.running;
    if (st.running) {
      getAudioCtx();
      timerRef.current = setInterval(() => {
        const s = stateRef.current;
        s.secondsLeft--;
        if (s.secondsLeft <= 0) {
          if (s.mode === "work") {
            s.sessions++;
            s.totalMinutes += (workMin || 25) as number;
            s.mode = "break";
            s.secondsLeft = ((breakMin || 5) as number) * 60;
            if (alarmOn) playAlarm();
            toast(t("sesiFokusSelesai"));
          } else {
            s.mode = "work";
            s.secondsLeft = ((workMin || 25) as number) * 60;
            if (alarmOn) playAlarm();
            toast(t("istirahatSelesai"));
          }
        }
        rerender();
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    rerender();
  }

  function reset() {
    if (timerRef.current) clearInterval(timerRef.current);
    stateRef.current = {
      mode: "work",
      secondsLeft: ((workMin || 25) as number) * 60,
      running: false,
      sessions: stateRef.current.sessions,
      totalMinutes: stateRef.current.totalMinutes,
    };
    rerender();
  }

  function handleWorkMinChange(v: number | "") {
    setWorkMin(v);
    const st = stateRef.current;
    if (!st.running && st.mode === "work") {
      st.secondsLeft = ((v || 25) as number) * 60;
      rerender();
    }
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const st = stateRef.current;
  const m = Math.floor(st.secondsLeft / 60);
  const s = st.secondsLeft % 60;
  const timeLabel = `${String(m).padStart(2, "0")}:${String(Math.max(s, 0)).padStart(2, "0")}`;

  return (
    <div className="page-view">
      <div className="focus-wrap">
        <div className={"focus-ring" + (st.mode === "break" ? " break" : "")}>
          <div className="focus-time">{timeLabel}</div>
          <div className="focus-mode-label">{st.mode === "work" ? t("fokusBelajar") : t("waktuIstirahat")}</div>
        </div>
        <div className="focus-controls">
          <button type="button" className="page-action" onClick={toggleRunning}>
            {st.running ? t("jeda") : t("mulai")}
          </button>
          <button type="button" className="page-action ghost" onClick={reset}>
            {t("reset")}
          </button>
        </div>
        <div className="focus-settings">
          <label>{t("fokusMenit")}</label>
          <input
            type="number"
            min={1}
            max={120}
            value={workMin}
            placeholder="25"
            onChange={(e) => handleWorkMinChange(e.target.value === "" ? "" : +e.target.value)}
          />
          <label>{t("istirahatMenit")}</label>
          <input
            type="number"
            min={1}
            max={60}
            value={breakMin}
            placeholder="5"
            onChange={(e) => setBreakMin(e.target.value === "" ? "" : +e.target.value)}
          />
        </div>
        <div className="focus-alarm-row">
          <label className="focus-alarm-toggle">
            <input type="checkbox" checked={alarmOn} onChange={(e) => setAlarmOn(e.target.checked)} />
            <span>{t("alarmAktif")}</span>
          </label>
          <button type="button" className="text-btn" onClick={playAlarm}>
            {t("ujiSuara")}
          </button>
        </div>
        <div className="focus-stat">
          <div><b>{st.sessions}</b><span>{t("sesiSelesai")}</span></div>
          <div><b>{st.totalMinutes}</b><span>{t("menitFokusTotal")}</span></div>
        </div>
      </div>
    </div>
  );
}