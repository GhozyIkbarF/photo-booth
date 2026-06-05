"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useCamera } from "@/lib/booth/useCamera";
import { useCapture } from "@/lib/booth/useCapture";
import { usePhotoStore } from "@/lib/booth/usePhotoStore";
import { FILTERS } from "@/lib/booth/filters";
import { drawFrameOnCtx } from "@/lib/booth/frameDrawing";
import { CameraPreview } from "./CameraPreview";
import { ControlsPanel } from "./ControlsPanel";
import { CaptureButton } from "./CaptureButton";
import { GallerySection } from "./GallerySection";
import { PrintModal } from "./PrintModal";
import type { Photo } from "@/lib/booth/constants";

export function PhotoBooth() {
  // ── Settings state ──────────────────────────────────
  const [currentFilter, setCurrentFilter] = useState("none");
  const [currentFrame, setCurrentFrame] = useState("none");

  // ── Hooks ────────────────────────────────────────────
  const camera = useCamera();
  const capture = useCapture();
  const store = usePhotoStore();

  // ── Print modal state ────────────────────────────────
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [printPhotos, setPrintPhotos] = useState<Photo[]>([]);
  const [printLayout, setPrintLayout] = useState<1 | 2 | 4>(1);

  // ── Render loop ref ──────────────────────────────────
  const animFrameIdRef = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // ── Camera init ──────────────────────────────────────
  const startCamera = useCallback(async () => {
    camera.setIsLoading(true);
    const stream = await camera.initCamera();
    const video = document.getElementById("booth-video") as HTMLVideoElement;
    if (video && stream) {
      video.srcObject = stream;
      await new Promise<void>((res) => {
        video.onloadedmetadata = () => {
          video.play();
          res();
        };
      });
      videoRef.current = video;
      previewCanvasRef.current = document.getElementById(
        "booth-canvas",
      ) as HTMLCanvasElement;
      startRenderLoop();
    }
  }, [camera.initCamera]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    startCamera();
    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      camera.stopCamera();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Re-init camera when facing changes ───────────────
  useEffect(() => {
    if (videoRef.current) startCamera();
  }, [camera.cameraFacing]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Render loop ──────────────────────────────────────
  function startRenderLoop() {
    if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);

    function render() {
      const video = videoRef.current;
      const canvas = previewCanvasRef.current;
      if (!video || !canvas) {
        animFrameIdRef.current = requestAnimationFrame(render);
        return;
      }
      if (video.readyState < 2) {
        animFrameIdRef.current = requestAnimationFrame(render);
        return;
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        animFrameIdRef.current = requestAnimationFrame(render);
        return;
      }

      const vw = video.videoWidth || 640;
      const vh = video.videoHeight || 480;
      if (canvas.width !== vw || canvas.height !== vh) {
        canvas.width = vw;
        canvas.height = vh;
      }

      ctx.clearRect(0, 0, vw, vh);
      ctx.filter =
        currentFilter !== "none"
          ? FILTERS[currentFilter]?.css || "none"
          : "none";

      ctx.save();
      if (camera.isMirrored) {
        ctx.translate(vw, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(video, 0, 0, vw, vh);
      ctx.restore();

      const loopState = { currentFilter, isMirrored: camera.isMirrored };
      drawFrameOnCtx(ctx, vw, vh, currentFrame, loopState);

      animFrameIdRef.current = requestAnimationFrame(render);
    }
    render();
  }

  // Restart render loop when settings change
  useEffect(() => {
    startRenderLoop();
  }, [currentFilter, currentFrame, camera.isMirrored]); // eslint-disable-line react-hooks/exhaustive-deps



  // ── Handle capture ───────────────────────────────────
  const handleCapture = useCallback(() => {
    capture.capturePhoto(
      {
        currentFilter,
        currentFrame,
        isMirrored: camera.isMirrored,
      },
      (photo: Photo) => store.addPhoto(photo),
    );
  }, [
    capture,
    currentFilter,
    currentFrame,
    camera.isMirrored,
    store,
  ]);

  // ── Switch camera ─────────────────────────────────────
  const handleSwitchCamera = useCallback(async () => {
    if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    camera.setIsLoading(true);
    await camera.switchCamera();
  }, [camera]);

  // ── Print helpers ─────────────────────────────────────
  const openPrintModal = useCallback((photos: Photo[]) => {
    setPrintPhotos(photos);
    setPrintModalOpen(true);
  }, []);

  const handlePrintAll = useCallback(() => {
    if (store.photos.length === 0) return;
    openPrintModal(store.getSelectedPhotos(store.photos));
  }, [store, openPrintModal]);

  // ── Reset session ─────────────────────────────────────
  const handleReset = useCallback(() => {
    if (!confirm("Hapus semua foto dan reset sesi? Semua foto akan hilang."))
      return;
    store.clearAll();
    setCurrentFilter("none");
    setCurrentFrame("none");
    capture.setTimerSeconds(0);
  }, [store, capture]);

  // ── Keyboard shortcuts ────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space" && e.target === document.body) {
        e.preventDefault();
        handleCapture();
      }
      if (e.code === "Escape") setPrintModalOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [handleCapture]);

  const CameraController = ({ className }: { className: string }) => {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <a
          href="https://saweria.co/ghoezyy"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-500 to-pink-500 px-4 py-2 text-sm font-semibold text-white no-underline transition hover:opacity-90"
        >
          ☕ Donasi
        </a>
        <button
          onClick={handleSwitchCamera}
          title="Ubah Kamera"
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/[0.08] bg-white/5 text-[#a0a8c0] transition hover:-translate-y-px hover:border-violet-500 hover:text-[#f1f0ff]"
        >
          <svg
            className="h-[18px] w-[18px]"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
        </button>
        <button
          onClick={camera.toggleMirror}
          title="Mirror Kamera"
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/[0.08] bg-white/5 text-[#a0a8c0] transition hover:-translate-y-px hover:border-violet-500 hover:text-[#f1f0ff]"
          style={{ color: camera.isMirrored ? "#8b5cf6" : undefined }}
        >
          <svg
            className="h-[18px] w-[18px]"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M1 4v6h6" />
            <path d="M23 20v-6h-6" />
            <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
          </svg>
        </button>
        <button
          onClick={handleReset}
          title="Reset Sesi"
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/[0.08] bg-white/5 text-[#a0a8c0] transition hover:-translate-y-px hover:border-violet-500 hover:text-[#f1f0ff]"
        >
          <svg
            className="h-[18px] w-[18px]"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="1 4 1 10 7 10" />
            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
          </svg>
        </button>
      </div>
    );
  };

  return (
    <div className="relative min-h-screen bg-[#0a0b14] text-[#f1f0ff]">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute -left-[20%] -top-1/2 h-full w-[60%] rounded-full bg-[radial-gradient(ellipse,rgba(139,92,246,0.07)_0%,transparent_70%)]" />
        <div className="absolute -bottom-[30%] -right-[10%] h-[80%] w-1/2 rounded-full bg-[radial-gradient(ellipse,rgba(236,72,153,0.05)_0%,transparent_70%)]" />
      </div>

      {/* Loading overlay */}
      {camera.isLoading && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0a0b14]">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="animate-pulse-icon text-6xl">📸</div>
            <h2 className="bg-gradient-to-br from-violet-500 to-pink-500 bg-clip-text text-3xl font-extrabold text-transparent">
              SnapBooth
            </h2>
            <div className="h-1 w-48 overflow-hidden rounded-full bg-white/5">
              <div className="animate-loading h-full rounded-full bg-gradient-to-r from-violet-500 to-pink-500" />
            </div>
            <p className="text-sm text-[#555b77]">Mempersiapkan kamera...</p>
          </div>
        </div>
      )}

      {/* Camera error */}
      {camera.cameraError && !camera.isLoading && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0a0b14]">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="text-6xl">❌</div>
            <h2 className="text-2xl font-bold text-[#f1f0ff]">
              Kamera Tidak Tersedia
            </h2>
            <p className="max-w-xs text-sm text-[#a0a8c0]">
              {camera.cameraError.name === "NotAllowedError"
                ? "Izin kamera ditolak. Silakan izinkan akses kamera di browser Anda dan refresh halaman."
                : "Tidak dapat mengakses kamera: " + camera.cameraError.message}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 px-6 py-2.5 text-sm font-semibold text-white"
            >
              🔄 Coba Lagi
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="relative z-10 flex h-16 items-center justify-between border-b border-white/[0.08] bg-[rgba(10,11,20,0.85)] px-6 backdrop-blur-xl">
        <div className="flex items-center gap-2.5">
          <span className="animate-pulse-icon text-3xl">📸</span>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#f1f0ff]">
            Snap
            <span className="bg-gradient-to-r from-violet-500 to-pink-500 bg-clip-text text-transparent">
              Booth
            </span>
          </h1>
        </div>
        <CameraController className="hidden lg:flex" />
      </header>

      {/* Main content */}
      <main className="relative z-10 mx-auto grid max-w-[1200px] grid-cols-1 gap-6 p-6 lg:grid-cols-[1fr_340px]">
        {/* Camera + Capture */}
        <CameraController className="lg:hidden" />
        <section className="flex flex-col items-center gap-5">
          <CameraPreview
            countdown={capture.countdown}
            showFlash={capture.showFlash}
            filterLabel={FILTERS[currentFilter]?.label ?? "Normal"}
          />
          <CaptureButton
            timerSeconds={capture.timerSeconds}
            setTimerSeconds={capture.setTimerSeconds}
            onCapture={handleCapture}
            isCapturing={capture.isCapturing}
          />
        </section>

        {/* Controls panel */}
        <ControlsPanel
          currentFilter={currentFilter}
          currentFrame={currentFrame}
          onSelectFilter={setCurrentFilter}
          onSelectFrame={setCurrentFrame}
        />
      </main>

      {/* Gallery */}
      <GallerySection
        photos={store.photos}
        selectedPhotoIds={store.selectedPhotoIds}
        onToggleSelect={store.toggleSelect}
        onDelete={store.deletePhoto}
        onPrintSingle={(photo) => openPrintModal([photo])}
        onPrintAll={handlePrintAll}
        onClearAll={() => {
          if (confirm("Hapus semua foto di galeri?")) store.clearAll();
        }}
      />

      {/* Print Modal */}
      <PrintModal
        open={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        photos={printPhotos}
        layout={printLayout}
        onLayoutChange={setPrintLayout}
      />

      {/* Hidden frame images */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        id="img-frame-news"
        src="/assets/backgrounds/frame_news.jpg"
        alt=""
        className="hidden"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        id="img-frame-fashion"
        src="/assets/backgrounds/frame_fashion_news.png"
        alt=""
        className="hidden"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        id="img-frame-woman"
        src="/assets/backgrounds/frame_woman_news.png"
        alt=""
        className="hidden"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        id="img-frame-love"
        src="/assets/backgrounds/frame_love_news.png"
        alt=""
        className="hidden"
      />

      {/* Print area */}
      <div id="print-area" />
    </div>
  );
}
