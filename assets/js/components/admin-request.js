/* Admin API request builder: compose a curl command. It sends nothing. */
export const OPS = {
  status: { label: 'Read status', method: 'GET', path: 'status', write: false },
  preview: { label: 'Preview a page', method: 'POST', path: 'preview', write: true },
  publish: { label: 'Publish a page', method: 'POST', path: 'live', write: true },
  unpublish: { label: 'Unpublish a page', method: 'DELETE', path: 'live', write: true, danger: true },
  cache: { label: 'Purge live CDN cache', method: 'POST', path: 'cache', write: true },
  index: { label: 'Re-index a page', method: 'POST', path: 'index', write: true },
};

export function build(op, { org, site, ref, path }) {
  const o = OPS[op]; const p = path.replace(/^\//, '');
  const flag = o.method === 'GET' ? '' : `-X ${o.method} `;
  return `curl -i ${flag}\\\n  "https://admin.hlx.page/${o.path}/${org}/${site}/${ref}/${p}" \\\n  -H "x-auth-token: $AEM_API_KEY"`;
}

export default function adminRequest(el, { h, uid }) {
  el.classList.add('ix');
  const field = (label, value) => { const id = uid('ar'); const input = h('input', { id, class: 'sim-input', type: 'text', value, spellcheck: 'false' }); return { input, node: h('div', {}, h('label', { for: id, class: 'sim-label' }, label), input) }; };
  const sId = uid('ar');
  const op = h('select', { id: sId, class: 'sim-input' }, ...Object.entries(OPS).map(([k, o]) => h('option', { value: k }, o.label)));
  const [org, site, ref, path] = [field('org', 'acme'), field('site', 'website'), field('ref', 'main'), field('path', '/savings/tfsa')];
  const out = h('pre', { class: 'sim-out', tabindex: '0', 'aria-label': 'curl command' });
  const note = h('div', { class: 'feedback good', 'aria-live': 'polite' });
  const paint = () => {
    const o = OPS[op.value];
    out.textContent = build(op.value, { org: org.input.value, site: site.input.value, ref: ref.input.value, path: path.input.value });
    note.className = `feedback ${o.danger ? 'bad' : 'good'}`;
    note.textContent = o.danger ? 'This removes the page from live and cannot be undone. Script it only with confirmation.' : `${o.write ? 'This changes state, so use a key limited to the roles it needs.' : 'Read-only. It may still need authentication, depending on the site.'} This page only builds the command and sends nothing.`;
  };
  [op, org.input, site.input, ref.input, path.input].forEach((c) => c.addEventListener('input', paint));
  el.append(h('div', { class: 'ix-head' }, h('div', {}, h('div', { class: 'ix-kind' }, 'Builder'), h('h3', {}, el.dataset.title || 'Admin API request builder'))), h('label', { for: sId, class: 'sim-label' }, 'Operation'), op, h('div', { class: 'sim-grid', style: 'margin:12px 0' }, org.node, site.node, ref.node, path.node), out, note);
  paint();
}
