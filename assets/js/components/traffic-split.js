/* Traffic split visual: an even split across control and challengers, and what each variant receives.
   JSON: {"visits":5000} */
export function split(challengers, visits) {
  const variants = challengers + 1; const share = 100 / variants;
  return { share, perVariant: Math.floor(visits / variants) };
}

export default function trafficSplit(el, { h, readJSON, uid }) {
  const cfg = readJSON(el);
  el.classList.add('ix');
  const cId = uid('ts'); const vId = uid('ts');
  const challengers = h('input', { id: cId, type: 'range', min: '1', max: '4', step: '1', value: '1' });
  const visits = h('input', { id: vId, type: 'range', min: '500', max: '50000', step: '500', value: String(cfg.visits || 5000) });
  const cOut = h('output', { for: cId }); const vOut = h('output', { for: vId });
  const bars = h('div', { class: 'ts-bars' });
  const note = h('div', { class: 'feedback good', 'aria-live': 'polite' });
  const paint = () => {
    const c = Number(challengers.value); const v = Number(visits.value); const r = split(c, v);
    cOut.textContent = String(c); vOut.textContent = v.toLocaleString('en-CA');
    bars.replaceChildren(...Array.from({ length: c + 1 }, (_, i) => h('div', { class: `ts-bar${i ? '' : ' control'}`, style: `flex:1` }, h('b', {}, i ? `Challenger ${i}` : 'Control'), h('span', {}, `${r.share.toFixed(1)}%`))));
    const thin = r.perVariant < 1000;
    note.className = `feedback ${thin ? 'bad' : 'good'}`;
    note.textContent = `Each variant gets about ${r.perVariant.toLocaleString('en-CA')} visits. ${thin ? 'That is likely too little traffic for a clear result: remove a challenger or run longer.' : 'More challengers split the same traffic thinner, so check significance before you pick a winner.'}`;
  };
  [challengers, visits].forEach((c) => c.addEventListener('input', paint));
  el.append(
    h('div', { class: 'ix-head' }, h('div', {}, h('div', { class: 'ix-kind' }, 'Visual'), h('h3', {}, el.dataset.title || 'Traffic split'))),
    h('label', { for: cId, class: 'sim-label' }, 'Challengers: ', cOut), challengers,
    h('label', { for: vId, class: 'sim-label', style: 'margin-top:10px' }, 'Visits during the experiment: ', vOut), visits,
    bars, note,
  );
  paint();
}
