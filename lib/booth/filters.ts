// =====================================================
// FILTER DEFINITIONS
// =====================================================
export interface FilterDef {
  label: string;
  css: string;
  previewClass: string;
}

export const FILTERS: Record<string, FilterDef> = {
  none:      { label: 'Normal',  css: 'none',                                                              previewClass: 'fp-none' },
  grayscale: { label: 'B&W',     css: 'grayscale(100%)',                                                   previewClass: 'fp-bw' },
  sepia:     { label: 'Sepia',   css: 'sepia(100%)',                                                       previewClass: 'fp-sepia' },
  warm:      { label: 'Warm',    css: 'sepia(30%) saturate(150%) hue-rotate(-15deg) brightness(1.1)',      previewClass: 'fp-warm' },
  cool:      { label: 'Cool',    css: 'saturate(80%) hue-rotate(30deg) brightness(1.05)',                  previewClass: 'fp-cool' },
  vivid:     { label: 'Vivid',   css: 'saturate(200%) contrast(1.1)',                                      previewClass: 'fp-vivid' },
  vintage:   { label: 'Vintage', css: 'sepia(40%) saturate(80%) contrast(0.9) brightness(0.95)',           previewClass: 'fp-vintage' },
  drama:     { label: 'Drama',   css: 'contrast(1.4) brightness(0.9) saturate(1.2)',                       previewClass: 'fp-drama' },
};
