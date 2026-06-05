const root = document.documentElement;
const body = document.body;
const header = document.querySelector("[data-header]");
const heroVideo = document.querySelector("[data-hero-video]");
const reservationForm = document.querySelector("[data-reservation-form]");
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

let introFinished = false;
let introVideoShown = false;

function showIntroVideo() {
  if (introVideoShown) return;
  introVideoShown = true;
  body.classList.add("intro-video-started");
}

function finishIntro() {
  if (introFinished) return;
  introFinished = true;
  showIntroVideo();
  body.classList.remove("intro-playing");
  body.classList.add("intro-complete");
  updateMotion();
}

function playHeroVideo() {
  if (!heroVideo) {
    finishIntro();
    return;
  }
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reducedMotion) {
    finishIntro();
    return;
  }

  window.scrollTo(0, 0);
  heroVideo.loop = false;
  heroVideo.muted = true;
  heroVideo.playsInline = true;
  heroVideo.removeAttribute("poster");
  heroVideo.addEventListener("timeupdate", () => {
    if (heroVideo.currentTime > 0.08) {
      showIntroVideo();
    }
  });
  heroVideo.addEventListener("playing", () => {
    window.requestAnimationFrame(() => {
      if (heroVideo.currentTime > 0.08) {
        showIntroVideo();
      }
    });
  });
  heroVideo.addEventListener("ended", finishIntro, { once: true });
  heroVideo.addEventListener("error", finishIntro, { once: true });
  heroVideo.play().catch(finishIntro);

  window.setTimeout(() => {
    if (heroVideo.ended || heroVideo.currentTime > 0) return;
    finishIntro();
  }, 2500);
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

function setupReservationForm() {
  if (!reservationForm) return;

  const status = reservationForm.querySelector("[data-form-status]");
  const submitButton = reservationForm.querySelector("button[type='submit']");
  const originalText = submitButton?.textContent || "送信する";

  function setStatus(message, type = "info") {
    if (!status) return;
    status.hidden = false;
    status.textContent = message;
    status.dataset.type = type;
  }

  reservationForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (window.location.protocol === "file:") {
      setStatus("バックエンド送信はCloudflare Pages上で確認できます。", "error");
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = "送信中...";
    setStatus("送信しています。");

    try {
      const response = await fetch(reservationForm.action, {
        method: "POST",
        body: new FormData(reservationForm),
        headers: {
          accept: "application/json",
        },
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.ok) {
        const message = data.errors?.join(" ") || data.message || "送信に失敗しました。";
        throw new Error(message);
      }

      reservationForm.reset();
      setStatus("送信を受け付けました。管理画面に保存されています。", "success");
    } catch (error) {
      setStatus(error.message || "送信に失敗しました。時間をおいてもう一度お試しください。", "error");
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = originalText;
    }
  });
}

window.addEventListener("scroll", requestMotionUpdate, { passive: true });
window.addEventListener("resize", requestMotionUpdate);
window.addEventListener("load", () => {
  playHeroVideo();
  updateMotion();
});

playHeroVideo();
updateMotion();
setupReservationForm();
