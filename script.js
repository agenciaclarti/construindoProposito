"use strict";

const EVENT_CONFIG = {
  masterCheckoutUrl: "",
  vipCheckoutUrl: ""
};

document.documentElement.classList.remove("no-js");
document.documentElement.classList.add("js");

document.addEventListener("DOMContentLoaded", () => {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const header = document.querySelector("[data-header]");
  const progressBar = document.querySelector(".page-progress span");
  const hero = document.querySelector(".hero");
  const heroOrbit = document.querySelector(".hero-orbit");
  const tickets = document.querySelector("#ingressos");
  const mobileCta = document.querySelector("[data-mobile-cta]");
  const menuToggle = document.querySelector("[data-menu-toggle]");
  const mobileMenu = document.querySelector("[data-mobile-menu]");
  const toast = document.querySelector("[data-toast]");
  const navLinks = [...document.querySelectorAll('.desktop-nav a[href^="#"]')];
  let toastTimer;
  let scrollQueued = false;
  let lastFocusedElement = null;

  document.querySelectorAll("[data-current-year]").forEach((year) => {
    year.textContent = String(new Date().getFullYear());
  });

  const showToast = (message) => {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 4200);
  };

  const closeMenu = ({ restoreFocus = true } = {}) => {
    if (!menuToggle || !mobileMenu) return;
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Abrir menu");
    mobileMenu.setAttribute("aria-hidden", "true");
    mobileMenu.classList.remove("is-open");
    document.body.classList.remove("menu-open");
    if (restoreFocus && lastFocusedElement) lastFocusedElement.focus();
  };

  const openMenu = () => {
    if (!menuToggle || !mobileMenu) return;
    lastFocusedElement = document.activeElement;
    menuToggle.setAttribute("aria-expanded", "true");
    menuToggle.setAttribute("aria-label", "Fechar menu");
    mobileMenu.setAttribute("aria-hidden", "false");
    mobileMenu.classList.add("is-open");
    document.body.classList.add("menu-open");
    window.requestAnimationFrame(() => mobileMenu.querySelector("a")?.focus());
  };

  menuToggle?.addEventListener("click", () => {
    const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
    isOpen ? closeMenu() : openMenu();
  });

  mobileMenu?.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", () => closeMenu({ restoreFocus: false }));
  });

  document.addEventListener("keydown", (event) => {
    const menuIsOpen = menuToggle?.getAttribute("aria-expanded") === "true";
    if (!menuIsOpen || !mobileMenu) return;

    if (event.key === "Escape") {
      closeMenu();
      return;
    }

    if (event.key !== "Tab") return;
    const focusable = [...mobileMenu.querySelectorAll("a, button")].filter(
      (element) => !element.hasAttribute("disabled")
    );
    if (!focusable.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  const updateOnScroll = () => {
    const scrollTop = window.scrollY;
    const documentHeight = document.documentElement.scrollHeight - window.innerHeight;

    header?.classList.toggle("is-scrolled", scrollTop > 24);

    if (progressBar) {
      const progress = documentHeight > 0 ? Math.min(scrollTop / documentHeight, 1) : 0;
      progressBar.style.transform = "scaleX(" + progress + ")";
    }

    if (mobileCta && hero && tickets) {
      const pastHero = scrollTop > hero.offsetHeight * 0.68;
      const beforeTickets = tickets.getBoundingClientRect().top > window.innerHeight * 0.66;
      mobileCta.classList.toggle("is-visible", pastHero && beforeTickets);
    }

    if (heroOrbit && !reducedMotion && scrollTop < window.innerHeight * 1.3) {
      heroOrbit.style.transform = "translate3d(0," + scrollTop * 0.035 + "px,0)";
    }

    scrollQueued = false;
  };

  const requestScrollUpdate = () => {
    if (scrollQueued) return;
    scrollQueued = true;
    window.requestAnimationFrame(updateOnScroll);
  };

  window.addEventListener("scroll", requestScrollUpdate, { passive: true });
  window.addEventListener("resize", requestScrollUpdate, { passive: true });
  updateOnScroll();

  const revealElements = document.querySelectorAll("[data-reveal]");
  if ("IntersectionObserver" in window && !reducedMotion) {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );
    revealElements.forEach((element) => revealObserver.observe(element));
  } else {
    revealElements.forEach((element) => element.classList.add("is-visible"));
  }

  if ("IntersectionObserver" in window) {
    const purpose = document.querySelector(".purpose");
    if (purpose) {
      const purposeObserver = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            purpose.classList.add("is-visible");
            purposeObserver.disconnect();
          }
        },
        { threshold: 0.16 }
      );
      purposeObserver.observe(purpose);
    }

    const sections = document.querySelectorAll("[data-nav-section]");
    const activeObserver = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visibleEntry) return;

        navLinks.forEach((link) => {
          const isActive = link.getAttribute("href") === "#" + visibleEntry.target.id;
          link.classList.toggle("is-active", isActive);
          if (isActive) link.setAttribute("aria-current", "location");
          else link.removeAttribute("aria-current");
        });
      },
      { rootMargin: "-30% 0px -58% 0px", threshold: [0.02, 0.2] }
    );
    sections.forEach((section) => activeObserver.observe(section));
  }

  document.querySelectorAll("[data-checkout]").forEach((button) => {
    button.addEventListener("click", () => {
      const ticket = button.getAttribute("data-checkout");
      const url = ticket === "vip" ? EVENT_CONFIG.vipCheckoutUrl : EVENT_CONFIG.masterCheckoutUrl;

      if (!url) {
        showToast("O link de compra deste ingresso será disponibilizado em breve.");
        return;
      }

      window.location.assign(url);
    });
  });

  document.querySelectorAll("[data-placeholder-link]").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      showToast("Este conteúdo institucional será disponibilizado em breve.");
    });
  });
});
