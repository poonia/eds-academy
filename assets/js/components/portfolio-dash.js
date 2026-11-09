/* Portfolio performance dashboard with invented sites.
   JSON: {"sites":[{"name":"Retail","views":900000,"lcp":2900,"cls":0.05,"inp":180}]} */
export function assess(site, limit) {
  const fails = [site.lcp > limit && 'LCP', site.cls > 0.1 && 'CLS', site.inp > 200 && 'INP'].filter(Boolean);
  return { ...site, fails, impact: Math.round(site.views * (fails.length)) };
}

export function rank(sites, limit) {
  return sites.map((s) => assess(s, limit)).sort((a, b) => b.impact - a.impact || a.name.localeCompare(b.name));
}

export default function portfolioDash(el, { h, readJSON, uid }) {
  const sites = readJSON(el).sites || [];
  el.classList.add('ix');
  const id = uid('pd');
  const limit = h('input', { id, class: 'sim-input', type: 'number', min: '1000', step: '100', value: '2500' });
  const body = h('tbody');
  const note = h('div', { class: 'feedback good', 'aria-live': 'polite' });
  const paint = () => {
    const list = rank(sites, Number(limit.value));
    body.replaceChildren(...list.map((s, i) => h('tr', {}, h('td', {}, s.fails.length ? String(i + 1) : '–'), h('td', {}, s.name), h('td', {}, s.views.toLocaleString('en-CA')), h('td', {}, `${s.lcp} ms`), h('td', {}, String(s.cls)), h('td', {}, `${s.inp} ms`), h('td', {}, s.fails.length ? s.fails.join(', ') : 'Pass'))));
    const failing = list.filter((s) => s.fails.length);
    note.className = `feedback ${failing.length ? 'bad' : 'good'}`;
    note.textContent = failing.length ? `${list.length - failing.length} of ${list.length} sites pass. Start with ${failing[0].name}: most traffic affected.` : 'All sites pass this budget.';
  };
  limit.addEventListener('input', paint);
  el.append(
    h('div', { class: 'ix-head' }, h('div', {}, h('div', { class: 'ix-kind' }, 'Mock dashboard'), h('h3', {}, el.dataset.title || 'Portfolio performance'))),
    h('p', { class: 'ix-note' }, 'Invented teaching data. Priority is a simple model: page views multiplied by the number of failing metrics.'),
    h('div', { style: 'max-width:260px;margin:12px 0' }, h('label', { for: id, class: 'sim-label' }, 'LCP budget (ms)'), limit),
    h('div', { class: 'table-wrap' }, h('table', { class: 't' }, h('thead', {}, h('tr', {}, ...['Priority', 'Site', 'Views', 'LCP', 'CLS', 'INP', 'Status'].map((x) => h('th', {}, x)))), body)),
    note,
  );
  paint();
}
