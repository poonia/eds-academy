/* Match exercise: pick the matching item for each prompt (keyboard friendly selects).
   <div data-component="match" data-title="..."><script type="application/json">
     {"prompt":"...","pairs":[["left","right"]],"explain":"..."}</script></div> */
export default function match(el, { h, readJSON, shuffle, uid }) {
  const data = readJSON(el);
  const pairs = data.pairs || [];
  const rights = shuffle(pairs.map((p) => p[1]));
  el.classList.add('ix');
  const rows = h('div');
  const selects = pairs.map(([left]) => {
    const id = uid('m');
    const sel = h('select', { id }, h('option', { value: '' }, 'Choose…'), rights.map((r) => h('option', { value: r }, r)));
    const mark = h('span', { class: 'mark', 'aria-hidden': 'true' });
    rows.append(h('div', { class: 'match-row' }, h('label', { for: id }, h('b', {}, left)), sel, mark));
    sel.addEventListener('change', () => { mark.textContent = ''; fb.className = ''; fb.innerHTML = ''; });
    return { sel, mark };
  });
  const fb = h('div', { 'aria-live': 'polite' });
  const check = h('button', { class: 'btn small primary', type: 'button' }, 'Check matches');
  check.addEventListener('click', () => {
    let right = 0;
    selects.forEach(({ sel, mark }, i) => { const ok = sel.value === pairs[i][1]; if (ok) right += 1; mark.textContent = sel.value ? (ok ? '✓' : '✗') : '?'; mark.style.color = ok ? 'var(--good)' : 'var(--bad)'; sel.setAttribute('aria-invalid', String(!ok)); });
    const all = right === pairs.length;
    fb.className = `feedback ${all ? 'good' : 'bad'}`; fb.innerHTML = '';
    fb.append(h('strong', {}, all ? 'All matched.' : `${right} of ${pairs.length} correct.`), all ? (data.explain || '') : 'Fix the rows marked ✗ or ?, then check again.');
  });
  const reveal = h('button', { class: 'btn small ghost', type: 'button' }, 'Show answers');
  reveal.addEventListener('click', () => { selects.forEach(({ sel }, i) => { sel.value = pairs[i][1]; }); check.click(); });
  el.append(h('div', { class: 'ix-head' }, h('div', {}, h('div', { class: 'ix-kind' }, 'Match'), h('h3', {}, data.prompt || el.dataset.title || 'Match each item'))), rows, h('div', { class: 'ix-foot' }, check, reveal), fb);
}
