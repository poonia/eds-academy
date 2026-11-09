/* Personalization flow and flicker timeline. Target figures are Adobe's published baseline;
   the other approaches are labelled as teaching estimates. */
export const APPROACHES = {
  plugin: { label: 'Plugin, audience resolved in the browser', mobile: 0, desktop: 0, swap: 'before', source: 'Teaching estimate' },
  api: { label: 'Plugin, audience from an external API', mobile: 300, desktop: 200, swap: 'before', source: 'Teaching estimate. Blocks rendering until it answers.' },
  edge: { label: 'Variation chosen at the CDN edge', mobile: 30, desktop: 30, swap: 'server', source: 'Teaching estimate' },
  targetFirst: { label: 'Adobe Target, first call', mobile: 1300, desktop: 500, swap: 'after', source: 'Adobe’s published baseline' },
  targetNext: { label: 'Adobe Target, later calls', mobile: 100, desktop: 400, swap: 'after', source: 'Adobe’s published baseline, upper figure on desktop' },
};

export function model(key, device, base) {
  const a = APPROACHES[key];
  const lcp = base + a[device];
  return { lcp, wait: a[device], flicker: a.swap === 'after', good: lcp <= 2500 };
}

export default function flickerTimeline(el, { h, uid }) {
  el.classList.add('ix');
  const aId = uid('ft'); const dId = uid('ft'); const bId = uid('ft');
  const approach = h('select', { id: aId, class: 'sim-input' }, ...Object.entries(APPROACHES).map(([k, a]) => h('option', { value: k }, a.label)));
  const device = h('select', { id: dId, class: 'sim-input' }, h('option', { value: 'mobile' }, 'Mobile'), h('option', { value: 'desktop' }, 'Desktop'));
  const base = h('input', { id: bId, class: 'sim-input', type: 'number', value: '1800', min: '500', step: '100' });
  const bars = h('div', { class: 'fl-bars', 'aria-hidden': 'true' });
  const out = h('ol', { class: 'sim-notes', 'aria-live': 'polite' });
  const note = h('div', { class: 'feedback good', 'aria-live': 'polite' });
  const bar = (label, start, end, max, cls) => h('div', { class: 'wf-row' }, h('span', { class: 'wf-name' }, label), h('span', { class: 'wf-track' }, h('i', { class: `wf-bar ${cls}`, style: `left:${(start / max) * 100}%;width:${Math.max(((end - start) / max) * 100, 1)}%` })));
  const paint = () => {
    const a = APPROACHES[approach.value]; const b = Number(base.value) || 0; const m = model(approach.value, device.value, b);
    const max = Math.max(m.lcp + 500, 3000);
    bars.replaceChildren(bar('Decision', Math.max(b - 800, 0), Math.max(b - 800, 0) + m.wait, max, 'wait'), bar('First paint', 0, m.lcp, max, 'paint'), ...(m.flicker ? [bar('Swap', m.lcp, m.lcp + 300, max, 'swap')] : []));
    out.replaceChildren(
      h('li', {}, `The page needs ${m.wait} ms for the decision.`),
      h('li', {}, `LCP is about ${m.lcp} ms: ${m.good ? 'within' : 'over'} 2500 ms.`),
      h('li', {}, a.swap === 'after' ? 'Changes apply after blocks are decorated and shown, so heavy changes can flicker.' : a.swap === 'server' ? 'The visitor receives the chosen HTML, so nothing swaps. It must not put personal data in shared cache.' : 'The variant is chosen before the page decorates, so nothing swaps.'),
      h('li', {}, `Source: ${a.source}.`),
    );
    note.className = `feedback ${m.good ? 'good' : 'bad'}`;
    note.textContent = m.good ? 'Within the LCP goal in this model.' : 'Over the LCP goal in this model. Limit this approach to the pages that need it.';
  };
  [approach, device, base].forEach((c) => c.addEventListener('input', paint));
  el.append(
    h('div', { class: 'ix-head' }, h('div', {}, h('div', { class: 'ix-kind' }, 'Timeline'), h('h3', {}, el.dataset.title || 'Personalization flicker timeline'))),
    h('div', { class: 'sim-grid', style: 'margin:12px 0' }, h('div', { style: 'grid-column:1/-1' }, h('label', { for: aId, class: 'sim-label' }, 'Approach'), approach), h('div', {}, h('label', { for: dId, class: 'sim-label' }, 'Device'), device), h('div', {}, h('label', { for: bId, class: 'sim-label' }, 'LCP without personalization (ms)'), base)),
    bars, out, note,
  );
  paint();
}
