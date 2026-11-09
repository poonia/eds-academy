/* Block builder playground: authored rows, a decorate pattern, the resulting DOM.
   JSON: {"name":"cards","source":"a | b\nc | d"} */
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const parse = (src) => src.split('\n').map((l) => l.trim()).filter(Boolean).map((l) => l.split('|').map((c) => c.trim()));

export const PATTERNS = {
  none: { label: 'No decoration', code: 'export default function decorate(block) {\n  // Leave the delivered rows and cells as they are.\n}' },
  list: { label: 'Rows to a list (cards)', code: "export default function decorate(block) {\n  const ul = document.createElement('ul');\n  [...block.children].forEach((row) => {\n    const li = document.createElement('li');\n    while (row.firstElementChild) li.append(row.firstElementChild);\n    ul.append(li);\n  });\n  block.replaceChildren(ul);\n}" },
  columns: { label: 'Count columns (columns)', code: 'export default function decorate(block) {\n  const cols = [...block.firstElementChild.children];\n  block.classList.add(`columns-${cols.length}-cols`);\n}' },
  config: { label: 'Read config (name and value)', code: "import { readBlockConfig } from '../../scripts/aem.js';\n\nexport default function decorate(block) {\n  const config = readBlockConfig(block);\n  block.textContent = '';\n  block.dataset.config = JSON.stringify(config);\n}" },
};

export function decorate(name, rows, pattern) {
  const cell = (c) => `<div>${esc(c)}</div>`;
  if (pattern === 'list') return `<div class="${name} block">\n  <ul>\n${rows.map((r) => `    <li>${r.map(cell).join('')}</li>`).join('\n')}\n  </ul>\n</div>`;
  if (pattern === 'config') {
    const cfg = Object.fromEntries(rows.map((r) => [r[0].toLowerCase().replace(/[^a-z0-9]+/g, '-'), r[1] || '']));
    return `<div class="${name} block" data-config='${esc(JSON.stringify(cfg))}'></div>`;
  }
  const extra = pattern === 'columns' ? ` columns-${(rows[0] || []).length}-cols` : '';
  return `<div class="${name}${extra} block">\n${rows.map((r) => `  <div>${r.map(cell).join('')}</div>`).join('\n')}\n</div>`;
}

export default function blockPlayground(el, { h, readJSON, uid }) {
  const cfg = readJSON(el); const name = cfg.name || 'cards';
  el.classList.add('ix');
  const inId = uid('bp'); const selId = uid('bp');
  const input = h('textarea', { id: inId, class: 'sim-text', rows: '5', spellcheck: 'false' }); input.value = cfg.source || '';
  const select = h('select', { id: selId, class: 'sim-input' }, ...Object.entries(PATTERNS).map(([k, p]) => h('option', { value: k }, p.label)));
  select.value = 'list';
  const js = h('pre', { class: 'sim-out', tabindex: '0', 'aria-label': `${name}.js` });
  const dom = h('pre', { class: 'sim-out', tabindex: '0', 'aria-label': 'Resulting DOM' });
  const paint = () => { js.textContent = PATTERNS[select.value].code; dom.textContent = decorate(name, parse(input.value), select.value); };
  input.addEventListener('input', paint); select.addEventListener('change', paint);
  el.append(
    h('div', { class: 'ix-head' }, h('div', {}, h('div', { class: 'ix-kind' }, 'Playground'), h('h3', {}, el.dataset.title || 'Block builder'))),
    h('div', { class: 'sim-io' }, h('div', {}, h('label', { for: inId, class: 'sim-label' }, 'Rows, with | between cells'), input), h('div', {}, h('label', { for: selId, class: 'sim-label' }, 'Decoration pattern'), select)),
    h('div', { class: 'sim-io', style: 'margin-top:12px' }, h('div', {}, h('div', { class: 'sim-label' }, `blocks/${name}/${name}.js`), js), h('div', {}, h('div', { class: 'sim-label' }, 'DOM after decorate()'), dom)),
  );
  paint();
}
