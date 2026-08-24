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
      if (elements[key].textContent !== pad(value)) {
        elements[key].style.transform = "translateY(-5px)";
        elements[key].textContent = pad(value);
        requestAnimationFrame(() => {
          setTimeout(() => {
            elements[key].style.transform = "translateY(0)";
          }, 30);
        });
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
});
