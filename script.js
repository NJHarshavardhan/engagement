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

  const prefersReducedMotionEarly = window.matchMedia("(prefers-reduced-motion: reduce)");

  // ------------------------------------------------------------------
  // Word-by-word reveal: split marked copy into masked word spans, then
  // fade/slide each one in with a small stagger once visible.
  // ------------------------------------------------------------------
  const splitWords = (el) => {
    const parts = el.innerHTML.split(/(<br\s*\/?>)/i);
    el.innerHTML = parts
      .map((part) => {
        if (/^<br\s*\/?>$/i.test(part)) return part;
        return part
          .split(/\s+/)
          .filter(Boolean)
          .map((word) => `<span class="word"><span class="word-inner">${word}</span></span>`)
          .join(" ");
      })
      .join(" ");
  };

  document.querySelectorAll(".split-words").forEach((el) => {
    splitWords(el);
    el.querySelectorAll(".word-inner").forEach((word, index) => {
      word.style.transitionDelay = `${index * 45}ms`;
    });
  });

  const wordRevealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.4 });

  document.querySelectorAll(".split-words").forEach((el) => wordRevealObserver.observe(el));

  // ------------------------------------------------------------------
  // Custom cursor: a dot that tracks exactly, and a ring that trails
  // slightly and swells over anything interactive.
  // ------------------------------------------------------------------
  const canHoverFineEarly = window.matchMedia("(hover: hover) and (pointer: fine)");
  const customCursor = document.getElementById("customCursor");
  if (customCursor && canHoverFineEarly.matches && !prefersReducedMotionEarly.matches) {
    document.body.classList.add("has-custom-cursor");
    const cursorDot = customCursor.querySelector(".cursor-dot");
    const cursorRing = customCursor.querySelector(".cursor-ring");
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let ringX = mouseX;
    let ringY = mouseY;

    window.addEventListener("pointermove", (event) => {
      mouseX = event.clientX;
      mouseY = event.clientY;
      cursorDot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;
    }, { passive: true });

    const animateRing = () => {
      ringX += (mouseX - ringX) * 0.2;
      ringY += (mouseY - ringY) * 0.2;
      cursorRing.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`;
      requestAnimationFrame(animateRing);
    };
    requestAnimationFrame(animateRing);

    const hoverTargets = "a, button, [data-tilt], .magnetic-btn, .language-button";
    document.addEventListener("mouseover", (event) => {
      if (event.target.closest(hoverTargets)) cursorRing.classList.add("is-hovering");
    });
    document.addEventListener("mouseout", (event) => {
      if (event.target.closest(hoverTargets)) cursorRing.classList.remove("is-hovering");
    });
  }

  // ------------------------------------------------------------------
  // Ambient petals: a sparse, slow drift of blossoms over the whole
  // page for a little continuous life between the bigger set pieces.
  // ------------------------------------------------------------------
  const ambientPetals = document.getElementById("ambientPetals");
  if (ambientPetals && !prefersReducedMotionEarly.matches) {
    const glyphs = ["✦", "✧", "❧", "✿"];
    const colors = ["rgba(226,168,92,.5)", "rgba(136,180,125,.45)", "rgba(161,217,155,.5)"];
    const fragment = document.createDocumentFragment();
    const petalCount = 14;
    for (let i = 0; i < petalCount; i++) {
      const petal = document.createElement("span");
      petal.textContent = glyphs[i % glyphs.length];
      petal.style.setProperty("--pl", `${(Math.random() * 96 + 2).toFixed(1)}%`);
      petal.style.setProperty("--ps", `${(Math.random() * 10 + 10).toFixed(0)}px`);
      petal.style.setProperty("--pd", `${(Math.random() * 10 + 14).toFixed(1)}s`);
      petal.style.setProperty("--pdelay", `${(Math.random() * -20).toFixed(1)}s`);
      petal.style.setProperty("--pdrift", `${(Math.random() * 80 - 40).toFixed(0)}px`);
      petal.style.color = colors[i % colors.length];
      fragment.appendChild(petal);
    }
    ambientPetals.appendChild(fragment);
  }

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

  // Language buttons control the Google Translate widget without showing its default toolbar.
  const languageButtons = document.querySelectorAll(".language-button");
  const changeLanguage = (language, attempts = 0) => {
    const selector = document.querySelector(".goog-te-combo");
    if (!selector) {
      if (attempts < 20) window.setTimeout(() => changeLanguage(language, attempts + 1), 250);
      return;
    }
    selector.value = language;
    selector.dispatchEvent(new Event("change"));
  };

  languageButtons.forEach((button) => {
    button.addEventListener("click", () => {
      languageButtons.forEach((item) => {
        const active = item === button;
        item.classList.toggle("is-active", active);
        item.setAttribute("aria-pressed", String(active));
      });
      changeLanguage(button.dataset.language);
    });
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
    const easeInOutCubic = (value) => {
      if (value < 0.5) return 4 * value * value * value;
      return 1 - Math.pow(-2 * value + 2, 3) / 2;
    };

    const updateEngagementScene = () => {
      const rect = engagementScene.getBoundingClientRect();
      const travel = Math.max(1, engagementScene.offsetHeight - window.innerHeight);
      const progress = clamp(-rect.top / travel);

      const intro = smoothstep(clamp(progress / 0.08));
      const meetRaw = clamp((progress - 0.08) / 1.42);
      const holdStart = 0.76;
      const holdEnd = 0.9;
      const meet = meetRaw < holdStart
        ? Math.pow(smoothstep(meetRaw / holdStart), 1.7)
        : meetRaw < holdEnd
          ? 0.82 + (meetRaw - holdStart) / (holdEnd - holdStart) * 0.14
          : 0.96 + Math.pow(smoothstep((meetRaw - holdEnd) / (1 - holdEnd)), 1.9) * 0.04;
      const celebrate = smoothstep(clamp((progress - 0.9) / 0.1));

      sceneSticky.style.setProperty("--scene-progress", progress.toFixed(4));
      sceneSticky.style.setProperty("--scene-intro", intro.toFixed(4));
      sceneSticky.style.setProperty("--scene-meet", meet.toFixed(4));
      sceneSticky.style.setProperty("--scene-celebrate", celebrate.toFixed(4));

      sceneSticky.classList.toggle("is-together", meet > 0.98);
      sceneSticky.classList.toggle("is-celebrating", celebrate > 0.55);

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

  // ------------------------------------------------------------------
  // Scroll progress rail across the top of the page.
  // ------------------------------------------------------------------
  const scrollProgressBar = document.getElementById("scrollProgressBar");
  const updateScrollProgress = () => {
    if (!scrollProgressBar) return;
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? Math.min(100, Math.max(0, (scrollTop / docHeight) * 100)) : 0;
    scrollProgressBar.style.width = `${pct}%`;
  };

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const canHoverFine = window.matchMedia("(hover: hover) and (pointer: fine)");
  const fineInteractionsEnabled = canHoverFine.matches && !prefersReducedMotion.matches;

  // ------------------------------------------------------------------
  // A soft light that drifts toward the cursor, giving the page a
  // little extra depth on desktop. Skipped on touch devices and when
  // the visitor prefers reduced motion.
  // ------------------------------------------------------------------
  const cursorGlow = document.getElementById("cursorGlow");
  if (cursorGlow && fineInteractionsEnabled) {
    let glowX = window.innerWidth / 2;
    let glowY = window.innerHeight / 2;
    let targetX = glowX;
    let targetY = glowY;

    window.addEventListener("pointermove", (event) => {
      targetX = event.clientX;
      targetY = event.clientY;
      cursorGlow.classList.add("is-active");
    }, { passive: true });

    document.addEventListener("mouseleave", () => cursorGlow.classList.remove("is-active"));

    const animateGlow = () => {
      glowX += (targetX - glowX) * 0.14;
      glowY += (targetY - glowY) * 0.14;
      cursorGlow.style.transform = `translate3d(${glowX}px, ${glowY}px, 0)`;
      requestAnimationFrame(animateGlow);
    };
    requestAnimationFrame(animateGlow);
  }

  // ------------------------------------------------------------------
  // 3D pointer-tilt for the marked cards, and a gentle magnetic pull
  // on the primary buttons. Both reset smoothly on pointer leave.
  // ------------------------------------------------------------------
  if (fineInteractionsEnabled) {
    document.querySelectorAll("[data-tilt]").forEach((card) => {
      const strength = 8;
      const handleTiltMove = (event) => {
        const rect = card.getBoundingClientRect();
        const px = (event.clientX - rect.left) / rect.width - 0.5;
        const py = (event.clientY - rect.top) / rect.height - 0.5;
        card.style.transform =
          `perspective(1100px) rotateX(${(-py * strength).toFixed(2)}deg) rotateY(${(px * strength).toFixed(2)}deg) translateY(-6px) translateZ(14px)`;
      };
      const resetTilt = () => { card.style.transform = ""; };
      card.addEventListener("pointermove", handleTiltMove);
      card.addEventListener("pointerleave", resetTilt);
    });

    document.querySelectorAll(".magnetic-btn").forEach((btn) => {
      const pull = 12;
      const handleMagnetMove = (event) => {
        const rect = btn.getBoundingClientRect();
        const px = (event.clientX - rect.left) / rect.width - 0.5;
        const py = (event.clientY - rect.top) / rect.height - 0.5;
        btn.style.transform = `translate(${(px * pull).toFixed(1)}px, ${(py * pull - 3).toFixed(1)}px)`;
      };
      const resetMagnet = () => { btn.style.transform = ""; };
      btn.addEventListener("pointermove", handleMagnetMove);
      btn.addEventListener("pointerleave", resetMagnet);
    });
  }

  // ------------------------------------------------------------------
  // Gentle scroll-tied parallax for the hero rings and botanical art.
  // ------------------------------------------------------------------
  const parallaxEls = Array.from(document.querySelectorAll("[data-speed]"));
  const updateParallax = () => {
    if (!parallaxEls.length) return;
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    parallaxEls.forEach((el) => {
      const speed = parseFloat(el.dataset.speed) || 0;
      el.style.setProperty("--parallax-y", `${(scrollTop * speed).toFixed(1)}px`);
    });
  };

  // ------------------------------------------------------------------
  // Twinkling starfield behind the dark countdown section.
  // ------------------------------------------------------------------
  const starsContainer = document.getElementById("countdownStars");
  if (starsContainer && !prefersReducedMotion.matches) {
    const starCount = 48;
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < starCount; i++) {
      const star = document.createElement("i");
      const size = (Math.random() * 2.2 + 1).toFixed(1);
      star.style.left = `${(Math.random() * 100).toFixed(1)}%`;
      star.style.top = `${(Math.random() * 100).toFixed(1)}%`;
      star.style.width = `${size}px`;
      star.style.height = `${size}px`;
      star.style.setProperty("--star-duration", `${(Math.random() * 2.5 + 2).toFixed(1)}s`);
      star.style.setProperty("--star-delay", `${(Math.random() * 3).toFixed(1)}s`);
      star.style.setProperty("--star-opacity", (Math.random() * 0.5 + 0.4).toFixed(2));
      fragment.appendChild(star);
    }
    starsContainer.appendChild(fragment);
  }

  // ------------------------------------------------------------------
  // Continuous zoom in/out on scroll for headings and key copy: grows
  // as an element nears the vertical centre of the viewport, eases back
  // down as it approaches the top or bottom edge.
  // ------------------------------------------------------------------
  const zoomEls = Array.from(document.querySelectorAll(".zoom-scroll"));
  const updateZoomScroll = () => {
    if (!zoomEls.length || prefersReducedMotion.matches) return;
    const vh = window.innerHeight;
    zoomEls.forEach((el) => {
      const rect = el.getBoundingClientRect();
      const elCenter = rect.top + rect.height / 2;
      const normalized = Math.min(1, Math.max(-1, (elCenter - vh / 2) / (vh / 2)));
      const scale = 1.14 - Math.abs(normalized) * 0.32;
      el.style.transform = `scale(${scale.toFixed(3)})`;
    });
  };

  // Drive the progress rail and parallax off a single rAF-throttled
  // scroll listener so they never fight the engagement-scene loop above.
  let pageScrollTicking = false;
  const onPageScroll = () => {
    if (!pageScrollTicking) {
      pageScrollTicking = true;
      requestAnimationFrame(() => {
        updateScrollProgress();
        updateParallax();
        updateZoomScroll();
        pageScrollTicking = false;
      });
    }
  };
  updateScrollProgress();
  updateParallax();
  updateZoomScroll();
  window.addEventListener("scroll", onPageScroll, { passive: true });
  window.addEventListener("resize", onPageScroll, { passive: true });

});