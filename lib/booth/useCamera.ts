'use client';
import { useCallback, useRef, useState } from 'react';

export function useCamera() {
  const [isMirrored, setIsMirrored] = useState(true);
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('user');
  const [isLoading, setIsLoading] = useState(true);
  const [cameraError, setCameraError] = useState<Error | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const initCamera = useCallback(async () => {
    setIsLoading(true);
    setCameraError(null);

    if (!navigator.mediaDevices?.getUserMedia) {
      const err = new Error('Akses kamera diblokir. Pastikan Anda membuka link HTTPS atau localhost.');
      setCameraError(err);
      setIsLoading(false);
      return null;
    }

    // Stop existing stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }

    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 960 }, facingMode: cameraFacing },
          audio: false,
        });
      } catch {
        // Fallback: no resolution constraints
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: cameraFacing },
          audio: false,
        });
      }

      streamRef.current = stream;
      setIsLoading(false);
      return stream;
    } catch (err) {
      const e = err as Error;
      setCameraError(e);
      setIsLoading(false);
      return null;
    }
  }, [cameraFacing]);

  const switchCamera = useCallback(async () => {
    const newFacing = cameraFacing === 'user' ? 'environment' : 'user';
    setCameraFacing(newFacing);
    // Mirror follows camera facing
    setIsMirrored(newFacing === 'user');
    return newFacing;
  }, [cameraFacing]);

  const toggleMirror = useCallback(() => {
    setIsMirrored(prev => !prev);
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }, []);

  return {
    streamRef,
    isMirrored,
    cameraFacing,
    isLoading,
    cameraError,
    initCamera,
    switchCamera,
    toggleMirror,
    stopCamera,
    setIsLoading,
  };
}
