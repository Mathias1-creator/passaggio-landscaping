/* ============================================================
   Paesaggio Landscape — site behavior (vanilla JS, no deps)
   Nav / smooth scroll / scroll-reveal / gallery slider / form
   ============================================================ */
(function () {
  "use strict";

  // Signals CSS that JS is running (scroll-reveal styles only apply then)
  document.documentElement.classList.add("js");

  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Sticky nav: darken slightly once scrolled ---------- */
  var nav = document.querySelector(".site-nav");

  function onScroll() {
    nav.classList.toggle("scrolled", window.scrollY > 40);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile hamburger menu ---------- */
  var toggle = document.querySelector(".nav-toggle");
  var menu = document.getElementById("nav-menu");

  function setMenu(open) {
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    menu.classList.toggle("open", open);
  }

  toggle.addEventListener("click", function () {
    setMenu(toggle.getAttribute("aria-expanded") !== "true");
  });

  /* ---------- Smooth anchor scroll with fixed-nav offset ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener("click", function (event) {
      var href = link.getAttribute("href");
      if (href === "#") { // placeholder link (e.g. pending PDF) — do nothing
        event.preventDefault();
        return;
      }
      var target = document.querySelector(href);
      if (!target) return;
      event.preventDefault();
      setMenu(false); // close the mobile menu before scrolling

      var top = target.getBoundingClientRect().top + window.scrollY - nav.offsetHeight;
      window.scrollTo({
        top: Math.max(top, 0),
        behavior: prefersReducedMotion ? "auto" : "smooth"
      });

      // Move keyboard focus along with the visual scroll (skip link included)
      if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
      target.focus({ preventScroll: true });
    });
  });

  /* ---------- Scroll-reveal (fade-up) via IntersectionObserver ---------- */
  var revealEls = document.querySelectorAll(".reveal");

  if ("IntersectionObserver" in window && !prefersReducedMotion) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });

    revealEls.forEach(function (el) { revealObserver.observe(el); });
  } else {
    // No observer support (or reduced motion): show everything immediately
    revealEls.forEach(function (el) { el.classList.add("visible"); });
  }

  /* ---------- Gallery slider ---------- */
  var slider = document.querySelector(".slider");
  var track = slider.querySelector(".slider-track");
  var slides = slider.querySelectorAll(".slide");
  var dotsWrap = slider.querySelector(".slider-dots");
  var AUTO_ADVANCE_MS = 5000;
  var current = 0;
  var timer = null;

  // Build one dot per slide
  slides.forEach(function (_, i) {
    var dot = document.createElement("button");
    dot.type = "button";
    dot.setAttribute("aria-label", "Go to slide " + (i + 1));
    dot.addEventListener("click", function () {
      goTo(i);
      restartTimer();
    });
    dotsWrap.appendChild(dot);
  });
  var dots = dotsWrap.querySelectorAll("button");

  function goTo(index) {
    current = (index + slides.length) % slides.length; // wrap around
    track.style.transform = "translateX(-" + current * 100 + "%)";
    dots.forEach(function (dot, i) {
      if (i === current) {
        dot.setAttribute("aria-current", "true");
      } else {
        dot.removeAttribute("aria-current");
      }
    });
  }

  function restartTimer() {
    clearInterval(timer);
    // No auto-advance for reduced motion or while the tab is hidden
    if (prefersReducedMotion || document.hidden) return;
    timer = setInterval(function () { goTo(current + 1); }, AUTO_ADVANCE_MS);
  }

  slider.querySelector(".slider-arrow.prev").addEventListener("click", function () {
    goTo(current - 1);
    restartTimer();
  });
  slider.querySelector(".slider-arrow.next").addEventListener("click", function () {
    goTo(current + 1);
    restartTimer();
  });

  // Pause auto-advance while hovering or keyboard-focused; resume after
  slider.addEventListener("mouseenter", function () { clearInterval(timer); });
  slider.addEventListener("mouseleave", restartTimer);
  slider.addEventListener("focusin", function () { clearInterval(timer); });
  slider.addEventListener("focusout", function (event) {
    if (!slider.contains(event.relatedTarget)) restartTimer();
  });

  // Pause when the tab is hidden so slides don't jump on return
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) { clearInterval(timer); } else { restartTimer(); }
  });

  // Touch swipe support
  var touchStartX = null;
  slider.addEventListener("touchstart", function (event) {
    touchStartX = event.changedTouches[0].clientX;
    clearInterval(timer);
  }, { passive: true });

  slider.addEventListener("touchend", function (event) {
    if (touchStartX === null) return;
    var deltaX = event.changedTouches[0].clientX - touchStartX;
    if (Math.abs(deltaX) > 40) {
      goTo(deltaX < 0 ? current + 1 : current - 1);
    }
    touchStartX = null;
    restartTimer();
  }, { passive: true });

  goTo(0);
  restartTimer();

  /* ---------- Placeholder quote form (Tally embed replaces this) ---------- */
  var form = document.querySelector(".quote-form");
  var formStatus = form.querySelector(".form-status");

  form.addEventListener("submit", function (event) {
    event.preventDefault(); // placeholder only — no data is sent anywhere
    form.reset();
    formStatus.textContent = "Thanks — we'll be in touch!";
  });
})();
