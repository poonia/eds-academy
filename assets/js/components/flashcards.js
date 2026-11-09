/* Flashcards: flip by click, Space or Enter; shuffle; mark as known.
   <div data-component="flashcards" data-id="a1-cards"><script type="application/json">
     {"cards":[["Term","Definition"]]}</script></div> */
export default function flashcards(el, { h, readJSON, store, shuffle, uid }) {
  const data = readJSON(el);
  const id = el.dataset.id || uid('cards');
  let order = (data.cards || []).map((c, i) => ({ term: c[0], def: c[1], i }));
  let pos = 0; let flipped = false;
  el.classList.add('ix');
  const known = () => new Set(store.get('cards', id) || []);
  const front = h('div', { class: 'fc-face front' });
  const back = h('div', { class: 'fc-face back' });
  const card = h('button', { class: 'fc-card', type: 'button', 'aria-live': 'polite' }, front, back);
  const count = h('span', { class: 'fc-count' });
  const prev = h('button', { class: 'btn small', type: 'button' }, '← Previous');
  const next = h('button', { class: 'btn small', type: 'button' }, 'Next →');
  const knowBtn = h('button', { class: 'btn small', type: 'button', 'aria-pressed': 'false' });
  const shuf = h('button', { class: 'btn small ghost', type: 'button' }, 'Shuffle');
  const paint = () => {
    const c = order[pos]; const k = known();
    front.innerHTML = ''; back.innerHTML = '';
    front.append(h('span', { class: 'term' }, c.term), h('span', { class: 'hint' }, 'Select or press Space to flip'));
    back.append(h('span', { class: 'def' }, c.def), h('span', { class: 'hint' }, c.term));
    if (k.has(c.i)) { front.append(h('span', { class: 'fc-known-mark' }, '✓ Known')); back.append(h('span', { class: 'fc-known-mark' }, '✓ Known')); }
    card.classList.toggle('flipped', flipped);
    front.setAttribute('aria-hidden', String(flipped)); back.setAttribute('aria-hidden', String(!flipped));
    card.setAttribute('aria-label', flipped ? `Definition of ${c.term}: ${c.def}` : `Term: ${c.term}. Select to show the definition.`);
    count.textContent = `Card ${pos + 1} of ${order.length} · ${k.size} known`;
    knowBtn.textContent = k.has(c.i) ? '✓ Known' : 'Mark as known'; knowBtn.setAttribute('aria-pressed', String(k.has(c.i)));
  };
  card.addEventListener('click', () => { flipped = !flipped; paint(); });
  prev.addEventListener('click', () => { pos = (pos - 1 + order.length) % order.length; flipped = false; paint(); });
  next.addEventListener('click', () => { pos = (pos + 1) % order.length; flipped = false; paint(); });
  shuf.addEventListener('click', () => { order = shuffle(order); pos = 0; flipped = false; paint(); });
  knowBtn.addEventListener('click', () => { const k = known(); const c = order[pos]; if (k.has(c.i)) k.delete(c.i); else k.add(c.i); store.set('cards', id, [...k]); paint(); });
  el.addEventListener('keydown', (e) => { if (e.target.closest('.fc-card')) return; if (e.key === 'ArrowRight') next.click(); if (e.key === 'ArrowLeft') prev.click(); });
  el.append(h('div', { class: 'ix-head' }, h('div', {}, h('div', { class: 'ix-kind' }, 'Flashcards'), h('h3', {}, el.dataset.title || 'Key terms')), count),
    h('div', { class: 'fc-stage' }, card),
    h('div', { class: 'fc-bar' }, h('div', { style: 'display:flex;gap:6px;flex-wrap:wrap' }, prev, next), h('div', { style: 'display:flex;gap:6px;flex-wrap:wrap' }, knowBtn, shuf)));
  if (order.length) paint();
}
