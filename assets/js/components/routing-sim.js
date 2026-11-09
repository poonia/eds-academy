/* Multi-brand and hybrid routing simulator. The first matching rule wins.
   JSON: {"origins":{"eds":"host"},"rules":[{"pattern":"/products/*","origin":"eds"}],
          "brands":[{"host":"www.a.com","site":"brand-a","theme":"brand-a"}],"path":"/products/x"} */
export function match(path, pattern) {
  if (pattern === '*' || pattern === '/*') return true;
  return pattern.endsWith('*') ? path.startsWith(pattern.slice(0, -1)) : path === pattern;
}

export function route(path, rules) {
  return rules.find((r) => match(path, r.pattern)) || null;
}

export default function routingSim(el, { h, readJSON, uid }) {
  const cfg = readJSON(el); const rules = (cfg.rules || []).map((r) => ({ ...r })); const brands = cfg.brands || [];
  el.classList.add('ix');
  const hostId = uid('rs'); const pathId = uid('rs');
  const host = h('select', { id: hostId, class: 'sim-input' }, ...brands.map((b) => h('option', { value: b.host }, b.host)));
  const path = h('input', { id: pathId, class: 'sim-input', type: 'text', value: cfg.path || '/', spellcheck: 'false' });
  const out = h('pre', { class: 'sim-out', tabindex: '0', 'aria-label': 'Routing result' });
  const note = h('div', { class: 'feedback good', 'aria-live': 'polite' });
  const rows = rules.map((r) => { const s = h('select', { class: 'sim-input', 'aria-label': `Origin for ${r.pattern}` }, ...Object.keys(cfg.origins).map((k) => h('option', { value: k }, k))); s.value = r.origin; return { r, s, row: h('tr', {}, h('td', {}, h('code', {}, r.pattern)), h('td', {}, s)) }; });
  const paint = () => {
    rows.forEach(({ r, s, row }) => { r.origin = s.value; row.classList.toggle('rs-hit', route(path.value, rules) === r); });
    const hit = route(path.value, rules); const b = brands.find((x) => x.host === host.value);
    if (!hit) { out.textContent = 'No rule matches.'; note.className = 'feedback bad'; note.textContent = 'Every path needs a route. Add a catch-all rule at the end.'; return; }
    const eds = hit.origin === 'eds';
    const origin = eds ? `main--${b.site}--acme.aem.live` : cfg.origins[hit.origin];
    out.textContent = `https://${b.host}${path.value}\n  rule: ${hit.pattern}\n  origin: https://${origin}${eds ? `\n  code: acme/${cfg.repo}\n  content: ${b.site}\n  theme: ${b.theme}` : ''}`;
    note.className = 'feedback good';
    note.textContent = eds ? `Served by Edge Delivery. ${b.host} uses shared code with its own content and theme.` : 'Served by the other origin. Keep header, footer and analytics consistent across the join.';
  };
  [host, path, ...rows.map((x) => x.s)].forEach((c) => c.addEventListener('input', paint));
  el.append(
    h('div', { class: 'ix-head' }, h('div', {}, h('div', { class: 'ix-kind' }, 'Simulator'), h('h3', {}, el.dataset.title || 'Routing simulator'))),
    h('div', { class: 'sim-grid', style: 'margin:12px 0' }, h('div', {}, h('label', { for: hostId, class: 'sim-label' }, 'Brand domain'), host), h('div', {}, h('label', { for: pathId, class: 'sim-label' }, 'Path'), path)),
    h('div', { class: 'sim-io' }, h('div', {}, h('div', { class: 'sim-label' }, 'CDN rules, first match wins'), h('div', { class: 'table-wrap' }, h('table', { class: 't sim-table' }, h('tbody', {}, ...rows.map((x) => x.row))))), h('div', {}, h('div', { class: 'sim-label' }, 'Result'), out)),
    note,
  );
  paint();
}
