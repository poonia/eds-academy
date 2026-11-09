/* Interactive RACI matrix: assign letters and check each decision.
   JSON: {"roles":["Author"],"rows":[{"task":"Publish","model":["A"],"why":"..."}]} */
export function checkRow(values) {
  const a = values.filter((v) => v === 'A').length;
  if (a !== 1) return a ? 'More than one Accountable.' : 'Nobody is Accountable.';
  return '';
}

export default function raciMatrix(el, { h, readJSON }) {
  const { roles = [], rows = [] } = readJSON(el);
  el.classList.add('ix');
  const state = rows.map((r) => r.model.map(() => ''));
  const status = rows.map(() => h('td', { class: 'ix-note' }));
  const selects = [];
  const paint = () => rows.forEach((r, i) => { const p = checkRow(state[i]); status[i].textContent = p || 'One clear owner.'; });
  const body = rows.map((r, i) => h('tr', {}, h('td', {}, r.task), ...r.model.map((_, j) => {
    const s = h('select', { class: 'sim-input', 'aria-label': `${r.task}: ${roles[j]}` }, ...['', 'R', 'A', 'C', 'I'].map((v) => h('option', { value: v }, v || '–')));
    s.addEventListener('input', () => { state[i][j] = s.value; paint(); });
    selects.push([s, i, j]);
    return h('td', {}, s);
  }), status[i]));
  const notes = h('ul', { class: 'sim-notes', 'aria-live': 'polite' });
  const show = h('button', { type: 'button', class: 'btn' }, 'Show a suggested model');
  show.addEventListener('click', () => {
    selects.forEach(([s, i, j]) => { s.value = rows[i].model[j]; state[i][j] = s.value; });
    paint();
    notes.replaceChildren(...rows.map((r) => h('li', {}, h('b', {}, `${r.task}: `), r.why)));
  });
  el.append(
    h('div', { class: 'ix-head' }, h('div', {}, h('div', { class: 'ix-kind' }, 'Matrix'), h('h3', {}, el.dataset.title || 'RACI matrix'))),
    h('p', { class: 'ix-note' }, 'R does the work. A owns the outcome, and there is exactly one. C is asked first. I is told after.'),
    h('div', { class: 'table-wrap' }, h('table', { class: 't sim-table' }, h('thead', {}, h('tr', {}, h('th', {}, 'Decision'), ...roles.map((x) => h('th', {}, x)), h('th', {}, 'Check'))), h('tbody', {}, ...body))),
    h('div', { style: 'margin-top:12px' }, show), notes,
  );
  paint();
}
