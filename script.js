const root = document.documentElement;
const header = document.querySelector("[data-header]");
const hero = document.querySelector(".hero");
const heroCanvas = document.querySelector("[data-hero-sequence]");
const heroCtx = heroCanvas ? heroCanvas.getContext("2d") : null;
const motionTargets = Array.from(document.querySelectorAll("[data-motion]"));
const revealTargets = Array.from(document.querySelectorAll("[data-reveal], [data-float]"));

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const easeOut = (value) => 1 - Math.pow(1 - clamp(value, 0, 1), 3);
const easeInOut = (value) => {
  const t = clamp(value, 0, 1);
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};

let heroCanvasWidth = 0;
let heroCanvasHeight = 0;

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
      }
    });
  },
  { threshold: 0.2, rootMargin: "0px 0px -8% 0px" }
);

revealTargets.forEach((target) => revealObserver.observe(target));

function resizeHeroCanvas() {
  if (!heroCanvas || !heroCtx) return;
  const rect = heroCanvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  heroCanvasWidth = Math.max(1, rect.width);
  heroCanvasHeight = Math.max(1, rect.height);
  heroCanvas.width = Math.round(heroCanvasWidth * dpr);
  heroCanvas.height = Math.round(heroCanvasHeight * dpr);
  heroCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function getHeroProgress(scrollY) {
  if (!hero) return 0;
  const start = hero.offsetTop;
  const distance = Math.max(hero.offsetHeight - window.innerHeight, 1);
  return clamp((scrollY - start) / distance, 0, 1);
}

function drawDroplet(x, y, size, alpha) {
  if (!heroCtx) return;
  heroCtx.save();
  heroCtx.globalAlpha = alpha;
  heroCtx.shadowColor = "rgba(93, 184, 202, 0.45)";
  heroCtx.shadowBlur = size * 2.8;

  const gradient = heroCtx.createRadialGradient(x - size * 0.25, y - size * 0.42, 1, x, y, size * 1.2);
  gradient.addColorStop(0, "rgba(255,255,255,0.95)");
  gradient.addColorStop(0.36, "rgba(186,236,248,0.82)");
  gradient.addColorStop(1, "rgba(52,139,170,0.38)");
  heroCtx.fillStyle = gradient;
  heroCtx.beginPath();
  heroCtx.ellipse(x, y, size * 0.72, size, 0, 0, Math.PI * 2);
  heroCtx.fill();

  heroCtx.shadowBlur = 0;
  heroCtx.fillStyle = "rgba(255,255,255,0.72)";
  heroCtx.beginPath();
  heroCtx.arc(x - size * 0.24, y - size * 0.36, size * 0.18, 0, Math.PI * 2);
  heroCtx.fill();
  heroCtx.restore();
}

function drawHeroFrame(progress) {
  if (!heroCanvas || !heroCtx) return;

  const w = heroCanvasWidth;
  const h = heroCanvasHeight;
  const frameCount = 32;
  const stepped = Math.round(progress * frameCount) / frameCount;
  const cinematic = easeInOut(stepped);
  const isMobile = w < 700;

  heroCtx.clearRect(0, 0, w, h);

  const scale = 1.025 + cinematic * 0.058;
  const xMove = isMobile ? -cinematic * 18 : -cinematic * 34;
  const yMove = isMobile ? cinematic * 8 : cinematic * 4;
  root.style.setProperty("--hero-scale", scale.toFixed(4));
  root.style.setProperty("--hero-bg-x", `${xMove.toFixed(2)}px`);
  root.style.setProperty("--hero-bg-y", `${yMove.toFixed(2)}px`);

  const dropStart = isMobile ? { x: w * 0.68, y: h * 0.47 } : { x: w * 0.895, y: h * 0.62 };
  const dropEnd = isMobile ? { x: w * 0.68, y: h * 0.77 } : { x: w * 0.895, y: h * 0.85 };
  const dropProgress = easeOut((stepped - 0.14) / 0.58);
  const dropX = dropStart.x + (dropEnd.x - dropStart.x) * dropProgress;
  const dropY = dropStart.y + (dropEnd.y - dropStart.y) * dropProgress;
  const dropAlpha = stepped < 0.12 || stepped > 0.9 ? 0 : 0.92;

  heroCtx.save();
  heroCtx.globalCompositeOperation = "screen";

  for (let i = 0; i < 18; i += 1) {
    const seed = (i * 0.137 + stepped * 0.44) % 1;
    const px = (w * 0.48 + i * 71 + Math.sin(i + stepped * 8) * 18) % w;
    const py = h * (0.14 + seed * 0.72);
    const radius = 4 + (i % 5) * 2;
    const glow = heroCtx.createRadialGradient(px, py, 0, px, py, radius * 4);
    glow.addColorStop(0, "rgba(255,255,255,0.48)");
    glow.addColorStop(1, "rgba(255,255,255,0)");
    heroCtx.fillStyle = glow;
    heroCtx.beginPath();
    heroCtx.arc(px, py, radius * 4, 0, Math.PI * 2);
    heroCtx.fill();
  }

  const sweepX = w * (-0.18 + stepped * 1.28);
  const sweep = heroCtx.createLinearGradient(sweepX - 180, 0, sweepX + 180, h);
  sweep.addColorStop(0, "rgba(255,255,255,0)");
  sweep.addColorStop(0.48, "rgba(255,255,255,0.28)");
  sweep.addColorStop(1, "rgba(255,255,255,0)");
  heroCtx.fillStyle = sweep;
  heroCtx.fillRect(0, 0, w, h);

  heroCtx.restore();

  const trailAlpha = dropAlpha * clamp(dropProgress, 0, 1) * clamp(1 - dropProgress, 0, 1) * 2.2;
  heroCtx.save();
  heroCtx.globalAlpha = trailAlpha;
  heroCtx.strokeStyle = "rgba(210,246,255,0.72)";
  heroCtx.lineWidth = isMobile ? 2.4 : 4;
  heroCtx.beginPath();
  heroCtx.moveTo(dropStart.x, dropStart.y);
  heroCtx.quadraticCurveTo(dropX + 8, (dropStart.y + dropY) / 2, dropX, dropY - 8);
  heroCtx.stroke();
  heroCtx.restore();

  drawDroplet(dropX, dropY, isMobile ? 12 : 18, dropAlpha);

  const impact = clamp((stepped - 0.72) / 0.18, 0, 1);
  if (impact > 0) {
    heroCtx.save();
    heroCtx.globalAlpha = 0.62 * (1 - impact);
    heroCtx.strokeStyle = "rgba(92,181,206,0.62)";
    heroCtx.lineWidth = 2;
    heroCtx.beginPath();
    heroCtx.ellipse(dropEnd.x, dropEnd.y + 6, (isMobile ? 18 : 30) + impact * 58, 5 + impact * 12, 0, 0, Math.PI * 2);
    heroCtx.stroke();
    heroCtx.restore();
  }

  for (let i = 0; i < 4; i += 1) {
    const mini = clamp((stepped - 0.3 - i * 0.08) / 0.42, 0, 1);
    if (mini <= 0 || mini >= 1) continue;
    drawDroplet(dropStart.x - 44 - i * 18, dropStart.y + mini * 170 + i * 12, isMobile ? 3.5 : 5, 0.45 * (1 - mini));
  }
}

let ticking = false;

function updateMotion() {
  const scrollY = window.scrollY || window.pageYOffset;
  const maxScroll = Math.max(document.body.scrollHeight - window.innerHeight, 1);
  const pageProgress = clamp(scrollY / maxScroll, 0, 1);
  root.style.setProperty("--page-progress", pageProgress.toFixed(4));

  if (header) {
    header.classList.toggle("is-scrolled", scrollY > 40);
  }

  const heroProgress = getHeroProgress(scrollY);
  drawHeroFrame(heroProgress);

  motionTargets.forEach((target) => {
    const rect = target.getBoundingClientRect();
    const speed = Number(target.dataset.speed || 0.2);
    const viewport = window.innerHeight || 1;
    const centerDelta = (rect.top + rect.height / 2 - viewport / 2) / viewport;
    const y = clamp(centerDelta * -96 * speed, -58, 58);
    const scale = 1.02 + Math.abs(centerDelta) * 0.018;
    target.style.setProperty("--motion-y", `${y.toFixed(2)}px`);
    target.style.setProperty("--motion-scale", scale.toFixed(4));
  });

  ticking = false;
}

function requestMotionUpdate() {
  if (!ticking) {
    window.requestAnimationFrame(updateMotion);
    ticking = true;
  }
}

window.addEventListener("scroll", requestMotionUpdate, { passive: true });
window.addEventListener("resize", () => {
  resizeHeroCanvas();
  requestMotionUpdate();
});
window.addEventListener("load", () => {
  resizeHeroCanvas();
  updateMotion();
});
resizeHeroCanvas();
updateMotion();
