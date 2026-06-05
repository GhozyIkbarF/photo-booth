'use client';

interface CameraPreviewProps {
  countdown: number | null;
  showFlash: boolean;
  filterLabel: string;
}

export function CameraPreview({ countdown, showFlash, filterLabel }: CameraPreviewProps) {
  return (
    <div className="relative w-full max-w-[720px]">
      {/* Camera wrapper */}
      <div
        className="relative aspect-[3/4] md:aspect-[4/3] w-full overflow-hidden rounded-[28px] border border-[rgba(139,92,246,0.4)] bg-[#171a2d]"
        style={{ boxShadow: '0 0 30px rgba(139,92,246,0.3), 0 20px 60px rgba(0,0,0,0.6)' }}
      >
        {/* Corner decorators */}
        <span className="pointer-events-none absolute left-3 top-3 z-10 h-7 w-7 rounded-tl border-l-2 border-t-2 border-violet-500" />
        <span className="pointer-events-none absolute bottom-3 right-3 z-10 h-7 w-7 rounded-br border-b-2 border-r-2 border-violet-500" />

        {/* Video (hidden, just a source) */}
        <video
          id="booth-video"
          autoPlay
          playsInline
          muted
          className="absolute inset-0 h-full w-full rounded-[28px] object-cover [transform:scaleX(-1)]"
        />

        {/* Canvas preview (rendered on top) */}
        <canvas
          id="booth-canvas"
          className="absolute inset-0 h-full w-full rounded-[28px] pointer-events-none"
        />

        {/* Countdown overlay */}
        {countdown !== null && (
          <div className="absolute inset-0 z-20 flex items-center justify-center rounded-[28px] bg-black/45">
            <span
              key={countdown}
              className="animate-countdown text-[120px] font-extrabold text-white"
              style={{ textShadow: '0 0 40px rgba(139,92,246,0.8)' }}
            >
              {countdown}
            </span>
          </div>
        )}

        {/* Flash overlay */}
        {showFlash && (
          <div className="animate-shutter absolute inset-0 z-30 rounded-[28px] bg-white" />
        )}

        {/* Filter badge */}
        <div className="absolute right-4 top-4 z-10">
          <span className="rounded-full border border-[rgba(139,92,246,0.4)] bg-black/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-violet-400 backdrop-blur-sm">
            {filterLabel}
          </span>
        </div>
      </div>
    </div>
  );
}
