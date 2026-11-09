/* File-tree explorer: select a file to see what it does.
   JSON: {"files":[{"path":"scripts/aem.js","role":"...","served":true}]} */
export default function fileTree(el, { h, readJSON }) {
  const files = readJSON(el).files || [];
  el.classList.add('ix');
  const detail = h('div', { class: 'ft-detail', 'aria-live': 'polite' });
  const show = (f, button) => {
    list.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b === button)));
    detail.replaceChildren(h('code', {}, f.path), h('p', {}, f.role), h('p', { class: 'ix-note' }, f.served === false ? 'Not served to visitors.' : `Served at /${f.path}`));
  };
  const seen = new Set();
  const list = h('div', { class: 'ft-list' }, ...files.flatMap((f) => {
    const parts = f.path.split('/'); const rows = [];
    parts.slice(0, -1).forEach((name, i) => {
      const folder = parts.slice(0, i + 1).join('/');
      if (!seen.has(folder)) { seen.add(folder); rows.push(h('div', { class: 'ft-folder', style: `padding-left:${8 + i * 14}px` }, `${name}/`)); }
    });
    const b = h('button', { type: 'button', class: 'ft-file', style: `padding-left:${8 + (parts.length - 1) * 14}px`, 'aria-pressed': 'false' }, parts[parts.length - 1]);
    b.title = f.path;
    b.addEventListener('click', () => show(f, b));
    rows.push(b);
    return rows;
  }));
  el.append(h('div', { class: 'ix-head' }, h('div', {}, h('div', { class: 'ix-kind' }, 'Explorer'), h('h3', {}, el.dataset.title || 'File tree'))), h('div', { class: 'sim-io' }, list, detail));
  if (files.length) show(files[0], list.querySelector('button'));
}
