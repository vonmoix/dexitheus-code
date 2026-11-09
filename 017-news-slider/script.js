const viewport = document.querySelector(".news__viewport");
const slides = [...document.querySelectorAll(".news__slide")];
const highlight = document.querySelector(".news__highlight");
const dotsWrap = document.querySelector(".news__dots");
const [prev, next] = document.querySelectorAll(".news__arrow");
const finePointer = matchMedia("(hover: hover) and (pointer: fine)");

/* ── Dots ── */
const dots = slides.map((slide, i) => {
  const dot = document.createElement("button");
  dot.type = "button";
  dot.className = "news__dot";
  dot.setAttribute("aria-label", `Go to card ${i + 1}`);
  dot.addEventListener("click", () => goTo(i));
  dotsWrap.append(dot);
  return dot;
});

/* ── Which card is centred ── */
function currentIndex() {
  const centre = viewport.scrollLeft + viewport.clientWidth / 2;
  let best = 0;
  slides.forEach((s, i) => {
    const d = Math.abs(s.offsetLeft + s.offsetWidth / 2 - centre);
    const bestD = Math.abs(slides[best].offsetLeft + slides[best].offsetWidth / 2 - centre);
    if (d < bestD) best = i;
  });
  return best;
}

// While a smooth scroll is running, remember where it's heading so quick
// repeated clicks keep advancing instead of re-reading a half-scrolled position
let pending = null;
let pendingTimer;
const index = () => pending ?? currentIndex();

function goTo(i) {
  pending = Math.max(0, Math.min(slides.length - 1, i));
  const s = slides[pending];
  viewport.scrollTo({ left: s.offsetLeft + s.offsetWidth / 2 - viewport.clientWidth / 2 });
  clearTimeout(pendingTimer);
  pendingTimer = setTimeout(() => (pending = null), 700);
}

function sync() {
  const i = index();
  dots.forEach((d, j) => d.setAttribute("aria-current", String(i === j)));
  prev.disabled = i === 0;
  next.disabled = i === slides.length - 1;
}

prev.addEventListener("click", () => goTo(index() - 1));
next.addEventListener("click", () => goTo(index() + 1));

let ticking = false;
viewport.addEventListener("scroll", () => {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    if (pending !== null && currentIndex() === pending) pending = null;
    sync();
    ticking = false;
  });
});

// Arrow keys move between cards while focus is inside the slider
viewport.addEventListener("keydown", (e) => {
  if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
  e.preventDefault();
  goTo(index() + (e.key === "ArrowRight" ? 1 : -1));
  slides[pending].querySelector("a").focus({ preventScroll: true });
});

/* ── Gliding highlight behind the hovered / focused card ── */
let lit = null;

function light(card) {
  const slide = card.closest(".news__slide");
  const first = !highlight.classList.contains("is-on");
  if (first) highlight.style.transition = "opacity var(--duration-fast)"; // appear in place, don't fly in
  highlight.style.translate = `${slide.offsetLeft}px ${slide.offsetTop}px`;
  highlight.style.width = `${slide.offsetWidth}px`;
  highlight.style.height = `${slide.offsetHeight}px`;
  highlight.classList.add("is-on");
  if (first) requestAnimationFrame(() => (highlight.style.transition = ""));
  lit?.classList.remove("is-lit");
  lit = card;
  card.classList.add("is-lit");
}

function unlight() {
  highlight.classList.remove("is-on");
  lit?.classList.remove("is-lit");
  lit = null;
}

document.querySelectorAll(".card").forEach((card) => {
  card.addEventListener("pointerenter", () => finePointer.matches && light(card));
  card.addEventListener("focus", () => light(card));
});
viewport.addEventListener("pointerleave", unlight);
viewport.addEventListener("focusout", (e) => {
  if (!viewport.contains(e.relatedTarget)) unlight();
});

addEventListener("resize", () => {
  if (lit) light(lit);
  sync();
});

sync();
