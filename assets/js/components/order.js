/* Drag-to-order exercise with keyboard alternative (move up / move down buttons).
   <div data-component="order" data-title="..."><script type="application/json">
     {"prompt":"...","items":["first","second","third"],"explain":"..."}</script></div>
   "items" is the correct order; learners see it shuffled. */
export default function order(el, { h, readJSON, shuffle }) {
  const data = readJSON(el);
  const correct = data.items || [];
  let items = shuffle(correct);
  if (items.join() === correct.join() && items.length > 1) items = items.slice().reverse();
  el.classList.add('ix');
  const list = h('ol', { class: 'ord-list' });
  const fb = h('div', { 'aria-live': 'polite' });
  const live = h('p', { class: 'sr-only', 'aria-live': 'assertive' });
  let dragFrom = null;
  const paint = (focusIdx, focusDir) => {
    list.innerHTML = '';
    items.forEach((t, i) => {
      const up = h('button', { class: 'mv', type: 'button', 'aria-label': `Move "${t}" up`, disabled: i === 0 }, '↑');
      const down = h('button', { class: 'mv', type: 'button', 'aria-label': `Move "${t}" down`, disabled: i === items.length - 1 }, '↓');
      up.addEventListener('click', () => move(i, -1));
      down.addEventListener('click', () => move(i, 1));
      const li = h('li', { class: 'ord-item', draggable: 'true' }, h('span', { class: 'pos' }, String(i + 1)), h('span', {}, t), up, down);
      li.addEventListener('dragstart', (e) => { dragFrom = i; li.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', String(i)); } catch (er) { /* ignore */ } });
      li.addEventListener('dragend', () => li.classList.remove('dragging'));
      li.addEventListener('dragover', (e) => e.preventDefault());
      li.addEventListener('drop', (e) => { e.preventDefault(); if (dragFrom === null || dragFrom === i) return; const [x] = items.splice(dragFrom, 1); items.splice(i, 0, x); dragFrom = null; fb.className = ''; fb.innerHTML = ''; paint(); });
      list.append(li);
    });
    if (focusIdx != null) { const btns = list.children[focusIdx] && list.children[focusIdx].querySelectorAll('.mv'); if (btns) { const b = btns[focusDir < 0 ? 0 : 1]; (b.disabled ? btns[focusDir < 0 ? 1 : 0] : b).focus(); } }
  };
  const move = (i, d) => {
    const j = i + d; if (j < 0 || j >= items.length) return;
    [items[i], items[j]] = [items[j], items[i]];
    live.textContent = `"${items[j]}" moved to position ${j + 1}.`;
    fb.className = ''; fb.innerHTML = '';
    paint(j, d);
  };
  const check = h('button', { class: 'btn small primary', type: 'button' }, 'Check order');
  check.addEventListener('click', () => {
    let right = 0;
    Array.from(list.children).forEach((li, i) => {
      const ok = items[i] === correct[i]; if (ok) right += 1;
      li.classList.toggle('correct', ok); li.classList.toggle('wrong', !ok);
      li.querySelector('.pos').textContent = `${i + 1} ${ok ? '✓' : '✗'}`;
    });
    const all = right === correct.length;
    fb.className = `feedback ${all ? 'good' : 'bad'}`; fb.innerHTML = '';
    fb.append(h('strong', {}, all ? 'Correct order.' : `${right} of ${correct.length} in the right place.`), all ? (data.explain || '') : 'Items marked ✗ are out of place. Move them and check again.');
  });
  const reveal = h('button', { class: 'btn small ghost', type: 'button' }, 'Show answer');
  reveal.addEventListener('click', () => { items = correct.slice(); paint(); check.click(); });
  el.append(h('div', { class: 'ix-head' }, h('div', {}, h('div', { class: 'ix-kind' }, 'Put in order'), h('h3', {}, data.prompt || el.dataset.title || 'Order these items'))),
    h('p', { class: 'ix-note' }, 'Drag items, or use the arrow buttons to move them.'), list, live, h('div', { class: 'ix-foot' }, check, reveal), fb);
  paint();
}
