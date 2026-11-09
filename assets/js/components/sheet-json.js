/* Spreadsheet-to-JSON converter, with an optional redirects tester (data-mode="redirects").
   JSON: {"csv":"Source,Destination\n/a,/b","path":"/a"} */
const parse = (csv) => {
  const rows = csv.split('\n').map((l) => l.trim()).filter(Boolean).map((l) => l.split(',').map((c) => c.trim()));
  const columns = rows[0] || [];
  const data = rows.slice(1).map((r) => Object.fromEntries(columns.map((c, i) => [c, r[i] || ''])));
  return { columns, data };
};

export function toSheet(csv) {
  const { columns, data } = parse(csv);
  return { total: data.length, offset: 0, limit: data.length, columns, data, ':type': 'sheet' };
}

export function followRedirect(csv, path) {
  const { data } = parse(csv);
  const hit = data.find((row) => row.Source === path);
  if (!hit) return { found: false, text: `No row matches ${path}. Sources are exact paths, so the page or a 404 is served.` };
  const external = /^https?:/.test(hit.Destination);
  const loop = hit.Destination === path;
  if (loop) return { found: true, bad: true, text: `Loop: ${path} redirects to itself. Fix this row before you publish.` };
  return { found: true, text: `Redirects to ${hit.Destination}${external ? ' on another site' : ''}. The redirect wins even if a page exists at ${path}.` };
}

export default function sheetJson(el, { h, readJSON, uid }) {
  const cfg = readJSON(el); const isRedirects = el.dataset.mode === 'redirects';
  el.classList.add('ix');
  const id = uid('sj');
  const input = h('textarea', { id, class: 'sim-text', rows: '7', spellcheck: 'false' }); input.value = cfg.csv || '';
  const output = h('pre', { class: 'sim-out', tabindex: '0', 'aria-label': 'Generated JSON' });
  const pathId = uid('sjp');
  const path = h('input', { id: pathId, class: 'sim-input', type: 'text', value: cfg.path || '/', spellcheck: 'false' });
  const verdict = h('div', { class: 'feedback good', 'aria-live': 'polite' });
  const paint = () => {
    output.textContent = JSON.stringify(toSheet(input.value), null, 2);
    if (isRedirects) {
      const r = followRedirect(input.value, path.value.trim());
      verdict.textContent = r.text; verdict.className = `feedback ${r.found && !r.bad ? 'good' : 'bad'}`;
    }
  };
  input.addEventListener('input', paint); path.addEventListener('input', paint);
  el.append(
    h('div', { class: 'ix-head' }, h('div', {}, h('div', { class: 'ix-kind' }, 'Converter'), h('h3', {}, el.dataset.title || 'Spreadsheet to JSON'))),
    h('p', { class: 'ix-note' }, 'Row one holds the column names. Separate cells with commas. The output follows the single-sheet format EDS serves.'),
    h('div', { class: 'sim-io' }, h('div', {}, h('label', { for: id, class: 'sim-label' }, 'Sheet'), input), h('div', {}, h('div', { class: 'sim-label' }, `${isRedirects ? '/redirects.json' : 'JSON response'}`), output)),
    isRedirects ? h('div', { style: 'margin-top:12px' }, h('label', { for: pathId, class: 'sim-label' }, 'Test a path'), path, verdict) : null,
  );
  paint();
}
