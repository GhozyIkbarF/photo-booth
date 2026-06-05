'use client';

import type { Photo } from '@/lib/booth/constants';

interface GallerySectionProps {
  photos: Photo[];
  selectedPhotoIds: number[];
  onToggleSelect: (id: number) => void;
  onDelete: (id: number) => void;
  onPrintSingle: (photo: Photo) => void;
  onPrintAll: () => void;
  onClearAll: () => void;
}

export function GallerySection({
  photos,
  selectedPhotoIds,
  onToggleSelect,
  onDelete,
  onPrintSingle,
  onPrintAll,
  onClearAll,
}: GallerySectionProps) {
  const hasPhotos = photos.length > 0;

  const downloadPhoto = (dataUrl: string, filename: string) => {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    a.click();
  };

  return (
    <section className="relative z-10 mx-auto max-w-[1200px] px-6 pb-12">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between border-b border-white/[0.08] pb-4">
        <h2 className="text-lg font-bold text-[#f1f0ff]">📂 Hasil Foto</h2>
        <div className="flex gap-2.5">
          <button
            onClick={onPrintAll}
            disabled={!hasPhotos}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-500 to-pink-500 px-4 py-2 text-xs font-semibold text-white shadow-[0_4px_16px_rgba(139,92,246,0.35)] transition hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(139,92,246,0.5)] disabled:cursor-not-allowed disabled:opacity-40 disabled:transform-none"
          >
            🖨️ Cetak Semua
          </button>
          <button
            onClick={onClearAll}
            disabled={!hasPhotos}
            className="inline-flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/15 px-4 py-2 text-xs font-semibold text-red-400 transition hover:-translate-y-0.5 hover:bg-red-500/25 disabled:cursor-not-allowed disabled:opacity-40 disabled:transform-none"
          >
            🗑️ Hapus Semua
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
        {!hasPhotos && (
          <div className="col-span-full flex flex-col items-center justify-center gap-3 py-16 text-center text-[#555b77]">
            <span className="text-5xl opacity-40">🖼️</span>
            <p className="text-sm">Belum ada foto. Klik capture untuk mulai!</p>
          </div>
        )}

        {photos.map((photo) => {
          const isSelected = selectedPhotoIds.includes(photo.id);
          return (
            <div
              key={photo.id}
              className={`animate-card-enter group relative cursor-pointer overflow-hidden rounded-xl border-2 bg-[#171a2d] transition-all hover:-translate-y-1 ${
                isSelected
                  ? 'border-violet-500 shadow-[0_0_0_3px_rgba(139,92,246,0.3)]'
                  : 'border-white/[0.08] hover:border-violet-500 hover:shadow-[0_0_30px_rgba(139,92,246,0.3)]'
              }`}
              onClick={(e) => {
                const target = e.target as HTMLElement;
                if (target.tagName === 'BUTTON') return;
                onToggleSelect(photo.id);
              }}
            >
              {/* Selection indicator */}
              <div className={`absolute left-2 top-2 z-10 flex h-5 w-5 items-center justify-center rounded-full border-2 text-xs transition-all ${
                isSelected ? 'border-violet-500 bg-violet-500' : 'border-white/[0.08] bg-black/60'
              }`}>
                {isSelected && '✓'}
              </div>

              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.dataUrl}
                alt={`Foto ${photo.timestamp}`}
                className="block aspect-[4/3] w-full object-cover"
              />

              {/* Action buttons */}
              <div className="flex gap-1.5 bg-black/50 p-2 backdrop-blur-sm">
                <button
                  onClick={() => onPrintSingle(photo)}
                  className="flex-1 rounded-lg border border-white/[0.08] bg-white/5 px-1.5 py-1.5 text-[11px] font-semibold text-[#a0a8c0] transition hover:border-violet-500 hover:bg-violet-500 hover:text-white"
                >
                  🖨️ Cetak
                </button>
                <button
                  onClick={() => downloadPhoto(photo.dataUrl, `snapbooth_${photo.id}.png`)}
                  className="flex-1 rounded-lg border border-white/[0.08] bg-white/5 px-1.5 py-1.5 text-[11px] font-semibold text-[#a0a8c0] transition hover:border-emerald-500 hover:bg-emerald-500 hover:text-white"
                >
                  💾 Simpan
                </button>
                <button
                  onClick={() => onDelete(photo.id)}
                  className="rounded-lg border border-white/[0.08] bg-white/5 px-2 py-1.5 text-[11px] font-semibold text-[#a0a8c0] transition hover:border-red-500 hover:bg-red-500 hover:text-white"
                >
                  🗑️
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
