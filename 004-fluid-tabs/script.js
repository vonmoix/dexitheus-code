const nav = document.querySelector('.tabs');
const links = [...nav.querySelectorAll('a')];
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const ease = getComputedStyle(document.documentElement)
  .getPropertyValue('--ease-out').trim() || 'ease-out';

// Indicator element
const line = document.createElement('span');
line.className = 'tabs__line';
line.setAttribute('aria-hidden', 'true');
nav.appendChild(line);

let current = nav.querySelector('[aria-current="page"]') || links[0];
let state = { x: 0, w: 0 };
let anim = null;

const frame = ({ x, w }) => ({ transform: `translateX(${x}px)`, width: `${w}px` });
const rect = (a) => ({ x: a.offsetLeft, w: a.offsetWidth });

const set = (s) => {
  state = s;
  Object.assign(line.style, frame(s));
};

// Place the indicator without animating (initial load, fonts, resize)
const place = () => {
  if (anim) { anim.cancel(); anim = null; }
  set(rect(current));
};

place();
document.fonts.ready.then(place);
window.addEventListener('resize', place);

// Two-step move: stretch to cover the new tab, then shrink into it
const stretchTo = (a) => {
  if (anim) {
    anim.commitStyles();
    anim.cancel();
    const m = new DOMMatrix(getComputedStyle(line).transform);
    state = { x: m.m41, w: line.offsetWidth };
  }

  const from = state;
  const to = rect(a);
  const mid = to.x >= from.x
    ? { x: from.x, w: to.x + to.w - from.x }
    : { x: to.x, w: from.x + from.w - to.x };

  anim = line.animate(
    [
      { ...frame(from), easing: ease },
      { ...frame(mid), offset: 0.55, easing: ease },
      frame(to)
    ],
    { duration: 460 }
  );
  anim.onfinish = () => {
    set(to);
    anim.cancel();
    anim = null;
  };
};

// Fade out, jump, fade in
const fadeTo = (a) => {
  line.style.opacity = '0';
  setTimeout(() => {
    set(rect(a));
    line.style.opacity = '1';
  }, 160);
};

const select = (a) => {
  if (a === current) return;
  current.removeAttribute('aria-current');
  a.setAttribute('aria-current', 'page');
  current = a;
  reduceMotion.matches ? fadeTo(a) : stretchTo(a);
};

links.forEach((a) => {
  a.addEventListener('click', (e) => {
    e.preventDefault();
    select(a);
  });
});
