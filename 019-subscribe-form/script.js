// Real form: the browser validates the email, JS only runs the animation states
const form = document.querySelector(".subscribe");
const input = form.querySelector(".subscribe__input");
const thanks = form.querySelector(".subscribe__thanks");
const still = matchMedia("(prefers-reduced-motion: reduce)");

const SWEEP = 700; // ms, matches --sweep in the CSS
const HOLD = 3000; // ms the thank-you stays before the form resets

form.addEventListener("submit", (e) => {
  e.preventDefault();
  if (form.dataset.state !== "idle") return;

  input.readOnly = true;
  form.dataset.state = "sending";

  setTimeout(() => {
    form.dataset.state = "done";
    thanks.textContent = "Thanks. You're on the list.";
  }, still.matches ? 0 : SWEEP);

  setTimeout(() => {
    form.reset();
    input.readOnly = false;
    thanks.textContent = "";
    form.dataset.state = "idle";
    input.focus();
  }, (still.matches ? 0 : SWEEP) + HOLD);
});
