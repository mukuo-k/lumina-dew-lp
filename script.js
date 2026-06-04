const root = document.documentElement;
const header = document.querySelector("[data-header]");
const heroVideo = document.querySelector("[data-hero-video]");
const motionTargets = Array.from(document.querySelectorAll("[data-motion]"));
const revealTargets = Array.from(document.querySelectorAll("[data-reveal], [data-float]"));

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

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

function playHeroVideo() {
  if (!heroVideo) return;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reducedMotion) {
    heroVideo.pause();
    return;
  }
  heroVideo.play().catch(() => {});
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
window.addEventListener("load", () => {
  playHeroVideo();
  updateMotion();
});

playHeroVideo();
updateMotion();
