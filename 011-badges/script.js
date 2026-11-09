// Counts above 99 collapse to "99+"; the full number stays in the accessible name.
const format = (n) => (n > 99 ? "99+" : String(n));
const badged = [...document.querySelectorAll(".icon-btn[data-count]")];

function setBadge(btn, show) {
  const n = Number(btn.dataset.count);
  btn.querySelector(".badge").textContent = format(n);
  btn.classList.toggle("is-cleared", !show);
  btn.setAttribute(
    "aria-label",
    show ? `${btn.dataset.label}, ${n.toLocaleString("en")} new` : btn.dataset.label
  );
}

badged.forEach((btn) => {
  setBadge(btn, true);
  btn.addEventListener("click", () => setBadge(btn, false));
});

document.querySelector(".reset").addEventListener("click", () => {
  badged.forEach((btn) => setBadge(btn, true));
});
