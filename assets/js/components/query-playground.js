/* Query-index playground: filter, sort and page a sample index on the client.
   JSON: {"data":[{"path":"/a","title":"...","tags":["x"],"date":"2026-01-01"}]} */
export function run(data, { tag, sort, limit }) {
  const hits = data.filter((d) => !tag || d.tags.includes(tag));
  const sorted = [...hits].sort((a, b) => (sort === 'title' ? a.title.localeCompare(b.title) : b.date.localeCompare(a.date)));
  return { total: hits.length, rows: sorted.slice(0, limit) };
}

export default function queryPlayground(el, { h, readJSON, uid }) {
  const data = readJSON(el).data || [];
  el.classList.add('ix');
  const tags = [...new Set(data.flatMap((d) => d.tags))].sort();
  const tId = uid('qp'); const sId = uid('qp'); const lId = uid('qp');
  const tag = h('select', { id: tId, class: 'sim-input' }, h('option', { value: '' }, 'All tags'), ...tags.map((t) => h('option', {}, t)));
  const sort = h('select', { id: sId, class: 'sim-input' }, h('option', { value: 'date' }, 'Newest first'), h('option', { value: 'title' }, 'Title A to Z'));
  const limit = h('input', { id: lId, class: 'sim-input', type: 'number', min: '1', max: String(data.length), value: '3' });
  const code = h('pre', { class: 'sim-out', tabindex: '0', 'aria-label': 'Query code' });
  const list = h('ul', { class: 'sim-notes' });
  const status = h('p', { class: 'ix-note', 'aria-live': 'polite' });
  const paint = () => {
    const opts = { tag: tag.value, sort: sort.value, limit: Math.max(1, Number(limit.value) || 1) };
    const r = run(data, opts);
    code.textContent = `const resp = await fetch('/query-index.json?limit=500');\nconst { data } = await resp.json();\nconst rows = data${opts.tag ? `\n  .filter((p) => JSON.parse(p.tags).includes('${opts.tag}'))` : ''}\n  .sort(${opts.sort === 'title' ? '(a, b) => a.title.localeCompare(b.title)' : '(a, b) => b.lastModified - a.lastModified'})\n  .slice(0, ${opts.limit});`;
    list.replaceChildren(...r.rows.map((d) => h('li', {}, h('code', {}, d.path), ` ${d.title}`)));
    status.textContent = `${r.total} match, showing ${r.rows.length}.`;
  };
  [tag, sort, limit].forEach((c) => c.addEventListener('input', paint));
  el.append(
    h('div', { class: 'ix-head' }, h('div', {}, h('div', { class: 'ix-kind' }, 'Playground'), h('h3', {}, el.dataset.title || 'Query index'))),
    h('div', { class: 'sim-grid' }, h('div', {}, h('label', { for: tId, class: 'sim-label' }, 'Tag'), tag), h('div', {}, h('label', { for: sId, class: 'sim-label' }, 'Sort'), sort), h('div', {}, h('label', { for: lId, class: 'sim-label' }, 'Show'), limit)),
    h('div', { class: 'sim-io', style: 'margin-top:12px' }, h('div', {}, h('div', { class: 'sim-label' }, 'Block code'), code), h('div', {}, h('div', { class: 'sim-label' }, 'Result'), list, status)),
  );
  paint();
}
