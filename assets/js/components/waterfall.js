/* Loading waterfall visualizer: apply fixes and see the modelled LCP change.
   JSON: {"items":[{"name":"HTML","start":0,"ms":200,"lcp":true,"fix":"id","fixed":{"start":0,"ms":0}}],
          "fixes":[{"id":"x","label":"..."}]}  Timings are illustrative. */
export function compute(items, active) {
  const out = items.map((i) => {
    const on = i.fix && active.includes(i.fix);
    const t = on ? { ...i, ...i.fixed } : i;
    return { name: i.name, start: t.start, ms: t.ms, lcp: t.lcp === undefined ? i.lcp : t.lcp };
  });
  const lcp = Math.max(0, ...out.filter((i) => i.lcp && i.ms > 0).map((i) => i.start + i.ms));
  const end = Math.max(1, ...out.map((i) => i.start + i.ms));
  return { items: out, lcp, end };
}

export default function waterfall(el, { h, readJSON }) {
  const cfg = readJSON(el); const items = cfg.items || [];
  el.classList.add('ix');
  const boxes = (cfg.fixes || []).map((f) => { const b = h('input', { type: 'checkbox' }); return { f, b }; });
  const chart = h('div', { class: 'wf', role: 'img', 'aria-label': 'Loading waterfall' });
  const result = h('div', { class: 'feedback bad', 'aria-live': 'polite' });
  const paint = () => {
    const r = compute(items, boxes.filter((x) => x.b.checked).map((x) => x.f.id));
    chart.replaceChildren(...r.items.filter((i) => i.ms > 0).map((i) => h('div', { class: 'wf-row' }, h('span', { class: 'wf-name' }, i.name), h('span', { class: 'wf-track' }, h('span', { class: `wf-bar${i.lcp ? ' lcp' : ''}`, style: `left:${(i.start / r.end) * 100}%;width:${Math.max((i.ms / r.end) * 100, 1)}%` })))));
    const good = r.lcp <= 2500;
    result.className = `feedback ${good ? 'good' : 'bad'}`;
    result.textContent = `Modelled LCP: ${(r.lcp / 1000).toFixed(2)} s. ${good ? 'Within the 2.5 s Good threshold.' : 'Slower than the 2.5 s Good threshold.'} Highlighted bars are on the path to LCP.`;
  };
  boxes.forEach((x) => x.b.addEventListener('change', paint));
  el.append(
    h('div', { class: 'ix-head' }, h('div', {}, h('div', { class: 'ix-kind' }, 'Visualizer'), h('h3', {}, el.dataset.title || 'Loading waterfall'))),
    h('div', { class: 'sim-checks' }, ...boxes.map((x) => h('label', {}, x.b, ` ${x.f.label}`))), chart, result,
    h('p', { class: 'ix-note' }, 'Timings are illustrative, not measurements.'),
  );
  paint();
}
