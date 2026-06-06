"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

// Dimensions used in the UI
const CONTAINER = 320; // container square side (px)
const CROP      = 280; // circular crop guide diameter (px)

// Dimensions used for canvas output
const RENDER  = 1024; // large intermediate canvas — avoids clipping during rotation
const OUTPUT  =  400; // final square image written to server

interface Props {
  imageSrc: string;
  onSave:  (blob: Blob) => void;
  onClose: () => void;
}

export function ImageEditorModal({ imageSrc, onSave, onClose }: Props) {
  const imgRef   = useRef<HTMLImageElement | null>(null);
  const [ready,    setReady]    = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [zoom,     setZoom]     = useState(1);
  const [rotation, setRotation] = useState(0);
  const [pos,      setPos]      = useState({ x: 0, y: 0 });

  // Drag state kept in refs to avoid stale closure in event handlers
  const dragging  = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });

  // Load the image once and set an initial zoom that fills the crop circle
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      // "cover" fit: the shorter dimension equals CROP
      const initialZoom = Math.max(CROP / img.width, CROP / img.height);
      setZoom(initialZoom);
      setReady(true);
    };
    img.src = imageSrc;
    return () => { img.onload = null; };
  }, [imageSrc]);

  // ── Mouse drag ────────────────────────────────────────────────────────────
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current  = true;
    dragStart.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pos]);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging.current) return;
    setPos({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y });
  }, []);

  const stopDrag = useCallback(() => { dragging.current = false; }, []);

  // ── Touch drag ────────────────────────────────────────────────────────────
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const t = e.touches[0];
    dragging.current  = true;
    dragStart.current = { x: t.clientX - pos.x, y: t.clientY - pos.y };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pos]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!dragging.current) return;
    const t = e.touches[0];
    setPos({ x: t.clientX - dragStart.current.x, y: t.clientY - dragStart.current.y });
  }, []);

  // ── Canvas extraction ─────────────────────────────────────────────────────
  async function handleSave() {
    const img = imgRef.current;
    if (!img) return;
    setSaving(true);
    try {
      // 1. Render the image on a large canvas replicating the CSS transform
      const render = document.createElement("canvas");
      render.width  = RENDER;
      render.height = RENDER;
      const rCtx = render.getContext("2d")!;
      rCtx.save();
      rCtx.translate(RENDER / 2 + pos.x, RENDER / 2 + pos.y);
      rCtx.rotate((rotation * Math.PI) / 180);
      rCtx.scale(zoom, zoom);
      rCtx.drawImage(img, -img.width / 2, -img.height / 2);
      rCtx.restore();

      // 2. Extract the centre CROP×CROP region (matches what the user sees)
      const cx = (RENDER - CROP) / 2;
      const cy = (RENDER - CROP) / 2;

      // 3. Scale to OUTPUT×OUTPUT
      const out = document.createElement("canvas");
      out.width  = OUTPUT;
      out.height = OUTPUT;
      out.getContext("2d")!.drawImage(render, cx, cy, CROP, CROP, 0, 0, OUTPUT, OUTPUT);

      out.toBlob(
        (blob) => { if (blob) onSave(blob); },
        "image/jpeg",
        0.92
      );
    } finally {
      setSaving(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  const cropOffset = (CONTAINER - CROP) / 2;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">Edit Photo</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Viewport */}
        <div className="flex justify-center">
          <div
            className="relative select-none overflow-hidden rounded-lg bg-gray-900"
            style={{ width: CONTAINER, height: CONTAINER, cursor: "grab" }}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={stopDrag}
            onMouseLeave={stopDrag}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={stopDrag}
          >
            {ready && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageSrc}
                alt=""
                draggable={false}
                className="pointer-events-none absolute max-w-none"
                style={{
                  top: "50%",
                  left: "50%",
                  transformOrigin: "center",
                  transform: `translate(-50%,-50%) translate(${pos.x}px,${pos.y}px) rotate(${rotation}deg) scale(${zoom})`,
                }}
              />
            )}

            {/* Dim everything outside the crop circle */}
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background: `radial-gradient(circle ${CROP / 2}px at 50% 50%, transparent ${CROP / 2 - 1}px, rgba(0,0,0,0.55) ${CROP / 2}px)`,
              }}
            />
            {/* Crop border ring */}
            <div
              className="pointer-events-none absolute rounded-full border border-white/60"
              style={{ width: CROP, height: CROP, top: cropOffset, left: cropOffset }}
            />
            <p className="pointer-events-none absolute inset-x-0 bottom-2 text-center text-xs text-white/60">
              Drag to reposition
            </p>
          </div>
        </div>

        {/* Rotation */}
        <div className="mt-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span>Rotate: {rotation}°</span>
            <div className="flex gap-1.5">
              {([-90, 90] as const).map((deg) => (
                <button
                  key={deg}
                  onClick={() => setRotation((r) => r + deg)}
                  className="rounded border border-gray-200 px-2 py-0.5 text-xs hover:bg-gray-50"
                >
                  {deg > 0 ? "+" : ""}{deg}°
                </button>
              ))}
            </div>
          </div>
          <input
            type="range" min={-180} max={180} value={rotation}
            onChange={(e) => setRotation(Number(e.target.value))}
            className="w-full accent-blue-600"
          />
        </div>

        {/* Zoom */}
        <div className="mt-3 space-y-1">
          <p className="text-xs text-gray-600">Zoom: {zoom.toFixed(2)}×</p>
          <input
            type="range" min={0.2} max={4} step={0.02} value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full accent-blue-600"
          />
        </div>

        {/* Actions */}
        <div className="mt-5 flex gap-2.5">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-gray-200 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => void handleSave()}
            disabled={saving || !ready}
            className="flex-1 rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Apply"}
          </button>
        </div>
      </div>
    </div>
  );
}
