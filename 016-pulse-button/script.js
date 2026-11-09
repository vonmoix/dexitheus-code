// Each click (or Enter/Space) sends out a new wave
const button = document.querySelector(".pulse-btn");

button.addEventListener("click", () => {
  const wave = document.createElement("span");
  wave.className = "pulse-btn__pulse";
  wave.setAttribute("aria-hidden", "true");
  wave.addEventListener("animationend", () => wave.remove(), { once: true });
  button.append(wave);
});
