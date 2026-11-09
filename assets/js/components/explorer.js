/* Click-through architecture explorer: columns of components joined by arrows.
   Selecting a component shows its role and highlights what it talks to.
   JSON: {"columns":[{"name":"Content sources","nodes":[{"id":"gd","label":"Google Drive","sub":"Docs, Sheets",
          "detail":"...","to":["api"]}]}],"start":"api"} */
export default function explorer(el, { h, readJSON }) {
  const data = readJSON(el);
  const cols = data.columns || [];
  const all = {}; cols.forEach((c) => c.nodes.forEach((n) => { all[n.id] = n; n.col = c.name; }));
  const edges = []; Object.values(all).forEach((n) => (n.to || []).forEach((t) => all[t] && edges.push([n.id, t])));
  el.classList.add('ix');
  const grid = h('div', { class: 'ex-grid', style: `grid-template-columns:repeat(${cols.length}, minmax(0,1fr))` });
  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg'); svg.setAttribute('class', 'ex-svg'); svg.setAttribute('aria-hidden', 'true');
  const defs = document.createElementNS(svgNS, 'defs');
  const mk = (id, color) => { const m = document.createElementNS(svgNS, 'marker'); m.setAttribute('id', id); m.setAttribute('viewBox', '0 0 10 10'); m.setAttribute('refX', '9'); m.setAttribute('refY', '5'); m.setAttribute('markerWidth', '7'); m.setAttribute('markerHeight', '7'); m.setAttribute('orient', 'auto'); const p = document.createElementNS(svgNS, 'path'); p.setAttribute('d', 'M0 0L10 5L0 10z'); p.setAttribute('fill', color); m.append(p); defs.append(m); };
  const uidBase = `ex${Math.random().toString(36).slice(2, 7)}`;
  mk(`${uidBase}-off`, 'var(--line-strong)'); mk(`${uidBase}-on`, 'var(--accent)');
  svg.append(defs);
  const btns = {};
  cols.forEach((c) => {
    const col = h('div', { class: 'ex-col', role: 'group', 'aria-label': c.name }, h('div', { class: 'ex-col-h' }, c.name));
    c.nodes.forEach((n) => {
      const b = h('button', { class: 'ex-node', type: 'button', 'aria-pressed': 'false' }, n.label, n.sub ? h('small', {}, n.sub) : null);
      b.addEventListener('click', () => select(n.id));
      btns[n.id] = b; col.append(b);
    });
    grid.append(col);
  });
  const wrapInner = h('div', { style: 'position:relative' }, grid);
  wrapInner.append(svg);
  const detail = h('div', { class: 'ex-detail', 'aria-live': 'polite' }, h('p', { class: 'muted' }, 'Select any component to see what it does and what it connects to.'));
  let sel = null;
  function draw() {
    const base = wrapInner.getBoundingClientRect();
    svg.setAttribute('width', wrapInner.scrollWidth); svg.setAttribute('height', wrapInner.scrollHeight);
    Array.from(svg.querySelectorAll('path.e')).forEach((p) => p.remove());
    edges.forEach(([a, b]) => {
      const ra = btns[a].getBoundingClientRect(); const rb = btns[b].getBoundingClientRect();
      let x1; let x2; const y1 = (ra.top + ra.bottom) / 2 - base.top; const y2 = (rb.top + rb.bottom) / 2 - base.top;
      if (rb.left >= ra.right) { x1 = ra.right - base.left; x2 = rb.left - base.left - 2; } else if (rb.right <= ra.left) { x1 = ra.left - base.left; x2 = rb.right - base.left + 2; } else { x1 = ra.right - base.left; x2 = rb.right - base.left + 2; }
      const dx = Math.max(24, Math.abs(x2 - x1) / 2) * (x2 >= x1 ? 1 : -1);
      const same = Math.abs(x2 - x1) < 4;
      const d = same ? `M${x1} ${y1}C${x1 + 40} ${y1} ${x2 + 40} ${y2} ${x2} ${y2}` : `M${x1} ${y1}C${x1 + dx} ${y1} ${x2 - dx} ${y2} ${x2} ${y2}`;
      const p = document.createElementNS(svgNS, 'path');
      const on = sel && (a === sel || b === sel);
      p.setAttribute('class', `e${on ? ' on' : ''}`); p.setAttribute('d', d); p.setAttribute('marker-end', `url(#${uidBase}-${on ? 'on' : 'off'})`);
      svg.append(p);
    });
  }
  function select(id) {
    sel = id; const n = all[id];
    const linked = new Set(); edges.forEach(([a, b]) => { if (a === id) linked.add(b); if (b === id) linked.add(a); });
    Object.entries(btns).forEach(([k, b]) => { b.classList.toggle('sel', k === id); b.classList.toggle('linked', linked.has(k)); b.classList.toggle('dim', k !== id && !linked.has(k)); b.setAttribute('aria-pressed', String(k === id)); });
    detail.innerHTML = '';
    const outs = (n.to || []).map((t) => all[t] && all[t].label).filter(Boolean);
    const ins = edges.filter(([, b]) => b === id).map(([a]) => all[a].label);
    detail.append(h('div', { class: 'eyebrow' }, n.col), h('h4', {}, n.label), h('p', {}, n.detail || ''));
    if (ins.length) detail.append(h('p', { class: 'muted', style: 'font-size:14px;margin:0' }, `Receives from: ${ins.join(', ')}`));
    if (outs.length) detail.append(h('p', { class: 'muted', style: 'font-size:14px;margin:0' }, `Sends to: ${outs.join(', ')}`));
    draw();
  }
  const clear = h('button', { class: 'btn small ghost', type: 'button' }, 'Clear selection');
  clear.addEventListener('click', () => { sel = null; Object.values(btns).forEach((b) => { b.classList.remove('sel', 'linked', 'dim'); b.setAttribute('aria-pressed', 'false'); }); detail.innerHTML = ''; detail.append(h('p', { class: 'muted' }, 'Select any component to see what it does and what it connects to.')); draw(); });
  el.append(h('div', { class: 'ix-head' }, h('div', {}, h('div', { class: 'ix-kind' }, 'Click-through architecture'), h('h3', {}, el.dataset.title || data.title || 'Explore the system'))), h('div', { class: 'ex-wrap' }, wrapInner), detail, h('div', { class: 'ix-foot' }, clear, h('span', { class: 'ix-note' }, 'Arrows show the direction content or requests flow.')));
  const redraw = () => requestAnimationFrame(draw);
  if (window.ResizeObserver) new ResizeObserver(redraw).observe(grid);
  window.addEventListener('resize', redraw);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(redraw);
  if (data.start) select(data.start); else redraw();
}
