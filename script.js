const root = document.documentElement;
const header = document.querySelector("[data-header]");
const hero = document.querySelector(".hero");
const heroFrame = document.querySelector("[data-hero-frame]");
const motionTargets = Array.from(document.querySelectorAll("[data-motion]"));
const revealTargets = Array.from(document.querySelectorAll("[data-reveal], [data-float]"));

const HERO_SEQUENCE_PATH = "./assets/hero-video-sequence/";
const HERO_FRAME_COUNT = 60;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const easeInOut = (value) => {
  const t = clamp(value, 0, 1);
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};

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

function heroFrameSrc(index) {
  return `${HERO_SEQUENCE_PATH}frame-${String(index).padStart(3, "0")}.webp`;
}

function preloadHeroFrames() {
  if (!heroFrame) return;
  for (let i = 0; i < HERO_FRAME_COUNT; i += 1) {
    const image = new Image();
    image.decoding = "async";
    image.src = heroFrameSrc(i);
  }
}

function getHeroProgress(scrollY) {
  if (!hero) return 0;
  const start = hero.offsetTop;
  const distance = Math.max(hero.offsetHeight - window.innerHeight, 1);
  return clamp((scrollY - start) / distance, 0, 1);
}

function updateHeroFrame(progress) {
  if (!heroFrame) return;
  const frameIndex = Math.round(progress * (HERO_FRAME_COUNT - 1));
  const clampedIndex = clamp(frameIndex, 0, HERO_FRAME_COUNT - 1);
  const currentIndex = Number(heroFrame.dataset.frameIndex || -1);

  if (currentIndex !== clampedIndex) {
    heroFrame.src = heroFrameSrc(clampedIndex);
    heroFrame.dataset.frameIndex = String(clampedIndex);
  }

  const scale = 1.01 + easeInOut(progress) * 0.026;
  root.style.setProperty("--hero-frame-scale", scale.toFixed(4));
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

  updateHeroFrame(getHeroProgress(scrollY));

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
window.addEventListener("resize", requestMotionUpdate);
window.addEventListener("load", updateMotion);

preloadHeroFrames();
updateMotion();
