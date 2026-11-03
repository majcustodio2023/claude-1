/* Magica Studio effects layer: scroll progress, word-stagger headlines, parallax, 3D tilt,
   magnetic buttons, cursor glow on dark sections, pinned media, and chart replay on view.
   Everything degrades to static under prefers-reduced-motion or on coarse pointers. */
(function () {
  'use strict';
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(pointer: fine)').matches;
  const lerp = (a, b, t) => a + (b - a) * t;

  /* ---------- Scroll progress ---------- */
  const bar = document.createElement('div'); bar.className = 'fx-progress'; document.body.appendChild(bar);
  const onScroll = () => { const h = document.documentElement; const p = h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight); bar.style.transform = `scaleX(${p})`; };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* ---------- Word-stagger headlines ---------- */
  $$('[data-split]').forEach((el) => {
    const walk = (node) => {
      Array.from(node.childNodes).forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            const s = document.createElement('span'); s.className = 'w'; s.textContent = part; frag.appendChild(s);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && !n.classList.contains('w')) walk(n);
      });
    };
    walk(el);
    $$('.w', el).forEach((w, i) => w.style.setProperty('--i', i));
    el.classList.add('split-ready');
  });

  /* ---------- Reveal (stagger children with data-stagger) ---------- */
  $$('[data-stagger]').forEach((g) => Array.from(g.children).forEach((c, i) => { c.classList.add('rv'); c.style.transitionDelay = `${Math.min(i, 8) * 90}ms`; }));
  const rio = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); rio.unobserve(e.target); } }), { threshold: 0.12 });
  $$('.rv:not(.in)').forEach((el) => rio.observe(el));

  /* ---------- Parallax ---------- */
  const px = $$('[data-parallax]').map((el) => ({ el, s: parseFloat(el.dataset.parallax) || 0.2, on: false }));
  if (px.length && !reduce) {
    const pio = new IntersectionObserver((es) => es.forEach((e) => { const o = px.find((p) => p.el === e.target); if (o) o.on = e.isIntersecting; }), { rootMargin: '20% 0px' });
    px.forEach((p) => pio.observe(p.el));
    let ticking = false;
    const run = () => {
      ticking = false; const vh = innerHeight;
      px.forEach((p) => { if (!p.on) return; const r = p.el.getBoundingClientRect(); const c = r.top + r.height / 2 - vh / 2; p.el.style.setProperty('--py', `${(c * p.s).toFixed(1)}px`); });
    };
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(run); } }, { passive: true }); run();
  }

  /* ---------- 3D tilt ---------- */
  if (fine && !reduce) $$('[data-tilt]').forEach((el) => {
    const max = parseFloat(el.dataset.tilt) || 6;
    el.addEventListener('mousemove', (e) => { const r = el.getBoundingClientRect(); const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5; el.style.transform = `perspective(900px) rotateX(${(-y * max).toFixed(2)}deg) rotateY(${(x * max).toFixed(2)}deg) translateY(-4px)`; el.style.setProperty('--mx', `${(x + 0.5) * 100}%`); el.style.setProperty('--my', `${(y + 0.5) * 100}%`); });
    el.addEventListener('mouseleave', () => { el.style.transform = ''; });
  });

  /* ---------- Magnetic buttons ---------- */
  if (fine && !reduce) $$('.btn').forEach((b) => {
    b.addEventListener('mousemove', (e) => { const r = b.getBoundingClientRect(); const x = e.clientX - r.left - r.width / 2, y = e.clientY - r.top - r.height / 2; b.style.transform = `translate(${x * 0.18}px, ${y * 0.28}px)`; });
    b.addEventListener('mouseleave', () => { b.style.transform = ''; });
  });

  /* ---------- Cursor glow on dark sections ---------- */
  if (fine && !reduce) $$('.sec--dark, .slide--dark, .offer__box, .ledger').forEach((s) => {
    const g = document.createElement('i'); g.className = 'fx-glow'; s.appendChild(g); s.classList.add('has-glow');
    s.addEventListener('mousemove', (e) => { const r = s.getBoundingClientRect(); g.style.left = `${e.clientX - r.left}px`; g.style.top = `${e.clientY - r.top}px`; g.style.opacity = 1; });
    s.addEventListener('mouseleave', () => { g.style.opacity = 0; });
  });

  /* ---------- Chart replay when scrolled into view ---------- */
  const cio = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting && window.Charts && e.target.__cfg) { window.Charts.replay(e.target); cio.unobserve(e.target); } }), { threshold: 0.35 });
  const armCharts = () => $$('.chart').forEach((c) => { if (c.__cfg && !c.__armed) { c.__armed = true; c.classList.add('chart--wait'); cio.observe(c); } });
  armCharts(); setTimeout(armCharts, 300); setTimeout(armCharts, 1200);

  /* ---------- Smooth anchor focus ---------- */
  $$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => { const t = document.querySelector(a.getAttribute('href')); if (t) { e.preventDefault(); t.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }); } }));

  /* ---------- Counter: money scramble ---------- */
  if (!reduce) $$('[data-scramble]').forEach((el) => {
    const final = el.textContent; const chars = '0123456789'; let frame = 0; const total = 26;
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (!e.isIntersecting) return; io.unobserve(el);
      const tick = () => { frame++; el.textContent = final.split('').map((ch, i) => (/\d/.test(ch) && frame < total - i * 1.2 ? chars[Math.floor(Math.random() * 10)] : ch)).join(''); if (frame < total + final.length) requestAnimationFrame(tick); else el.textContent = final; };
      tick(); }), { threshold: 0.6 });
    io.observe(el);
  });
})();
