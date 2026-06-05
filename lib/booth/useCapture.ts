'use client';
import { useCallback, useRef, useState } from 'react';
import { FILTERS } from './filters';
import { drawFrameOnCtx } from './frameDrawing';
import type { Photo } from './constants';

interface CaptureState {
  currentFilter: string;
  currentFrame: string;
  isMirrored: boolean;
}

export function useCapture() {
  const [isCapturing, setIsCapturing] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showFlash, setShowFlash] = useState(false);

  const sleep = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

  const runCountdown = useCallback(async (seconds: number) => {
    for (let i = seconds; i >= 1; i--) {
      setCountdown(i);
      await sleep(1000);
    }
    setCountdown(null);
  }, []);

  const triggerFlash = useCallback(async () => {
    setShowFlash(true);
    await sleep(400);
    setShowFlash(false);
  }, []);

  const takeSnapshot = useCallback((captureState: CaptureState): string | null => {
    const video = document.getElementById('booth-video') as HTMLVideoElement;
    if (!video || video.readyState < 2) return null;

    const canvas = document.createElement('canvas');
    const w = video.videoWidth || 640;
    const h = video.videoHeight || 480;
    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.clearRect(0, 0, w, h);

    // Apply filter
    ctx.filter = captureState.currentFilter !== 'none'
      ? FILTERS[captureState.currentFilter]?.css || 'none'
      : 'none';



    // Draw video (mirrored)
    ctx.save();
    if (captureState.isMirrored) {
      ctx.translate(w, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, w, h);
    ctx.restore();
    ctx.filter = 'none';

    // Draw frame on top
    drawFrameOnCtx(ctx, w, h, captureState.currentFrame, captureState, true);

    return canvas.toDataURL('image/png');
  }, []);

  const capturePhoto = useCallback(async (
    captureState: CaptureState,
    onCapture: (photo: Photo) => void,
  ) => {
    if (isCapturing) return;
    setIsCapturing(true);

    if (timerSeconds > 0) {
      await runCountdown(timerSeconds);
    }

    triggerFlash();
    await sleep(150);

    const dataUrl = takeSnapshot(captureState);
    if (!dataUrl) {
      setIsCapturing(false);
      return;
    }

    const photo: Photo = {
      id: Date.now(),
      dataUrl,
      filter: captureState.currentFilter,
      frame: captureState.currentFrame,
      timestamp: new Date().toLocaleString('id-ID'),
    };

    onCapture(photo);
    await sleep(300);
    setIsCapturing(false);
  }, [isCapturing, timerSeconds, runCountdown, triggerFlash, takeSnapshot]);

  return {
    isCapturing,
    timerSeconds,
    setTimerSeconds,
    countdown,
    showFlash,
    capturePhoto,
  };
}
