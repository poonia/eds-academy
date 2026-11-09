/* Form rules builder: WHEN a condition is true THEN show or hide a field, with a live form. */
export function test(op, left, right) {
  const a = Number(left); const b = Number(right); const numeric = left !== '' && right !== '' && !Number.isNaN(a) && !Number.isNaN(b);
  switch (op) {
    case '>': return numeric && a > b;
    case '<': return numeric && a < b;
    case '=': return String(left).toLowerCase() === String(right).toLowerCase();
    case 'empty': return left === '';
    default: return false;
  }
}

export function ruleText({ source, op, value, action, target, otherwise }) {
  const cond = op === 'empty' ? `${source} is empty` : `${source} ${op} ${value}`;
  const other = action === 'Show' ? 'Hide' : 'Show';
  return `WHEN ${cond}\nTHEN ${action} "${target}"${otherwise ? `\nELSE ${other} "${target}"` : ''}`;
}

export default function formRules(el, { h, uid }) {
  el.classList.add('ix');
  const FIELDS = ['Gross salary', 'Dependents'];
  const select = (label, values) => { const id = uid('fr'); const s = h('select', { id, class: 'sim-input' }, ...values.map((v) => h('option', { value: v }, v === 'empty' ? 'is empty' : v))); return { s, node: h('div', {}, h('label', { for: id, class: 'sim-label' }, label), s) }; };
  const source = select('When', FIELDS); const op = select('Condition', ['>', '<', '=', 'empty']); const action = select('Then', ['Show', 'Hide']);
  const vId = uid('fr');
  const value = h('input', { id: vId, class: 'sim-input', type: 'text', value: '50000' });
  const otherwise = h('input', { type: 'checkbox' }); otherwise.checked = true;
  const inputs = Object.fromEntries(FIELDS.map((f) => [f, h('input', { type: 'number', value: f === 'Gross salary' ? '42000' : '0', 'aria-label': f })]));
  const extra = h('div', { class: 'form-row' }, h('label', {}, 'Additional deduction', h('input', { type: 'number', 'aria-label': 'Additional deduction' })));
  const out = h('pre', { class: 'sim-out', tabindex: '0', 'aria-label': 'Rule' });
  const note = h('div', { class: 'feedback good', 'aria-live': 'polite' });
  const paint = () => {
    const hit = test(op.s.value, inputs[source.s.value].value, value.value);
    const show = hit ? action.s.value === 'Show' : (otherwise.checked ? action.s.value !== 'Show' : true);
    extra.hidden = !show;
    value.disabled = op.s.value === 'empty';
    out.textContent = ruleText({ source: source.s.value, op: op.s.value, value: value.value, action: action.s.value, target: 'Additional deduction', otherwise: otherwise.checked });
    note.textContent = `Condition is ${hit ? 'true' : 'false'}, so “Additional deduction” is ${show ? 'visible' : 'hidden'}. Server-side validation must still check submitted data.`;
  };
  [source.s, op.s, action.s, value, ...Object.values(inputs)].forEach((c) => c.addEventListener('input', paint));
  otherwise.addEventListener('change', paint);
  el.append(
    h('div', { class: 'ix-head' }, h('div', {}, h('div', { class: 'ix-kind' }, 'Builder'), h('h3', {}, el.dataset.title || 'Form rules builder'))),
    h('div', { class: 'sim-grid', style: 'margin:12px 0' }, source.node, op.node, h('div', {}, h('label', { for: vId, class: 'sim-label' }, 'Value'), value), action.node),
    h('div', { class: 'sim-checks' }, h('label', {}, otherwise, ' Add the opposite action when false')),
    h('div', { class: 'sim-io' }, h('div', {}, h('div', { class: 'sim-label' }, 'Rule'), out), h('div', {}, h('div', { class: 'sim-label' }, 'Form preview'), h('div', { class: 'form-preview' }, ...FIELDS.map((f) => h('div', { class: 'form-row' }, h('label', {}, f, inputs[f]))), extra))),
    note,
  );
  paint();
}
