'use client';

interface CaptureButtonProps {
  timerSeconds: number;
  setTimerSeconds: (s: number) => void;
  onCapture: () => void;
  isCapturing: boolean;
}

export function CaptureButton({ timerSeconds, setTimerSeconds, onCapture, isCapturing }: CaptureButtonProps) {
  const timers = [
    { label: 'Off', value: 0 },
    { label: '3s',  value: 3 },
    { label: '5s',  value: 5 },
  ];

  return (
    <div className="flex w-full max-w-[720px] flex-col items-center gap-3">
      {/* Timer selector */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-[#555b77]">Timer:</span>
        {timers.map(t => (
          <button
            key={t.value}
            onClick={() => setTimerSeconds(t.value)}
            className={`rounded-full border px-3.5 py-1 text-xs font-semibold transition-all ${
              timerSeconds === t.value
                ? 'border-violet-500 bg-violet-500 text-white shadow-[0_0_12px_rgba(139,92,246,0.4)]'
                : 'border-white/[0.08] bg-white/5 text-[#a0a8c0] hover:border-violet-500 hover:bg-violet-500 hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Capture button */}
      <button
        onClick={onCapture}
        disabled={isCapturing}
        className="group relative flex h-20 w-20 items-center justify-center transition-transform hover:scale-[1.08] active:scale-[0.95] disabled:opacity-60"
        aria-label="Ambil foto"
      >
        <span className="animate-ring-pulse absolute inset-0 rounded-full bg-gradient-to-br from-violet-500 to-pink-500" />
        <span className="relative z-10 text-3xl drop-shadow-lg">📸</span>
      </button>

      <p className="text-xs text-[#555b77]">Klik untuk mengambil foto</p>
    </div>
  );
}
