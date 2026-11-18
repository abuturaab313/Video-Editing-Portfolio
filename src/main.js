import { site } from "./config.js";
import { projectDetails } from "./projects.js";
import { createHologram } from "./core.js";

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
const compactView = () => window.matchMedia("(max-width: 760px)").matches;

/* -------------------------------------------------------------------------
   Live date — keeps the interface stamp current without a rebuild
   ------------------------------------------------------------------------- */
function setupDate() {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = String(now.getFullYear());
  const short = `${day} / ${month} / ${year.slice(-2)}`;

  document.querySelectorAll("[data-date]").forEach((node) => {
    node.textContent = `${short} — creative interface`;
  });

  document.querySelectorAll("[data-year]").forEach((node) => {
    node.textContent = year;
  });
}

/* -------------------------------------------------------------------------
   Project media — playable previews, before/after comparison, stills
   Add paths in src/projects.js; entries without media keep their concept art.
   ------------------------------------------------------------------------- */
const isSource = (value) => typeof value === "string" && value.trim().length > 0;
const isVideoSource = (value) => /\.(mp4|webm|mov|m4v|ogv)(\?.*)?$/i.test(value.trim());

function mediaElement(src, alt, { autoplay = true, controls = false } = {}) {
  if (isVideoSource(src)) {
    const video = document.createElement("video");
    video.src = src;
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = "metadata";
    video.autoplay = autoplay;
    if (controls) video.controls = true;
    if (alt) video.setAttribute("aria-label", alt);
    if (autoplay) {
      const play = video.play();
      if (play && typeof play.catch === "function") play.catch(() => {});
    }
    return video;
  }

  const img = document.createElement("img");
  img.src = src;
  img.alt = alt || "";
  img.loading = "lazy";
  img.decoding = "async";
  return img;
}

function buildCompare(data, media) {
  const figure = document.createElement("div");
  figure.className = "compare";
  figure.style.setProperty("--split", "50%");

  const layer = (src, label, variant) => {
    const wrap = document.createElement("div");
    wrap.className = `compare__layer compare__layer--${variant}`;
    wrap.append(mediaElement(src, `${data.title} — ${label}`));
    const tag = document.createElement("span");
    tag.className = "compare__tag";
    tag.textContent = label;
    wrap.append(tag);
    return wrap;
  };

  const after = layer(media.after, "After", "after");
  after.style.clipPath = "inset(0 0 0 var(--split))";

  const range = document.createElement("input");
  range.type = "range";
  range.min = "0";
  range.max = "100";
  range.value = "50";
  range.className = "compare__range";
  range.setAttribute("aria-label", "Drag to compare the before and after edit");
  range.addEventListener("input", () => {
    figure.style.setProperty("--split", `${range.value}%`);
  });

  const handle = document.createElement("span");
  handle.className = "compare__handle";
  handle.setAttribute("aria-hidden", "true");

  figure.append(layer(media.before, "Before", "before"), after, handle, range);
  return figure;
}

function buildProjectMedia(data, context = "panel") {
  const media = data.media || {};
  const stills = Array.isArray(media.stills)
    ? media.stills.filter((item) => item && isSource(item.src))
    : [];
  const hasCompare = isSource(media.before) && isSource(media.after);
  const hasVideo = isSource(media.video);

  if (!hasCompare && !hasVideo && !stills.length) return null;

  const wrap = document.createElement("div");
  wrap.className = `media media--${context}`;

  if (hasCompare) {
    // Interactive slider only in the panel; the card button cannot nest a range input.
    wrap.append(
      context === "card"
        ? mediaElement(media.after, `${data.title} — after edit`)
        : buildCompare(data, media)
    );
  } else if (hasVideo) {
    const video = mediaElement(
      media.video,
      `${data.title} playable preview`,
      { autoplay: true, controls: context === "panel" }
    );
    if (isSource(media.poster)) video.poster = media.poster;
    wrap.append(video);
  } else {
    const gallery = document.createElement("div");
    gallery.className = "media__stills";
    stills.slice(0, 3).forEach((item) => {
      gallery.append(mediaElement(item.src, item.alt || `${data.title} still`));
    });
    wrap.append(gallery);
  }

  const flag = document.createElement("span");
  flag.className = "media__flag";
  flag.textContent = hasCompare
    ? context === "card"
      ? "Demo / concept · before → after"
      : "Demo / concept · drag to compare"
    : "Demo / concept · preview";
  wrap.append(flag);

  return wrap;
}

function applyCardMedia() {
  document.querySelectorAll(".entry__open").forEach((trigger) => {
    const id = trigger.closest("[data-project]")?.dataset.project;
    const data = projectDetails[id];
    const screen = trigger.querySelector(".entry__screen");
    if (!data || !screen) return;

    const node = buildProjectMedia(data, "card");
    if (!node) return;

    screen.classList.remove("art");
    [...screen.classList]
      .filter((name) => name.startsWith("art--"))
      .forEach((name) => screen.classList.remove(name));
    screen.classList.add("has-media");
    screen.replaceChildren(node);

    const hover = document.createElement("span");
    hover.className = "entry__hover";
    hover.setAttribute("aria-hidden", "true");
    hover.textContent = "Open archive entry";
    screen.append(hover);
  });
}

/* -------------------------------------------------------------------------
   Boot sequence
   ------------------------------------------------------------------------- */
let bootFinished = false;

function finishBoot(boot, timers) {
  if (bootFinished) return;
  bootFinished = true;
  timers.forEach((id) => window.clearTimeout(id));
  document.body.classList.add("is-entered");

  try {
    sessionStorage.setItem("asys-booted", "1");
  } catch (error) {
    /* storage unavailable — the sequence simply plays again next visit */
  }

  if (!boot) {
    setupReveals();
    return;
  }

  const bar = boot.querySelector("[data-boot-progress]");
  if (bar) bar.style.width = "100%";
  boot.classList.add("is-done");

  window.setTimeout(() => {
    boot.hidden = true;
    setupReveals();
  }, 850);
}

function setupBoot() {
  const boot = document.querySelector("[data-boot]");
  const timers = [];
  const sessionSkip = document.documentElement.classList.contains("boot-skipped");

  if (!boot || sessionSkip || reduceMotion) {
    if (boot) {
      boot.classList.add("is-done");
      boot.hidden = true;
    }
    finishBoot(null, timers);
    return;
  }

  const compact = compactView();
  const step = (index) =>
    boot.querySelectorAll(`[data-boot-step="${index}"]`);

  const mark = (index) => {
    step(index).forEach((el) => el.classList.add("is-on"));
  };

  const bar = boot.querySelector("[data-boot-progress]");
  const total = compact ? 2500 : 4300;
  const started = performance.now();

  const tick = () => {
    if (bootFinished) return;
    if (bar) {
      const pct = Math.min(((performance.now() - started) / total) * 100, 100);
      bar.style.width = `${pct.toFixed(1)}%`;
    }
    if (!bootFinished) window.requestAnimationFrame(tick);
  };
  window.requestAnimationFrame(tick);

  const at = (delay, fn) => timers.push(window.setTimeout(fn, delay));

  if (compact) {
    at(160, () => mark(1));
    at(820, () => mark(2));
    at(1420, () => mark(3));
    at(total, () => finishBoot(boot, timers));
  } else {
    at(360, () => mark(1));
    at(1500, () => mark(2));
    at(2420, () => mark(3));
    at(total, () => finishBoot(boot, timers));
  }

  const skip = boot.querySelector("[data-boot-skip]");
  skip?.addEventListener("click", () => finishBoot(boot, timers));
  boot.addEventListener("click", (event) => {
    if (event.target === boot) finishBoot(boot, timers);
  });

  const onKey = (event) => {
    if (event.key === "Escape") finishBoot(boot, timers);
  };
  document.addEventListener("keydown", onKey);

  // Hard fail-safe: never trap the visitor behind the intro.
  at(8200, () => finishBoot(boot, timers));
}

/* -------------------------------------------------------------------------
   Holographic core
   ------------------------------------------------------------------------- */
function setupHologram() {
  const canvas = document.querySelector("[data-holo]");
  const wrap = canvas?.closest(".holo");
  if (!canvas || !wrap) return;

  let instance = null;
  let attempts = 0;

  const init = () => {
    if (instance) return;
    // A background tab can refuse a WebGL context, and a hidden canvas has no
    // layout box yet, so wait for both a visible box and a spare attempt.
    if (!canvas.getBoundingClientRect().width) return;
    attempts += 1;

    let holo = null;
    try {
      holo = createHologram(canvas, { reducedMotion: reduceMotion });
    } catch (error) {
      holo = null;
    }

    if (holo) {
      instance = holo;
      wrap.classList.add("is-webgl");
    } else if (attempts < 3) {
      window.setTimeout(init, 700 * attempts);
    }
  };

  init();
  window.addEventListener("load", init, { once: true });
  window.addEventListener("resize", init, { passive: true });
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) init();
  });
}

/* -------------------------------------------------------------------------
   HUD: scroll state, progress, active section
   ------------------------------------------------------------------------- */
function setupHeader() {
  const header = document.querySelector("[data-header]");
  const progress = document.querySelector("[data-scroll-progress]");
  if (!header) return;

  let ticking = false;
  const update = () => {
    ticking = false;
    header.classList.toggle("is-scrolled", window.scrollY > 20);
    if (progress) {
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      const ratio = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
      progress.style.transform = `scaleX(${ratio.toFixed(4)})`;
    }
  };

  update();
  window.addEventListener(
    "scroll",
    () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    },
    { passive: true }
  );

  const links = [...document.querySelectorAll(".hud__link")];
  const sections = links
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);

  if (!sections.length || !("IntersectionObserver" in window)) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach((link) => {
          link.classList.toggle(
            "is-active",
            link.getAttribute("href") === `#${entry.target.id}`
          );
        });
      });
    },
    { rootMargin: "-42% 0px -52% 0px", threshold: 0 }
  );

  sections.forEach((section) => observer.observe(section));

  // Guarantee the home state at the very top of the page.
  const syncTop = () => {
    if (window.scrollY > 40) return;
    links.forEach((link) => {
      link.classList.toggle("is-active", link.getAttribute("href") === "#home");
    });
  };
  window.addEventListener("scroll", syncTop, { passive: true });
  syncTop();
}

/* -------------------------------------------------------------------------
   Mobile navigation
   ------------------------------------------------------------------------- */
function setupMobileMenu() {
  const menu = document.querySelector("[data-mobile-menu]");
  const toggle = document.querySelector("[data-menu-toggle]");
  if (!menu || !toggle) return;

  const links = menu.querySelectorAll("a");
  const label = toggle.querySelector(".hud__menu-label");

  const setState = (open, returnFocus = true) => {
    toggle.setAttribute("aria-expanded", String(open));
    menu.setAttribute("aria-hidden", String(!open));
    menu.classList.toggle("is-open", open);
    document.body.classList.toggle("is-locked", open);
    if (label) label.textContent = open ? "Close" : "Index";

    if (open) window.setTimeout(() => links[0]?.focus(), 60);
    else if (returnFocus) toggle.focus();
  };

  toggle.addEventListener("click", () => {
    setState(toggle.getAttribute("aria-expanded") !== "true");
  });

  links.forEach((link) => link.addEventListener("click", () => setState(false, false)));

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menu.classList.contains("is-open")) setState(false);
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 980 && menu.classList.contains("is-open")) {
      setState(false, false);
    }
  });
}

/* -------------------------------------------------------------------------
   Reveals / workflow progress
   ------------------------------------------------------------------------- */
function setupReveals() {
  const items = [...document.querySelectorAll("[data-reveal]")];
  if (!items.length) return;

  if (reduceMotion || !("IntersectionObserver" in window)) {
    items.forEach((item) => item.classList.add("is-in"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        obs.unobserve(entry.target);
      });
    },
    { rootMargin: "0px 0px -6% 0px", threshold: 0.08 }
  );

  items.forEach((item) => observer.observe(item));
}

function setupWorkflow() {
  const stages = document.querySelector("[data-stages]");
  const fill = document.querySelector("[data-stages-fill]");
  if (!stages || !fill) return;

  const update = () => {
    const rect = stages.getBoundingClientRect();
    const start = window.innerHeight * 0.78;
    const end = window.innerHeight * 0.18;
    const progress = (start - rect.top) / (rect.height + (start - end));
    const clamped = Math.max(0, Math.min(progress, 1));
    fill.style.setProperty("--p", `${(clamped * 100).toFixed(1)}%`);
    fill.parentElement.style.setProperty("--p", `${(clamped * 100).toFixed(1)}%`);
  };

  if (reduceMotion) {
    fill.style.setProperty("--p", "100%");
    fill.parentElement.style.setProperty("--p", "100%");
    return;
  }

  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(() => {
      ticking = false;
      update();
    });
  };

  update();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
}

/* -------------------------------------------------------------------------
   Decorative bits: timeline waveform, cursor halo
   ------------------------------------------------------------------------- */
function setupDetails() {
  document.querySelectorAll("[data-wave]").forEach((wave) => {
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < 34; i += 1) {
      const bar = document.createElement("i");
      const height = 14 + Math.round(Math.abs(Math.sin(i * 1.47 + 0.4)) * 82);
      bar.style.height = `${height}%`;
      bar.style.opacity = String(0.3 + (height / 100) * 0.7);
      fragment.appendChild(bar);
    }
    wave.replaceChildren(fragment);
  });

  const halo = document.querySelector("[data-cursor]");
  if (!halo || reduceMotion || !finePointer) return;

  let x = 0;
  let y = 0;
  let seen = false;

  window.addEventListener(
    "pointermove",
    (event) => {
      x = event.clientX;
      y = event.clientY;
      if (!seen) {
        seen = true;
        halo.classList.add("is-active");
      }
      halo.style.left = `${x}px`;
      halo.style.top = `${y}px`;
    },
    { passive: true }
  );

  document.addEventListener("pointerover", (event) => {
    const interactive = event.target.closest(
      "a, button, input, select, textarea, .entry__screen"
    );
    halo.classList.toggle("is-hovering", Boolean(interactive));
  });
}

/* -------------------------------------------------------------------------
   Archive panel tilt
   ------------------------------------------------------------------------- */
function setupTilt() {
  if (!finePointer || reduceMotion) return;

  document.querySelectorAll("[data-tilt]").forEach((screen) => {
    const card = screen.closest(".entry__open") || screen;

    card.addEventListener("pointermove", (event) => {
      const rect = screen.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width - 0.5;
      const py = (event.clientY - rect.top) / rect.height - 0.5;
      screen.style.setProperty("--ry", `${(px * 5).toFixed(2)}deg`);
      screen.style.setProperty("--rx", `${(-py * 5).toFixed(2)}deg`);
    });

    card.addEventListener("pointerleave", () => {
      screen.style.setProperty("--rx", "0deg");
      screen.style.setProperty("--ry", "0deg");
    });
  });
}

/* -------------------------------------------------------------------------
   Project panel
   ------------------------------------------------------------------------- */
function setupProjects() {
  const dialog = document.getElementById("project-dialog");
  if (!dialog) return;

  const triggers = [...document.querySelectorAll(".entry__open")];
  if (!triggers.length) return;

  const media = dialog.querySelector("[data-dialog-media]");
  const title = dialog.querySelector("[data-dialog-title]");
  const category = dialog.querySelector("[data-dialog-cat]");
  const lead = dialog.querySelector("[data-dialog-lead]");
  const direction = dialog.querySelector("[data-dialog-direction]");
  const scope = dialog.querySelector("[data-dialog-scope]");
  const disclosure = dialog.querySelector("[data-dialog-disclosure]");
  const closeBtn = dialog.querySelector("[data-dialog-close]");
  const prevBtn = dialog.querySelector("[data-dialog-prev]");
  const nextBtn = dialog.querySelector("[data-dialog-next]");
  const cta = dialog.querySelector("[data-dialog-cta]");

  let current = 0;

  const renderList = (list, items = []) => {
    if (!list) return;
    list.replaceChildren(
      ...items.map((text) => {
        const li = document.createElement("li");
        li.textContent = text;
        return li;
      })
    );
  };

  const open = (index) => {
    const trigger = triggers[index];
    if (!trigger) return;
    const id = trigger.closest("[data-project]")?.dataset.project;
    const data = projectDetails[id];
    if (!data) return;

    current = index;
    const art = trigger.querySelector(".entry__screen");
    const mediaNode = buildProjectMedia(data, "panel");
    if (mediaNode && media) {
      media.replaceChildren(mediaNode);
    } else if (art && media) {
      const clone = art.cloneNode(true);
      clone.removeAttribute("data-tilt");
      media.replaceChildren(clone);
    }

    if (title) title.textContent = data.title;
    if (category) category.textContent = data.category;
    if (lead) lead.textContent = data.lead;
    renderList(direction, data.direction);
    renderList(scope, data.scope);
    if (disclosure) disclosure.textContent = data.disclosure;

    dialog.showModal();
    document.body.classList.add("is-locked");
    dialog.querySelector(".panel__body")?.scrollTo({ top: 0 });
  };

  const step = (delta) => open((current + delta + triggers.length) % triggers.length);

  triggers.forEach((trigger, index) => {
    trigger.addEventListener("click", () => open(index));
  });

  applyCardMedia();

  closeBtn?.addEventListener("click", () => dialog.close());
  prevBtn?.addEventListener("click", () => step(-1));
  nextBtn?.addEventListener("click", () => step(1));
  cta?.addEventListener("click", () => dialog.close());

  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });

  dialog.addEventListener("close", () => {
    document.body.classList.remove("is-locked");
    triggers[current]?.focus({ preventScroll: true });
  });

  dialog.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      step(1);
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      step(-1);
    }
  });
}

/* -------------------------------------------------------------------------
   Inquiry form → WhatsApp
   ------------------------------------------------------------------------- */
const isValidEmail = (value) =>
  typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());

function setupForm() {
  const form = document.querySelector("[data-inquiry-form]");
  if (!form) return;

  const status = form.querySelector("[data-form-status]");
  const submit = form.querySelector('button[type="submit"]');

  const rules = {
    name: (value) => (value.trim().length < 2 ? "Please enter your name." : ""),
    email: (value) => (!isValidEmail(value) ? "Enter a valid email address." : ""),
    projectType: (value) => (!value ? "Choose a project type." : ""),
    description: (value) =>
      value.trim().length < 10
        ? "Tell me a little more (at least 10 characters)."
        : "",
  };

  const fieldOf = (input) => input.closest(".field");

  const showError = (input, message) => {
    const field = fieldOf(input);
    const error = field?.querySelector("[data-error]");
    if (!field) return;
    field.classList.toggle("is-invalid", Boolean(message));
    if (error) error.textContent = message;
    input.setAttribute("aria-invalid", message ? "true" : "false");
  };

  const validate = (input) => {
    const rule = rules[input.name];
    if (!rule) return true;
    const message = rule(input.value);
    showError(input, message);
    return !message;
  };

  const controls = [...form.querySelectorAll("input, select, textarea")].filter(
    (input) => rules[input.name]
  );

  controls.forEach((input) => {
    input.addEventListener("blur", () => validate(input));
    input.addEventListener("input", () => {
      if (fieldOf(input)?.classList.contains("is-invalid")) validate(input);
    });
    input.addEventListener("change", () => {
      if (fieldOf(input)?.classList.contains("is-invalid")) validate(input);
    });
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (status) status.textContent = "";

    const invalid = controls.filter((input) => !validate(input));
    if (invalid.length) {
      invalid[0].focus();
      return;
    }

    const data = new FormData(form);
    const name = String(data.get("name") || "").trim();
    const email = String(data.get("email") || "").trim();
    const projectType = String(data.get("projectType") || "Not specified");
    const budget = String(data.get("budget") || "").trim();
    const description = String(data.get("description") || "").trim();

    const message = [
      site.whatsappMessage,
      "",
      `Name: ${name}`,
      `Email: ${email}`,
      `Project type: ${projectType}`,
      `Budget: ${budget || "Not sure yet"}`,
      "",
      "Project details:",
      description,
    ].join("\n");

    const url = `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(message)}`;

    if (submit) submit.setAttribute("aria-busy", "true");
    // Keep the window reference so a blocked popup is reported honestly.
    // "noopener" in the features string makes window.open return null.
    const win = window.open(url, "_blank");
    if (win) win.opener = null;
    if (submit) submit.removeAttribute("aria-busy");

    if (!status) return;
    if (win) {
      status.textContent =
        "Channel open — WhatsApp is loading your brief in a new tab. Press send there.";
    } else {
      status.replaceChildren(
        document.createTextNode("The new tab was blocked. "),
        Object.assign(document.createElement("a"), {
          href: url,
          target: "_blank",
          rel: "noopener noreferrer",
          textContent: "Open WhatsApp manually",
        }),
        document.createTextNode(".")
      );
    }
  });
}

/* -------------------------------------------------------------------------
   Init
   ------------------------------------------------------------------------- */
function init() {
  setupDate();
  setupHologram();
  setupHeader();
  setupMobileMenu();
  setupWorkflow();
  setupDetails();
  setupTilt();
  setupProjects();
  setupForm();
  setupBoot();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init, { once: true });
} else {
  init();
}
