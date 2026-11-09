const GAP = 10;     // space between trigger and floating element
const MARGIN = 16;  // minimum distance to the viewport edge
const OPPOSITE = { top: "bottom", bottom: "top", left: "right", right: "left" };
const touch = matchMedia("(hover: none)");

// Place a fixed element next to its trigger, flipping it if it doesn't fit.
function place(el, trigger, preferred) {
  const t = trigger.getBoundingClientRect();
  const w = el.offsetWidth;
  const h = el.offsetHeight;
  const vw = innerWidth;
  const vh = innerHeight;

  const fits = {
    top: t.top - GAP - h >= MARGIN,
    bottom: t.bottom + GAP + h <= vh - MARGIN,
    left: t.left - GAP - w >= MARGIN,
    right: t.right + GAP + w <= vw - MARGIN
  };
  const side =
    [preferred, OPPOSITE[preferred], "top", "bottom", "right", "left"].find((s) => fits[s]) ||
    preferred;

  const vertical = side === "top" || side === "bottom";
  let x = vertical ? t.left + t.width / 2 - w / 2 : side === "left" ? t.left - GAP - w : t.right + GAP;
  let y = vertical ? (side === "top" ? t.top - GAP - h : t.bottom + GAP) : t.top + t.height / 2 - h / 2;
  x = Math.min(Math.max(x, MARGIN), vw - MARGIN - w);
  y = Math.min(Math.max(y, MARGIN), vh - MARGIN - h);

  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  el.dataset.side = side;
  // Keep the arrow pointing at the trigger's centre after clamping
  el.style.setProperty(
    "--arrow",
    vertical ? `${t.left + t.width / 2 - x}px` : `${t.top + t.height / 2 - y}px`
  );
}

/* ── Tooltips ── */
const triggers = [...document.querySelectorAll(".tip-trigger")];
const placeTip = (btn) => place(btn.querySelector(".tip"), btn, btn.dataset.placement);
const closeTips = (except) =>
  triggers.forEach((b) => b !== except && b.classList.remove("is-open"));

triggers.forEach((btn) => {
  btn.addEventListener("pointerenter", () => placeTip(btn));
  btn.addEventListener("focus", () => placeTip(btn));
  // Touch screens have no hover: tap toggles the tooltip
  btn.addEventListener("click", () => {
    if (!touch.matches) return;
    closeTips(btn);
    if (btn.classList.toggle("is-open")) placeTip(btn);
  });
  btn.addEventListener("pointerleave", () => delete btn.dataset.dismissed);
  btn.addEventListener("blur", () => {
    delete btn.dataset.dismissed;
    btn.classList.remove("is-open");
  });
});

// Esc hides a visible tooltip; a tap anywhere else closes it on touch
document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  triggers.forEach((b) => (b.dataset.dismissed = ""));
  closeTips();
});
document.addEventListener("pointerdown", (e) => {
  if (!e.target.closest(".tip-trigger")) closeTips();
});

/* ── Popovers (native popover API: toggle, light dismiss and Esc come free) ── */
let openPop = null;

document.querySelectorAll(".pop").forEach((pop) => {
  const trigger = document.querySelector(`[popovertarget="${pop.id}"]`);
  pop.addEventListener("toggle", (e) => {
    if (e.newState === "open") {
      openPop = { pop, trigger };
      place(pop, trigger, pop.dataset.placement);
    } else if (openPop?.pop === pop) {
      openPop = null;
    }
  });
});

/* ── Keep everything attached on scroll and resize ── */
function reposition() {
  if (openPop) place(openPop.pop, openPop.trigger, openPop.pop.dataset.placement);
  triggers
    .filter((b) => b.matches(":hover, :focus-visible, .is-open"))
    .forEach(placeTip);
}
addEventListener("resize", reposition);
addEventListener("scroll", reposition, { capture: true, passive: true });
