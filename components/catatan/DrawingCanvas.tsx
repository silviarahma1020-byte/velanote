"use client";
// ============================================================
// DrawingCanvas — mesin gambar kanvas.
//
// REVISI Batch 13:
// - poin 2a (tombol hapus × belum terlihat jelas): didesain ulang
//   jadi lingkaran merah dengan tanda × yang lebih besar & kontras
//   di pojok kanan-atas setiap elemen (gambar, sticky note, teks,
//   stiker). `overflow: visible` dipastikan eksplisit di semua
//   pembungkus supaya tombol yang posisinya sedikit keluar dari
//   badan elemen tidak terpotong oleh pembungkusnya.
// Semua revisi Batch 1–12 (resize handle, drag handle, warna teks
// per-blok) TETAP ada, tidak diubah.
// ============================================================
import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import { NoteData, OverlayElement } from "@/data/types";
import { emojiList } from "@/data/seed";
import { uid } from "@/data/utils";

export type Tool = "pen" | "pencil" | "marker" | "highlighter" | "pan" | "ruler" | "text" | "eraser";

export interface DrawingCanvasHandle {
  exportDataUrl: () => string;
  undo: () => boolean;
  redo: () => boolean;
  clear: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  zoomReset: () => void;
  exportPdf: () => Promise<void>;
  applyColorToSelection: (elementId: number, color: string) => boolean;
}

interface ActiveTextInfo {
  id: number;
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  fontColor: string;
}

interface Props {
  note: NoteData;
  tool: Tool;
  color: string;
  size: number;
  textDefaults: { family: string; size: number; weight: string; color: string };
  palmModeOn: boolean;
  onActiveTextChange: (v: ActiveTextInfo | null) => void;
  onElementsChange: (elements: OverlayElement[]) => void;
  onZoomChange: (zoom: number) => void;
}

const textWeightMap: Record<string, { weight: number; stroke: number }> = {
  "400": { weight: 400, stroke: 0 },
  "600": { weight: 600, stroke: 0.35 },
  "700": { weight: 700, stroke: 0.75 },
  "800": { weight: 800, stroke: 1.2 },
};

const STICKY_DEFAULT_W = 220;
const STICKY_DEFAULT_H = 160;
const IMAGE_DEFAULT_W = 260;
const IMAGE_DEFAULT_H = 200;
const MIN_W = 90;
const MIN_H = 70;
const STICKY_HANDLE_H = 20;

type ResizeDir = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

const RESIZE_HANDLES: { dir: ResizeDir; style: React.CSSProperties }[] = [
  { dir: "n", style: { top: -5, left: "50%", marginLeft: -5, cursor: "ns-resize" } },
  { dir: "s", style: { bottom: -5, left: "50%", marginLeft: -5, cursor: "ns-resize" } },
  { dir: "e", style: { right: -5, top: "50%", marginTop: -5, cursor: "ew-resize" } },
  { dir: "w", style: { left: -5, top: "50%", marginTop: -5, cursor: "ew-resize" } },
  { dir: "ne", style: { top: -5, right: -5, cursor: "nesw-resize" } },
  { dir: "nw", style: { top: -5, left: -5, cursor: "nwse-resize" } },
  { dir: "se", style: { bottom: -5, right: -5, cursor: "nwse-resize" } },
  { dir: "sw", style: { bottom: -5, left: -5, cursor: "nesw-resize" } },
];

const RESIZE_HANDLE_Z = 5;
// REVISI Batch 13: zIndex tombol hapus dinaikkan lagi supaya pasti
// menang atas apa pun (resize handle, drag handle, dst).
const DELETE_BTN_Z = 50;

const DrawingCanvas = forwardRef<DrawingCanvasHandle, Props>(function DrawingCanvas(
  { note, tool, color, size, textDefaults, palmModeOn, onActiveTextChange, onElementsChange, onZoomChange },
  ref
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const stickerLayerRef = useRef<HTMLDivElement>(null);

  const drawingRef = useRef(false);
  const undoStackRef = useRef<string[]>([]);
  const redoStackRef = useRef<string[]>([]);
  const zoomRef = useRef(1);
  const rulerStartRef = useRef<{ x: number; y: number } | null>(null);
  const rulerSnapshotRef = useRef<HTMLImageElement | null>(null);
  const activeTouchPointersRef = useRef<Set<number>>(new Set());
  const textElRefsRef = useRef<Map<number, HTMLDivElement>>(new Map());
  const textRangesRef = useRef<Map<number, Range>>(new Map());
  const [, forceRender] = useState(0);
  const rerender = () => forceRender((n) => n + 1);

  function ctx() {
    return canvasRef.current!.getContext("2d")!;
  }

  function pos(clientX: number, clientY: number) {
    const canvas = canvasRef.current!;
    const r = canvas.getBoundingClientRect();
    return { x: (clientX - r.left) / zoomRef.current, y: (clientY - r.top) / zoomRef.current };
  }

  function saveState() {
    undoStackRef.current.push(canvasRef.current!.toDataURL());
    if (undoStackRef.current.length > 25) undoStackRef.current.shift();
    redoStackRef.current = [];
  }

  function applyToolStyle() {
    const c = ctx();
    c.lineCap = "round";
    c.lineJoin = "round";
    if (tool === "eraser") {
      c.globalCompositeOperation = "destination-out";
      c.lineWidth = size * 4;
      c.strokeStyle = "rgba(0,0,0,1)";
      c.globalAlpha = 1;
    } else if (tool === "highlighter") {
      c.globalCompositeOperation = "multiply";
      c.lineWidth = size * 5;
      c.strokeStyle = color;
      c.globalAlpha = 0.35;
    } else if (tool === "pencil") {
      c.globalCompositeOperation = "source-over";
      c.lineWidth = Math.max(1, size * 0.6);
      c.strokeStyle = color;
      c.globalAlpha = 0.55;
    } else if (tool === "marker") {
      c.globalCompositeOperation = "source-over";
      c.lineWidth = size * 2.2;
      c.strokeStyle = color;
      c.globalAlpha = 0.9;
    } else {
      c.globalCompositeOperation = "source-over";
      c.lineWidth = size;
      c.strokeStyle = color;
      c.globalAlpha = 1;
    }
  }

  function saveCurrentCanvas() {}

  function addOverlayElement(elData: OverlayElement) {
    onElementsChange([...note.elements, elData]);
  }

  function shouldIgnoreForDrawing(pointerType: string) {
    if (pointerType !== "touch") return false;
    if (activeTouchPointersRef.current.size > 1) return true;
    if (palmModeOn) return true;
    return false;
  }

  function start(e: React.PointerEvent<HTMLCanvasElement>) {
    if (e.pointerType === "touch") {
      activeTouchPointersRef.current.add(e.pointerId);
    }
    if (shouldIgnoreForDrawing(e.pointerType)) return;

    if (tool !== "text") onActiveTextChange(null);

    if (tool === "pan") return;

    canvasRef.current?.setPointerCapture(e.pointerId);

    if (tool === "text") {
      const p = pos(e.clientX, e.clientY);
      addOverlayElement({
        id: uid(), type: "text", text: "Ketik di sini…", x: p.x, y: p.y,
        fontFamily: textDefaults.family, fontSize: textDefaults.size, fontWeight: textDefaults.weight,
        fontColor: textDefaults.color,
      });
      return;
    }
    drawingRef.current = true;
    if (tool === "ruler") {
      saveState();
      rulerStartRef.current = pos(e.clientX, e.clientY);
      const img = new Image();
      img.src = canvasRef.current!.toDataURL();
      rulerSnapshotRef.current = img;
    } else {
      saveState();
      const p = pos(e.clientX, e.clientY);
      const c = ctx();
      c.beginPath();
      c.moveTo(p.x, p.y);
    }
    e.preventDefault();
  }

  function move(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) return;
    if (shouldIgnoreForDrawing(e.pointerType)) return;
    const p = pos(e.clientX, e.clientY);
    const c = ctx();
    if (tool === "ruler") {
      c.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
      if (rulerSnapshotRef.current?.complete) c.drawImage(rulerSnapshotRef.current, 0, 0);
      applyToolStyle();
      c.beginPath();
      c.moveTo(rulerStartRef.current!.x, rulerStartRef.current!.y);
      c.lineTo(p.x, p.y);
      c.stroke();
      e.preventDefault();
      return;
    }
    applyToolStyle();
    c.lineTo(p.x, p.y);
    c.stroke();
    e.preventDefault();
  }

  function end(e: React.PointerEvent<HTMLCanvasElement>) {
    if (e.pointerType === "touch") activeTouchPointersRef.current.delete(e.pointerId);
    if (drawingRef.current) {
      drawingRef.current = false;
      rulerStartRef.current = null;
      rulerSnapshotRef.current = null;
      saveCurrentCanvas();
    }
  }

  useEffect(() => {
    const c = ctx();
    c.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
    if (note.canvasData) {
      const img = new Image();
      img.onload = () => { c.drawImage(img, 0, 0); };
      img.src = note.canvasData;
    }
    undoStackRef.current = [];
    redoStackRef.current = [];
    activeTouchPointersRef.current.clear();
    textElRefsRef.current.clear();
    textRangesRef.current.clear();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note.id]);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    let pinchActive = false, pinchStartDist = 0, pinchStartZoom = 1;
    let pinchStartMid = { x: 0, y: 0 };
    let pinchStartScroll = { left: 0, top: 0 };

    function dist(a: Touch, b: Touch) {
      return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
    }
    function mid(a: Touch, b: Touch) {
      return { x: (a.clientX + b.clientX) / 2, y: (a.clientY + b.clientY) / 2 };
    }
    function onStart(e: TouchEvent) {
      if (e.touches.length === 2) {
        pinchActive = true;
        e.preventDefault();
        pinchStartDist = dist(e.touches[0], e.touches[1]);
        pinchStartZoom = zoomRef.current;
        pinchStartMid = mid(e.touches[0], e.touches[1]);
        pinchStartScroll = { left: wrap!.scrollLeft, top: wrap!.scrollTop };
      }
    }
    function onMove(e: TouchEvent) {
      if (pinchActive && e.touches.length === 2) {
        e.preventDefault();
        const d = dist(e.touches[0], e.touches[1]);
        const scale = d / pinchStartDist;
        zoomRef.current = +Math.min(2.5, Math.max(0.3, pinchStartZoom * scale)).toFixed(3);
        onZoomChange(zoomRef.current);
        const m = mid(e.touches[0], e.touches[1]);
        wrap!.scrollLeft = pinchStartScroll.left - (m.x - pinchStartMid.x);
        wrap!.scrollTop = pinchStartScroll.top - (m.y - pinchStartMid.y);
      }
    }
    function onEnd(e: TouchEvent) {
      if (e.touches.length < 2) pinchActive = false;
    }
    wrap.style.touchAction = "none";
    wrap.addEventListener("touchstart", onStart, { passive: false });
    wrap.addEventListener("touchmove", onMove, { passive: false });
    wrap.addEventListener("touchend", onEnd);
    return () => {
      wrap.removeEventListener("touchstart", onStart);
      wrap.removeEventListener("touchmove", onMove);
      wrap.removeEventListener("touchend", onEnd);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (surfaceRef.current) surfaceRef.current.style.transform = `scale(${zoomRef.current})`;
  });

  useEffect(() => {
    function handleSelectionChange() {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return;
      const range = sel.getRangeAt(0);
      if (range.collapsed) return;
      for (const [id, el] of textElRefsRef.current.entries()) {
        if (el.contains(range.commonAncestorContainer)) {
          textRangesRef.current.set(id, range.cloneRange());
          break;
        }
      }
    }
    document.addEventListener("selectionchange", handleSelectionChange);
    return () => document.removeEventListener("selectionchange", handleSelectionChange);
  }, []);

  function makeDraggable(el: HTMLDivElement, data: OverlayElement) {
    function onDown(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "TEXTAREA" ||
        target.classList.contains("ov-del") ||
        target.classList.contains("ov-text") ||
        target.classList.contains("resize-handle")
      ) return;
      e.preventDefault();
      const startX = e.clientX, startY = e.clientY, ox = data.x, oy = data.y;
      function onMove(ev: MouseEvent) {
        const nx = ox + (ev.clientX - startX) / zoomRef.current;
        const ny = oy + (ev.clientY - startY) / zoomRef.current;
        el.style.left = nx + "px";
        el.style.top = ny + "px";
        (data as { x: number }).x = nx;
        (data as { y: number }).y = ny;
      }
      function onUp() {
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
        onElementsChange(note.elements.map((el2) => (el2.id === data.id ? { ...data } : el2)));
      }
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    }
    el.addEventListener("mousedown", onDown);
  }

  function handleTextElMount(id: number, el: HTMLDivElement | null) {
    if (el) textElRefsRef.current.set(id, el);
    else textElRefsRef.current.delete(id);
  }

  useImperativeHandle(ref, () => ({
    exportDataUrl: () => canvasRef.current!.toDataURL(),
    undo: () => {
      if (!undoStackRef.current.length) return false;
      redoStackRef.current.push(canvasRef.current!.toDataURL());
      const data = undoStackRef.current.pop()!;
      const img = new Image();
      img.onload = () => { ctx().clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height); ctx().drawImage(img, 0, 0); };
      img.src = data;
      return true;
    },
    redo: () => {
      if (!redoStackRef.current.length) return false;
      undoStackRef.current.push(canvasRef.current!.toDataURL());
      const data = redoStackRef.current.pop()!;
      const img = new Image();
      img.onload = () => { ctx().clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height); ctx().drawImage(img, 0, 0); };
      img.src = data;
      return true;
    },
    clear: () => {
      saveState();
      ctx().clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
      saveCurrentCanvas();
    },
    zoomIn: () => { zoomRef.current = Math.min(2.5, +(zoomRef.current + 0.1).toFixed(2)); onZoomChange(zoomRef.current); rerender(); },
    zoomOut: () => { zoomRef.current = Math.max(0.3, +(zoomRef.current - 0.1).toFixed(2)); onZoomChange(zoomRef.current); rerender(); },
    zoomReset: () => { zoomRef.current = 1; onZoomChange(zoomRef.current); rerender(); },
    exportPdf: async () => {
      if (!surfaceRef.current) return;
      const prevTransform = surfaceRef.current.style.transform;
      surfaceRef.current.style.transform = "scale(1)";
      try {
        const [{ default: html2canvas }, { default: JsPDF }] = await Promise.all([
          import("html2canvas"),
          import("jspdf"),
        ]);
        const shot = await html2canvas(surfaceRef.current, {
          backgroundColor: note.dark ? "#22222E" : "#FFFDFB",
          scale: 1.5,
          useCORS: true,
        });
        const imgData = shot.toDataURL("image/png");
        const pdf = new JsPDF({
          orientation: shot.width > shot.height ? "landscape" : "portrait",
          unit: "px",
          format: [shot.width, shot.height],
        });
        pdf.addImage(imgData, "PNG", 0, 0, shot.width, shot.height);
        const safeName = (note.title || "catatan").replace(/[^a-z0-9\-_ ]/gi, "_").trim() || "catatan";
        pdf.save(`${safeName}.pdf`);
      } finally {
        surfaceRef.current.style.transform = prevTransform;
      }
    },
    applyColorToSelection: (elementId, colorValue) => {
      try {
        const el = textElRefsRef.current.get(elementId);
        if (!el) return false;

        let range: Range | null = null;
        const liveSel = window.getSelection();
        if (liveSel && liveSel.rangeCount > 0) {
          const liveRange = liveSel.getRangeAt(0);
          if (!liveRange.collapsed && el.contains(liveRange.commonAncestorContainer)) {
            range = liveRange.cloneRange();
          }
        }
        if (!range) {
          const stored = textRangesRef.current.get(elementId);
          if (stored && !stored.collapsed && el.contains(stored.commonAncestorContainer)) {
            range = stored;
          }
        }
        if (!range) return false;

        const span = document.createElement("span");
        span.style.color = colorValue;
        const frag = range.extractContents();
        span.appendChild(frag);
        range.insertNode(span);

        textRangesRef.current.delete(elementId);
        const sel = window.getSelection();
        if (sel) sel.removeAllRanges();

        onElementsChange(
          note.elements.map((x) => (x.id === elementId && x.type === "text" ? { ...x, text: el.innerHTML } : x))
        );
        return true;
      } catch (err) {
        console.error("applyColorToSelection gagal:", err);
        return false;
      }
    },
  }));

  return (
    <div className="canvas-wrap" ref={wrapRef}>
      <div
        className="canvas-surface"
        ref={surfaceRef}
        data-paper={note.paperType}
        data-theme={note.dark ? "dark" : "light"}
      >
        <div className="note-title-bar">{note.title + " — " + note.subject}</div>
        <canvas
          id="board"
          ref={canvasRef}
          width={1800}
          height={2400}
          style={{ cursor: tool === "pan" ? "grab" : tool === "eraser" ? "cell" : tool === "text" ? "text" : "crosshair", touchAction: "none" }}
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerCancel={end}
        />
        <div className={"cornell-guide" + (note.template === "cornell" ? " show" : "")}>
          <div className="cornell-cue" />
          <div className="cornell-main" />
          <div className="cornell-sum" />
        </div>
        <div className={"split-guide" + (note.template === "garis-tengah" ? " show" : "")} />
        <div className="sticker-layer" ref={stickerLayerRef} style={{ overflow: "visible" }}>
          {note.elements.map((elData) => (
            <OverlayEl
              key={elData.id}
              elData={elData}
              zoomRef={zoomRef}
              onDelete={() => onElementsChange(note.elements.filter((x) => x.id !== elData.id))}
              onChange={(patch) => onElementsChange(note.elements.map((x) => (x.id === elData.id ? ({ ...x, ...patch } as OverlayElement) : x)))}
              onDrag={makeDraggable}
              onActiveTextChange={onActiveTextChange}
              onTextElMount={handleTextElMount}
            />
          ))}
        </div>
      </div>
    </div>
  );
});

export default DrawingCanvas;

export { emojiList as stickerEmojis };

function OverlayEl({
  elData,
  zoomRef,
  onDelete,
  onChange,
  onDrag,
  onActiveTextChange,
  onTextElMount,
}: {
  elData: OverlayElement;
  zoomRef: React.RefObject<number>;
  onDelete: () => void;
  onChange: (patch: Partial<OverlayElement>) => void;
  onDrag: (el: HTMLDivElement, data: OverlayElement) => void;
  onActiveTextChange: (v: ActiveTextInfo | null) => void;
  onTextElMount: (id: number, el: HTMLDivElement | null) => void;
}) {
  const elRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (elRef.current) onDrag(elRef.current, elData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (elData.type === "text" && textRef.current) {
      textRef.current.innerHTML = elData.text;
      onTextElMount(elData.id, textRef.current);
      const t = setTimeout(() => {
        textRef.current?.focus();
        document.execCommand("selectAll", false, undefined);
      }, 30);
      return () => {
        clearTimeout(t);
        onTextElMount(elData.id, null);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function beginResize(e: React.MouseEvent, dir: ResizeDir, curW: number, curH: number) {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    const startW = curW;
    const startH = curH;
    const startPX = elData.x;
    const startPY = elData.y;
    function onMove(ev: MouseEvent) {
      const dx = (ev.clientX - startX) / zoomRef.current;
      const dy = (ev.clientY - startY) / zoomRef.current;
      let width = startW, height = startH, x = startPX, y = startPY;
      if (dir.includes("e")) width = Math.max(MIN_W, startW + dx);
      if (dir.includes("s")) height = Math.max(MIN_H, startH + dy);
      if (dir.includes("w")) { width = Math.max(MIN_W, startW - dx); x = startPX + (startW - width); }
      if (dir.includes("n")) { height = Math.max(MIN_H, startH - dy); y = startPY + (startH - height); }
      onChange({ width, height, x, y });
    }
    function onUp() {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    }
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }

  function renderHandles(curW: number, curH: number) {
    return RESIZE_HANDLES.map((h) => (
      <div
        key={h.dir}
        className="resize-handle"
        onMouseDown={(e) => beginResize(e, h.dir, curW, curH)}
        style={{
          position: "absolute",
          width: 11,
          height: 11,
          background: "#6C5CE0",
          border: "1.5px solid #fff",
          borderRadius: 3,
          boxShadow: "0 1px 3px rgba(0,0,0,.25)",
          zIndex: RESIZE_HANDLE_Z,
          ...h.style,
        }}
      />
    ));
  }

  const weightStyle = elData.type === "text" ? textWeightMap[String(elData.fontWeight)] || textWeightMap["400"] : null;

  // REVISI Batch 13 (poin 2): tombol hapus didesain ulang — lingkaran
  // merah pekat dengan tanda × putih, ukuran diperbesar (24x24) supaya
  // jelas terlihat sebagai "tanda silang" fungsional di pojok
  // kanan-atas, bukan cuma teks kecil. `pointerEvents: "auto"`
  // dipastikan eksplisit supaya tidak ada elemen lain yang mencuri klik.
  function DeleteBtn() {
    return (
      <button
        type="button"
        className="ov-del"
        title="Hapus"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          position: "absolute",
          top: -12,
          right: -12,
          zIndex: DELETE_BTN_Z,
          width: 24,
          height: 24,
          borderRadius: "50%",
          background: "#D64545",
          color: "#fff",
          border: "2px solid #fff",
          boxShadow: "0 2px 6px rgba(0,0,0,.3)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 15,
          lineHeight: 1,
          fontWeight: 700,
          cursor: "pointer",
          pointerEvents: "auto",
          padding: 0,
        }}
      >
        ×
      </button>
    );
  }

  return (
    <div className="ov-el" style={{ left: elData.x, top: elData.y, position: "absolute", overflow: "visible" }} ref={elRef}>
      {elData.type === "sticker" && (
        <div style={{ position: "relative", overflow: "visible" }}>
          <div className="ov-sticker">{elData.emoji}</div>
          <DeleteBtn />
        </div>
      )}

      {elData.type === "sticky" && (
        <div
          className="ov-sticky"
          style={{
            width: elData.width ?? STICKY_DEFAULT_W,
            height: elData.height ?? STICKY_DEFAULT_H,
            position: "relative",
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            padding: 0,
            // REVISI Batch 13: eksplisit visible — dulu belum diset di
            // sini, ada risiko style luar mewarisi overflow:hidden
            // yang memotong tombol hapus.
            overflow: "visible",
          }}
        >
          <div
            className="ov-sticky-handle"
            title="Tarik untuk memindahkan"
            style={{
              height: STICKY_HANDLE_H,
              flexShrink: 0,
              cursor: "grab",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(0,0,0,0.06)",
              borderRadius: "6px 6px 0 0",
              letterSpacing: 2,
              fontSize: 11,
              userSelect: "none",
            }}
          >
            ⠿⠿⠿
          </div>
          <textarea
            defaultValue={elData.text}
            onMouseDown={(e) => e.stopPropagation()}
            onInput={(e) => onChange({ text: (e.target as HTMLTextAreaElement).value })}
            style={{ flex: 1, width: "100%", boxSizing: "border-box", resize: "none", borderRadius: "0 0 6px 6px" }}
          />
          {renderHandles(elData.width ?? STICKY_DEFAULT_W, elData.height ?? STICKY_DEFAULT_H)}
          <DeleteBtn />
        </div>
      )}

      {elData.type === "image" && (
        <div
          className="ov-image"
          style={{
            width: elData.width ?? IMAGE_DEFAULT_W,
            height: elData.height ?? IMAGE_DEFAULT_H,
            position: "relative",
            boxSizing: "border-box",
            overflow: "visible",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={elData.src}
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", borderRadius: "inherit" }}
          />
          {renderHandles(elData.width ?? IMAGE_DEFAULT_W, elData.height ?? IMAGE_DEFAULT_H)}
          <DeleteBtn />
        </div>
      )}

      {elData.type === "text" && (
        <div style={{ position: "relative", overflow: "visible" }}>
          <div
            className="ov-text-handle"
            title="Tarik untuk memindahkan"
            style={{
              position: "absolute",
              top: -16,
              left: -16,
              width: 20,
              height: 20,
              borderRadius: "50%",
              background: "#6C5CE0",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "grab",
              fontSize: 11,
              boxShadow: "0 1px 3px rgba(0,0,0,.3)",
              zIndex: 6,
              userSelect: "none",
            }}
          >
            ✥
          </div>
          <div
            className="ov-text"
            ref={textRef}
            contentEditable
            suppressContentEditableWarning
            style={{
              fontFamily: elData.fontFamily,
              fontSize: elData.fontSize,
              fontWeight: weightStyle?.weight,
              WebkitTextStroke: weightStyle?.stroke ? `${weightStyle.stroke}px currentColor` : "0px transparent",
              color: elData.fontColor || "#1F2233",
            }}
            onMouseDown={(e) => e.stopPropagation()}
            onInput={(e) => onChange({ text: (e.target as HTMLDivElement).innerHTML })}
            onFocus={() =>
              onActiveTextChange({
                id: elData.id,
                fontFamily: elData.fontFamily,
                fontSize: elData.fontSize,
                fontWeight: elData.fontWeight,
                fontColor: elData.fontColor || "#1F2233",
              })
            }
          />
          <DeleteBtn />
        </div>
      )}
    </div>
  );
}