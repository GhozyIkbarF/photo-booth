'use client';

import { useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FILTER_LIST, FRAMES } from '@/lib/booth/constants';

interface ControlsPanelProps {
  currentFilter: string;
  currentFrame: string;
  onSelectFilter: (value: string) => void;
  onSelectFrame: (value: string) => void;
}

export function ControlsPanel({
  currentFilter,
  currentFrame,
  onSelectFilter,
  onSelectFrame,
}: ControlsPanelProps) {
  return (
    <aside className="h-fit overflow-hidden rounded-[20px] border border-white/[0.08] bg-[#171a2d]">
      <Tabs defaultValue="filter">
        <TabsList className="grid w-full grid-cols-2 rounded-none border-b border-white/[0.08] bg-transparent p-0">
          <TabsTrigger
            value="filter"
            className="rounded-none border-b-2 border-transparent py-3.5 text-xs font-semibold text-[#555b77] data-[state=active]:border-pink-500 data-[state=active]:bg-[rgba(236,72,153,0.06)] data-[state=active]:text-pink-400"
          >
            🎨 Filter
          </TabsTrigger>
          <TabsTrigger
            value="frame"
            className="rounded-none border-b-2 border-transparent py-3.5 text-xs font-semibold text-[#555b77] data-[state=active]:border-amber-500 data-[state=active]:bg-[rgba(245,158,11,0.06)] data-[state=active]:text-amber-400"
          >
            🖼 Frame
          </TabsTrigger>
        </TabsList>



        {/* ── Filter Tab ───────────────────────────────── */}
        <TabsContent value="filter" className="max-h-[450px] overflow-y-auto p-4">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-[#555b77]">Pilih Filter</p>
          <div className="grid grid-cols-2 gap-2.5">
            {FILTER_LIST.map((f) => {
              const filterKey = f.id.replace('filter-', '') === 'bw' ? 'grayscale' : f.id.replace('filter-', '');
              const isActive = currentFilter === filterKey;
              return (
                <button
                  key={f.id}
                  onClick={() => onSelectFilter(filterKey)}
                  className={`flex flex-col items-center gap-1.5 rounded-xl border-2 p-1.5 text-[11px] font-medium transition-all ${
                    isActive
                      ? 'border-pink-500 bg-[rgba(236,72,153,0.1)] text-pink-400'
                      : 'border-white/[0.08] bg-white/5 text-[#a0a8c0] hover:border-pink-500 hover:bg-white/[0.09]'
                  }`}
                >
                  <div
                    className={`aspect-[4/3] w-full rounded-lg bg-[linear-gradient(135deg,#667eea_0%,#764ba2_50%,#f093fb_100%)] ${f.previewClass}`}
                  />
                  <span>{f.label}</span>
                </button>
              );
            })}
          </div>
        </TabsContent>

        {/* ── Frame Tab ────────────────────────────────── */}
        <TabsContent value="frame" className="max-h-[450px] overflow-y-auto p-4">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-[#555b77]">Pilih Frame</p>
          <div className="grid grid-cols-2 gap-2.5">
            {FRAMES.map((fr) => {
              const isActive = currentFrame === fr.value;
              return (
                <button
                  key={fr.id}
                  onClick={() => onSelectFrame(fr.value)}
                  className={`flex flex-col items-center gap-1.5 rounded-xl border-2 p-1.5 text-[11px] font-medium transition-all ${
                    isActive
                      ? 'border-amber-500 bg-[rgba(245,158,11,0.1)] text-amber-400'
                      : 'border-white/[0.08] bg-white/5 text-[#a0a8c0] hover:border-amber-500 hover:bg-white/[0.09]'
                  }`}
                >
                  <FramePreview value={fr.value} />
                  <span>{fr.label}</span>
                </button>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </aside>
  );
}

// ── Mini frame previews ───────────────────────────────────────────────────────
function FramePreview({ value }: { value: string }) {
  const base = 'aspect-[4/3] w-full overflow-hidden rounded-lg relative flex flex-col';
  const photoArea = 'bg-[linear-gradient(135deg,#1e2139,#2d3154)] rounded-sm flex-1';

  if (value === 'none') {
    return <div className={base}><div className={photoArea + ' rounded-lg'} /></div>;
  }
  if (value === 'polaroid') {
    return (
      <div className={`${base} bg-white p-1 pb-3`}>
        <div className="flex-1 rounded-sm bg-[linear-gradient(135deg,#1e2139,#2d3154)]" />
      </div>
    );
  }
  if (value === 'film') {
    return (
      <div className={`${base} items-center gap-0.5 bg-[#1a1a1a] p-1`}>
        <FilmHoles /><div className={photoArea} /><FilmHoles />
      </div>
    );
  }
  if (value === 'news') {
    return (
      <div className={`${base} bg-white p-1`}>
        <div className="mb-0.5 h-1 w-full border-b border-t border-black" />
        <div className="relative mb-4 flex-1 bg-black">
          <div className="absolute bottom-0 left-0 w-[60%] bg-red-700 px-0.5 text-[6px] font-black italic text-white">BREAKING</div>
        </div>
      </div>
    );
  }
  if (value === 'wanted') {
    return (
      <div className={`${base} bg-[#d4c0a1] p-1`}>
        <p className="text-center text-[10px] font-black text-[#3b2a1a] font-serif mb-0.5">WANTED</p>
        <div className={photoArea} />
      </div>
    );
  }
  if (value === 'magazine') {
    return (
      <div className={`${base} relative bg-white p-0.5`}>
        <p className="absolute top-[5%] z-10 w-full text-center text-xs font-black text-white/90" style={{ fontFamily: 'Times New Roman, serif', textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>VOGUE</p>
        <div className={photoArea + ' rounded-none'} />
      </div>
    );
  }
  if (value === 'newspaper_img') {
    return (
      <div className={`${base} bg-[#e5e5e5] p-1`}>
        <p className="mb-0.5 text-center text-[8px] font-black">BREAKING NEWS</p>
        <div className="flex-1 bg-black rounded-sm" />
      </div>
    );
  }
  if (value === 'fashion_news_img') {
    return (
      <div className={`${base} bg-[#fdf5e6] p-1`}>
        <p className="mb-0.5 text-center text-[8px] font-black" style={{ fontFamily: 'serif' }}>FASHION</p>
        <div className="flex-1 bg-black rounded-sm" />
      </div>
    );
  }
  if (value === 'woman_news_img') {
    return (
      <div className={`${base} bg-[#ffe4e1] p-1`}>
        <p className="mb-0.5 text-center text-[8px] font-black text-[#d10068]" style={{ fontFamily: 'serif' }}>WOMAN</p>
        <div className="flex-1 bg-black rounded-sm" />
      </div>
    );
  }
  if (value === 'love_news_img') {
    return (
      <div className={`${base} bg-[#ffebee] p-1`}>
        <p className="mb-0.5 text-center text-[8px] font-black text-[#d32f2f]" style={{ fontFamily: 'serif' }}>LOVE</p>
        <div className="flex-1 bg-black rounded-sm" />
      </div>
    );
  }
  if (value === 'missing') {
    return (
      <div className={`${base} bg-[#fdf5e6] p-1`}>
        <p className="mb-0.5 text-center text-[10px] font-black tracking-widest text-[#a30000]">MISSING</p>
        <div className={photoArea} />
      </div>
    );
  }
  if (value === 'prisoner') {
    return (
      <div className={`${base} relative border border-gray-300 bg-white p-0.5`}>
        <div className={photoArea} />
        <div className="absolute bottom-[10%] left-[10%] right-[10%] border-2 border-white bg-[#333] py-0.5 text-center">
          <p className="font-mono text-[6px] font-bold text-white">DEPT. OF CORRECTIONS</p>
        </div>
      </div>
    );
  }
  return <div className={base}><div className={photoArea} /></div>;
}

function FilmHoles() {
  return (
    <div className="flex justify-center gap-1">
      {[0,1,2].map(i => <span key={i} className="block h-1 w-1.5 rounded-sm bg-[#888]" />)}
    </div>
  );
}
