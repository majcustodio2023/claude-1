/* Magica Studio funnel helpers: reveal, count-up, sticky CTA, forms, and SVG charts.
   Charts follow the dataviz spec: thin marks, 4px rounded data-ends, 2px lines, >=8px markers,
   surface gaps, hairline grid, legend for >=2 series, tooltips on hover. */
(function () {
  'use strict';
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const css = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();

  /* ---------- Reveal on scroll ---------- */
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.12 });
  $$('.rv').forEach((el) => io.observe(el));

  /* ---------- Count-up ---------- */
  const fmt = (v, d) => {
    const p = d.prefix || '', s = d.suffix || '';
    const n = Number(v);
    const str = d.decimals ? n.toFixed(d.decimals) : Math.round(n).toLocaleString('en-PH');
    return p + str + s;
  };
  const cio = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return; cio.unobserve(e.target);
    const el = e.target, to = Number(el.dataset.count), t0 = performance.now(), dur = 1400;
    const tick = (t) => { const k = Math.min(1, (t - t0) / dur), ease = 1 - Math.pow(1 - k, 3); el.textContent = fmt(to * ease, el.dataset); if (k < 1) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  }), { threshold: 0.5 });
  $$('[data-count]').forEach((el) => cio.observe(el));

  /* ---------- Result bars ---------- */
  const bio = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.style.setProperty('--w', e.target.dataset.w); bio.unobserve(e.target); } }), { threshold: 0.4 });
  $$('.result__bar i[data-w]').forEach((el) => { el.style.setProperty('--w', '0%'); bio.observe(el); });

  /* ---------- Sticky CTA ---------- */
  const sticky = $('.sticky');
  if (sticky) {
    const hero = $('.hero');
    const sio = new IntersectionObserver((es) => es.forEach((e) => sticky.classList.toggle('show', !e.isIntersecting)), { threshold: 0.1 });
    if (hero) sio.observe(hero);
    const end = $('[data-sticky-end]'); if (end) { const eio = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) sticky.classList.remove('show'); }), { threshold: 0.2 }); eio.observe(end); }
  }

  /* ---------- Chips & slots ---------- */
  $$('[data-chips]').forEach((g) => g.addEventListener('click', (ev) => {
    const b = ev.target.closest('.chip'); if (!b) return;
    if (g.dataset.chips === 'multi') b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') !== 'true');
    else { $$('.chip', g).forEach((c) => c.setAttribute('aria-pressed', 'false')); b.setAttribute('aria-pressed', 'true'); }
  }));

  /* ---------- Forms (demo: no backend, show confirmation) ---------- */
  $$('form[data-demo]').forEach((f) => f.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const done = f.parentElement.querySelector('.form__done');
    f.style.display = 'none'; if (done) { done.style.display = 'block'; done.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
  }));

  /* ---------- Tooltip ---------- */
  let tip = $('.tip'); if (!tip) { tip = document.createElement('div'); tip.className = 'tip'; document.body.appendChild(tip); }
  const showTip = (html, x, y) => { tip.innerHTML = html; tip.classList.add('on'); const w = tip.offsetWidth, h = tip.offsetHeight; tip.style.left = Math.min(window.innerWidth - w - 8, Math.max(8, x - w / 2)) + 'px'; tip.style.top = (y - h - 14) + 'px'; };
  const hideTip = () => tip.classList.remove('on');

  /* ---------- Chart engine ---------- */
  const NS = 'http://www.w3.org/2000/svg';
  const el = (n, a, p) => { const e = document.createElementNS(NS, n); for (const k in a) e.setAttribute(k, a[k]); if (p) p.appendChild(e); return e; };
  const money = (v) => '₱' + Math.round(v).toLocaleString('en-PH');
  const compact = (v) => Math.abs(v) >= 1e6 ? (v / 1e6).toFixed(1).replace(/\.0$/, '') + 'M' : Math.abs(v) >= 1e4 ? Math.round(v / 1e3) + 'K' : Math.round(v).toLocaleString('en-PH');
  const nice = (max, n) => { const raw = max / n, p = Math.pow(10, Math.floor(Math.log10(raw))), m = raw / p; const s = m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10; return s * p; };
  let themeHost = document.documentElement; const cssH = (n) => getComputedStyle(themeHost).getPropertyValue(n).trim();
  const ink = () => cssH('--ink') || '#0b1324', mute = () => cssH('--mute') || '#5b6676', hair = () => cssH('--hair-soft') || 'rgba(0,0,0,.08)', surf = () => (themeHost.closest('.sec--dark, .slide--dark') ? (cssH('--dark-2') || '#121c30') : (cssH('--bg') || '#fff'));

  function legend(host, series) {
    if (series.length < 2) return;
    const lg = document.createElement('div'); lg.className = 'chart__legend';
    series.forEach((s) => { const sp = document.createElement('span'); sp.innerHTML = `<i style="background:${s.color}"></i>${s.name}`; lg.appendChild(sp); });
    host.appendChild(lg);
  }

  function frame(host, cfg) {
    themeHost = host; host.innerHTML = '';
    if (cfg.title) { const t = document.createElement('div'); t.className = 'chart__title'; t.textContent = cfg.title; host.appendChild(t); }
    if (cfg.sub) { const t = document.createElement('div'); t.className = 'chart__sub'; t.textContent = cfg.sub; host.appendChild(t); }
    const W = cfg.width || 720, H = cfg.height || 300, P = { t: 18, r: 18, b: 36, l: 54 };
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': cfg.title || 'chart' }, host);
    return { svg, W, H, P };
  }

  function yAxis(svg, P, W, H, max, fmtFn) {
    const step = nice(max, 4), top = Math.ceil(max / step) * step, ticks = [];
    for (let v = 0; v <= top + 1e-9; v += step) ticks.push(v);
    const y = (v) => P.t + (H - P.t - P.b) * (1 - v / top);
    ticks.forEach((v) => {
      el('line', { x1: P.l, x2: W - P.r, y1: y(v), y2: y(v), stroke: hair(), 'stroke-width': 1 }, svg);
      el('text', { x: P.l - 8, y: y(v) + 4, 'text-anchor': 'end', 'font-size': 11, fill: mute() }, svg).textContent = fmtFn(v);
    });
    return { y, top };
  }

  /* Bars: cfg = { labels:[], series:[{name,color,values[]}], money, title, sub, stacked } */
  function bars(host, cfg) {
    host.__cfg = { fn: 'bars', cfg }; host.classList.remove('chart--wait');
    const { svg, W, H, P } = frame(host, cfg);
    const n = cfg.labels.length, S = cfg.series, stacked = !!cfg.stacked;
    const totals = cfg.labels.map((_, i) => stacked ? S.reduce((a, s) => a + s.values[i], 0) : Math.max(...S.map((s) => s.values[i])));
    const { y, top } = yAxis(svg, P, W, H, Math.max(...totals) * 1.08, cfg.money ? (v) => '₱' + compact(v) : compact);
    const band = (W - P.l - P.r) / n, bw = Math.min(24, (band * 0.7) / (stacked ? 1 : S.length)), gap = 2;
    const fmtV = cfg.money ? money : (v) => Math.round(v).toLocaleString('en-PH');
    const maxTotal = Math.max(...totals); let labeledMax = false;
    cfg.labels.forEach((lab, i) => {
      const x0 = P.l + band * i + band / 2;
      el('text', { x: x0, y: H - P.b + 20, 'text-anchor': 'middle', 'font-size': 12, fill: mute() }, svg).textContent = lab;
      let acc = 0;
      S.forEach((s, j) => {
        const v = s.values[i];
        const x = stacked ? x0 - bw / 2 : x0 - (S.length * bw + (S.length - 1) * gap) / 2 + j * (bw + gap);
        const yTop = stacked ? y(acc + v) : y(v), yBase = stacked ? y(acc) : y(0), h = Math.max(0, yBase - yTop);
        const r = 4, hh = Math.max(0, h - (stacked && j < S.length - 1 ? gap : 0));
        const isTop = !stacked || j === S.length - 1;
        const d = isTop
          ? `M${x},${yBase} v${-(hh - r)} a${r},${r} 0 0 1 ${r},${-r} h${bw - 2 * r} a${r},${r} 0 0 1 ${r},${r} v${hh - r} z`
          : `M${x},${yBase} v${-hh} h${bw} v${hh} z`;
        const p = el('path', { d, fill: s.color, class: 'bar', style: '--i:' + (i * S.length + j) }, svg);
        p.addEventListener('mousemove', (e) => showTip(`<b>${lab} · ${s.name}</b>${fmtV(v)}`, e.clientX, e.clientY));
        p.addEventListener('mouseleave', hideTip);
        acc += v;
      });
      if (cfg.labelTop !== false) {
        const tv = stacked ? acc : Math.max(...S.map((s) => s.values[i]));
        const isMax = tv === maxTotal && !labeledMax; if (isMax) labeledMax = true;
        if (cfg.labelAll || i === n - 1 || isMax) el('text', { x: x0, y: y(tv) - 8, 'text-anchor': 'middle', 'font-size': 12, 'font-weight': 700, fill: ink(), class: 'val' }, svg).textContent = cfg.money ? '₱' + compact(tv) : compact(tv);
      }
    });
    el('line', { x1: P.l, x2: W - P.r, y1: y(0), y2: y(0), stroke: hair(), 'stroke-width': 1 }, svg);
    legend(host, S);
  }

  /* Lines: cfg = { labels:[], series:[{name,color,values[]}], money, area } */
  function lines(host, cfg) {
    host.__cfg = { fn: 'lines', cfg }; host.classList.remove('chart--wait');
    const { svg, W, H, P } = frame(host, cfg);
    const S = cfg.series, n = cfg.labels.length;
    const max = Math.max(...S.flatMap((s) => s.values)) * 1.1;
    const { y } = yAxis(svg, P, W, H, max, cfg.money ? (v) => '₱' + compact(v) : compact);
    const x = (i) => P.l + (W - P.l - P.r) * (n === 1 ? 0.5 : i / (n - 1));
    const fmtV = cfg.money ? money : (v) => Math.round(v).toLocaleString('en-PH');
    cfg.labels.forEach((lab, i) => { if (n <= 8 || i % Math.ceil(n / 8) === 0 || i === n - 1) el('text', { x: x(i), y: H - P.b + 20, 'text-anchor': 'middle', 'font-size': 12, fill: mute() }, svg).textContent = lab; });
    S.forEach((s) => {
      const pts = s.values.map((v, i) => [x(i), y(v)]);
      if (cfg.area !== false) el('path', { d: `M${pts[0][0]},${y(0)} ` + pts.map((p) => `L${p[0]},${p[1]}`).join(' ') + ` L${pts[pts.length - 1][0]},${y(0)} z`, fill: s.color, opacity: 0.1, class: 'area' }, svg);
      el('path', { d: pts.map((p, i) => (i ? 'L' : 'M') + p[0] + ',' + p[1]).join(' '), fill: 'none', stroke: s.color, 'stroke-width': 2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round', 'stroke-dasharray': s.dashed ? '6 6' : 'none', class: s.dashed ? '' : 'line', pathLength: 1 }, svg);
      pts.forEach((p, i) => {
        const c = el('circle', { cx: p[0], cy: p[1], r: 5, fill: s.color, stroke: surf(), 'stroke-width': 2, class: 'dot' }, svg);
        const hit = el('circle', { cx: p[0], cy: p[1], r: 14, fill: 'transparent' }, svg);
        hit.addEventListener('mousemove', (e) => { showTip(`<b>${cfg.labels[i]} · ${s.name}</b>${fmtV(s.values[i])}`, e.clientX, e.clientY); c.setAttribute('r', 7); });
        hit.addEventListener('mouseleave', () => { hideTip(); c.setAttribute('r', 5); });
      });
      const last = pts[pts.length - 1];
      el('text', { x: last[0] + (S.length > 1 ? 0 : 0), y: last[1] - 12, 'text-anchor': 'end', 'font-size': 12, 'font-weight': 700, fill: ink(), class: 'val' }, svg).textContent = cfg.money ? '₱' + compact(s.values[n - 1]) : compact(s.values[n - 1]);
    });
    legend(host, S);
  }

  /* Funnel: cfg = { stages:[{name, value, note}], color } — horizontal bars, 4px rounded ends */
  function funnel(host, cfg) {
    host.__cfg = { fn: 'funnel', cfg }; host.classList.remove('chart--wait');
    themeHost = host; host.innerHTML = '';
    if (cfg.title) { const t = document.createElement('div'); t.className = 'chart__title'; t.textContent = cfg.title; host.appendChild(t); }
    if (cfg.sub) { const t = document.createElement('div'); t.className = 'chart__sub'; t.textContent = cfg.sub; host.appendChild(t); }
    const W = 720, rowH = 44, n = cfg.stages.length, H = n * rowH + 8, L = 150, R = 110;
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}` }, host);
    const max = cfg.stages[0].value;
    const ramp = cfg.ramp || ['#2f8fc4', '#2a7fb3', '#256fa0', '#1f5f8c', '#1b5079', '#174266'];
    cfg.stages.forEach((s, i) => {
      const y = i * rowH + 6, w = Math.max(8, (W - L - R) * (s.value / max)), c = ramp[Math.min(i, ramp.length - 1)];
      el('text', { x: L - 12, y: y + 22, 'text-anchor': 'end', 'font-size': 13, 'font-weight': 600, fill: ink() }, svg).textContent = s.name;
      const p = el('path', { d: `M${L},${y + 6} h${w - 4} a4,4 0 0 1 4,4 v16 a4,4 0 0 1 -4,4 h${-(w - 4)} z`, fill: c, class: 'hbar', style: '--i:' + i }, svg);
      p.addEventListener('mousemove', (e) => showTip(`<b>${s.name}</b>${s.value.toLocaleString('en-PH')}${s.note ? ' · ' + s.note : ''}`, e.clientX, e.clientY));
      p.addEventListener('mouseleave', hideTip);
      el('text', { x: L + w + 10, y: y + 22, 'font-size': 13, 'font-weight': 700, fill: ink() }, svg).textContent = s.value.toLocaleString('en-PH') + (s.pct ? `  (${s.pct})` : '');
    });
  }

  const replay = (host) => { if (host.__cfg) window.Charts[host.__cfg.fn](host, host.__cfg.cfg); };
  window.Charts = { bars, lines, funnel, money, compact, replay };
  $$('[data-chart]').forEach((h) => { try { const cfg = JSON.parse(h.dataset.chart); (window.Charts[cfg.type] || bars)(h, cfg); } catch (e) { console.error(e); } });
})();
