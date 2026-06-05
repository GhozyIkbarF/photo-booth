'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Photo } from '@/lib/booth/constants';

interface PrintModalProps {
  open: boolean;
  onClose: () => void;
  photos: Photo[];
  layout: 1 | 2 | 4;
  onLayoutChange: (l: 1 | 2 | 4) => void;
}

export function PrintModal({ open, onClose, photos, layout, onLayoutChange }: PrintModalProps) {

  const buildPrintArea = () => {
    const area = document.getElementById('print-area');
    if (!area) return;
    area.innerHTML = '';

    const container = document.createElement('div');
    container.className = 'print-container';

    const header = document.createElement('div');
    header.className = 'print-header';
    header.innerHTML = `<h1>📸 SnapBooth</h1><p>Dicetak pada: ${new Date().toLocaleString('id-ID')}</p>`;
    container.appendChild(header);

    const photoWrap = document.createElement('div');
    photoWrap.className = `print-layout-${layout}`;

    const photosToRender = photos.slice(0, layout);
    // Pad if not enough
    while (photosToRender.length < layout && photosToRender.length > 0) {
      photosToRender.push(photosToRender[photosToRender.length - 1]);
    }

    photosToRender.forEach(photo => {
      const div = document.createElement('div');
      div.className = `print-photo ${photo.frame !== 'none' ? 'frame-' + photo.frame : ''}`;
      const img = document.createElement('img');
      img.src = photo.dataUrl;
      img.alt = 'Foto SnapBooth';
      div.appendChild(img);
      photoWrap.appendChild(div);
    });

    container.appendChild(photoWrap);

    const footer = document.createElement('div');
    footer.className = 'print-footer';
    footer.textContent = '✨ Dibuat dengan SnapBooth';
    container.appendChild(footer);

    area.appendChild(container);
  };

  const handlePrint = () => {
    buildPrintArea();
    window.print();
  };

  const handleDownload = () => {
    if (photos.length === 1) {
      const a = document.createElement('a');
      a.href = photos[0].dataUrl;
      a.download = `snapbooth_${photos[0].id}.png`;
      a.click();
    } else {
      photos.forEach((photo, i) => {
        setTimeout(() => {
          const a = document.createElement('a');
          a.href = photo.dataUrl;
          a.download = `snapbooth_${i + 1}_${photo.id}.png`;
          a.click();
        }, i * 300);
      });
    }
    onClose();
  };

  const layouts: { value: 1 | 2 | 4; label: string; dots: number }[] = [
    { value: 1, label: '1 Foto',     dots: 1 },
    { value: 2, label: '2 Foto',     dots: 2 },
    { value: 4, label: '4 Foto (Strip)', dots: 4 },
  ];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="animate-modal max-w-[480px] border border-[rgba(139,92,246,0.4)] bg-[#171a2d] p-6 text-[#f1f0ff] shadow-[0_0_30px_rgba(139,92,246,0.3),0_20px_60px_rgba(0,0,0,0.6)] [&>button]:text-[#a0a8c0]">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-[#f1f0ff]">🖨️ Pilih Layout Cetak</DialogTitle>
        </DialogHeader>

        {/* Layout selector */}
        <div className="flex gap-3 py-2">
          {layouts.map((l) => (
            <button
              key={l.value}
              onClick={() => onLayoutChange(l.value)}
              className={`flex flex-1 flex-col items-center gap-2 rounded-xl border-2 px-2 py-3 text-xs font-semibold transition-all ${
                layout === l.value
                  ? 'border-violet-500 bg-[rgba(139,92,246,0.1)] text-violet-400'
                  : 'border-white/[0.08] bg-white/5 text-[#a0a8c0] hover:border-violet-500 hover:bg-[rgba(139,92,246,0.1)] hover:text-violet-400'
              }`}
            >
              {/* Layout preview */}
              <div className="flex h-[52px] w-[60px] flex-wrap gap-[3px] rounded-md bg-[#0a0b14] p-1">
                {Array.from({ length: l.dots }).map((_, i) => (
                  <div
                    key={i}
                    className="rounded-sm bg-gradient-to-br from-violet-500 to-pink-500 opacity-70"
                    style={{
                      width:  l.value === 4 ? 'calc(50% - 1.5px)' : '100%',
                      height: l.value === 1 ? '100%' : l.value === 4 ? 'calc(50% - 1.5px)' : 'calc(50% - 1.5px)',
                    }}
                  />
                ))}
              </div>
              {l.label}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-2.5 pt-2">
          <button
            onClick={handlePrint}
            className="flex-1 rounded-lg bg-gradient-to-r from-violet-500 to-pink-500 py-2.5 text-sm font-semibold text-white shadow-[0_4px_16px_rgba(139,92,246,0.35)] transition hover:-translate-y-0.5"
          >
            🖨️ Cetak Sekarang
          </button>
          <button
            onClick={handleDownload}
            className="flex-1 rounded-lg bg-gradient-to-r from-emerald-500 to-green-600 py-2.5 text-sm font-semibold text-white shadow-[0_4px_16px_rgba(16,185,129,0.35)] transition hover:-translate-y-0.5"
          >
            💾 Download PNG
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
