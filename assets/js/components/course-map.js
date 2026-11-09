/* Home-page course map: modules placed by category (rows) and entry level (columns),
   filterable by level, track and search, with a detail panel and progress per module. */
export default function courseMap(el, ctx) {
  const { h, syl, href, store, trackTags, levelText, moduleProgress, modLink } = ctx;
  const state = { levels: new Set([1, 2, 3, 4]), tracks: new Set(['au', 'dev', 'imp']), q: '', sel: store.data.last || 'A1' };
  const nodeEls = {};
  const count = h('span', { class: 'ix-note', 'aria-live': 'polite' });
  const chips = (label, items, set) => {
    const g = h('div', { class: 'cm-group', role: 'group', 'aria-label': `Filter by ${label.toLowerCase()}` }, h('span', { class: 'lbl' }, label));
    items.forEach(([val, text, sw]) => {
      const b = h('button', { class: 'chip', type: 'button', 'aria-pressed': 'true' }, sw ? h('span', { class: 'sw', style: `background:var(--${val})` }) : null, text);
      b.addEventListener('click', () => { if (set.has(val)) set.delete(val); else set.add(val); b.setAttribute('aria-pressed', String(set.has(val))); filter(); });
      g.append(b);
    });
    return g;
  };
  const search = h('input', { class: 'cm-search', type: 'search', placeholder: 'Filter modules and topics', 'aria-label': 'Filter modules and topics' });
  search.addEventListener('input', () => { state.q = search.value.trim().toLowerCase(); filter(); });
  const controls = h('div', { class: 'cm-controls' },
    chips('Level', [[1, 'L1'], [2, 'L2'], [3, 'L3'], [4, 'L4']], state.levels),
    chips('Track', [['au', 'Authoring', true], ['dev', 'Development', true], ['imp', 'Implementation', true]], state.tracks),
    search, count);
  const grid = h('div', { class: 'cm-grid' }, h('div', { class: 'cm-colh' }, h('b', {}, 'Category'), h('span', {}, 'lane')));
  [1, 2, 3, 4].forEach((l) => grid.append(h('div', { class: 'cm-colh' }, h('b', {}, `L${l} ${syl.levels[l]}`), h('span', {}, 'modules starting here'))));
  syl.categories.forEach((c) => {
    grid.append(h('div', { class: 'cm-lane' }, h('span', { class: 'eyebrow' }, `Category ${c.id}`), h('b', {}, c.name)));
    [1, 2, 3, 4].forEach((l) => {
      const cell = h('div', { class: 'cm-cell' });
      syl.modules.filter((m) => m.cat === c.id && m.levels[0] === l).forEach((m) => {
        const st = h('span', { class: `st${m.built ? ' built' : ''}` });
        const meter = h('span');
        const b = h('button', { class: 'cm-node', type: 'button', 'aria-pressed': 'false' },
          h('span', { class: 'cm-node-h' }, h('span', {}, m.id), st),
          h('span', { class: 'cm-node-n' }, m.name),
          h('span', { class: 'badges' }, trackTags(m.tracks, syl)),
          h('span', { class: 'meter', 'aria-hidden': 'true' }, meter));
        b.addEventListener('click', () => select(m.id, true));
        nodeEls[m.id] = { b, st, meter };
        cell.append(b);
      });
      grid.append(cell);
    });
  });
  const detail = h('aside', { class: 'cm-detail card', 'aria-live': 'polite' });
  el.append(controls, h('div', { class: 'cm-layout' }, h('div', { class: 'cm-scroll' }, grid), detail));

  function matches(m) {
    const lv = [...state.levels].some((l) => l >= m.levels[0] && l <= m.levels[1]);
    const tr = m.tracks.some((t) => state.tracks.has(t));
    if (!lv || !tr) return false;
    if (!state.q) return true;
    return `${m.id} ${m.name} ${m.topics.map((t) => t.name).join(' ')}`.toLowerCase().includes(state.q);
  }
  function filter() {
    let n = 0;
    syl.modules.forEach((m) => { const ok = matches(m); if (ok) n += 1; nodeEls[m.id].b.classList.toggle('dim', !ok); });
    count.textContent = `${n} of ${syl.modules.length} modules match`;
  }
  function paintNodes() {
    syl.modules.forEach((m) => {
      const p = moduleProgress(m); const e = nodeEls[m.id];
      e.st.textContent = p.complete ? '✓ done' : m.built ? (p.done ? `${p.done}/${p.total}` : 'Ready') : 'Planned';
      e.meter.style.width = `${(p.done / p.total) * 100}%`;
      e.b.setAttribute('aria-label', `${m.id} ${m.name}, ${levelText(m)}, ${m.built ? 'ready to study' : 'not built yet'}${p.done ? `, ${p.done} of ${p.total} topics done` : ''}`);
    });
  }
  function select(id, focusDetail) {
    state.sel = id; const m = syl.byId[id]; if (!m) return;
    Object.entries(nodeEls).forEach(([k, e]) => { e.b.classList.toggle('sel', k === id); e.b.setAttribute('aria-pressed', String(k === id)); });
    const p = moduleProgress(m);
    detail.innerHTML = '';
    const topics = h('ul', { style: 'padding-left:1.1em;font-size:14.5px;margin:0' });
    m.topics.forEach((t) => topics.append(h('li', {}, m.built ? h('a', { href: `${href(m.page)}#${t.id}` }, t.name) : t.name, ' ', h('span', { class: 'lvl', 'data-l': t.level }, `L${t.level}`), store.get('topics', `${m.id}/${t.id}`) ? h('span', { style: 'color:var(--good)' }, ' ✓') : null)));
    const pre = h('div', { style: 'display:grid;gap:4px;font-size:14.5px' });
    if (m.pre.length) m.pre.forEach((x) => pre.append(modLink(syl.byId[x]))); else pre.append(h('span', { class: 'muted' }, 'None'));
    detail.append(
      h('div', { class: 'eyebrow' }, `Category ${m.cat} · ${levelText(m)} · ${m.hours} h`),
      h('h3', { style: 'margin:6px 0 8px;font-size:21px' }, `${m.id} ${m.name}`),
      h('div', { class: 'badges', style: 'margin-bottom:12px' }, trackTags(m.tracks, syl), h('span', { class: `tag ${m.built ? 'status-built' : 'status-planned'}` }, m.built ? 'Ready' : 'Not built yet')),
      m.built ? h('a', { class: 'btn primary', href: href(m.page), style: 'margin-bottom:14px' }, p.done ? 'Continue module' : 'Open module') : h('p', { class: 'muted', style: 'font-size:14.5px' }, 'This module is planned in a later build phase.'),
      h('p', { style: 'font-size:14.5px;margin:6px 0 4px' }, h('b', {}, 'Signature interactive: '), m.signature),
      h('h4', { style: 'margin:14px 0 4px' }, 'Needs first'), pre,
      h('h4', { style: 'margin:14px 0 4px' }, `Topics (${p.done}/${p.total} done)`), topics);
    if (focusDetail && window.innerWidth <= 1100) detail.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  paintNodes(); filter(); select(state.sel in syl.byId ? state.sel : 'A1', false);
  document.addEventListener('academy:progress', () => { paintNodes(); select(state.sel, false); });
}
