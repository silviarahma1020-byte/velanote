"use client";
// ============================================================
// TopBar — dipindahkan dari <div class="top-row"> di index.html
// vanilla. Judul halaman dulu diisi manual lewat setView(), sekarang
// dibaca otomatis dari URL (usePathname). Jam digital dulu jalan
// lewat tickClock()+setInterval di init.js, sekarang di useEffect.
// ============================================================
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useLang } from "@/context/LangContext";
import { pageTitles } from "@/data/pageTitles";
import { ViewName } from "@/data/types";
import { usePageAction } from "@/context/PageActionContext";

function useClock(lang: "id" | "en") {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  if (!now) return { time: "00:00:00", date: "-" };
  const loc = lang === "id" ? "id-ID" : "en-US";
  return {
    time: now.toLocaleTimeString(loc, { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    date: now.toLocaleDateString(loc, { weekday: "long", day: "numeric", month: "long" }),
  };
}

export default function TopBar() {
  const pathname = usePathname();
  const { lang } = useLang();
  const { time, date } = useClock(lang);
  const action = usePageAction();

  const view = (pathname?.replace("/", "") || "dashboard") as ViewName;
  const [title, sub] = pageTitles[lang][view] || pageTitles[lang].dashboard;

  return (
    <div className="top-row">
      <div>
        <div className="page-title">{title}</div>
        <div className="page-sub">{sub}</div>
      </div>
      <div className="digital-clock">
        <div className="dc-time">{time}</div>
        <div className="dc-date">{date}</div>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        {action && (
          <button className="page-action" onClick={action.onClick}>
            {"+ " + action.label}
          </button>
        )}
      </div>
    </div>
  );
}