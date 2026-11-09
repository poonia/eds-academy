/* Content Fragment JSON to HTML: a small Mustache-style renderer for learning.
   Supports {{name}}, {{a.b}} and {{#list}}...{{/list}}. JSON: {"json":{...},"template":"..."} */
const safe = (v) => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const get = (ctx, path) => (path === '.' ? ctx : path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), ctx));

export function render(tpl, data, missing = []) {
  const sections = tpl.replace(/\{\{#([\w.]+)\}\}([\s\S]*?)\{\{\/\1\}\}/g, (_, key, inner) => {
    const v = get(data, key);
    if (Array.isArray(v)) return v.map((item) => render(inner, typeof item === 'object' ? { ...data, ...item } : { ...data, '.': item }, missing)).join('');
    if (v === undefined) missing.push(key);
    return v ? render(inner, typeof v === 'object' ? { ...data, ...v } : data, missing) : '';
  });
  return sections.replace(/\{\{([\w.]+)\}\}/g, (_, key) => {
    const v = key === '.' ? data['.'] : get(data, key);
    if (v === undefined || v === null) { missing.push(key); return ''; }
    return safe(v);
  });
}

export default function cfHtml(el, { h, readJSON, uid }) {
  const cfg = readJSON(el);
  el.classList.add('ix');
  const jId = uid('cf'); const tId = uid('cf');
  const json = h('textarea', { id: jId, class: 'sim-text', rows: '11', spellcheck: 'false' }, JSON.stringify(cfg.json, null, 2));
  const tpl = h('textarea', { id: tId, class: 'sim-text', rows: '11', spellcheck: 'false' }, cfg.template);
  const out = h('pre', { class: 'sim-out', tabindex: '0', 'aria-label': 'Generated HTML' });
  const note = h('div', { class: 'feedback good', 'aria-live': 'polite' });
  const paint = () => {
    let data;
    try { data = JSON.parse(json.value); } catch (e) { out.textContent = ''; note.className = 'feedback bad'; note.textContent = 'Invalid JSON.'; return; }
    const missing = [];
    out.textContent = render(tpl.value, data, missing);
    const hasH1 = /<h1[\s>]/i.test(tpl.value);
    note.className = `feedback ${missing.length || !hasH1 ? 'bad' : 'good'}`;
    note.textContent = missing.length ? `No value for: ${[...new Set(missing)].join(', ')}.` : hasH1 ? 'The full content is in the HTML, so crawlers and agents can read it without JavaScript.' : 'Add an <h1>. The generated page needs a main heading.';
  };
  [json, tpl].forEach((c) => c.addEventListener('input', paint));
  el.append(
    h('div', { class: 'ix-head' }, h('div', {}, h('div', { class: 'ix-kind' }, 'Simulator'), h('h3', {}, el.dataset.title || 'Content Fragment JSON to HTML'))),
    h('div', { class: 'sim-io' }, h('div', {}, h('label', { for: jId, class: 'sim-label' }, 'Fragment JSON'), json), h('div', {}, h('label', { for: tId, class: 'sim-label' }, 'Mustache template'), tpl)),
    h('div', { class: 'sim-label', style: 'margin-top:12px' }, 'Generated HTML'), out, note,
  );
  paint();
}
