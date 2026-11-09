/* Telemetry dashboard mock with invented teaching data.
   JSON: {"weight":100,"rows":[{"device":"mobile","section":"/products","samples":900,"lcp":2100,"cls":0.04,"inp":160}],
          "notFound":[{"path":"/old","samples":40}]} */
export const LIMITS = { lcp: [2500, 'ms', 'LCP'], cls: [0.1, '', 'CLS'], inp: [200, 'ms', 'INP'] };

export function summarize(rows, weight, device = 'all', section = 'all') {
  const hit = rows.filter((r) => (device === 'all' || r.device === device) && (section === 'all' || r.section === section));
  const samples = hit.reduce((s, r) => s + r.samples, 0);
  const avg = (k) => (samples ? hit.reduce((s, r) => s + r[k] * r.samples, 0) / samples : 0);
  return { samples, views: samples * weight, margin: samples ? Math.round((196 / Math.sqrt(samples))) : 100, lcp: Math.round(avg('lcp')), cls: Number(avg('cls').toFixed(2)), inp: Math.round(avg('inp')) };
}

export default function rumDashboard(el, { h, readJSON, uid }) {
  const cfg = readJSON(el); const rows = cfg.rows || [];
  el.classList.add('ix');
  const pick = (label, values) => { const id = uid('rd'); const s = h('select', { id, class: 'sim-input' }, ...values.map((v) => h('option', { value: v }, v === 'all' ? 'All' : v))); return { s, node: h('div', {}, h('label', { for: id, class: 'sim-label' }, label), s) }; };
  const device = pick('Device', ['all', ...new Set(rows.map((r) => r.device))]);
  const section = pick('Section', ['all', ...new Set(rows.map((r) => r.section))]);
  const limitId = uid('rd');
  const limit = h('input', { id: limitId, class: 'sim-input', type: 'number', value: '2500', step: '100', min: '500' });
  const cards = h('div', { class: 'rd-cards', 'aria-live': 'polite' });
  const alert = h('div', { class: 'feedback good', 'aria-live': 'polite' });
  const card = (name, value, good, sub) => h('div', { class: `rd-card ${good === null ? '' : good ? 'ok' : 'poor'}` }, h('div', { class: 'sim-label' }, name), h('b', {}, value), h('div', { class: 'ix-note' }, sub));
  const paint = () => {
    const d = summarize(rows, cfg.weight, device.s.value, section.s.value);
    cards.replaceChildren(
      card('Estimated page views', d.views.toLocaleString('en-CA'), null, `${d.samples} samples × ${cfg.weight}, about ±${d.margin}%`),
      ...Object.entries(LIMITS).map(([k, [max, unit, name]]) => card(name, `${d[k]}${unit}`, d[k] <= max, d[k] <= max ? 'Good' : 'Needs work')),
    );
    const over = d.lcp > Number(limit.value);
    alert.className = `feedback ${over ? 'bad' : 'good'}`;
    alert.textContent = d.samples < 100
      ? `Too few samples (${d.samples}) to alert on. Widen the filter or time range.`
      : over ? `Alert: LCP ${d.lcp}ms is over your ${limit.value}ms threshold.` : `No alert: LCP ${d.lcp}ms is within your ${limit.value}ms threshold.`;
  };
  [device.s, section.s, limit].forEach((c) => c.addEventListener('input', paint));
  const nf = cfg.notFound || [];
  el.append(
    h('div', { class: 'ix-head' }, h('div', {}, h('div', { class: 'ix-kind' }, 'Mock dashboard'), h('h3', {}, el.dataset.title || 'Telemetry dashboard'))),
    h('p', { class: 'ix-note' }, 'Invented teaching data. It is not a real site and not Adobe’s interface. Combined values are sample-weighted averages, a simplification of real percentiles.'),
    h('div', { class: 'sim-grid', style: 'margin:12px 0' }, device.node, section.node, h('div', {}, h('label', { for: limitId, class: 'sim-label' }, 'Alert if LCP is over (ms)'), limit)),
    cards, alert,
    h('h4', {}, 'Top 404s'),
    h('div', { class: 'table-wrap' }, h('table', { class: 't' }, h('thead', {}, h('tr', {}, h('th', {}, 'Path'), h('th', {}, 'Estimated views'))), h('tbody', {}, ...nf.map((n) => h('tr', {}, h('td', {}, h('code', {}, n.path)), h('td', {}, String(n.samples * cfg.weight))))))),
  );
  paint();
}
