/* Magica Studio deck: full-screen slides with snap scrolling, keyboard and button navigation,
   progress and counter, per-slide entrance animations, hash routing and chart replay. */
(function () {
  'use strict';
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const deck = document.querySelector('.deck'); if (!deck) return;
  const slides = $$('.slide', deck); const n = slides.length; let cur = 0;

  /* chrome */
  const chrome = document.createElement('div'); chrome.className = 'deck-chrome';
  chrome.innerHTML = `
    <div class="deck-progress"><i></i></div>
    <div class="deck-counter"><b class="deck-cur">1</b><span>/ ${n}</span></div>
    <div class="deck-nav">
      <button class="deck-btn" data-go="-1" aria-label="Previous slide"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M15 6l-6 6 6 6"/></svg></button>
      <button class="deck-btn" data-go="1" aria-label="Next slide"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M9 6l6 6-6 6"/></svg></button>
      <button class="deck-btn deck-full" aria-label="Fullscreen"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg></button>
    </div>
    <div class="deck-hint">Use <kbd>←</kbd> <kbd>→</kbd> or scroll · <kbd>F</kbd> fullscreen</div>`;
  document.body.appendChild(chrome);
  const prog = chrome.querySelector('.deck-progress i'), counter = chrome.querySelector('.deck-cur');

  /* stagger children marked data-anim */
  slides.forEach((s, i) => {
    s.dataset.index = i; if (!s.id) s.id = `s${i + 1}`;
    $$('[data-anim]', s).forEach((el, k) => el.style.setProperty('--d', `${Math.min(k, 12) * 90 + 120}ms`));
  });

  const go = (i, smooth) => { i = Math.max(0, Math.min(n - 1, i)); slides[i].scrollIntoView({ behavior: smooth === false || reduce ? 'auto' : 'smooth', block: 'start' }); };
  const activate = (i) => {
    if (i === cur && slides[i].classList.contains('is-active')) return;
    cur = i; slides.forEach((s, k) => s.classList.toggle('is-active', k === i));
    counter.textContent = i + 1; prog.style.transform = `scaleX(${(i + 1) / n})`;
    document.body.dataset.tone = slides[i].classList.contains('slide--dark') ? 'dark' : slides[i].classList.contains('slide--brand') ? 'brand' : 'light';
    if (history.replaceState) history.replaceState(null, '', `#${slides[i].id}`);
    if (window.Charts) $$('.chart', slides[i]).forEach((c) => { if (c.__cfg) window.Charts.replay(c); });
  };
  let raf = false;
  const pick = () => { raf = false; const y = deck.scrollTop + deck.clientHeight * 0.45; let i = 0; slides.forEach((s, k) => { if (s.offsetTop <= y) i = k; }); activate(i); };
  deck.addEventListener('scroll', () => { if (!raf) { raf = true; requestAnimationFrame(pick); } }, { passive: true });
  addEventListener('resize', pick);

  chrome.addEventListener('click', (e) => { const b = e.target.closest('[data-go]'); if (b) go(cur + +b.dataset.go); if (e.target.closest('.deck-full')) { const d = document.documentElement; if (!document.fullscreenElement) (d.requestFullscreen && d.requestFullscreen().catch(() => {})); else document.exitFullscreen(); } });
  addEventListener('keydown', (e) => {
    if (['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement && document.activeElement.tagName)) return;
    if (['ArrowRight', 'ArrowDown', 'PageDown', ' '].includes(e.key)) { e.preventDefault(); go(cur + 1); }
    else if (['ArrowLeft', 'ArrowUp', 'PageUp'].includes(e.key)) { e.preventDefault(); go(cur - 1); }
    else if (e.key === 'Home') go(0); else if (e.key === 'End') go(n - 1);
    else if (e.key.toLowerCase() === 'f') chrome.querySelector('.deck-full').click();
  });
  const start = location.hash && slides.findIndex((s) => `#${s.id}` === location.hash);
  if (start > 0) setTimeout(() => go(start, false), 50); else activate(0);
  setTimeout(pick, 100);
  setTimeout(() => chrome.querySelector('.deck-hint').classList.add('fade'), 5000);
})();
