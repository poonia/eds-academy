/* Metro map: each learning path is a line, modules are stations and the four capstone
   gates are interchanges where every line meets. The shared start (A1 to B1) is a trunk.
   One line is active at a time; its stations form a single tab stop moved with arrow keys.
   <div data-component="metro-map"></div> */
const NS = 'http://www.w3.org/2000/svg';
const LINE_VAR = { author: 'au', developer: 'dev', lead: 'imp' };

export default function metroMap(el, ctx) {
  const { h, syl, href, store, moduleProgress, levelText } = ctx;
  const paths = syl.paths;
  const color = (p) => `var(--${LINE_VAR[p.id] || 'dev'}-line)`;
  const textColor = (p) => `var(--${LINE_VAR[p.id] || 'dev'})`;
  let lineId = paths.some((p) => p.id === store.data.line) ? store.data.line : 'developer';
  if (!paths.some((p) => p.id === lineId)) lineId = paths[0].id;
  let sel = null; // { kind: 'm', id } or { kind: 'g', level }
  let vertical = false;

  /* ---- layout in abstract columns ---- */
  const phases = paths[0].phases.length;
  let trunk = 0;
  while (paths.every((p) => p.phases[0][trunk] && p.phases[0][trunk] === paths[0].phases[0][trunk])) trunk += 1;
  const widths = [];
  for (let k = 0; k < phases; k += 1) {
    const w = Math.max(...paths.map((p) => p.phases[k].length));
    widths.push(k === 0 ? w + 1 : w);
  }
  const zoneStart = []; const gateCol = [];
  let c = 0;
  widths.forEach((w, k) => { zoneStart.push(c); c += w; gateCol.push(c); c += 1; });
  const cols = c;
  const stops = {}; // pathId -> [{ kind, id|level, col }]
  paths.forEach((p) => {
    const list = [];
    p.phases.forEach((ph, k) => {
      const shared = k === 0 ? ph.slice(0, trunk) : [];
      const rest = k === 0 ? ph.slice(trunk) : ph;
      shared.forEach((id, i) => list.push({ kind: 'm', id, col: i, trunk: true }));
      const from = k === 0 ? zoneStart[0] + trunk + 1 : zoneStart[k];
      const to = gateCol[k] - 1;
      rest.forEach((id, i) => list.push({ kind: 'm', id, col: rest.length === 1 ? from : from + (i * (to - from)) / (rest.length - 1) }));
      list.push({ kind: 'g', level: k + 1, col: gateCol[k] });
    });
    stops[p.id] = list;
  });
  const linesOf = (id) => paths.filter((p) => p.phases.flat().includes(id));

  /* ---- DOM ---- */
  const picker = h('div', { class: 'mm-picker', role: 'group', 'aria-label': 'Choose a line' });
  const pickBtns = paths.map((p) => {
    const b = h('button', { type: 'button', class: 'mm-pick', 'aria-pressed': String(p.id === lineId), style: `--lc:${color(p)}` }, h('span', { class: 'mm-bullet', 'aria-hidden': 'true' }), `${p.name} line`);
    b.addEventListener('click', () => { lineId = p.id; sel = null; store.data.line = p.id; store.save(); });
    picker.append(b);
    return [p.id, b];
  });
  const frame = h('div', { class: 'mm-frame' });
  const detail = h('div', { class: 'mm-detail', 'aria-live': 'polite' });
  const hint = h('p', { class: 'ix-note mm-hint' }, 'Select a station for details. On the active line, use the arrow keys to move between stations.');
  el.classList.add('metro-map');
  el.append(picker, frame, hint, detail);

  function svg(tag, attrs = {}, ...kids) {
    const n = document.createElementNS(NS, tag);
    Object.entries(attrs).forEach(([k, v]) => { if (v !== null && v !== undefined) n.setAttribute(k, v); });
    kids.forEach((k) => k && n.append(k));
    return n;
  }
  function status(id) {
    const m = syl.byId[id]; const p = moduleProgress(m);
    return { m, p, state: p.complete ? 'done' : p.done ? 'started' : 'todo' };
  }
  function gateState(level) { return store.get('capstones', String(level)) || ''; }
  function defaultSel() {
    const list = stops[lineId];
    const last = store.data.last;
    if (last && list.some((s) => s.kind === 'm' && s.id === last)) return { kind: 'm', id: last };
    const next = list.find((s) => s.kind === 'm' && !moduleProgress(syl.byId[s.id]).complete);
    return next ? { kind: 'm', id: next.id } : { kind: 'g', level: phases };
  }
  const same = (a, b) => a && b && a.kind === b.kind && (a.kind === 'm' ? a.id === b.id : a.level === b.level);

  function render(focusSel) {
    const hadFocus = frame.contains(document.activeElement);
    pickBtns.forEach(([id, b]) => b.setAttribute('aria-pressed', String(id === lineId)));
    if (!sel || !stops[lineId].some((s) => same(s, sel))) sel = defaultSel();
    const avail = frame.clientWidth || el.clientWidth || 1000;
    vertical = avail < 900;
    const pad = vertical ? { a: 30, b: 40 } : { a: 40, b: 46 };
    const step = vertical ? 36 : Math.max(28, (avail - 4 - pad.a - pad.b) / (cols - 1));
    const rowGap = vertical ? 64 : 70;
    const rowOf = { author: 0, developer: 1, lead: 2 };
    const across = (r) => (vertical ? 40 : 74) + r * rowGap; // perpendicular coordinate of a row
    const zoneGap = vertical ? 26 : 0;
    const zoneIdx = (col) => zoneStart.filter((z) => z <= col).length;
    const along = (col) => pad.a + col * step + zoneIdx(col) * zoneGap;
    const mid = across(1);
    const bundle = 8;
    const pos = (p, s) => {
      const t = along(s.col);
      const r = s.trunk ? mid + (rowOf[p.id] - 1) * bundle : across(rowOf[p.id] ?? 1);
      return vertical ? [r, t] : [t, r];
    };
    const length = along(cols - 1) + pad.b;
    const breadth = across(2) + (vertical ? 92 : 64);
    const W = vertical ? breadth : length; const H = vertical ? length : breadth;
    const active = paths.find((p) => p.id === lineId);
    const map = svg('svg', { class: 'mm-svg', viewBox: `0 0 ${W} ${H}`, width: W, height: H, role: 'group', 'aria-label': `Course network map. Active: ${active.name} line, ${stops[lineId].length} stops.` });
    const zones = svg('g', { 'aria-hidden': 'true' });
    const zoneLabels = svg('g', { 'aria-hidden': 'true' });
    widths.forEach((w, k) => {
      const a = along(zoneStart[k]) - step / 2 - zoneGap; const b = along(gateCol[k]) + step / 2;
      const rect = vertical ? { x: 0, y: a, width: W, height: b - a } : { x: a, y: 0, width: b - a, height: H };
      zones.append(svg('rect', { ...rect, class: k % 2 ? 'mm-zone alt' : 'mm-zone' }));
      const label = `Level ${k + 1} · ${syl.levels[k + 1]}`;
      const cls = k % 2 ? 'mm-zone-t alt' : 'mm-zone-t';
      zoneLabels.append(vertical
        ? svg('text', { x: 8, y: a + 17, class: cls }, document.createTextNode(label))
        : svg('text', { x: a + 8, y: 20, class: cls }, document.createTextNode(label)));
    });
    map.append(zones);

    const order = [...paths.filter((p) => p.id !== lineId), active];
    const lineLayer = svg('g', { 'aria-hidden': 'true' });
    order.forEach((p) => {
      const pts = stops[p.id].map((s) => pos(p, s));
      let d = `M${pts[0][0]} ${pts[0][1]}`;
      for (let i = 1; i < pts.length; i += 1) {
        const [x0, y0] = pts[i - 1]; const [x1, y1] = pts[i];
        if (vertical ? x0 === x1 : y0 === y1) { d += ` L${x1} ${y1}`; continue; }
        const dv = Math.abs(vertical ? x1 - x0 : y1 - y0); // 45 degree bend, then straight
        if (vertical) d += ` L${x0} ${Math.max(y0, y1 - dv)} L${x1} ${y1}`;
        else d += ` L${Math.max(x0, x1 - dv)} ${y0} L${x1} ${y1}`;
      }
      lineLayer.append(svg('path', { d, class: `mm-line${p.id === lineId ? ' on' : ''}`, stroke: color(p) }));
    });
    map.append(lineLayer, zoneLabels);

    // gates: one interchange across all rows
    const gateLayer = svg('g', {});
    widths.forEach((w, k) => {
      const t = along(gateCol[k]);
      const a0 = across(0) - 16; const a1 = across(2) + 16;
      const r = vertical ? { x: a0, y: t - 13, width: a1 - a0, height: 26 } : { x: t - 13, y: a0, width: 26, height: a1 - a0 };
      gateLayer.append(svg('rect', { ...r, rx: 13, class: `mm-gate${gateState(k + 1) ? ' has' : ''}`, 'aria-hidden': 'true' }));
      const lab = vertical ? { x: a1 + 8, y: t + 5 } : { x: t, y: a0 - 10, 'text-anchor': 'middle' };
      gateLayer.append(svg('text', { ...lab, class: 'mm-gate-t', 'aria-hidden': 'true' }, document.createTextNode(`Gate ${k + 1}`)));
    });
    map.append(gateLayer);

    // trunk interchange capsules
    const trunkLayer = svg('g', { 'aria-hidden': 'true' });
    for (let i = 0; i < trunk; i += 1) {
      const t = along(i); const a0 = mid - bundle - 9; const len = bundle * 2 + 18;
      trunkLayer.append(svg('rect', vertical ? { x: a0, y: t - 9, width: len, height: 18, rx: 9, class: 'mm-trunk' } : { x: t - 9, y: a0, width: 18, height: len, rx: 9, class: 'mm-trunk' }));
    }
    map.append(trunkLayer);

    // stations
    const stLayer = svg('g', {});
    const focusables = [];
    const last = store.data.last;
    order.forEach((p) => {
      const isOn = p.id === lineId;
      const g = svg('g', { class: `mm-stations${isOn ? ' on' : ''}`, 'aria-hidden': isOn ? null : 'true' });
      stops[p.id].forEach((s, idx) => {
        if (s.trunk && !isOn) return; // drawn once, by the active line
        const [x, y] = s.kind === 'g' ? (vertical ? [mid, along(s.col)] : [along(s.col), mid]) : pos(p, s);
        if (s.kind === 'g' && !isOn) return;
        const node = svg('g', { class: 'mm-st', transform: `translate(${x} ${y})` });
        if (s.kind === 'm') {
          const { m, p: pr, state } = status(s.id);
          const lines = linesOf(s.id);
          node.classList.add(state);
          if (lines.length > 1) node.classList.add('xchg');
          node.append(svg('circle', { r: 16, class: 'mm-hit' }), svg('circle', { r: 13, class: 'mm-ring' }));
          if (s.trunk) node.append(svg('circle', { r: 5.5, class: `mm-dot ${state}`, style: `--lc:${color(p)}` }));
          else node.append(svg('circle', { r: 7, class: `mm-dot ${state}`, style: `--lc:${color(p)}` }));
          let lx = 0; let ly = 0; let anchor = 'middle';
          if (vertical) { lx = s.trunk ? bundle + 18 : 14; ly = 4; anchor = 'start'; if (!s.trunk && p.id === 'author') { lx = -14; anchor = 'end'; } } else if (s.trunk || p.id === 'author') ly = s.trunk ? -(bundle + 16) : -15; else ly = 24;
          node.append(svg('text', { x: lx, y: ly, 'text-anchor': anchor, class: 'mm-st-t' }, document.createTextNode(m.id)));
          if (isOn) {
            node.setAttribute('role', 'button');
            const also = lines.filter((l) => l.id !== p.id).map((l) => l.name).join(' and ');
            node.setAttribute('aria-label', `${m.id} ${m.name}. Stop ${idx + 1} of ${stops[p.id].length}. ${state === 'done' ? 'Done' : `${pr.done} of ${pr.total} topics done`}.${also ? ` Also on the ${also} line.` : ''}${m.id === last ? ' You are here.' : ''}`);
          }
          if (m.id === last) {
            node.append(svg('circle', { r: 12, class: 'mm-here' }));
          }
        } else {
          node.append(svg('circle', { r: 16, class: 'mm-hit' }), svg('circle', { r: 13, class: 'mm-ring' }));
          node.setAttribute('role', 'button');
          const gate = syl.gates.find((x) => x.level === s.level);
          node.setAttribute('aria-label', `Gate ${s.level}: ${gate ? gate.title : 'capstone'} and the level ${s.level} exam. Stop ${idx + 1} of ${stops[p.id].length}.`);
        }
        if (isOn) {
          const key = s.kind === 'm' ? { kind: 'm', id: s.id } : { kind: 'g', level: s.level };
          node.setAttribute('tabindex', same(key, sel) ? '0' : '-1');
          if (same(key, sel)) node.classList.add('sel');
          node.addEventListener('click', () => choose(key, true));
          node.addEventListener('keydown', (e) => onKey(e, idx));
          focusables.push(node);
        }
        g.append(node);
      });
      stLayer.append(g);
    });
    map.append(stLayer);

    // You are here flag
    if (last && syl.byId[last]) {
      const hit = stops[lineId].find((s) => s.kind === 'm' && s.id === last);
      if (hit) {
        const [x, y] = pos(active, hit);
        const fx = vertical ? x - 34 : x; const fy = vertical ? y : y - (hit.trunk ? 58 : active.id === 'author' ? 44 : 38);
        const flag = svg('g', { class: 'mm-flag', transform: `translate(${fx} ${fy})`, 'aria-hidden': 'true' });
        if (!vertical) flag.append(svg('rect', { x: -38, y: -11, width: 76, height: 20, rx: 2 }), svg('text', { x: 0, y: 3.5, 'text-anchor': 'middle' }, document.createTextNode('You are here')));
        else flag.append(svg('rect', { x: -46, y: -10, width: 30, height: 20, rx: 2 }), svg('text', { x: -31, y: 4, 'text-anchor': 'middle' }, document.createTextNode('Here')));
        map.append(flag);
      }
    }
    frame.replaceChildren(map);
    frame.classList.toggle('vertical', vertical);
    paintDetail();
    if (focusSel || hadFocus) { const f = focusables.find((n) => n.getAttribute('tabindex') === '0'); if (f) f.focus({ preventScroll: true }); }
  }

  function choose(key, focus) { sel = key; render(focus); }
  function onKey(e, idx) {
    const list = stops[lineId];
    let n = null;
    const fwd = vertical ? ['ArrowDown', 'ArrowRight'] : ['ArrowRight', 'ArrowDown'];
    const back = vertical ? ['ArrowUp', 'ArrowLeft'] : ['ArrowLeft', 'ArrowUp'];
    if (fwd.includes(e.key)) n = Math.min(list.length - 1, idx + 1);
    else if (back.includes(e.key)) n = Math.max(0, idx - 1);
    else if (e.key === 'Home') n = 0;
    else if (e.key === 'End') n = list.length - 1;
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); const a = detail.querySelector('a.btn.primary'); if (a) a.focus(); return; }
    if (n === null) return;
    e.preventDefault();
    const s = list[n];
    choose(s.kind === 'm' ? { kind: 'm', id: s.id } : { kind: 'g', level: s.level }, true);
  }

  function paintDetail() {
    const active = paths.find((p) => p.id === lineId);
    const list = stops[lineId];
    const idx = list.findIndex((s) => same(s, sel));
    const nextStop = list[idx + 1];
    const lineTag = h('span', { class: 'mm-linetag', style: `--lc:${color(active)};--lt:${textColor(active)}` }, h('span', { class: 'mm-bullet', 'aria-hidden': 'true' }), `${active.name} line · stop ${idx + 1} of ${list.length}`);
    const nextBtn = nextStop ? h('button', { type: 'button', class: 'btn small' }, `Next stop: ${nextStop.kind === 'm' ? nextStop.id : `Gate ${nextStop.level}`}`) : null;
    if (nextBtn) nextBtn.addEventListener('click', () => choose(nextStop.kind === 'm' ? { kind: 'm', id: nextStop.id } : { kind: 'g', level: nextStop.level }, true));
    detail.innerHTML = '';
    if (sel.kind === 'm') {
      const { m, p, state } = status(sel.id);
      const also = linesOf(m.id).filter((l) => l.id !== lineId);
      detail.append(...[
        lineTag,
        h('h3', {}, h('span', { class: 'mm-id' }, m.id), m.name),
        h('div', { class: 'mm-facts' },
          h('span', {}, levelText(m)), h('span', {}, `About ${m.hours} hours`), h('span', {}, `${m.topics.length} topics`),
          h('span', {}, state === 'done' ? 'Done' : `${p.done} of ${p.total} topics done`)),
        h('div', { class: 'meter', 'aria-hidden': 'true' }, h('span', { style: `width:${(p.done / p.total) * 100}%` })),
        also.length ? h('p', { class: 'mm-also' }, `Interchange: also on the ${also.map((l) => l.name).join(' and ')} ${also.length > 1 ? 'lines' : 'line'}.`) : null,
        h('div', { class: 'mm-actions' },
          h('a', { class: 'btn primary', href: href(m.page) }, state === 'done' ? 'Review module' : p.done ? `Continue ${m.id}` : `Start ${m.id}`),
          nextBtn)].filter(Boolean));
    } else {
      const gate = syl.gates.find((x) => x.level === sel.level);
      const exam = syl.exams.find((x) => x.scope === sel.level);
      const st = gateState(sel.level);
      detail.append(
        lineTag,
        h('h3', {}, h('span', { class: 'mm-id gate' }, `G${sel.level}`), gate ? gate.title : `Gate ${sel.level}`),
        h('p', { class: 'mm-brief' }, gate ? gate.brief : ''),
        h('p', { class: 'mm-also' }, `Every line meets here. Finish the capstone and the level ${sel.level} exam${sel.level < phases ? ` before level ${sel.level + 1}` : ''}.`, st ? ` Your capstone status: ${st}.` : ''),
        h('div', { class: 'mm-actions' },
          gate ? h('a', { class: 'btn primary', href: href(gate.page) }, 'Open capstone') : null,
          exam ? h('a', { class: 'btn', href: href(exam.page) }, `Level ${sel.level} exam`) : null,
          nextBtn));
    }
  }

  let lastW = 0;
  const ro = new ResizeObserver(() => { const w = frame.clientWidth; if (Math.abs(w - lastW) > 4) { lastW = w; render(false); } });
  ro.observe(frame);
  render(false);
  document.addEventListener('academy:progress', () => {
    if (paths.some((p) => p.id === store.data.line) && store.data.line !== lineId) { lineId = store.data.line; sel = null; }
    render(false);
  });
}
