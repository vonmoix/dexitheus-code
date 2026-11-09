const valueEl = document.getElementById("value");
const slider = document.getElementById("slider");
const blur = document.getElementById("blur");
const still = matchMedia("(prefers-reduced-motion: reduce)");

const EASE = 3;         // higher = reaches the target faster
const MAX_BLUR = 16;    // px of horizontal blur while the number is moving fast
const SHARP_BELOW = 3000; // speed (units/s) under which the blur fades out

let current = 0;
let target = Number(slider.value);
let raf = null;
let last = 0;

const format = (n) => Math.round(n).toLocaleString("en-US");
// Digits that already match the final value (from the left) are settled
function render() {
  const now = format(current);
  const end = format(target);
  let settled = 0;
  if (now.length === end.length) {
    while (settled < now.length && now[settled] === end[settled]) settled++;
  }
  valueEl.innerHTML = [...now]
    .map((ch, i) => `<span${i < settled ? "" : ' class="is-moving"'}>${ch}</span>`)
    .join("");
}
const setBlur = (x) => blur.setAttribute("stdDeviation", `${x.toFixed(2)},0`);

// Ease toward the target. Full blur while it races; it sharpens only on the final stretch
function tick(now) {
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;

  const prev = current;
  current += (target - current) * (1 - Math.exp(-dt * EASE));
  if (Math.abs(target - current) < 1) current = target;

  const speed = Math.abs(current - prev) / (dt || 1 / 60); // units per second
  setBlur(MAX_BLUR * Math.min(1, speed / SHARP_BELOW));
  render();

  if (current !== target) {
    raf = requestAnimationFrame(tick);
  } else {
    setBlur(0);
    raf = null;
  }
}

function go() {
  target = Number(slider.value);
  slider.setAttribute("aria-valuetext", format(target));

  if (still.matches) {
    current = target;
    setBlur(0);
    render();
    return;
  }
  if (!raf) {
    last = performance.now();
    raf = requestAnimationFrame(tick);
  }
}

slider.addEventListener("input", go);
requestAnimationFrame(go); // count up from 0 on load
