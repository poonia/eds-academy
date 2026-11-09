/* Core Web Vitals simulator: move LCP, CLS and INP and see each rating, plus two "feel it"
   demos (a layout shift and a delayed interaction). Thresholds are Google's published
   Core Web Vitals thresholds, assessed at the 75th percentile of page loads. */
const METRICS = [
  { key: 'lcp', name: 'LCP', full: 'Largest Contentful Paint', unit: 's', min: 0.5, max: 6, step: 0.1, value: 1.4, good: 2.5, poor: 4, fmt: (v) => `${v.toFixed(1)} s` },
  { key: 'cls', name: 'CLS', full: 'Cumulative Layout Shift', unit: '', min: 0, max: 0.5, step: 0.01, value: 0.02, good: 0.1, poor: 0.25, fmt: (v) => v.toFixed(2) },
  { key: 'inp', name: 'INP', full: 'Interaction to Next Paint', unit: 'ms', min: 50, max: 800, step: 10, value: 120, good: 200, poor: 500, fmt: (v) => `${Math.round(v)} ms` },
];
export default function cwvSim(el, { h, uid, reducedMotion }) {
  el.classList.add('ix');
  const vals = {};
  const grid = h('div', { class: 'sim-grid' });
  const overall = h('div', { class: 'feedback', 'aria-live': 'polite' });
  const rate = (m, v) => (v <= m.good ? ['good', 'Good'] : v <= m.poor ? ['ni', 'Needs improvement'] : ['poor', 'Poor']);
  METRICS.forEach((m) => {
    vals[m.key] = m.value;
    const id = uid('cwv');
    const out = h('output', { for: id });
    const badge = h('span', { class: 'rating' });
    const pin = h('span', { class: 'scale-pin' });
    const range = h('input', { type: 'range', id, min: m.min, max: m.max, step: m.step, value: m.value, 'aria-describedby': `${id}-d` });
    const span = m.max - m.min;
    const scale = h('div', { class: 'scale-wrap', 'aria-hidden': 'true' }, h('div', { class: 'scale' },
      h('span', { class: 's-good', style: `width:${((m.good - m.min) / span) * 100}%` }),
      h('span', { class: 's-ni', style: `width:${((m.poor - m.good) / span) * 100}%` }),
      h('span', { class: 's-poor', style: `width:${((m.max - m.poor) / span) * 100}%` })), pin);
    const paint = () => {
      const v = Number(range.value); vals[m.key] = v; out.textContent = m.fmt(v);
      const [cls, label] = rate(m, v); badge.className = `rating ${cls}`; badge.textContent = label;
      pin.style.left = `${((v - m.min) / span) * 100}%`;
      range.setAttribute('aria-valuetext', `${m.fmt(v)}, ${label}`);
      paintOverall();
    };
    range.addEventListener('input', paint);
    grid.append(h('div', { class: 'sim-metric' }, h('label', { for: id }, h('span', {}, `${m.name} `, h('span', { class: 'muted', style: 'font-weight:400;font-size:13px' }, m.full)), out), range, scale, badge,
      h('span', { id: `${id}-d`, class: 'ix-note' }, `Good ≤ ${m.fmt(m.good)} · Poor > ${m.fmt(m.poor)}`)));
    paint();
  });
  function paintOverall() {
    if (Object.keys(vals).length < METRICS.length) return;
    const ratings = METRICS.map((m) => rate(m, vals[m.key])[0]);
    const pass = ratings.every((r) => r === 'good');
    overall.className = `feedback ${pass ? 'good' : 'bad'}`;
    overall.innerHTML = pass ? '<strong>Passes Core Web Vitals.</strong>All three metrics are in the Good range, which is the bar every EDS page should clear.' : `<strong>Does not pass.</strong>${METRICS.filter((m, i) => ratings[i] !== 'good').map((m) => m.name).join(' and ')} ${ratings.filter((r) => r !== 'good').length > 1 ? 'are' : 'is'} outside the Good range. A page passes only when all three are Good.`;
  }
  paintOverall();
  // Feel CLS
  const ad = h('div', { class: 'ad' }, 'Late-loading banner');
  const demo = h('div', { class: 'cls-demo', 'aria-hidden': 'true' }, ad, h('p', {}, h('b', {}, 'Rate this mortgage calculator'), ' — imagine you are about to tap the button below when the banner arrives.'), h('p', {}, h('span', { class: 'btn small' }, 'Calculate payment')));
  const clsBtn = h('button', { class: 'btn small', type: 'button' }, 'Load the banner');
  clsBtn.addEventListener('click', () => {
    const px = Math.round(vals.cls * 300);
    ad.style.height = '0px'; void ad.offsetHeight; ad.style.height = `${px}px`;
    clsOut.textContent = px ? `Content jumped ${px}px down. That is what CLS ${vals.cls.toFixed(2)} feels like on a small screen.` : 'No shift: space was reserved for the banner.';
  });
  const clsOut = h('p', { class: 'feel-out', 'aria-live': 'polite' });
  // Feel INP
  const inpBtn = h('button', { class: 'btn small primary', type: 'button' }, 'Tap to feel this INP');
  const inpOut = h('p', { class: 'feel-out', 'aria-live': 'polite' });
  inpBtn.addEventListener('click', () => {
    inpOut.textContent = '…';
    const delay = Math.round(vals.inp);
    setTimeout(() => { inpOut.textContent = `Responded after ${delay} ms. ${delay <= 200 ? 'Feels instant.' : delay <= 500 ? 'Noticeably sluggish.' : 'Feels broken: users tap again.'}`; }, reducedMotion() ? delay : delay);
  });
  el.append(h('div', { class: 'ix-head' }, h('div', {}, h('div', { class: 'ix-kind' }, 'Simulator'), h('h3', {}, el.dataset.title || 'Core Web Vitals simulator')), h('span', { class: 'ix-note' }, 'Example values, not a measurement')),
    grid, overall,
    h('div', { class: 'grid-2', style: 'margin-top:16px' },
      h('div', {}, h('h4', { style: 'margin-bottom:8px' }, 'Feel a layout shift (CLS)'), demo, h('div', { class: 'feel', style: 'margin-top:8px' }, clsBtn), clsOut),
      h('div', {}, h('h4', { style: 'margin-bottom:8px' }, 'Feel an interaction delay (INP)'), h('p', { class: 'ix-note' }, 'The button waits for the INP value you set before it responds.'), h('div', { class: 'feel' }, inpBtn), inpOut)));
}
