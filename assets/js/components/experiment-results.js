/* Experiment results explorer: is a challenger really better?
   Sampled telemetry means significance depends on sampled counts, not estimated ones.
   JSON: {"control":[50000,1500],"challenger":[50000,1650],"weight":100} */
function normalCdf(z) {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp((-z * z) / 2);
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return z > 0 ? 1 - p : p;
}

export function significance([aViews, aConv], [bViews, bConv], weight = 1) {
  const n1 = aViews / weight; const n2 = bViews / weight;
  const c1 = aConv / weight; const c2 = bConv / weight;
  if (n1 <= 0 || n2 <= 0) return { rateA: 0, rateB: 0, lift: 0, p: 1, n1, n2, c1, c2 };
  const rateA = c1 / n1; const rateB = c2 / n2;
  const pool = (c1 + c2) / (n1 + n2);
  const se = Math.sqrt(pool * (1 - pool) * (1 / n1 + 1 / n2));
  const z = se ? (rateB - rateA) / se : 0;
  return { rateA, rateB, lift: rateA ? (rateB - rateA) / rateA : 0, p: 2 * (1 - normalCdf(Math.abs(z))), n1, n2, c1, c2 };
}

export function verdict(r) {
  if (r.c1 < 10 || r.c2 < 10) return ['bad', 'Too few sampled conversions to judge. Keep the test running.'];
  if (r.p >= 0.05) return ['bad', 'Not significant at 95%. The difference could be luck.'];
  return r.lift > 0 ? ['good', 'Significant at 95%, and the challenger is ahead.'] : ['bad', 'Significant at 95%, and the challenger is worse. Keep the control.'];
}

export default function experimentResults(el, { h, readJSON, uid }) {
  const cfg = readJSON(el);
  el.classList.add('ix');
  const num = (label, value) => { const id = uid('er'); const input = h('input', { id, class: 'sim-input', type: 'number', min: '0', value: String(value) }); return { input, node: h('div', {}, h('label', { for: id, class: 'sim-label' }, label), input) }; };
  const views1 = num('Control: estimated views', cfg.control[0]); const conv1 = num('Control: estimated conversions', cfg.control[1]);
  const views2 = num('Challenger: estimated views', cfg.challenger[0]); const conv2 = num('Challenger: estimated conversions', cfg.challenger[1]);
  const wId = uid('er');
  const weight = h('select', { id: wId, class: 'sim-input' }, ...[1, 10, 100].map((w) => h('option', { value: String(w) }, w === 1 ? 'Every view (1)' : `1 in ${w}`)));
  weight.value = String(cfg.weight || 100);
  const out = h('pre', { class: 'sim-out', tabindex: '0', 'aria-label': 'Results' });
  const note = h('div', { class: 'feedback bad', 'aria-live': 'polite' });
  const pct = (x) => `${(x * 100).toFixed(2)}%`;
  const paint = () => {
    const r = significance([Number(views1.input.value), Number(conv1.input.value)], [Number(views2.input.value), Number(conv2.input.value)], Number(weight.value));
    out.textContent = `Control rate:    ${pct(r.rateA)}\nChallenger rate: ${pct(r.rateB)}\nLift:            ${(r.lift * 100).toFixed(1)}%\nSampled views:   ${Math.round(r.n1)} and ${Math.round(r.n2)}\nSampled conv.:   ${Math.round(r.c1)} and ${Math.round(r.c2)}\np-value:         ${r.p.toFixed(3)}`;
    const [kind, text] = verdict(r);
    note.className = `feedback ${kind}`; note.textContent = text;
  };
  [views1, conv1, views2, conv2].forEach((f) => f.input.addEventListener('input', paint));
  weight.addEventListener('input', paint);
  el.append(
    h('div', { class: 'ix-head' }, h('div', {}, h('div', { class: 'ix-kind' }, 'Explorer'), h('h3', {}, el.dataset.title || 'Experiment results explorer'))),
    h('p', { class: 'ix-note' }, 'A simplified two-proportion test for learning. Numbers you type stay on this page.'),
    h('div', { class: 'sim-grid', style: 'margin:12px 0' }, views1.node, conv1.node, views2.node, conv2.node, h('div', {}, h('label', { for: wId, class: 'sim-label' }, 'Sampling'), weight)),
    out, note,
  );
  paint();
}
