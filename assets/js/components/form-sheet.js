/* Form sheet to form preview. Teaching simulator with a small column set.
   JSON: {"csv":"Name,Type,Label,Mandatory,Options\nemail,email,Email,x,"} */
const ALLOWED = ['text', 'email', 'tel', 'number', 'date', 'textarea', 'select', 'checkbox', 'submit'];

export function parseForm(csv) {
  const rows = csv.split('\n').map((l) => l.trim()).filter(Boolean).map((l) => l.split(',').map((c) => c.trim()));
  const head = (rows[0] || []).map((c) => c.toLowerCase());
  const col = (r, n) => r[head.indexOf(n)] || '';
  const issues = []; const names = new Set();
  const fields = rows.slice(1).map((r, i) => {
    const f = { name: col(r, 'name'), type: col(r, 'type').toLowerCase() || 'text', label: col(r, 'label'), required: !!col(r, 'mandatory'), options: col(r, 'options').split(';').map((o) => o.trim()).filter(Boolean) };
    if (!f.name) issues.push(`Row ${i + 2}: add a Name, which becomes the submitted field.`);
    if (names.has(f.name)) issues.push(`Row ${i + 2}: the name “${f.name}” is used twice.`);
    names.add(f.name);
    if (!ALLOWED.includes(f.type)) issues.push(`Row ${i + 2}: this simulator has no “${f.type}” type.`);
    if (!f.label && f.type !== 'submit') issues.push(`Row ${i + 2}: add a Label so screen reader users know what to enter.`);
    if (f.type === 'select' && !f.options.length) issues.push(`Row ${i + 2}: a select needs Options, separated by semicolons.`);
    return f;
  });
  return { fields, issues };
}

export default function formSheet(el, { h, readJSON, uid }) {
  const start = readJSON(el).csv || '';
  el.classList.add('ix');
  const id = uid('fs');
  const input = h('textarea', { id, class: 'sim-text', rows: '8', spellcheck: 'false' }); input.value = start;
  const preview = h('form', { class: 'form-preview', 'aria-label': 'Form preview' });
  preview.addEventListener('submit', (e) => e.preventDefault());
  const issues = h('ul', { class: 'sim-notes', 'aria-live': 'polite' });
  const paint = () => {
    const r = parseForm(input.value);
    preview.replaceChildren(...r.fields.map((f) => {
      if (f.type === 'submit') return h('button', { class: 'btn primary', type: 'submit' }, f.label || 'Submit');
      const fid = uid('fp'); let control;
      if (f.type === 'textarea') control = h('textarea', { id: fid, rows: '2' });
      else if (f.type === 'select') control = h('select', { id: fid }, ...f.options.map((o) => h('option', {}, o)));
      else control = h('input', { id: fid, type: f.type });
      if (f.required) control.required = true;
      return h('div', { class: 'form-row' }, h('label', { for: fid }, `${f.label || f.name}${f.required ? ' *' : ''}`), control);
    }));
    issues.replaceChildren(...(r.issues.length ? r.issues : ['No problems found.']).map((t) => h('li', {}, t)));
  };
  input.addEventListener('input', paint);
  el.append(
    h('div', { class: 'ix-head' }, h('div', {}, h('div', { class: 'ix-kind' }, 'Simulator'), h('h3', {}, el.dataset.title || 'Form sheet to form'))),
    h('p', { class: 'ix-note' }, 'Row one holds the columns. Your project’s form block decides which columns and types it really supports.'),
    h('div', { class: 'sim-io' }, h('div', {}, h('label', { for: id, class: 'sim-label' }, 'Form sheet'), input), h('div', {}, h('div', { class: 'sim-label' }, 'Preview'), preview)),
    issues,
  );
  paint();
}
