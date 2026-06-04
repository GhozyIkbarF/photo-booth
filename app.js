/* =====================================================
   SNAPBOOTH — Main Application Logic
   Version: 1.0
   ===================================================== */

'use strict';

// =====================================================
// STATE
// =====================================================
const state = {
  stream: null,
  currentBackground: 'none',
  currentFilter: 'none',
  currentFrame: 'none',
  timerSeconds: 0,
  isCapturing: false,
  isMirrored: true,
  cameraFacing: 'user', // 'user' or 'environment'
  photos: [],           // Array of { id, dataUrl, bg, filter, frame, timestamp }
  selectedPhotoIds: [], // IDs for print selection
  printLayout: 1,
  animFrameId: null,
  bgImage: null,        // HTMLImageElement for background
  printTargetId: null,  // single photo print target
};

// =====================================================
// DOM REFERENCES
// =====================================================
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const DOM = {
  loadingScreen: $('#loading-screen'),
  video: $('#video'),
  canvasPreview: $('#canvas-preview'),
  canvasMain: $('#canvas-main'),
  countdownOverlay: $('#countdown-overlay'),
  countdownNum: $('#countdown-number'),
  shutterFlash: $('#shutter-flash'),
  filterIndicator: $('#filter-indicator'),

  btnCapture: $('#btn-capture'),
  btnFlip: $('#btn-flip-camera'),
  btnSwitchCam: $('#btn-switch-camera'),
  btnReset: $('#btn-reset'),

  bgGrid: $('#bg-grid'),
  filterGrid: $('#filter-grid'),
  frameGrid: $('#frame-grid'),

  tabBtns: $$('.tab-btn'),
  tabContents: $$('.tab-content'),

  timerBtns: $$('.btn-timer'),

  galleryGrid: $('#gallery-grid'),
  galleryEmpty: $('#gallery-empty'),
  btnPrintAll: $('#btn-print-all'),
  btnClearGallery: $('#btn-clear-gallery'),

  printModal: $('#print-modal'),
  modalClose: $('#modal-close'),
  modalBackdrop: $('.modal-backdrop'),
  printLayoutBtns: $$('.print-layout-btn'),
  btnDoPrint: $('#btn-do-print'),
  btnDoDownload: $('#btn-do-download'),

  bgUploadBtn: $('#bg-upload-btn'),
  bgUploadInput: $('#bg-upload-input'),

  printArea: $('#print-area'),
};

// =====================================================
// FILTER DEFINITIONS
// =====================================================
const FILTERS = {
  none: { label: 'Normal', css: 'none' },
  grayscale: { label: 'B&W', css: 'grayscale(100%)' },
  sepia: { label: 'Sepia', css: 'sepia(100%)' },
  warm: { label: 'Warm', css: 'sepia(30%) saturate(150%) hue-rotate(-15deg) brightness(1.1)' },
  cool: { label: 'Cool', css: 'saturate(80%) hue-rotate(30deg) brightness(1.05)' },
  vivid: { label: 'Vivid', css: 'saturate(200%) contrast(1.1)' },
  vintage: { label: 'Vintage', css: 'sepia(40%) saturate(80%) contrast(0.9) brightness(0.95)' },
  drama: { label: 'Drama', css: 'contrast(1.4) brightness(0.9) saturate(1.2)' },
};

// =====================================================
// CAMERA
// =====================================================
async function initCamera() {
  try {
    if (state.stream) {
      state.stream.getTracks().forEach(track => track.stop());
    }
    const constraints = {
      video: {
        width: { ideal: 1280 },
        height: { ideal: 960 },
        facingMode: state.cameraFacing,
      },
      audio: false,
    };

    state.stream = await navigator.mediaDevices.getUserMedia(constraints);
    DOM.video.srcObject = state.stream;

    await new Promise((res) => {
      DOM.video.onloadedmetadata = () => {
        DOM.video.play();
        res();
      };
    });

    // Start rendering loop
    if (!state.animFrameId) {
      startRenderLoop();
    }
    hideLoading();
  } catch (err) {
    console.error('Camera error:', err);
    showCameraError(err);
  }
}

function showCameraError(err) {
  DOM.loadingScreen.innerHTML = `
    <div class="loading-content">
      <div class="loading-icon">❌</div>
      <h2>Kamera Tidak Tersedia</h2>
      <p style="color: #a0a8c0; margin-top: 8px; max-width: 300px; text-align: center;">
        ${err.name === 'NotAllowedError'
      ? 'Izin kamera ditolak. Silakan izinkan akses kamera di browser Anda dan refresh halaman.'
      : 'Tidak dapat mengakses kamera: ' + err.message}
      </p>
      <button onclick="location.reload()" style="margin-top:20px; padding: 10px 24px; background: linear-gradient(135deg, #8b5cf6, #ec4899); border: none; border-radius: 999px; color: #fff; font-size: 14px; font-weight: 600; cursor: pointer; font-family: inherit;">
        🔄 Coba Lagi
      </button>
    </div>
  `;
}

function hideLoading() {
  DOM.loadingScreen.classList.add('fade-out');
  setTimeout(() => {
    DOM.loadingScreen.classList.add('hidden');
  }, 500);
}

// =====================================================
// RENDER LOOP — Live Preview with Background & Filter
// =====================================================
function startRenderLoop() {
  const video = DOM.video;
  const canvas = DOM.canvasPreview;
  const ctx = canvas.getContext('2d');

  function render() {
    if (video.readyState >= 2) {
      // Match canvas size to video
      const vw = video.videoWidth || 640;
      const vh = video.videoHeight || 480;

      if (canvas.width !== vw || canvas.height !== vh) {
        canvas.width = vw;
        canvas.height = vh;
      }

      ctx.clearRect(0, 0, vw, vh);

      // Apply filter
      ctx.filter = state.currentFilter !== 'none'
        ? FILTERS[state.currentFilter]?.css || 'none'
        : 'none';

      // Draw background
      if (state.bgImage && state.currentBackground !== 'none') {
        ctx.save();
        ctx.drawImage(state.bgImage, 0, 0, vw, vh);
        ctx.restore();
      }

      // Draw video (mirrored)
      ctx.save();
      if (state.isMirrored) {
        ctx.translate(vw, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(video, 0, 0, vw, vh);
      ctx.restore();

      // Draw frame
      drawFrameOnCtx(ctx, vw, vh);
    }

    state.animFrameId = requestAnimationFrame(render);
  }

  render();
}

// =====================================================
// FRAME DRAWING
// =====================================================
function drawFrameOnCtx(ctx, w, h, forCapture = false) {
  const frame = state.currentFrame;

  if (frame === 'none') return;

  if (frame === 'polaroid') {
    // White border with thick bottom
    const bTop = w * 0.04;
    const bSide = w * 0.04;
    const bBot = w * 0.15;

    ctx.fillStyle = '#ffffff';
    // Top
    ctx.fillRect(0, 0, w, bTop);
    // Left
    ctx.fillRect(0, 0, bSide, h);
    // Right
    ctx.fillRect(w - bSide, 0, bSide, h);
    // Bottom
    ctx.fillRect(0, h - bBot, w, bBot);

    if (forCapture) {
      // Write "SnapBooth" text at bottom
      ctx.fillStyle = '#333';
      ctx.font = `${w * 0.05}px Outfit, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('SnapBooth', w / 2, h - bBot / 2 + w * 0.02);
    }
  }

  else if (frame === 'film') {
    const sideW = w * 0.06;
    const holeH = h * 0.04;
    const holeCount = 8;
    const totalGap = h / (holeCount + 1);

    // Black film sides
    ctx.fillStyle = '#111111';
    ctx.fillRect(0, 0, sideW, h);
    ctx.fillRect(w - sideW, 0, sideW, h);

    // White perforations
    ctx.fillStyle = '#cccccc';
    for (let i = 0; i < holeCount; i++) {
      const y = totalGap * (i + 1) - holeH / 2;
      const margin = sideW * 0.15;
      const holeW = sideW * 0.65;
      // Left holes
      ctx.roundRect(margin, y, holeW, holeH, 2);
      ctx.fill();
      // Right holes
      ctx.roundRect(w - sideW + margin, y, holeW, holeH, 2);
      ctx.fill();
    }
  }

  else if (frame === 'news') {
    drawNewsFrame(ctx, w, h);
  }

  else if (frame === 'wanted') {
    drawWantedFrame(ctx, w, h);
  }

  else if (frame === 'magazine') {
    drawMagazineFrame(ctx, w, h);
  }

  else if (frame === 'missing') {
    drawMissingFrame(ctx, w, h);
  }

  else if (frame === 'prisoner') {
    drawPrisonerFrame(ctx, w, h);
  }

  else if (frame === 'newspaper_img') {
    drawNewspaperImgFrame(ctx, w, h);
  }

  else if (frame === 'fashion_news_img') {
    drawFashionNewsImgFrame(ctx, w, h);
  }
}

function drawNewspaperImgFrame(ctx, w, h) {
  const img = document.getElementById('img-frame-news');
  if (img && img.complete && img.naturalHeight > 0) {
    // 1. Gambar frame koran menutupi seluruh canvas
    ctx.drawImage(img, 0, 0, w, h);

    // 2. Gambar ulang video HANYA di area kotak hitam
    // Estimasi posisi kotak hitam berdasarkan rasio gambar:
    const boxX = w * 0.065;
    const boxY = h * 0.525;
    const boxW = w * 0.87;
    const boxH = h * 0.35;

    if (video && video.readyState >= 2) {
      ctx.save();

      // Apply filter for the inner video
      ctx.filter = state.currentFilter !== 'none' ? FILTERS[state.currentFilter]?.css || 'none' : 'none';

      // Hitung cropping (object-fit: cover) agar video tidak gepeng
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
  } else {
    // Fallback jika file frame_news.jpg tidak ada
    ctx.fillStyle = '#f4f1ea';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#000';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Silakan simpan gambar sebagai frame_news.jpg', w / 2, h / 2);
  }
}

function drawFashionNewsImgFrame(ctx, w, h) {
  const img = document.getElementById('img-frame-fashion');
  if (img && img.complete && img.naturalHeight > 0) {
    // 1. Gambar frame menutupi seluruh canvas
    ctx.drawImage(img, 0, 0, w, h);

    // 2. Gambar ulang video HANYA di area kotak hitam
    // PENTING: Anda bisa menyesuaikan angka-angka ini jika kotaknya kurang pas
    // X, Y, W, H adalah presentase dari lebar (w) dan tinggi (h)
    const boxX = w * 0.35;  // Jarak kotak dari kiri (10%)
    const boxY = h * 0.42825;  // Jarak kotak dari atas (20%)
    const boxW = w * 0.30;  // Lebar kotak (80%)
    const boxH = h * 0.30;  // Tinggi kotak (50%)

    const video = document.getElementById('video');
    if (video && video.readyState >= 2) {
      ctx.save();

      // Apply filter for the inner video
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
  } else {
    // Fallback jika file tidak ada
    ctx.fillStyle = '#f4f1ea';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#000';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Gambar frame_fashion_news.png tidak ditemukan', w / 2, h / 2);
  }
}

function drawMissingFrame(ctx, w, h) {
  // Grayscale/faded look
  ctx.save();
  ctx.globalCompositeOperation = 'saturation';
  ctx.fillStyle = 'hsl(0,0%,50%)';
  ctx.fillRect(0, 0, w, h);
  ctx.restore();

  // White border
  const margin = w * 0.05;
  ctx.fillStyle = '#fdf5e6';
  ctx.fillRect(0, 0, w, margin * 2.5); // Top
  ctx.fillRect(0, h - margin * 1.5, w, margin * 1.5); // Bottom
  ctx.fillRect(0, 0, margin, h); // Left
  ctx.fillRect(w - margin, 0, margin, h); // Right

  // MISSING text
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

function drawPrisonerFrame(ctx, w, h) {
  // Height lines on background (optional, simple bars)
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

  // Height text
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.font = `${h * 0.03}px monospace`;
  ctx.textAlign = 'left';
  ctx.fillText("6' 0\"", 5, h * 0.2);
  ctx.fillText("5' 6\"", 5, h * 0.4);
  ctx.fillText("5' 0\"", 5, h * 0.6);
  ctx.restore();

  // Prisoner board
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

function drawNewsFrame(ctx, w, h) {
  // 1. Latar belakang putih
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, w, h);

  // 2. Top Bar
  // Hamburger menu
  ctx.fillStyle = '#000';
  const menuX = w * 0.05;
  const menuY = h * 0.05;
  const menuW = w * 0.08;
  const menuLineH = h * 0.01;
  const menuGap = h * 0.015;
  ctx.fillRect(menuX, menuY, menuW, menuLineH);
  ctx.fillRect(menuX, menuY + menuLineH + menuGap, menuW, menuLineH);
  ctx.fillRect(menuX, menuY + (menuLineH + menuGap) * 2, menuW, menuLineH);

  // "ECONOMIC NEWS"
  ctx.fillStyle = '#000';
  ctx.font = `italic 900 ${h * 0.05}px Arial, sans-serif`;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'top';
  ctx.fillText('ECONOMIC NEWS', w * 0.95, h * 0.06);

  // Red dot
  const textWidth = ctx.measureText('ECONOMIC NEWS').width;
  ctx.beginPath();
  ctx.arc(w * 0.95 - textWidth - (w * 0.03), h * 0.08, h * 0.015, 0, Math.PI * 2);
  ctx.fillStyle = '#b30000';
  ctx.fill();

  // 3. Area Video (Tengah)
  const boxX = w * 0.05;
  const boxY = h * 0.15;
  const boxW = w * 0.9;
  const boxH = h * 0.58;

  const video = document.getElementById('video');
  if (video && video.readyState >= 2) {
    ctx.save();
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
  } else {
    ctx.fillStyle = '#ccc';
    ctx.fillRect(boxX, boxY, boxW, boxH);
  }

  // 4. BREAKING NEWS Red Box (Overlap bawah kiri video)
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

  // 5. Paragraf Teks
  ctx.fillStyle = '#000';
  ctx.font = `normal ${h * 0.035}px Arial, sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  const textY = boxY + boxH + (h * 0.03);
  ctx.fillText('Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed', w * 0.05, textY);
  ctx.fillText('do eiusmod tempor incididunt ut labore et dolore magna', w * 0.05, textY + (h * 0.04));
  ctx.fillText('aliqua. Ut enim ad minim veniam', w * 0.05, textY + (h * 0.08));

  // 6. Footer (Tombol READ MORE dan Web)
  const footerY = h * 0.88;
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

  // Garis abu-abu di atas www
  ctx.beginPath();
  ctx.moveTo(w * 0.05 + readMoreW + 10, footerY);
  ctx.lineTo(w * 0.95, footerY);
  ctx.strokeStyle = '#999';
  ctx.lineWidth = 1;
  ctx.stroke();
}

function drawWantedFrame(ctx, w, h) {
  // Sepia/old paper overlay (multiply)
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = '#dcb084';
  ctx.fillRect(0, 0, w, h);
  ctx.restore();

  // Border
  ctx.strokeStyle = '#3b2a1a';
  ctx.lineWidth = w * 0.02;
  ctx.strokeRect(w * 0.05, h * 0.05, w * 0.9, h * 0.9);
  ctx.lineWidth = w * 0.005;
  ctx.strokeRect(w * 0.07, h * 0.07, w * 0.86, h * 0.86);

  // Wanted Text
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

function drawMagazineFrame(ctx, w, h) {
  // Magazine Title
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.font = `900 ${h * 0.25}px "Times New Roman", serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 5;
  ctx.fillText('VOGUE', w / 2, -h * 0.02);
  ctx.shadowColor = 'transparent';

  // Subheadlines
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

  // Barcode
  ctx.fillStyle = '#fff';
  ctx.fillRect(w * 0.8, h * 0.85, w * 0.15, h * 0.1);
  ctx.fillStyle = '#000';
  for (let i = 0; i < 15; i++) {
    const bw = Math.random() * w * 0.01 + w * 0.002;
    const bx = w * 0.81 + i * (w * 0.009);
    ctx.fillRect(bx, h * 0.86, bw, h * 0.07);
  }
}

function drawPatternBorder(ctx, w, h, color, emoji, size, forCapture) {
  const borderW = Math.floor(w * 0.08);
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, w, borderW);
  ctx.fillRect(0, h - borderW, w, borderW);
  ctx.fillRect(0, 0, borderW, h);
  ctx.fillRect(w - borderW, 0, borderW, h);

  if (!forCapture) return;
  // Draw emojis
  ctx.font = `${size}px serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const step = size * 2;
  for (let x = step / 2; x < w; x += step) {
    ctx.fillText(emoji, x, borderW / 2);
    ctx.fillText(emoji, x, h - borderW / 2);
  }
  for (let y = step / 2 + borderW; y < h - borderW; y += step) {
    ctx.fillText(emoji, borderW / 2, y);
    ctx.fillText(emoji, w - borderW / 2, y);
  }
}

function drawGlitterBorder(ctx, w, h) {
  const borderW = Math.floor(w * 0.07);
  const gradient = ctx.createLinearGradient(0, 0, w, h);
  gradient.addColorStop(0, '#a855f7');
  gradient.addColorStop(0.33, '#ec4899');
  gradient.addColorStop(0.66, '#f59e0b');
  gradient.addColorStop(1, '#a855f7');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, borderW);
  ctx.fillRect(0, h - borderW, w, borderW);
  ctx.fillRect(0, 0, borderW, h);
  ctx.fillRect(w - borderW, 0, borderW, h);

  // Glitter sparkles
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  for (let i = 0; i < 60; i++) {
    const r = Math.random();
    let x, y;
    if (r < 0.25) {
      x = Math.random() * w; y = Math.random() * borderW;
    } else if (r < 0.5) {
      x = Math.random() * w; y = h - Math.random() * borderW;
    } else if (r < 0.75) {
      x = Math.random() * borderW; y = Math.random() * h;
    } else {
      x = w - Math.random() * borderW; y = Math.random() * h;
    }
    ctx.beginPath();
    ctx.arc(x, y, Math.random() * 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

// =====================================================
// CAPTURE PHOTO
// =====================================================
async function capturePhoto() {
  if (state.isCapturing) return;
  state.isCapturing = true;
  DOM.btnCapture.disabled = true;

  const seconds = state.timerSeconds;

  if (seconds > 0) {
    await runCountdown(seconds);
  }

  // Flash effect
  triggerShutterFlash();

  // Wait for flash
  await sleep(150);

  // Snapshot to canvas
  const snapshot = takeSnapshot();
  if (!snapshot) {
    state.isCapturing = false;
    DOM.btnCapture.disabled = false;
    return;
  }

  // Save to gallery
  const photo = {
    id: Date.now(),
    dataUrl: snapshot,
    bg: state.currentBackground,
    filter: state.currentFilter,
    frame: state.currentFrame,
    timestamp: new Date().toLocaleString('id-ID'),
  };

  state.photos.push(photo);
  addPhotoToGallery(photo);
  updateGalleryButtons();

  await sleep(300);
  state.isCapturing = false;
  DOM.btnCapture.disabled = false;
}

function takeSnapshot() {
  const video = DOM.video;
  if (!video || video.readyState < 2) return null;

  // Gunakan canvas baru di memori untuk menghindari bug filter pada display:none
  const canvas = document.createElement('canvas');
  const w = video.videoWidth || 640;
  const h = video.videoHeight || 480;

  canvas.width = w;
  canvas.height = h;

  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, w, h);

  // Apply filter
  ctx.filter = state.currentFilter !== 'none'
    ? FILTERS[state.currentFilter]?.css || 'none'
    : 'none';

  // Draw background
  if (state.bgImage && state.currentBackground !== 'none') {
    ctx.drawImage(state.bgImage, 0, 0, w, h);
  }

  // Draw video (mirrored)
  ctx.save();
  if (state.isMirrored) {
    ctx.translate(w, 0);
    ctx.scale(-1, 1);
  }
  ctx.drawImage(video, 0, 0, w, h);
  ctx.restore();

  ctx.filter = 'none';

  // Draw frame on top
  drawFrameOnCtx(ctx, w, h, true);

  return canvas.toDataURL('image/png');
}

async function runCountdown(seconds) {
  DOM.countdownOverlay.classList.remove('hidden');

  for (let i = seconds; i >= 1; i--) {
    DOM.countdownNum.textContent = i;
    // Re-trigger animation
    DOM.countdownNum.style.animation = 'none';
    DOM.countdownNum.offsetHeight; // reflow
    DOM.countdownNum.style.animation = '';
    await sleep(1000);
  }

  DOM.countdownOverlay.classList.add('hidden');
}

function triggerShutterFlash() {
  const flash = DOM.shutterFlash;
  flash.classList.remove('hidden');
  flash.style.animation = 'none';
  flash.offsetHeight;
  flash.style.animation = '';
  setTimeout(() => flash.classList.add('hidden'), 400);
}

// =====================================================
// GALLERY
// =====================================================
function addPhotoToGallery(photo) {
  // Remove empty state
  if (DOM.galleryEmpty) {
    DOM.galleryEmpty.style.display = 'none';
  }

  const card = document.createElement('div');
  card.className = 'gallery-card';
  card.dataset.id = photo.id;

  card.innerHTML = `
    <div class="gallery-card-check">✓</div>
    <img src="${photo.dataUrl}" alt="Foto ${photo.timestamp}" />
    <div class="gallery-card-actions">
      <button class="gc-print" title="Cetak foto ini">🖨️ Cetak</button>
      <button class="gc-download" title="Download foto ini">💾 Simpan</button>
      <button class="gc-delete" title="Hapus foto ini">🗑️</button>
    </div>
  `;

  // Click to select
  card.addEventListener('click', (e) => {
    if (e.target.tagName === 'BUTTON') return;
    card.classList.toggle('selected');
    const id = parseInt(card.dataset.id);
    if (card.classList.contains('selected')) {
      state.selectedPhotoIds.push(id);
    } else {
      state.selectedPhotoIds = state.selectedPhotoIds.filter(x => x !== id);
    }
    updateGalleryButtons();
  });

  // Print single
  card.querySelector('.gc-print').addEventListener('click', () => {
    state.printTargetId = photo.id;
    openPrintModal([photo]);
  });

  // Download single
  card.querySelector('.gc-download').addEventListener('click', () => {
    downloadPhoto(photo.dataUrl, `snapbooth_${photo.id}.png`);
  });

  // Delete
  card.querySelector('.gc-delete').addEventListener('click', () => {
    state.photos = state.photos.filter(p => p.id !== photo.id);
    state.selectedPhotoIds = state.selectedPhotoIds.filter(x => x !== photo.id);
    card.style.animation = 'none';
    card.style.transition = 'all 0.3s ease';
    card.style.opacity = '0';
    card.style.transform = 'scale(0.8)';
    setTimeout(() => {
      card.remove();
      if (state.photos.length === 0 && DOM.galleryEmpty) {
        DOM.galleryEmpty.style.display = '';
      }
      updateGalleryButtons();
    }, 300);
  });

  DOM.galleryGrid.appendChild(card);
}

function updateGalleryButtons() {
  const hasPhotos = state.photos.length > 0;
  DOM.btnPrintAll.disabled = !hasPhotos;
  DOM.btnClearGallery.disabled = !hasPhotos;
}

// =====================================================
// BACKGROUND SELECTION
// =====================================================
function selectBackground(bgValue) {
  state.currentBackground = bgValue;
  state.bgImage = null;

  if (bgValue !== 'none') {
    const img = new Image();
    img.onload = () => { state.bgImage = img; };
    img.onerror = () => {
      console.warn('Failed to load background:', bgValue);
      state.bgImage = null;
    };
    img.src = bgValue;
  }

  // Update UI active state
  $$('.bg-item').forEach(btn => btn.classList.remove('active'));
  const target = document.querySelector(`[data-bg="${bgValue}"]`);
  if (target) target.classList.add('active');
}

// =====================================================
// FILTER SELECTION
// =====================================================
function selectFilter(filterKey) {
  state.currentFilter = filterKey;

  // Update filter badge
  DOM.filterIndicator.textContent = FILTERS[filterKey]?.label || 'Normal';

  // Update UI
  $$('.filter-item').forEach(btn => btn.classList.remove('active'));
  const target = document.querySelector(`[data-filter="${filterKey}"]`);
  if (target) target.classList.add('active');
}

// =====================================================
// FRAME SELECTION
// =====================================================
function selectFrame(frameKey) {
  state.currentFrame = frameKey;

  $$('.frame-item').forEach(btn => btn.classList.remove('active'));
  const target = document.querySelector(`[data-frame="${frameKey}"]`);
  if (target) target.classList.add('active');
}

// =====================================================
// TABS
// =====================================================
function switchTab(tabId) {
  DOM.tabBtns.forEach(btn => btn.classList.remove('active'));
  DOM.tabContents.forEach(content => content.classList.remove('active'));

  const btn = document.querySelector(`[data-tab="${tabId}"]`);
  const content = document.getElementById(tabId);

  if (btn) btn.classList.add('active');
  if (content) content.classList.add('active');
}

// =====================================================
// PRINT / DOWNLOAD
// =====================================================
function openPrintModal(photosToUse) {
  state._printPhotos = photosToUse;
  DOM.printModal.classList.remove('hidden');
}

function closePrintModal() {
  DOM.printModal.classList.add('hidden');
  state._printPhotos = null;
  state.printTargetId = null;
}

function buildPrintArea(photos, layout) {
  const area = DOM.printArea;
  area.innerHTML = '';

  const container = document.createElement('div');
  container.className = 'print-container';

  // Header
  const header = document.createElement('div');
  header.className = 'print-header';
  header.innerHTML = `<h1>📸 SnapBooth</h1><p>Dicetak pada: ${new Date().toLocaleString('id-ID')}</p>`;
  container.appendChild(header);

  const photoWrap = document.createElement('div');
  photoWrap.className = `print-layout-${layout}`;

  const photosToRender = layout === 1 ? photos.slice(0, 1)
    : layout === 2 ? photos.slice(0, 2)
      : photos.slice(0, 4);

  // Pad if not enough photos
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
}

function printPhotos(photos, layout) {
  buildPrintArea(photos, layout);
  window.print();
}

function downloadPhoto(dataUrl, filename) {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  a.click();
}

function downloadAllAsZip(photos) {
  // Simple: download each separately
  photos.forEach((photo, i) => {
    setTimeout(() => {
      downloadPhoto(photo.dataUrl, `snapbooth_${i + 1}_${photo.id}.png`);
    }, i * 300);
  });
}

// =====================================================
// RESET SESSION
// =====================================================
function resetSession() {
  if (!confirm('Hapus semua foto dan reset sesi? Semua foto akan hilang.')) return;

  state.photos = [];
  state.selectedPhotoIds = [];

  // Reset photo settings
  selectBackground('none');
  selectFilter('none');
  selectFrame('none');
  state.timerSeconds = 0;

  // Reset timer buttons
  DOM.timerBtns.forEach(btn => btn.classList.remove('active'));
  document.getElementById('timer-0')?.classList.add('active');

  // Clear gallery
  DOM.galleryGrid.innerHTML = '';
  DOM.galleryGrid.appendChild(DOM.galleryEmpty);
  DOM.galleryEmpty.style.display = '';

  updateGalleryButtons();
}

// =====================================================
// UTILITIES
// =====================================================
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// =====================================================
// EVENT LISTENERS
// =====================================================
function bindEvents() {

  // --- Capture ---
  DOM.btnCapture.addEventListener('click', capturePhoto);

  // --- Flip Camera (mirror toggle) ---
  DOM.btnFlip.addEventListener('click', () => {
    state.isMirrored = !state.isMirrored;
    DOM.video.style.transform = state.isMirrored ? 'scaleX(-1)' : 'scaleX(1)';
    DOM.btnFlip.style.color = state.isMirrored
      ? 'var(--accent-primary)'
      : 'var(--text-secondary)';
  });

  // --- Switch Camera ---
  if (DOM.btnSwitchCam) {
    DOM.btnSwitchCam.addEventListener('click', async () => {
      // Tampilkan indikator loading kamera saat switch
      DOM.loadingScreen.classList.remove('hidden');
      DOM.loadingScreen.classList.remove('fade-out');
      
      state.cameraFacing = state.cameraFacing === 'user' ? 'environment' : 'user';
      // Default ke mirror jika pakai kamera depan, tidak mirror jika kamera belakang
      state.isMirrored = (state.cameraFacing === 'user');
      DOM.video.style.transform = state.isMirrored ? 'scaleX(-1)' : 'scaleX(1)';
      DOM.btnFlip.style.color = state.isMirrored ? 'var(--accent-primary)' : 'var(--text-secondary)';
      
      await initCamera();
    });
  }

  // --- Reset ---
  DOM.btnReset.addEventListener('click', resetSession);

  // --- Timer buttons ---
  DOM.timerBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      state.timerSeconds = parseInt(btn.dataset.timer);
      DOM.timerBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // --- Tab switching ---
  DOM.tabBtns.forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // --- Background grid ---
  DOM.bgGrid.addEventListener('click', (e) => {
    const item = e.target.closest('.bg-item');
    if (!item) return;

    if (item.id === 'bg-upload-btn') {
      DOM.bgUploadInput.click();
      return;
    }

    const bgVal = item.dataset.bg;
    if (bgVal !== undefined) selectBackground(bgVal);
  });

  // --- Background upload ---
  DOM.bgUploadInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target.result;

      // Check if upload item already exists
      let uploadItem = document.getElementById('bg-custom-uploaded');
      if (!uploadItem) {
        uploadItem = document.createElement('button');
        uploadItem.className = 'bg-item';
        uploadItem.id = 'bg-custom-uploaded';
        uploadItem.innerHTML = `
          <div class="bg-thumb" style="background-image: url('${dataUrl}')"></div>
          <span>Custom</span>
        `;
        // Insert before upload btn
        DOM.bgGrid.insertBefore(uploadItem, DOM.bgUploadBtn);
      } else {
        uploadItem.querySelector('.bg-thumb').style.backgroundImage = `url('${dataUrl}')`;
      }

      uploadItem.dataset.bg = dataUrl;
      selectBackground(dataUrl);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  });

  // --- Filter grid ---
  DOM.filterGrid.addEventListener('click', (e) => {
    const item = e.target.closest('.filter-item');
    if (!item) return;
    selectFilter(item.dataset.filter);
  });

  // --- Frame grid ---
  DOM.frameGrid.addEventListener('click', (e) => {
    const item = e.target.closest('.frame-item');
    if (!item) return;
    selectFrame(item.dataset.frame);
  });

  // --- Print All ---
  DOM.btnPrintAll.addEventListener('click', () => {
    if (state.photos.length === 0) return;

    // Use selected photos, or all if none selected
    const toUse = state.selectedPhotoIds.length > 0
      ? state.photos.filter(p => state.selectedPhotoIds.includes(p.id))
      : state.photos;

    openPrintModal(toUse);
  });

  // --- Clear Gallery ---
  DOM.btnClearGallery.addEventListener('click', () => {
    if (!confirm('Hapus semua foto di galeri?')) return;
    state.photos = [];
    state.selectedPhotoIds = [];

    // Remove all cards
    $$('.gallery-card').forEach(c => c.remove());
    DOM.galleryEmpty.style.display = '';
    updateGalleryButtons();
  });

  // --- Print Layout selection ---
  DOM.printLayoutBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      state.printLayout = parseInt(btn.dataset.layout);
      DOM.printLayoutBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // --- Do Print ---
  DOM.btnDoPrint.addEventListener('click', () => {
    const photos = state._printPhotos || state.photos;
    printPhotos(photos, state.printLayout);
  });

  // --- Do Download ---
  DOM.btnDoDownload.addEventListener('click', () => {
    const photos = state._printPhotos || state.photos;
    if (photos.length === 1) {
      downloadPhoto(photos[0].dataUrl, `snapbooth_${photos[0].id}.png`);
    } else {
      downloadAllAsZip(photos);
    }
    closePrintModal();
  });

  // --- Close Modal ---
  DOM.modalClose.addEventListener('click', closePrintModal);
  DOM.modalBackdrop.addEventListener('click', closePrintModal);

  // --- Keyboard shortcuts ---
  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && e.target === document.body) {
      e.preventDefault();
      capturePhoto();
    }
    if (e.code === 'Escape') closePrintModal();
  });
}

// =====================================================
// INIT
// =====================================================
async function init() {
  // Bind events first
  bindEvents();

  // Start camera (this will hide loading screen when done)
  await initCamera();
}

// Boot when DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
