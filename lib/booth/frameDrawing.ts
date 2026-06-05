/* =====================================================
   FRAME DRAWING FUNCTIONS
   Ported directly from app.js — no logic changes
   ===================================================== */
import { FILTERS } from './filters';

// -------------------------------------------------------
// Main dispatcher
// -------------------------------------------------------
export function drawFrameOnCtx(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  frame: string,
  state: { currentFilter: string; isMirrored: boolean },
  forCapture = false,
) {
  if (frame === 'none') return;

  if (frame === 'polaroid') {
    drawPolaroidFrame(ctx, w, h, forCapture);
  } else if (frame === 'film') {
    drawFilmFrame(ctx, w, h);
  } else if (frame === 'news') {
    drawNewsFrame(ctx, w, h, state);
  } else if (frame === 'wanted') {
    drawWantedFrame(ctx, w, h);
  } else if (frame === 'magazine') {
    drawMagazineFrame(ctx, w, h);
  } else if (frame === 'missing') {
    drawMissingFrame(ctx, w, h);
  } else if (frame === 'prisoner') {
    drawPrisonerFrame(ctx, w, h);
  } else if (frame === 'newspaper_img') {
    drawNewspaperImgFrame(ctx, w, h, state);
  } else if (frame === 'fashion_news_img') {
    drawFashionNewsImgFrame(ctx, w, h, state);
  } else if (frame === 'woman_news_img') {
    drawWomanNewsImgFrame(ctx, w, h, state);
  } else if (frame === 'love_news_img') {
    drawLoveNewsImgFrame(ctx, w, h, state);
  }
}

// -------------------------------------------------------
// Helper: draw video inside a box (cover fit, optional mirror)
// -------------------------------------------------------
function drawVideoInBox(
  ctx: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  w: number,
  boxX: number, boxY: number, boxW: number, boxH: number,
  state: { currentFilter: string; isMirrored: boolean },
) {
  if (!video || video.readyState < 2) return;
  ctx.save();
  ctx.filter = state.currentFilter !== 'none' ? FILTERS[state.currentFilter]?.css || 'none' : 'none';

  const vRatio = video.videoWidth / video.videoHeight;
  const bRatio = boxW / boxH;
  let srcX = 0, srcY = 0, srcW = video.videoWidth, srcH = video.videoHeight;

  if (vRatio > bRatio) {
    srcW = video.videoHeight * bRatio;
    srcX = (video.videoWidth - srcW) / 2;
  } else {
    srcH = video.videoWidth / bRatio;
    srcY = (video.videoHeight - srcH) / 2;
  }

  if (state.isMirrored) {
    ctx.translate(w, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, srcX, srcY, srcW, srcH, w - (boxX + boxW), boxY, boxW, boxH);
  } else {
    ctx.drawImage(video, srcX, srcY, srcW, srcH, boxX, boxY, boxW, boxH);
  }
  ctx.restore();
}

// -------------------------------------------------------
// Polaroid
// -------------------------------------------------------
function drawPolaroidFrame(ctx: CanvasRenderingContext2D, w: number, h: number, forCapture: boolean) {
  const bTop  = w * 0.04;
  const bSide = w * 0.04;
  const bBot  = w * 0.15;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, bTop);
  ctx.fillRect(0, 0, bSide, h);
  ctx.fillRect(w - bSide, 0, bSide, h);
  ctx.fillRect(0, h - bBot, w, bBot);

  if (forCapture) {
    ctx.fillStyle = '#333';
    ctx.font = `${w * 0.05}px Outfit, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('SnapBooth', w / 2, h - bBot / 2 + w * 0.02);
  }
}

// -------------------------------------------------------
// Film Strip
// -------------------------------------------------------
function drawFilmFrame(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const sideW     = w * 0.06;
  const holeH     = h * 0.04;
  const holeCount = 8;
  const totalGap  = h / (holeCount + 1);

  ctx.fillStyle = '#111111';
  ctx.fillRect(0, 0, sideW, h);
  ctx.fillRect(w - sideW, 0, sideW, h);

  ctx.fillStyle = '#cccccc';
  for (let i = 0; i < holeCount; i++) {
    const y      = totalGap * (i + 1) - holeH / 2;
    const margin = sideW * 0.15;
    const holeW  = sideW * 0.65;
    ctx.roundRect(margin, y, holeW, holeH, 2);
    ctx.fill();
    ctx.roundRect(w - sideW + margin, y, holeW, holeH, 2);
    ctx.fill();
  }
}

// -------------------------------------------------------
// News (drawn frame)
// -------------------------------------------------------
function drawNewsFrame(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  state: { currentFilter: string; isMirrored: boolean },
) {
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = '#000';
  const menuX    = w * 0.05;
  const menuY    = h * 0.05;
  const menuW    = w * 0.08;
  const menuLineH = h * 0.01;
  const menuGap  = h * 0.015;
  ctx.fillRect(menuX, menuY, menuW, menuLineH);
  ctx.fillRect(menuX, menuY + menuLineH + menuGap, menuW, menuLineH);
  ctx.fillRect(menuX, menuY + (menuLineH + menuGap) * 2, menuW, menuLineH);

  ctx.fillStyle = '#000';
  ctx.font = `italic 900 ${h * 0.05}px Arial, sans-serif`;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'top';
  ctx.fillText('ECONOMIC NEWS', w * 0.95, h * 0.06);

  const textWidth = ctx.measureText('ECONOMIC NEWS').width;
  ctx.beginPath();
  ctx.arc(w * 0.95 - textWidth - (w * 0.03), h * 0.08, h * 0.015, 0, Math.PI * 2);
  ctx.fillStyle = '#b30000';
  ctx.fill();

  const boxX = w * 0.05;
  const boxY = h * 0.15;
  const boxW = w * 0.9;
  const boxH = h * 0.58;

  const video = document.getElementById('booth-video') as HTMLVideoElement;
  if (video && video.readyState >= 2) {
    drawVideoInBox(ctx, video, w, boxX, boxY, boxW, boxH, state);
  } else {
    ctx.fillStyle = '#ccc';
    ctx.fillRect(boxX, boxY, boxW, boxH);
  }

  const bnX = w * 0.05;
  const bnY = boxY + boxH - (h * 0.1);
  const bnW = w * 0.55;
  const bnH = h * 0.12;
  ctx.fillStyle = '#b30000';
  ctx.fillRect(bnX, bnY, bnW, bnH);

  ctx.fillStyle = '#fff';
  ctx.font = `italic 900 ${h * 0.06}px Arial, sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('BREAKING NEWS', bnX + (w * 0.03), bnY + (bnH / 2));

  ctx.fillStyle = '#000';
  ctx.font = `normal ${h * 0.035}px Arial, sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  const textY = boxY + boxH + (h * 0.03);
  ctx.fillText('Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed', w * 0.05, textY);
  ctx.fillText('do eiusmod tempor incididunt ut labore et dolore magna', w * 0.05, textY + (h * 0.04));
  ctx.fillText('aliqua. Ut enim ad minim veniam', w * 0.05, textY + (h * 0.08));

  const footerY   = h * 0.88;
  const readMoreW = w * 0.3;
  const readMoreH = h * 0.08;
  ctx.fillStyle = '#b30000';
  ctx.fillRect(w * 0.05, footerY, readMoreW, readMoreH);
  ctx.fillStyle = '#fff';
  ctx.font = `900 ${h * 0.035}px Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('READ MORE', w * 0.05 + (readMoreW / 2), footerY + (readMoreH / 2));
  ctx.fillStyle = '#000';
  ctx.font = `normal ${h * 0.035}px Arial, sans-serif`;
  ctx.textAlign = 'right';
  ctx.fillText('www.reallygreatsite.com', w * 0.95, footerY + (readMoreH / 2));
  ctx.beginPath();
  ctx.moveTo(w * 0.05 + readMoreW + 10, footerY);
  ctx.lineTo(w * 0.95, footerY);
  ctx.strokeStyle = '#999';
  ctx.lineWidth = 1;
  ctx.stroke();
}

// -------------------------------------------------------
// Wanted
// -------------------------------------------------------
function drawWantedFrame(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = '#dcb084';
  ctx.fillRect(0, 0, w, h);
  ctx.restore();

  ctx.strokeStyle = '#3b2a1a';
  ctx.lineWidth = w * 0.02;
  ctx.strokeRect(w * 0.05, h * 0.05, w * 0.9, h * 0.9);
  ctx.lineWidth = w * 0.005;
  ctx.strokeRect(w * 0.07, h * 0.07, w * 0.86, h * 0.86);

  ctx.fillStyle = '#3b2a1a';
  ctx.font = `900 ${h * 0.15}px serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('WANTED', w / 2, h * 0.1);
  ctx.font = `bold ${h * 0.08}px serif`;
  ctx.fillText('DEAD OR ALIVE', w / 2, h * 0.25);
  ctx.font = `bold ${h * 0.06}px serif`;
  ctx.fillText('$1,000,000 REWARD', w / 2, h * 0.85);
}

// -------------------------------------------------------
// Magazine (Vogue)
// -------------------------------------------------------
function drawMagazineFrame(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.font = `900 ${h * 0.25}px "Times New Roman", serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 5;
  ctx.fillText('VOGUE', w / 2, -h * 0.02);
  ctx.shadowColor = 'transparent';

  ctx.textAlign = 'left';
  ctx.fillStyle = '#fff';
  ctx.font = `bold ${h * 0.06}px sans-serif`;
  ctx.shadowColor = 'rgba(0,0,0,0.8)';
  ctx.shadowBlur = 4;
  ctx.fillText('THE', w * 0.05, h * 0.4);
  ctx.font = `bold ${h * 0.08}px sans-serif`;
  ctx.fillStyle = '#f59e0b';
  ctx.fillText('STYLE', w * 0.05, h * 0.48);
  ctx.fillStyle = '#fff';
  ctx.font = `bold ${h * 0.06}px sans-serif`;
  ctx.fillText('ISSUE', w * 0.05, h * 0.56);

  ctx.textAlign = 'right';
  ctx.font = `${h * 0.04}px sans-serif`;
  ctx.fillText('Exclusive', w * 0.95, h * 0.7);
  ctx.font = `bold ${h * 0.05}px sans-serif`;
  ctx.fillText('NEW TRENDS', w * 0.95, h * 0.76);
  ctx.shadowColor = 'transparent';

  ctx.fillStyle = '#fff';
  ctx.fillRect(w * 0.8, h * 0.85, w * 0.15, h * 0.1);
  ctx.fillStyle = '#000';
  for (let i = 0; i < 15; i++) {
    const bw = Math.random() * w * 0.01 + w * 0.002;
    const bx = w * 0.81 + i * (w * 0.009);
    ctx.fillRect(bx, h * 0.86, bw, h * 0.07);
  }
}

// -------------------------------------------------------
// Missing Person
// -------------------------------------------------------
function drawMissingFrame(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.save();
  ctx.globalCompositeOperation = 'saturation';
  ctx.fillStyle = 'hsl(0,0%,50%)';
  ctx.fillRect(0, 0, w, h);
  ctx.restore();

  const margin = w * 0.05;
  ctx.fillStyle = '#fdf5e6';
  ctx.fillRect(0, 0, w, margin * 2.5);
  ctx.fillRect(0, h - margin * 1.5, w, margin * 1.5);
  ctx.fillRect(0, 0, margin, h);
  ctx.fillRect(w - margin, 0, margin, h);

  ctx.fillStyle = '#a30000';
  ctx.font = `900 ${h * 0.1}px Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('MISSING', w / 2, margin * 0.2);

  ctx.fillStyle = '#000';
  ctx.font = `bold ${h * 0.04}px Arial, sans-serif`;
  ctx.fillText('HAVE YOU SEEN THIS PERSON?', w / 2, margin * 1.6);
  ctx.font = `bold ${h * 0.03}px Arial, sans-serif`;
  ctx.fillText('CALL LOCAL AUTHORITIES IMMEDIATELY', w / 2, h - margin * 1.2);
}

// -------------------------------------------------------
// Prisoner
// -------------------------------------------------------
function drawPrisonerFrame(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.save();
  ctx.strokeStyle = 'rgba(0,0,0,0.3)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let y = 0; y < h; y += h / 10) {
    ctx.moveTo(0, y);
    ctx.lineTo(w * 0.1, y);
    ctx.moveTo(w * 0.9, y);
    ctx.lineTo(w, y);
  }
  ctx.stroke();
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.font = `${h * 0.03}px monospace`;
  ctx.textAlign = 'left';
  ctx.fillText("6' 0\"", 5, h * 0.2);
  ctx.fillText("5' 6\"", 5, h * 0.4);
  ctx.fillText("5' 0\"", 5, h * 0.6);
  ctx.restore();

  const bw = w * 0.7;
  const bh = h * 0.3;
  const bx = (w - bw) / 2;
  const by = h * 0.65;

  ctx.fillStyle = '#222';
  ctx.fillRect(bx, by, bw, bh);
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 4;
  ctx.strokeRect(bx + 4, by + 4, bw - 8, bh - 8);

  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `bold ${h * 0.04}px monospace`;
  ctx.fillText('DEPT. OF CORRECTIONS', w / 2, by + bh * 0.25);
  ctx.font = `bold ${h * 0.06}px monospace`;
  const randomId = Math.floor(Math.random() * 900000) + 100000;
  ctx.fillText(`ID: ${randomId}`, w / 2, by + bh * 0.6);
  ctx.font = `${h * 0.03}px monospace`;
  const date = new Date().toLocaleDateString('en-GB');
  ctx.fillText(`DATE: ${date}`, w / 2, by + bh * 0.85);
}

// -------------------------------------------------------
// Image-overlay frames (newspaper, fashion, woman, love)
// -------------------------------------------------------
function drawImageOverlayFrame(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | null,
  w: number,
  h: number,
  boxX: number,
  boxY: number,
  boxW: number,
  boxH: number,
  state: { currentFilter: string; isMirrored: boolean },
  fallbackText: string,
) {
  if (img && img.complete && img.naturalHeight > 0) {
    ctx.drawImage(img, 0, 0, w, h);
    const video = document.getElementById('booth-video') as HTMLVideoElement;
    if (video && video.readyState >= 2) {
      drawVideoInBox(ctx, video, w, boxX, boxY, boxW, boxH, state);
    }
  } else {
    ctx.fillStyle = '#f4f1ea';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#000';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(fallbackText, w / 2, h / 2);
  }
}

export function drawNewspaperImgFrame(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  state: { currentFilter: string; isMirrored: boolean },
) {
  const img = document.getElementById('img-frame-news') as HTMLImageElement;
  drawImageOverlayFrame(ctx, img, w, h,
    w * 0.06637, h * 0.529, w * 0.8678, h * 0.351,
    state, 'frame_news.jpg tidak ditemukan',
  );
}

export function drawFashionNewsImgFrame(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  state: { currentFilter: string; isMirrored: boolean },
) {
  const img = document.getElementById('img-frame-fashion') as HTMLImageElement;
  drawImageOverlayFrame(ctx, img, w, h,
    w * 0.35, h * 0.42825, w * 0.30, h * 0.30,
    state, 'frame_fashion_news.png tidak ditemukan',
  );
}

export function drawWomanNewsImgFrame(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  state: { currentFilter: string; isMirrored: boolean },
) {
  const img = document.getElementById('img-frame-woman') as HTMLImageElement;
  drawImageOverlayFrame(ctx, img, w, h,
    w * 0.055, h * 0.445, w * 0.885, h * 0.425,
    state, 'frame_woman_news.png tidak ditemukan',
  );
}

export function drawLoveNewsImgFrame(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  state: { currentFilter: string; isMirrored: boolean },
) {
  const img = document.getElementById('img-frame-love') as HTMLImageElement;
  drawImageOverlayFrame(ctx, img, w, h,
    w * 0.045, h * 0.245, w * 0.91, h * 0.47,
    state, 'frame_love_news.png tidak ditemukan',
  );
}
