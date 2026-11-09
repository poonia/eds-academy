/* Loading-phase visualizer: move resources between eager, lazy and delayed phases and watch
   the payload before LCP against the 100 KB rule of thumb from aem.live "Keeping it 100".
   The LCP estimate is a teaching model, not a measurement.
   JSON: {"budget":100,"resources":[{"name":"styles.css","kb":8,"phase":"eager","third":false,"lcp":false}]} */
const PHASES = [
  { id: 'eager', name: 'Eager', note: 'Needed for LCP' },
  { id: 'lazy', name: 'Lazy', note: 'After LCP, same origin' },
  { id: 'delayed', name: 'Delayed', note: 'Third parties, later' },
];
export default function phases(el, { h, readJSON }) {
  const data = readJSON(el);
  const budget = data.budget || 100;
  const res = (data.resources || []).map((r) => ({ ...r }));
  const initial = res.map((r) => r.phase);
  el.classList.add('ix');
  const lanes = h('div', { class: 'ph-lanes' });
  const laneEls = {};
  PHASES.forEach((p) => {
    const items = h('div', { class: 'ph-items', role: 'list', 'aria-label': `${p.name} phase` });
    laneEls[p.id] = items;
    lanes.append(h('div', { class: 'ph-lane' }, h('div', { class: 'ph-lane-h' }, p.name, h('small', {}, p.note)), items));
  });
  const kbOut = h('b'); const lcpOut = h('b'); const tpOut = h('b');
  const bar = h('span'); const mark = h('i');
  const budgetEl = h('div', { class: 'ph-budget', 'aria-hidden': 'true' }, bar, mark);
  const advice = h('div', { 'aria-live': 'polite' });
  function paint() {
    Object.values(laneEls).forEach((l) => { l.innerHTML = ''; });
    res.forEach((r, i) => {
      const sel = h('select', { 'aria-label': `Phase for ${r.name}` }, PHASES.map((p) => h('option', { value: p.id, selected: p.id === r.phase }, p.name)));
      sel.addEventListener('change', () => { r.phase = sel.value; paint(); const again = el.querySelectorAll('.ph-item select')[i]; if (again) again.focus(); });
      laneEls[r.phase].append(h('span', { class: `ph-item${r.third ? ' third' : ''}`, role: 'listitem' }, h('span', {}, r.name, h('span', { class: 'muted' }, ` ${r.kb} KB${r.third ? ' · third party' : ''}${r.lcp ? ' · LCP image' : ''}`)), sel));
    });
    const eager = res.filter((r) => r.phase === 'eager');
    const kb = eager.reduce((s, r) => s + r.kb, 0);
    const thirdEager = eager.filter((r) => r.third).length;
    const lcpRes = res.find((r) => r.lcp);
    const lcpLate = lcpRes && lcpRes.phase !== 'eager';
    // Teaching model: ~450 ms baseline + ~10 ms per KB before LCP on a throttled mobile profile,
    // + 350 ms per extra host connection opened before LCP, and a large penalty if the LCP image itself is deferred.
    const est = 450 + kb * 10 + thirdEager * 350 + (lcpLate ? 1800 : 0);
    kbOut.textContent = `${kb} KB`; lcpOut.textContent = `≈ ${(est / 1000).toFixed(2)} s`; tpOut.textContent = String(thirdEager);
    bar.style.width = `${Math.min(100, (kb / (budget * 2)) * 100)}%`; mark.style.left = '50%';
    budgetEl.classList.toggle('over', kb > budget);
    const tips = [];
    if (kb > budget) tips.push(`Payload before LCP is ${kb - budget} KB over the ${budget} KB rule of thumb.`);
    if (thirdEager) tips.push(`${thirdEager} third-party resource${thirdEager > 1 ? 's' : ''} in the eager phase. Third parties belong in delayed.`);
    if (lcpLate) tips.push('The LCP image is not in the eager phase, so the largest element paints late.');
    const thirdLazy = res.filter((r) => r.third && r.phase === 'lazy').length;
    if (thirdLazy) tips.push(`${thirdLazy} third-party resource${thirdLazy > 1 ? 's are' : ' is'} in the lazy phase, which is for project-owned, same-origin code. Move third parties to delayed.`);
    const ok = !tips.length;
    advice.className = `feedback ${ok ? 'good' : 'bad'}`; advice.innerHTML = '';
    advice.append(h('strong', {}, ok ? 'Within budget.' : 'Over budget or out of phase.'), ok ? 'Everything needed for LCP is eager and small; the rest waits. This is the shape aem.live recommends.' : tips.join(' '));
  }
  const reset = h('button', { class: 'btn small ghost', type: 'button' }, 'Reset');
  reset.addEventListener('click', () => { res.forEach((r, i) => { r.phase = initial[i]; }); paint(); });
  el.append(h('div', { class: 'ix-head' }, h('div', {}, h('div', { class: 'ix-kind' }, 'Visualizer'), h('h3', {}, el.dataset.title || 'Loading-phase visualizer')), h('span', { class: 'ix-note' }, 'LCP estimate is a teaching model')),
    h('p', { class: 'ix-note' }, 'Change the phase of each resource with its menu.'), lanes,
    h('div', { class: 'ph-summary' },
      h('div', { class: 'sim-metric' }, h('span', { class: 'muted' }, 'Payload before LCP'), kbOut, budgetEl, h('span', { class: 'ix-note' }, `Line marks ${budget} KB`)),
      h('div', { class: 'sim-metric' }, h('span', { class: 'muted' }, 'Modelled mobile LCP'), lcpOut, h('span', { class: 'ix-note' }, 'Good is 2.5 s or less')),
      h('div', { class: 'sim-metric' }, h('span', { class: 'muted' }, 'Third parties before LCP'), tpOut, h('span', { class: 'ix-note' }, 'Target: 0'))),
    advice, h('div', { class: 'ix-foot' }, reset));
  paint();
}
