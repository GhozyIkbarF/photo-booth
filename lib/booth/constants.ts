// =====================================================
// CONSTANTS — Backgrounds & Frames config
// =====================================================


export interface FrameItem {
  id: string;
  label: string;
  value: string;
}

export interface FilterItem {
  id: string;
  label: string;
  previewClass: string;
}


export const FILTER_LIST: FilterItem[] = [
  { id: 'filter-none',    label: 'Normal',  previewClass: 'fp-none' },
  { id: 'filter-bw',      label: 'B&W',     previewClass: 'fp-bw' },
  { id: 'filter-sepia',   label: 'Sepia',   previewClass: 'fp-sepia' },
  { id: 'filter-warm',    label: 'Warm',    previewClass: 'fp-warm' },
  { id: 'filter-cool',    label: 'Cool',    previewClass: 'fp-cool' },
  { id: 'filter-vivid',   label: 'Vivid',   previewClass: 'fp-vivid' },
  { id: 'filter-vintage', label: 'Vintage', previewClass: 'fp-vintage' },
  { id: 'filter-drama',   label: 'Drama',   previewClass: 'fp-drama' },
];

export const FRAMES: FrameItem[] = [
  { id: 'frame-none',         label: 'Polos',         value: 'none' },
  { id: 'frame-polaroid',     label: 'Polaroid',      value: 'polaroid' },
  { id: 'frame-film',         label: 'Film Strip',    value: 'film' },
  { id: 'frame-news',         label: 'Berita LIVE',   value: 'news' },
  { id: 'frame-wanted',       label: 'Buronan',       value: 'wanted' },
  { id: 'frame-magazine',     label: 'Majalah',       value: 'magazine' },
  { id: 'frame-newspaper',    label: 'Koran (Foto)',  value: 'newspaper_img' },
  { id: 'frame-fashion',      label: 'Berita Fashion',value: 'fashion_news_img' },
  { id: 'frame-woman',        label: 'Woman News',    value: 'woman_news_img' },
  { id: 'frame-love',         label: 'Love News',     value: 'love_news_img' },
  { id: 'frame-missing',      label: 'Orang Hilang',  value: 'missing' },
  { id: 'frame-prisoner',     label: 'Tahanan',       value: 'prisoner' },
];

export interface Photo {
  id: number;
  dataUrl: string;
  filter: string;
  frame: string;
  timestamp: string;
}
