const dot = document.getElementById("cursor-dot");
const ring = document.getElementById("cursor-ring");
let rx = 0,
  ry = 0,
  mx = 0,
  my = 0;

document.addEventListener("mousemove", (e) => {
  mx = e.clientX;
  my = e.clientY;
  dot.style.left = mx + "px";
  dot.style.top = my + "px";
});

(function lerpRing() {
  rx += (mx - rx) * 0.14;
  ry += (my - ry) * 0.14;
  ring.style.left = rx + "px";
  ring.style.top = ry + "px";
  requestAnimationFrame(lerpRing);
})();

/* ── MARQUEE ─────────────────────────────────────────── */
const items = ["Glitch", "Aurora", "Scramble", "Spotlight", "Noise"];
const track = document.getElementById("marquee");
const make = () =>
  items
    .map(
      (t) =>
        `<span class="marquee-item">${t}</span><span class="marquee-sep">✦</span>`
    )
    .join("");
track.innerHTML = make() + make(); // duplicate for seamless loop

/* ── TEXT SCRAMBLE ───────────────────────────────────── */
const CHARS = "!<>-_\\/[]{}—=+*^?#░▒▓│┤╡╢╖╕╣║╗╝╜╛┐└┴┬├─┼╞╟╚╔╩╦╠═╬╧╨╤╥╙╘╒╓╫╪┘┌";
const scrambleEl = document.getElementById("scramble-text");
const PHRASES = [
  "no libraries. no mercy.",
  "your cursor > their framework.",
  "ship it. no deps. no regrets.",
  "the browser is enough.",
  "pure css goes hard. ✦"
];
let phraseIdx = 0;
let scrambleTimer = null;

function scramble(el, newText) {
  clearInterval(scrambleTimer);
  const len = Math.max(el.innerText.length, newText.length);
  let iter = 0;
  scrambleTimer = setInterval(() => {
    el.innerText = newText
      .split("")
      .map((ch, i) => {
        if (i < iter) return newText[i];
        if (ch === " ") return " ";
        return CHARS[Math.floor(Math.random() * CHARS.length)];
      })
      .join("");
    if (iter >= len + 4) clearInterval(scrambleTimer);
    iter += 0.6;
  }, 38);
}

scrambleEl.addEventListener("mouseenter", () => {
  phraseIdx = (phraseIdx + 1) % PHRASES.length;
  scramble(scrambleEl, PHRASES[phraseIdx]);
});

scramble(scrambleEl, PHRASES[0]); // init

/* ── SPOTLIGHT CANVAS ────────────────────────────────── */
// Spotlight colours are read from the CSS tokens
const rootCss = getComputedStyle(document.documentElement);
const spotA = rootCss.getPropertyValue("--mostaza-500").trim() || "#F3CA20";
const spotB = rootCss.getPropertyValue("--mostaza-700").trim() || "#C9A40F";
const rgba = (hex, a) => {
  const n = parseInt(hex.replace("#", ""), 16);
  return `rgba(${n >> 16}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
};
const spotSection = document.querySelector(".spotlight-section");
const canvas = document.getElementById("spotlight-canvas");
const ctx = canvas.getContext("2d");
let slx = -999,
  sly = -999;

function resizeCanvas() {
  const r = spotSection.getBoundingClientRect();
  canvas.width = r.width;
  canvas.height = r.height;
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);

spotSection.addEventListener("mousemove", (e) => {
  const r = spotSection.getBoundingClientRect();
  slx = e.clientX - r.left;
  sly = e.clientY - r.top;
});

spotSection.addEventListener("mouseleave", () => {
  slx = -999;
  sly = -999;
});

(function drawSpotlight() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (slx !== -999) {
    const g = ctx.createRadialGradient(slx, sly, 0, slx, sly, 260);
    g.addColorStop(0, rgba(spotA, 0.14));
    g.addColorStop(0.5, rgba(spotB, 0.06));
    g.addColorStop(1, "transparent");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  requestAnimationFrame(drawSpotlight);
})();

/* ── SCROLL REVEAL ───────────────────────────────────── */
const reveals = document.querySelectorAll(".reveal");
const io = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) e.target.classList.add("in-view");
    });
  },
  { threshold: 0.12 }
);
reveals.forEach((el) => io.observe(el));

/* ── ANIMATED COUNTERS ───────────────────────────────── */
const counters = document.querySelectorAll(".stat-num");
const cio = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = +el.dataset.target;
      const dur = 1800;
      let start = null;
      const ease = (t) =>
        t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      (function tick(ts) {
        if (!start) start = ts;
        const p = Math.min((ts - start) / dur, 1);
        el.textContent = Math.floor(ease(p) * target).toLocaleString();
        if (p < 1) requestAnimationFrame(tick);
        else el.textContent = target.toLocaleString();
      })(performance.now());
      cio.unobserve(el);
    });
  },
  { threshold: 0.5 }
);
counters.forEach((el) => cio.observe(el));
