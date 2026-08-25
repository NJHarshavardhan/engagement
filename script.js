document.addEventListener("DOMContentLoaded", () => {
  // Smooth reveal animations
  const revealItems = document.querySelectorAll(".reveal");

  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  revealItems.forEach((item, index) => {
    item.style.transitionDelay = `${Math.min(index * 40, 240)}ms`;
    revealObserver.observe(item);
  });

  // Countdown: 01 November 2026, 6:00 PM local time
  const targetDate = new Date(2026, 10, 1, 18, 0, 0);

  const elements = {
    days: document.getElementById("days"),
    hours: document.getElementById("hours"),
    minutes: document.getElementById("minutes"),
    seconds: document.getElementById("seconds")
  };

  function pad(value) {
    return String(value).padStart(2, "0");
  }

  function updateCountdown() {
    const now = new Date();
    const difference = targetDate.getTime() - now.getTime();

    if (difference <= 0) {
      Object.values(elements).forEach((el) => el.textContent = "00");
      return;
    }

    const totalSeconds = Math.floor(difference / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const values = { days, hours, minutes, seconds };

    Object.entries(values).forEach(([key, value]) => {
      const nextValue = pad(value);
      if (elements[key].textContent !== nextValue) {
        elements[key].textContent = nextValue;
        elements[key].dataset.value = nextValue;
        elements[key].classList.remove("flip-digit");
        void elements[key].offsetWidth;
        elements[key].classList.add("flip-digit");
      }
    });
  }

  updateCountdown();
  setInterval(updateCountdown, 1000);

  // Optional background music. It only starts after the visitor presses the control.
  const music = document.getElementById("bgMusic");
  const musicToggle = document.getElementById("musicToggle");
  const musicLabel = musicToggle.querySelector(".music-label");

  musicToggle.addEventListener("click", async () => {
    try {
      if (music.paused) {
        await music.play();
        musicToggle.setAttribute("aria-pressed", "true");
        musicToggle.setAttribute("aria-label", "Pause background music");
        musicLabel.textContent = "Pause";
      } else {
        music.pause();
        musicToggle.setAttribute("aria-pressed", "false");
        musicToggle.setAttribute("aria-label", "Play background music");
        musicLabel.textContent = "Music";
      }
    } catch (error) {
      console.warn("Music could not be played. Add a valid MP3 at assets/music.mp3.", error);
    }
  });
  // ------------------------------------------------------------------
  // Keep a JS-driven --vh in sync with the real, current viewport height.
  // This is the fix for the "scene jumps / isn't visible / doesn't come
  // back on scroll-up" bug: previously the tall scroll container used CSS
  // `svh` (fixed) while the pinned inner layer used `dvh` (changes as a
  // mobile browser's address bar shows/hides mid-scroll). Those two units
  // could disagree by tens of pixels while scrolling, which made the
  // sticky element unpin early or land in the wrong spot. Driving both
  // from the exact same number removes that mismatch entirely.
  // ------------------------------------------------------------------
  const setViewportUnit = () => {
    const vh = (window.visualViewport ? window.visualViewport.height : window.innerHeight) * 0.01;
    document.documentElement.style.setProperty("--vh", `${vh}px`);
  };
  setViewportUnit();
  window.addEventListener("resize", setViewportUnit, { passive: true });
  window.addEventListener("orientationchange", setViewportUnit, { passive: true });
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", setViewportUnit, { passive: true });
  }

  // Scroll-scrubbed engagement scene.
  // Choreography (as a fraction of the pinned scroll distance):
  //   0.00 - 0.08  intro: girl & boy fade/slide in from off-screen
  //   0.08 - 0.55  meet:  they travel toward each other and arrive
  //   0.55 - 0.78  celebrate: ring glow, sparkle message, petals
  //   0.78 - 1.00  a short hold so the finished moment can be enjoyed
  // Kept intentionally shorter than before so there's no big "dead" gap
  // of scrolling with nothing happening, and it plays back identically
  // in both directions (scroll up reverses it smoothly).
  const engagementScene = document.getElementById("engagement-scene");
  const sceneSticky = engagementScene?.querySelector(".scene-sticky");
  const sceneRingButton = engagementScene?.querySelector(".scene-ring-button");

  if (engagementScene && sceneSticky) {
    let sceneTicking = false;
    let lastProgress = -1;

    const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
    const smoothstep = (value) => value * value * (3 - 2 * value);

    const updateEngagementScene = () => {
      const rect = engagementScene.getBoundingClientRect();
      const travel = Math.max(1, engagementScene.offsetHeight - window.innerHeight);
      const progress = clamp(-rect.top / travel);

      const intro = smoothstep(clamp(progress / 0.08));
      const meet = smoothstep(clamp((progress - 0.08) / 0.47));
      const celebrate = smoothstep(clamp((progress - 0.55) / 0.23));

      sceneSticky.style.setProperty("--scene-progress", progress.toFixed(4));
      sceneSticky.style.setProperty("--scene-intro", intro.toFixed(4));
      sceneSticky.style.setProperty("--scene-meet", meet.toFixed(4));
      sceneSticky.style.setProperty("--scene-celebrate", celebrate.toFixed(4));

      sceneSticky.classList.toggle("is-together", meet > 0.985);
      sceneSticky.classList.toggle("is-celebrating", celebrate > 0.65);

      // Add a tiny scroll-direction cue to the thoranam and backdrop without
      // moving layout, keeping the animation smooth on phones and iPads.
      if (lastProgress >= 0) {
        sceneSticky.classList.toggle("scrolling-back", progress < lastProgress);
      }
      lastProgress = progress;
      sceneTicking = false;
    };

    const requestSceneUpdate = () => {
      if (!sceneTicking) {
        sceneTicking = true;
        requestAnimationFrame(updateEngagementScene);
      }
    };

    updateEngagementScene();
    window.addEventListener("scroll", requestSceneUpdate, { passive: true });
    window.addEventListener("resize", requestSceneUpdate, { passive: true });
    window.addEventListener("orientationchange", requestSceneUpdate, { passive: true });
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", requestSceneUpdate, { passive: true });
    }

    // Gentle pointer parallax on larger screens makes the decoration feel
    // layered without interfering with the scroll choreography.
    const canHover = window.matchMedia("(hover: hover) and (pointer: fine)");
    const updatePointer = (event) => {
      const rect = sceneSticky.getBoundingClientRect();
      const x = clamp((event.clientX - rect.left) / rect.width - 0.5, -0.5, 0.5);
      const y = clamp((event.clientY - rect.top) / rect.height - 0.5, -0.5, 0.5);
      sceneSticky.style.setProperty("--pointer-x", x.toFixed(3));
      sceneSticky.style.setProperty("--pointer-y", y.toFixed(3));
    };

    if (canHover.matches) {
      sceneSticky.addEventListener("pointermove", updatePointer, { passive: true });
      sceneSticky.addEventListener("pointerleave", () => {
        sceneSticky.style.setProperty("--pointer-x", "0");
        sceneSticky.style.setProperty("--pointer-y", "0");
      });
    }

    // Small celebratory burst when the ring is tapped/clicked.
    sceneRingButton?.addEventListener("click", () => {
      sceneRingButton.classList.add("is-celebrated");
      sceneSticky.classList.add("magic-burst");

      const boyImage = sceneSticky.querySelector(".person-boy img");
      const girlImage = sceneSticky.querySelector(".person-girl img");
      const stickyRect = sceneSticky.getBoundingClientRect();
      const boyRect = boyImage.getBoundingClientRect();
      const girlRect = girlImage.getBoundingClientRect();
      const heart = document.createElement("span");
      heart.className = "love-heart";
      heart.textContent = "❤️";
      heart.style.setProperty("--heart-x", `${girlRect.left + girlRect.width * 0.52 - (boyRect.left + boyRect.width * 0.5)}px`);
      heart.style.setProperty("--heart-y", `${girlRect.top + girlRect.height * 0.38 - (boyRect.top + boyRect.height * 0.42)}px`);
      heart.style.left = `${boyRect.left + boyRect.width * 0.5 - stickyRect.left}px`;
      heart.style.top = `${boyRect.top + boyRect.height * 0.42 - stickyRect.top}px`;
      sceneSticky.appendChild(heart);

      heart.addEventListener("animationend", () => {
        sceneSticky.classList.add("heart-arrived");
        heart.remove();
        window.setTimeout(() => sceneSticky.classList.remove("heart-arrived"), 650);
      }, { once: true });

      const burst = document.createDocumentFragment();
      const symbols = ["✦", "✧", "❧", "✦", "·", "✧", "❧", "·"];
      symbols.forEach((symbol, index) => {
        const spark = document.createElement("span");
        spark.className = "magic-spark";
        spark.textContent = symbol;
        spark.style.setProperty("--spark-angle", `${index * 45}deg`);
        spark.style.setProperty("--spark-distance", `${46 + (index % 3) * 17}px`);
        burst.appendChild(spark);
      });
      sceneRingButton.appendChild(burst);

      window.setTimeout(() => {
        sceneRingButton.classList.remove("is-celebrated");
        sceneSticky.classList.remove("magic-burst");
        sceneRingButton.querySelectorAll(".magic-spark").forEach((spark) => spark.remove());
      }, 950);
    });
  }

});
