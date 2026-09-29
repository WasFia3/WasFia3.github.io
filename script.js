const canvas = document.getElementById('animeCanvas');
const ctx = canvas.getContext('2d');
const learnBtn = document.querySelector('.btn-learn-more');

const totalFrames = 22; 
const images = [];

const totalAngryFrames = 3;
const angryImages = [];

const totalDizzyFrames = 3;
const dizzyImages = [];

let framesLoaded = 0;

// سرعات الفريمات
const blinkFps = 12;
const smileFps = 8;
const angryFps = 10;
const dizzyFps = 12;

// idle: 0 = eyes open, 2 = half closed, 3 = closed, 4 = half, 5 = open again.
// Rest with eyes open for ~3s (36 frames at blinkFps = 12), then one natural blink.
const blinkFrames = [...Array(36).fill(0), 1, 2, 3, 4, 5];
const smileIntroFrames = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];
const smileLoopFrames = [18, 19, 20, 21];
// angry: 0 = eyes open, 1 = half closed, 2 = closed.
// Hold the glare for ~1.5s, then one quick blink (at angryFps = 10).
const angryFrames = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 1];

let animationId = null;
let isHovered = false;
let isDragging = false; 

// متغيرات السحب
let dragOffsetX = 0;
let dragOffsetY = 0;
let originalPosition = null;

// متغيرات كشف الهز والمؤقت للعودة للغضب
let lastMouseX = 0;
let lastMouseY = 0;
let lastDirX = 0;
let lastDirY = 0;
let shakeCount = 0;
let lastShakeTime = 0;
let dizzyResetTimeout = null; // 🔥 مؤقت العودة من الدوخة للغضب

let currentFrameIndex = 0;
let currentState = 'blink';
let currentStep = 0;
let lastFrameTime = 0;
let unsmileFrames = [];

// تحميل الصور الأساسية (22)
for (let i = 1; i <= totalFrames; i++) {
  const img = new Image();
  const frameNumber = i.toString().padStart(2, '0');
  img.src = `images/frame${frameNumber}.png`; 
  img.onload = checkAllLoaded;
  images.push(img);
}

// تحميل صور الغضب (3)
for (let i = 1; i <= totalAngryFrames; i++) {
  const img = new Image();
  const frameNumber = i.toString().padStart(2, '0');
  img.src = `angry/frame${frameNumber}.png`; 
  img.onload = checkAllLoaded;
  angryImages.push(img);
}

// تحميل صور الدوخة (3)
for (let i = 1; i <= totalDizzyFrames; i++) {
  const img = new Image();
  const frameNumber = i.toString().padStart(2, '0');
  img.src = `dizzy/frame${frameNumber}.png`; 
  img.onload = checkAllLoaded;
  dizzyImages.push(img);
}

function checkAllLoaded() {
  framesLoaded++;
  if (framesLoaded === (totalFrames + totalAngryFrames + totalDizzyFrames)) {
    canvas.width = images[0].naturalWidth;
    canvas.height = images[0].naturalHeight;
    
    drawFrame(images[0]);
    setupEvents();
    startAnimationLoop();
  }
}

function drawFrame(imgSource) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (imgSource && imgSource.complete) {
    ctx.drawImage(imgSource, 0, 0, canvas.width, canvas.height);
  }
}

function animate(timestamp) {
  if (!lastFrameTime) lastFrameTime = timestamp;

  let targetFps = blinkFps;
  if (currentState === 'smileIntro' || currentState === 'smileLoop') targetFps = smileFps;
  if (currentState === 'angry') targetFps = angryFps;
  if (currentState === 'dizzy') targetFps = dizzyFps;

  const frameInterval = 1000 / targetFps;
  const elapsed = timestamp - lastFrameTime;

  if (elapsed >= frameInterval) {
    lastFrameTime = timestamp - (elapsed % frameInterval);

    if (currentState === 'dizzy') {
      drawFrame(dizzyImages[currentStep]);
      currentStep = (currentStep + 1) % dizzyImages.length;

    } else if (currentState === 'angry') {
      drawFrame(angryImages[angryFrames[currentStep]]);
      currentStep = (currentStep + 1) % angryFrames.length;

    } else if (currentState === 'blink') {
      currentFrameIndex = blinkFrames[currentStep];
      drawFrame(images[currentFrameIndex]);
      currentStep = (currentStep + 1) % blinkFrames.length;

    } else if (currentState === 'smileIntro') {
      currentFrameIndex = smileIntroFrames[currentStep];
      drawFrame(images[currentFrameIndex]);
      currentStep++;
      if (currentStep >= smileIntroFrames.length) {
        currentState = 'smileLoop';
        currentStep = 0;
      }

    } else if (currentState === 'smileLoop') {
      currentFrameIndex = smileLoopFrames[currentStep];
      drawFrame(images[currentFrameIndex]);
      currentStep = (currentStep + 1) % smileLoopFrames.length;

    } else if (currentState === 'reverse') {
      currentFrameIndex = unsmileFrames[currentStep];
      drawFrame(images[currentFrameIndex]);
      currentStep++;
      if (currentStep >= unsmileFrames.length) {
        currentState = 'blink';
        currentStep = 0;
      }
    }
  }

  animationId = requestAnimationFrame(animate);
}

function startAnimationLoop() {
  if (!animationId) {
    lastFrameTime = 0;
    animationId = requestAnimationFrame(animate);
  }
}

function triggerReverse() {
  unsmileFrames = [];
  for (let i = currentFrameIndex; i >= 0; i--) {
    unsmileFrames.push(i);
  }
  currentState = 'reverse';
  currentStep = 0;
  lastFrameTime = 0;
}

function setupEvents() {
  // 1. Hover
  canvas.addEventListener('mouseenter', () => {
    if (!isDragging) {
      isHovered = true;
      currentState = 'smileIntro';
      currentStep = 0;
      lastFrameTime = 0;
    }
  });

  canvas.addEventListener('mouseleave', () => {
    if (!isDragging) {
      isHovered = false;
      triggerReverse();
    }
  });

  // 2. بداية السحب (MouseDown)
  canvas.addEventListener('mousedown', (e) => {
    isDragging = true;
    currentState = 'angry';
    currentStep = 0;
    lastFrameTime = 0;

    shakeCount = 0;
    lastDirX = 0;
    lastDirY = 0;
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;

    const rect = canvas.getBoundingClientRect();
    
    if (!originalPosition) {
      originalPosition = {
        left: rect.left,
        top: rect.top
      };
    }

    dragOffsetX = e.clientX - rect.left;
    dragOffsetY = e.clientY - rect.top;

    canvas.style.transition = 'none';
    canvas.style.position = 'fixed';
    canvas.style.left = `${rect.left}px`;
    canvas.style.top = `${rect.top}px`;
    canvas.style.zIndex = '1000';
  });

  // أثناء السحب
  window.addEventListener('mousemove', (e) => {
    if (isDragging) {
      canvas.style.left = `${e.clientX - dragOffsetX}px`;
      canvas.style.top = `${e.clientY - dragOffsetY}px`;

      const now = Date.now();
      const dx = e.clientX - lastMouseX;
      const dy = e.clientY - lastMouseY;

      const currentDirX = Math.sign(dx);
      const currentDirY = Math.sign(dy);

      // كشف تغير الاتجاه السريع (Shake Detection)
      if ((currentDirX !== 0 && currentDirX !== lastDirX && Math.abs(dx) > 6) ||
          (currentDirY !== 0 && currentDirY !== lastDirY && Math.abs(dy) > 6)) {
        
        if (now - lastShakeTime < 250) { 
          shakeCount++;
        } else {
          shakeCount = 1;
        }

        lastShakeTime = now;
        if (currentDirX !== 0) lastDirX = currentDirX;
        if (currentDirY !== 0) lastDirY = currentDirY;

        // التحول لحالة الدوخة عند 4 هزات
        if (shakeCount >= 4) {
          if (currentState !== 'dizzy') {
            currentState = 'dizzy';
            currentStep = 0;
            lastFrameTime = 0;
          }

          // 🔥 تمديد مؤقت الدوخة عند استمرار الهز
          clearTimeout(dizzyResetTimeout);
          dizzyResetTimeout = setTimeout(() => {
            // إذا توقف عن الهز ولكنه ما زال يجرّ الكاركتر، ارجع لحالة الغضب
            if (isDragging) {
              currentState = 'angry';
              currentStep = 0;
              lastFrameTime = 0;
              shakeCount = 0;
            }
          }, 600); // 600 ملي ثانية من التوقف عن الهز كافية لإرجاعها غاضبة
        }
      }

      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
    }
  });

  // ترك الماوس (MouseUp)
  window.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      shakeCount = 0;
      clearTimeout(dizzyResetTimeout); // إيقاف المؤقت

      canvas.style.transition = 'left 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.27), top 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.27)';
      
      if (originalPosition) {
        canvas.style.left = `${originalPosition.left}px`;
        canvas.style.top = `${originalPosition.top}px`;
      }

      setTimeout(() => {
        canvas.style.transition = 'none';
        canvas.style.position = '';
        canvas.style.left = '';
        canvas.style.top = '';
        canvas.style.zIndex = '';
      }, 400);

      if (isHovered) {
        currentState = 'smileLoop';
        currentStep = 0;
      } else {
        triggerReverse();
      }
    }
  });

  // 3. الزر الجانبي
  if (learnBtn) {
    learnBtn.addEventListener('mouseenter', () => {
      if (!isDragging) {
        isHovered = true;
        currentState = 'smileIntro';
        currentStep = 0;
        lastFrameTime = 0;
      }
    });

    learnBtn.addEventListener('mouseleave', () => {
      if (!isDragging) {
        isHovered = false;
        triggerReverse();
      }
    });
  }
}