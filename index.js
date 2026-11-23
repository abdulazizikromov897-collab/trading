/**
 * PROPER TRADING ACADEMY - SCRIPT.JS
 * To'liq interaktivlik: Tun/Kun rejimi, 3D tilt, Canvas animatsiyalar,
 * Google Auth modali, OTP kod kiritish, Video pleer va Talaba kabineti.
 */

// ==========================================
// 1. SOUND EFFECTS (Web Audio API Synthesizer)
// ==========================================
let soundEnabled = true;
const audioCtx = (typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined')
  ? new (window.AudioContext || window.webkitAudioContext)()
  : null;

function playSound(type) {
  if (!soundEnabled || !audioCtx) return;
  try {
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    const now = audioCtx.currentTime;

    if (type === 'click') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(480, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.08);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (type === 'theme') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(640, now + 0.15);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === 'success') {
      // Fanfare chord
      [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
        const chordOsc = audioCtx.createOscillator();
        const chordGain = audioCtx.createGain();
        chordOsc.type = 'sine';
        chordOsc.frequency.setValueAtTime(freq, now + i * 0.07);
        chordGain.gain.setValueAtTime(0.15, now + i * 0.07);
        chordGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5 + i * 0.07);
        chordOsc.connect(chordGain);
        chordGain.connect(audioCtx.destination);
        chordOsc.start(now + i * 0.07);
        chordOsc.stop(now + 0.6 + i * 0.07);
      });
    } else if (type === 'code') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(700, now);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
    }
  } catch (e) {
    console.warn('Audio not allowed yet:', e);
  }
}

// Sound toggle button
const soundToggleBtn = document.getElementById('sound-toggle');
if (soundToggleBtn) {
  soundToggleBtn.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    soundToggleBtn.innerHTML = soundEnabled 
      ? '<i class="fa-solid fa-volume-high"></i>' 
      : '<i class="fa-solid fa-volume-xmark"></i>';
    showToast(soundEnabled ? 'Ovoz effektlari yoqildi' : 'Ovoz effektlari o\'chirildi');
  });
}

// ==========================================
// 2. TUN VA KUN REJIMI (DARK / LIGHT MODE)
// ==========================================
const themeToggleBtn = document.getElementById('theme-toggle');
const htmlEl = document.documentElement;
const bodyEl = document.body;

function setTheme(theme) {
  if (theme === 'light') {
    htmlEl.setAttribute('data-theme', 'light');
    bodyEl.classList.remove('dark-theme');
    bodyEl.classList.add('light-theme');
    localStorage.setItem('proper_theme', 'light');
  } else {
    htmlEl.setAttribute('data-theme', 'dark');
    bodyEl.classList.remove('light-theme');
    bodyEl.classList.add('dark-theme');
    localStorage.setItem('proper_theme', 'dark');
  }
}

// Initial theme check
const savedTheme = localStorage.getItem('proper_theme') || 'dark';
setTheme(savedTheme);

if (themeToggleBtn) {
  themeToggleBtn.addEventListener('click', () => {
    playSound('theme');
    const currentTheme = htmlEl.getAttribute('data-theme') || 'dark';
    const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    showToast(nextTheme === 'light' ? 'Kunduzgi rejim yoqildi ☀️' : 'Tungi rejim yoqildi 🌙');
  });
}

// ==========================================
// 3. CANVAS ANIMATED BACKGROUND (PARTICLES & NODES)
// ==========================================
const bgCanvas = document.getElementById('bg-canvas');
let bgCtx = null;
let particles = [];
let animFrameId = null;

if (bgCanvas) {
  bgCtx = bgCanvas.getContext('2d');

  function resizeCanvas() {
    bgCanvas.width = window.innerWidth;
    bgCanvas.height = window.innerHeight;
    initParticles();
  }

  function initParticles() {
    particles = [];
    const count = Math.floor((bgCanvas.width * bgCanvas.height) / 16000);
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * bgCanvas.width,
        y: Math.random() * bgCanvas.height,
        vx: (Math.random() - 0.5) * 0.7,
        vy: (Math.random() - 0.5) * 0.7,
        size: Math.random() * 2.5 + 1,
        color: Math.random() > 0.5 ? '#00f2fe' : '#4facfe',
        alpha: Math.random() * 0.6 + 0.2
      });
    }
  }

  function drawParticles() {
    if (!bgCtx) return;
    bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);

    const isLight = htmlEl.getAttribute('data-theme') === 'light';

    // Draw connecting lines
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 120) {
          bgCtx.beginPath();
          const lineAlpha = (1 - dist / 120) * (isLight ? 0.12 : 0.2);
          bgCtx.strokeStyle = isLight 
            ? `rgba(0, 114, 255, ${lineAlpha})`
            : `rgba(0, 242, 254, ${lineAlpha})`;
          bgCtx.lineWidth = 1;
          bgCtx.moveTo(particles[i].x, particles[i].y);
          bgCtx.lineTo(particles[j].x, particles[j].y);
          bgCtx.stroke();
        }
      }
    }

    // Draw particles
    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0) p.x = bgCanvas.width;
      if (p.x > bgCanvas.width) p.x = 0;
      if (p.y < 0) p.y = bgCanvas.height;
      if (p.y > bgCanvas.height) p.y = 0;

      bgCtx.beginPath();
      bgCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      bgCtx.fillStyle = isLight ? `rgba(0, 114, 255, ${p.alpha * 0.7})` : `rgba(0, 242, 254, ${p.alpha})`;
      bgCtx.fill();
    }

    animFrameId = requestAnimationFrame(drawParticles);
  }

  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();
  drawParticles();
}

// ==========================================
// 4. HERO TYPEWRITER ANIMATION
// ==========================================
const typewriterText = document.getElementById('typewriter-text');
const phrases = [
  'MOLIYAVIY ERKINLIKKA ERISHING!',
  '$10,000 - $200,000 FUNDED HISOB OLING!',
  'SMART MONEY CONCEPTS O\'RGANING!',
  'PROPER RISK-REWARD 1:3 BILAN SAVDO QILING!'
];
let phraseIndex = 0;
let charIndex = 0;
let isDeleting = false;

function typeLoop() {
  if (!typewriterText) return;
  const currentPhrase = phrases[phraseIndex];
  
  if (isDeleting) {
    typewriterText.textContent = currentPhrase.substring(0, charIndex - 1);
    charIndex--;
  } else {
    typewriterText.textContent = currentPhrase.substring(0, charIndex + 1);
    charIndex++;
  }

  let typeSpeed = isDeleting ? 40 : 80;

  if (!isDeleting && charIndex === currentPhrase.length) {
    typeSpeed = 1800; // Pause at end of phrase
    isDeleting = true;
  } else if (isDeleting && charIndex === 0) {
    isDeleting = false;
    phraseIndex = (phraseIndex + 1) % phrases.length;
    typeSpeed = 400;
  }

  setTimeout(typeLoop, typeSpeed);
}
typeLoop();

// ==========================================
// 5. 3D TILT EFFECT ON VISUAL CARD
// ==========================================
const tiltCard = document.getElementById('tilt-card');
if (tiltCard) {
  tiltCard.addEventListener('mousemove', (e) => {
    const rect = tiltCard.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = ((y - centerY) / centerY) * -12;
    const rotateY = ((x - centerX) / centerX) * 12;

    tiltCard.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
  });

  tiltCard.addEventListener('mouseleave', () => {
    tiltCard.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
  });
}

// ==========================================
// 6. ANIMATED NUMBERS COUNTER
// ==========================================
const statNumbers = document.querySelectorAll('.stat-number');
let statsAnimated = false;

function animateStats() {
  if (statsAnimated) return;
  statNumbers.forEach(stat => {
    const target = parseFloat(stat.getAttribute('data-target'));
    const isDecimal = target % 1 !== 0;
    const duration = 2000;
    const start = 0;
    const startTime = performance.now();

    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOutQuad = 1 - (1 - progress) * (1 - progress);
      const currentVal = start + (target - start) * easeOutQuad;

      stat.textContent = isDecimal ? currentVal.toFixed(1) : Math.floor(currentVal);

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        stat.textContent = target;
      }
    }

    requestAnimationFrame(update);
  });
  statsAnimated = true;
}
window.addEventListener('scroll', () => {
  const statsRow = document.querySelector('.hero-stats-row');
  if (statsRow) {
    const rect = statsRow.getBoundingClientRect();
    if (rect.top <= window.innerHeight && rect.bottom >= 0) {
      animateStats();
    }
  }
});
animateStats(); // Run once initially

// ==========================================
// 7. GOOGLE AUTH MODAL & SIMULATION
// ==========================================
const googleModal = document.getElementById('google-modal');

function triggerGoogleAuth() {
  playSound('click');
  if (googleModal) {
    googleModal.classList.add('open');
  }
}

function closeGoogleModal() {
  playSound('click');
  if (googleModal) {
    googleModal.classList.remove('open');
  }
}

function confirmGoogleAccount() {
  playSound('success');
  closeGoogleModal();
  
  // Set values to inputs
  const nameInput = document.getElementById('full-name');
  const emailInput = document.getElementById('email-address');

  if (nameInput) nameInput.value = 'ABDULAZIZ IKROMOV';
  if (emailInput) emailInput.value = 'abdulazizikromov897@gmail.com';

  showToast('Google orqali muvaffaqiyatli ulandi: abdulazizikromov897@gmail.com');

  // Trigger code send automatically for smoothness
  sendVerificationCode();
}

// ==========================================
// 8. OTP VERIFICATION CODE (6-DIGIT BOXES)
// ==========================================
const otpDigits = document.querySelectorAll('.otp-digit');
const demoCode = '784291';
let otpTimer = null;

function sendVerificationCode() {
  playSound('click');
  const reqBtn = document.getElementById('btn-request-code');
  const statusLabel = document.getElementById('otp-status-label');

  if (reqBtn) reqBtn.disabled = true;

  let seconds = 60;
  showToast(`Kod yuborildi! abdulazizikromov897@gmail.com pochta qutisini tekshiring.`);

  if (statusLabel) {
    statusLabel.innerHTML = `<span style="color:var(--accent-green);"><i class="fa-solid fa-circle-check"></i> Kod yuborildi (${demoCode})</span>`;
  }

  // Auto-fill demo code for effortless user experience
  setTimeout(() => {
    otpDigits.forEach((input, index) => {
      setTimeout(() => {
        input.value = demoCode[index];
        playSound('code');
        input.classList.add('filled');
      }, index * 120);
    });
  }, 600);

  if (otpTimer) clearInterval(otpTimer);
  otpTimer = setInterval(() => {
    seconds--;
    if (reqBtn) reqBtn.textContent = `Qayta yuborish (${seconds}s)`;
    if (seconds <= 0) {
      clearInterval(otpTimer);
      if (reqBtn) {
        reqBtn.disabled = false;
        reqBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Kodni Olish';
      }
    }
  }, 1000);
}

// OTP digit input interaction
otpDigits.forEach((input, index) => {
  input.addEventListener('input', (e) => {
    playSound('code');
    if (e.target.value.length === 1) {
      if (index < otpDigits.length - 1) {
        otpDigits[index + 1].focus();
      }
    }
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Backspace' && !e.target.value && index > 0) {
      otpDigits[index - 1].focus();
    }
  });

  input.addEventListener('paste', (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').trim().slice(0, 6);
    pasteData.split('').forEach((char, i) => {
      if (otpDigits[i]) {
        otpDigits[i].value = char;
      }
    });
    if (otpDigits[Math.min(pasteData.length, otpDigits.length - 1)]) {
      otpDigits[Math.min(pasteData.length, otpDigits.length - 1)].focus();
    }
  });
});

// ==========================================
// 9. FORM SUBMISSION & SUCCESS FLOW
// ==========================================
function handleRegistrationSubmit(event) {
  event.preventDefault();
  playSound('success');

  const fullName = document.getElementById('full-name').value || 'ABDULAZIZ IKROMOV';
  const email = document.getElementById('email-address').value || 'abdulazizikromov897@gmail.com';

  // Update dashboard user details
  const dashName = document.getElementById('dash-user-name');
  const dashEmail = document.getElementById('dash-user-email');
  if (dashName) dashName.textContent = fullName;
  if (dashEmail) dashEmail.textContent = email;

  // Trigger celebration confetti
  triggerConfetti();

  showToast(`Tabriklaymiz, ${fullName}! Proper Kursiga muvaffaqiyatli ro'yxatdan o'tdingiz 🎉`);

  // Open the Student Dashboard Modal
  setTimeout(() => {
    openDashboardModal();
  }, 700);
}

// ==========================================
// 10. CONFETTI CELEBRATION (PURE CANVAS)
// ==========================================
const confettiCanvas = document.getElementById('confetti-canvas');
let confettiCtx = confettiCanvas ? confettiCanvas.getContext('2d') : null;
let confettiParticles = [];
let confettiFrameId = null;

function triggerConfetti() {
  if (!confettiCanvas || !confettiCtx) return;
  confettiCanvas.width = window.innerWidth;
  confettiCanvas.height = window.innerHeight;
  confettiParticles = [];

  const colors = ['#00f2fe', '#4facfe', '#10b981', '#fbbf24', '#f43f5e', '#a855f7'];

  for (let i = 0; i < 180; i++) {
    confettiParticles.push({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      vx: (Math.random() - 0.5) * 22,
      vy: (Math.random() - 0.7) * 24,
      size: Math.random() * 8 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      vRotation: (Math.random() - 0.5) * 12,
      alpha: 1,
      gravity: 0.45
    });
  }

  function renderConfetti() {
    confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    let alive = false;

    for (const c of confettiParticles) {
      c.x += c.vx;
      c.y += c.vy;
      c.vy += c.gravity;
      c.rotation += c.vRotation;
      c.alpha -= 0.007;

      if (c.alpha > 0) {
        alive = true;
        confettiCtx.save();
        confettiCtx.translate(c.x, c.y);
        confettiCtx.rotate((c.rotation * Math.PI) / 180);
        confettiCtx.globalAlpha = Math.max(0, c.alpha);
        confettiCtx.fillStyle = c.color;
        confettiCtx.fillRect(-c.size / 2, -c.size / 2, c.size, c.size * 1.4);
        confettiCtx.restore();
      }
    }

    if (alive) {
      confettiFrameId = requestAnimationFrame(renderConfetti);
    } else {
      confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    }
  }

  if (confettiFrameId) cancelAnimationFrame(confettiFrameId);
  renderConfetti();
}

// ==========================================
// 11. TRAILER VIDEO MODAL & CUSTOM CONTROLS
// ==========================================
const trailerModal = document.getElementById('trailer-modal');
const properVideo = document.getElementById('proper-html5-video');
const btnPlayPause = document.getElementById('btn-play-pause');
const centerPlayOverlay = document.getElementById('center-play-overlay');
const centerPlayIcon = document.getElementById('center-play-icon');
const progressFill = document.getElementById('video-progress-fill');
const scrubber = document.getElementById('video-scrubber');
const currentTimeLabel = document.getElementById('video-current-time');
const totalTimeLabel = document.getElementById('video-total-time');

function openTrailerModal() {
  playSound('click');
  if (trailerModal) {
    trailerModal.classList.add('open');
    if (properVideo) {
      properVideo.play().then(() => {
        updatePlayIcons(true);
      }).catch(() => {
        updatePlayIcons(false);
      });
    }
  }
}

function closeTrailerModal() {
  playSound('click');
  if (trailerModal) {
    trailerModal.classList.remove('open');
    if (properVideo) {
      properVideo.pause();
      updatePlayIcons(false);
    }
  }
}

function togglePlayVideo() {
  if (!properVideo) return;
  playSound('click');
  if (properVideo.paused) {
    properVideo.play();
    updatePlayIcons(true);
  } else {
    properVideo.pause();
    updatePlayIcons(false);
  }
}

function updatePlayIcons(isPlaying) {
  if (btnPlayPause) {
    btnPlayPause.innerHTML = isPlaying ? '<i class="fa-solid fa-pause"></i>' : '<i class="fa-solid fa-play"></i>';
  }
  if (centerPlayOverlay) {
    if (isPlaying) {
      centerPlayOverlay.classList.add('playing');
    } else {
      centerPlayOverlay.classList.remove('playing');
    }
  }
}

function skipVideo(seconds) {
  playSound('click');
  if (properVideo) {
    properVideo.currentTime = Math.max(0, Math.min(properVideo.currentTime + seconds, properVideo.duration || 100));
  }
}

function toggleVideoMute() {
  playSound('click');
  const muteBtn = document.getElementById('btn-video-mute');
  if (properVideo && muteBtn) {
    properVideo.muted = !properVideo.muted;
    muteBtn.innerHTML = properVideo.muted ? '<i class="fa-solid fa-volume-xmark"></i>' : '<i class="fa-solid fa-volume-high"></i>';
  }
}

function toggleFullScreen() {
  playSound('click');
  const viewport = document.getElementById('video-viewport');
  if (!viewport) return;
  if (!document.fullscreenElement) {
    viewport.requestFullscreen().catch(err => alert(err.message));
  } else {
    document.exitFullscreen();
  }
}

// Video time update
if (properVideo) {
  properVideo.addEventListener('timeupdate', () => {
    if (!properVideo.duration) return;
    const current = properVideo.currentTime;
    const duration = properVideo.duration;
    const pct = (current / duration) * 100;

    if (progressFill) progressFill.style.width = `${pct}%`;
    if (scrubber) scrubber.style.left = `${pct}%`;

    if (currentTimeLabel) currentTimeLabel.textContent = formatTime(current);
    if (totalTimeLabel) totalTimeLabel.textContent = formatTime(duration);
  });

  properVideo.addEventListener('ended', () => {
    updatePlayIcons(false);
  });
}

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
}

// Progress bar seeking
const progressContainer = document.getElementById('video-progress-container');
if (progressContainer && properVideo) {
  progressContainer.addEventListener('click', (e) => {
    const rect = progressContainer.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    properVideo.currentTime = pos * properVideo.duration;
  });
}

// Thumbnail switcher for main showcase preview
const videoShowcaseData = [
  {
    img: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=80',
    title: 'Proper Kursi Kirish & Treyleri: 0 dan $100,000 Gacha Yo\'l',
    desc: '1-Dars: Bozor psixologiyasi va Proper hisoblarning afzalliklari'
  },
  {
    img: 'https://images.unsplash.com/photo-1642543492481-44e81e3914a7?auto=format&fit=crop&w=1200&q=80',
    title: 'Jonli NFP & FOMC Savdosi: Likvidlikni Qanday Qidirish Kerak?',
    desc: '2-Dars: Yuqori volatil bozorlarda Smart Money Concepts'
  },
  {
    img: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=1200&q=80',
    title: 'Risk Menejment va Drawdown Hisoblash Qoidalari',
    desc: '3-Dars: Hisobingizni hech qachon yo\'qotmaslikning 3 ta oltin qoidasi'
  },
  {
    img: 'https://images.unsplash.com/photo-1535320903710-d993d3d77d29?auto=format&fit=crop&w=1200&q=80',
    title: 'Fundednext & FTMO dan Birinchi $10,000 Yechib Olish',
    desc: '4-Dars: Profit split va shartnomalar bilan ishlash'
  }
];

function switchVideoPreview(index) {
  playSound('click');
  const thumbs = document.querySelectorAll('.thumb-item');
  thumbs.forEach((t, i) => {
    if (i === index) t.classList.add('active');
    else t.classList.remove('active');
  });

  const coverImg = document.getElementById('cover-image');
  const captionH3 = document.querySelector('.video-caption h3');
  const captionP = document.querySelector('.video-caption p');

  if (coverImg && videoShowcaseData[index]) {
    coverImg.src = videoShowcaseData[index].img;
    if (captionH3) captionH3.textContent = videoShowcaseData[index].title;
    if (captionP) captionP.textContent = videoShowcaseData[index].desc;
  }
}

// ==========================================
// 12. TALABA KABINETI (DASHBOARD) FUNKSIYALARI
// ==========================================
const dashboardModal = document.getElementById('dashboard-modal');

function openDashboardModal() {
  playSound('success');
  if (dashboardModal) {
    dashboardModal.classList.add('open');
  }
}

function closeDashboardModal() {
  playSound('click');
  if (dashboardModal) {
    dashboardModal.classList.remove('open');
  }
}

function switchDashTab(tabId) {
  playSound('click');
  // Update sidebar active item
  const menuItems = document.querySelectorAll('.d-menu li');
  menuItems.forEach(li => li.classList.remove('active'));

  // Update tabs
  const tabs = document.querySelectorAll('.d-tab-content');
  tabs.forEach(tab => tab.classList.remove('active'));

  const activeTab = document.getElementById(`tab-${tabId}`);
  if (activeTab) {
    activeTab.classList.add('active');
  }

  // Set active class on clicked nav
  const clickedLink = document.querySelector(`.d-menu li a[onclick*="${tabId}"]`);
  if (clickedLink && clickedLink.parentElement) {
    clickedLink.parentElement.classList.add('active');
  }

  if (tabId === 'certificate') {
    triggerConfetti();
  }
}

// Playlist interaction inside dashboard
const playlistItems = document.querySelectorAll('.playlist-item');
playlistItems.forEach(item => {
  item.addEventListener('click', () => {
    playSound('click');
    playlistItems.forEach(p => p.classList.remove('active'));
    item.classList.add('active');
    showToast(`${item.querySelector('strong').textContent} darsi yuklandi.`);
  });
});

// ==========================================
// 13. TOAST NOTIFICATION
// ==========================================
const toastEl = document.getElementById('toast-notify');
const toastMsg = document.getElementById('toast-message');
let toastTimer = null;

function showToast(message) {
  if (!toastEl || !toastMsg) return;
  toastMsg.textContent = message;
  toastEl.classList.add('show');

  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastEl.classList.remove('show');
  }, 3500);
}

// ==========================================
// 14. NAVIGATION & SCROLL HELPERS
// ==========================================
function scrollToRegister() {
  playSound('click');
  const regSec = document.getElementById('register-section');
  if (regSec) {
    regSec.scrollIntoView({ behavior: 'smooth' });
  }
}

function navigateTo(id) {
  playSound('click');
  const target = document.getElementById(id);
  if (target) {
    target.scrollIntoView({ behavior: 'smooth' });
  }
}

// Global modal backdrop close by clicking outside
window.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-backdrop')) {
    e.target.classList.remove('open');
    if (properVideo) properVideo.pause();
  }
});
