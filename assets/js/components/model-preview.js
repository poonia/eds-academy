/* Model JSON to properties-panel preview.
   JSON: {"model":{"id":"hero","fields":[...]}} */
const KNOWN = ['text', 'richtext', 'reference', 'aem-content', 'aem-tag', 'select', 'multiselect', 'boolean', 'number', 'date-time', 'tab', 'container'];
const SUFFIX = /(Title|Type|MimeType|Alt|Text)$/;

export function inspect(source) {
  let model;
  try { model = JSON.parse(source); } catch (e) { return { error: `Invalid JSON: ${e.message}` }; }
  if (!Array.isArray(model.fields)) return { error: 'A model needs a "fields" array.' };
  const names = model.fields.map((f) => f.name).filter(Boolean);
  const notes = []; const seen = new Set();
  model.fields.forEach((f) => {
    if (!f.component) notes.push(`A field has no "component".`);
    else if (!KNOWN.includes(f.component)) notes.push(`“${f.component}” is not one of the field types taught here.`);
    if (f.name && seen.has(f.name)) notes.push(`“${f.name}” is used twice.`);
    if (f.name) seen.add(f.name);
    if (f.component !== 'tab' && !f.label) notes.push(`“${f.name || f.component}” has no label.`);
    const m = f.name && f.name.match(SUFFIX);
    if (m) {
      const base = f.name.slice(0, -m[1].length);
      if (names.includes(base)) notes.push(`Field collapse: “${f.name}” becomes an attribute of “${base}” rather than its own value.`);
    }
  });
  return { id: model.id, fields: model.fields, notes };
}

export default function modelPreview(el, { h, readJSON, uid }) {
  const start = JSON.stringify(readJSON(el).model || {}, null, 2);
  el.classList.add('ix');
  const id = uid('mp');
  const input = h('textarea', { id, class: 'sim-text', rows: '16', spellcheck: 'false' }); input.value = start;
  const panel = h('div', { class: 'form-preview', 'aria-label': 'Properties panel preview' });
  const notes = h('ul', { class: 'sim-notes', 'aria-live': 'polite' });
  const paint = () => {
    const r = inspect(input.value);
    if (r.error) { panel.replaceChildren(h('p', {}, 'Fix the JSON to see the panel.')); notes.replaceChildren(h('li', {}, r.error)); return; }
    panel.replaceChildren(h('strong', {}, `Properties: ${r.id || 'model'}`), ...r.fields.filter((f) => f.name).map((f) => {
      const fid = uid('mf'); let control;
      if (f.component === 'richtext') control = h('textarea', { id: fid, rows: '2' });
      else if (f.component === 'boolean') control = h('input', { id: fid, type: 'checkbox' });
      else if (f.component === 'select') control = h('select', { id: fid }, ...(f.options || []).map((o) => h('option', {}, o.name || String(o))));
      else if (f.component === 'number') control = h('input', { id: fid, type: 'number' });
      else control = h('input', { id: fid, type: 'text', placeholder: f.component === 'reference' ? 'Choose an asset' : '' });
      return h('div', { class: 'form-row' }, h('label', { for: fid }, f.label || f.name), control);
    }));
    notes.replaceChildren(...(r.notes.length ? r.notes : ['No problems found.']).map((t) => h('li', {}, t)));
  };
  input.addEventListener('input', paint);
  el.append(h('div', { class: 'ix-head' }, h('div', {}, h('div', { class: 'ix-kind' }, 'Preview'), h('h3', {}, el.dataset.title || 'Model to properties panel'))), h('div', { class: 'sim-io' }, h('div', {}, h('label', { for: id, class: 'sim-label' }, 'Model definition'), input), h('div', {}, h('div', { class: 'sim-label' }, 'Properties panel'), panel)), notes);
  paint();
}
