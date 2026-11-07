const canvas = document.getElementById("field");
const ctx = canvas.getContext("2d");
const css = getComputedStyle(document.documentElement);
const fg = css.getPropertyValue("--dx-fg").trim();
const bg = css.getPropertyValue("--dx-bg").trim();
const still = matchMedia("(prefers-reduced-motion: reduce)");

const LINK = 150;       // max distance for a line between two particles
const REPEL = 200;      // radius of the pointer's repulsion
const SPEED = 1.6;      // px per frame at 60 fps
const MAX = 400;        // cap so clicking can't freeze the tab

let w, h, dpr;
let particles = [];
let pointer = null;

const rand = (min, max) => min + Math.random() * (max - min);

function makeParticle(x = rand(0, w), y = rand(0, h)) {
  const a = rand(0, Math.PI * 2);
  return { x, y, vx: Math.cos(a) * SPEED, vy: Math.sin(a) * SPEED, r: rand(0.8, 3) };
}

// Same density as the original particles.js setup: 80 per 800×800 area
const targetCount = () => Math.round(Math.min(Math.max((w * h) / 10000, 40), 200));

function resize() {
  dpr = Math.min(devicePixelRatio || 1, 2);
  w = innerWidth;
  h = innerHeight;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const n = targetCount();
  while (particles.length < n) particles.push(makeParticle());
  if (particles.length > n) particles.length = n;
  if (still.matches) draw();
}

function step(dt) {
  for (const p of particles) {
    // Push away from the pointer, stronger the closer it is
    if (pointer) {
      const dx = p.x - pointer.x;
      const dy = p.y - pointer.y;
      const d = Math.hypot(dx, dy);
      if (d < REPEL && d > 0.1) {
        const force = (1 - d / REPEL) * 12 * dt;
        p.x += (dx / d) * force;
        p.y += (dy / d) * force;
      }
    }
    p.x += p.vx * dt;
    p.y += p.vy * dt;

    // Leave one edge, come back on the opposite one
    if (p.x < -10) p.x = w + 10;
    else if (p.x > w + 10) p.x = -10;
    if (p.y < -10) p.y = h + 10;
    else if (p.y > h + 10) p.y = -10;
  }
}

function draw() {
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = fg;
  ctx.fillStyle = fg;
  ctx.lineWidth = 1;

  for (let i = 0; i < particles.length; i++) {
    const a = particles[i];
    for (let j = i + 1; j < particles.length; j++) {
      const b = particles[j];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (d < LINK) {
        ctx.globalAlpha = 0.4 * (1 - d / LINK);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }
  }

  ctx.globalAlpha = 0.8;
  for (const p of particles) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

let last = performance.now();
function frame(now) {
  const dt = Math.min((now - last) / 16.67, 3); // frame-rate independent, capped after tab switches
  last = now;
  if (!still.matches) {
    step(dt);
    draw();
  }
  requestAnimationFrame(frame);
}

/* ── Interaction ── */
const toCanvas = (e) => ({ x: e.clientX, y: e.clientY });

canvas.addEventListener("pointermove", (e) => (pointer = toCanvas(e)));
canvas.addEventListener("pointerleave", () => (pointer = null));
canvas.addEventListener("pointerup", (e) => {
  if (e.pointerType !== "mouse") pointer = null;
});
canvas.addEventListener("pointerdown", (e) => {
  const { x, y } = toCanvas(e);
  for (let i = 0; i < 4; i++) particles.push(makeParticle(x + rand(-4, 4), y + rand(-4, 4)));
  if (particles.length > MAX) particles.splice(0, particles.length - MAX);
  if (still.matches) draw();
});

addEventListener("resize", resize);
still.addEventListener("change", () => still.matches && draw());

resize();
draw();
requestAnimationFrame(frame);
