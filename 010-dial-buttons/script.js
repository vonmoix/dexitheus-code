(function () {
  const CLASSES = {
    BTN: "dial-btn",
    ACTIVE: "dial-btn--active",
    OPTION: "dial-btn--option"
  };

  const mainBtns = document.querySelectorAll(`.${CLASSES.BTN}:not(.${CLASSES.OPTION})`);

  const close = (btn) => {
    btn.classList.remove(CLASSES.ACTIVE);
    btn.setAttribute("aria-expanded", "false");
  };

  // Open on click; the next click anywhere closes the dial
  const toggleActive = (e) => {
    const btn = e.currentTarget;
    if (btn.classList.contains(CLASSES.ACTIVE)) return;

    btn.classList.add(CLASSES.ACTIVE);
    btn.setAttribute("aria-expanded", "true");

    const processClick = (evt) => {
      if (evt === e) return;
      close(btn);
      document.removeEventListener("click", processClick);
    };
    document.addEventListener("click", processClick);
  };

  mainBtns.forEach((btn) => btn.addEventListener("click", toggleActive));

  // Escape closes any open dial
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    mainBtns.forEach((btn) => {
      if (btn.classList.contains(CLASSES.ACTIVE)) {
        close(btn);
        btn.focus();
      }
    });
  });

  // Options still run their own action
  document.querySelectorAll(`.${CLASSES.OPTION}`).forEach((btn) => {
    btn.addEventListener("click", (e) => {
      console.info(`Clicked ${e.currentTarget.getAttribute("data-option")}`);
    });
  });
})();
