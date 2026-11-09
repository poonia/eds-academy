/* Configuration explorer: edit profile and site values and see which one wins.
   JSON: {"rows":[{"key":"cdn.prod.host","profile":"","site":"www.acme.com","risky":true}]} */
export function effective(rows, useProfile = true) {
  return rows.map((r) => {
    if (r.site !== '') return { key: r.key, value: r.site, from: 'site' };
    if (useProfile && r.profile !== '') return { key: r.key, value: r.profile, from: 'profile' };
    return { key: r.key, value: '', from: 'unset' };
  });
}

export default function configExplorer(el, { h, readJSON, uid }) {
  const start = readJSON(el).rows || [];
  el.classList.add('ix');
  const rows = start.map((r) => ({ ...r }));
  const useProfile = h('input', { type: 'checkbox' }); useProfile.checked = true;
  const out = h('pre', { class: 'sim-out', tabindex: '0', 'aria-label': 'Effective configuration' });
  const notes = h('ul', { class: 'sim-notes', 'aria-live': 'polite' });
  const warn = h('div', { class: 'feedback good', 'aria-live': 'polite' });
  const paint = () => {
    const eff = effective(rows, useProfile.checked);
    out.textContent = eff.map((e) => `${e.key}: ${e.value || '(not set)'}`).join('\n');
    notes.replaceChildren(...eff.map((e) => h('li', {}, `${e.key} comes from ${e.from === 'unset' ? 'nowhere: it is not set' : `the ${e.from}`}`)));
    const changed = rows.filter((r, i) => r.risky && r.site !== start[i].site);
    warn.className = `feedback ${changed.length ? 'bad' : 'good'}`;
    warn.textContent = changed.length
      ? `Changing ${changed.map((r) => r.key).join(' and ')} on a production site is risky. Create a new site with the new value, validate it, then switch the CDN origin.`
      : 'A site value wins over its profile. Clear a site value to see the profile value apply.';
  };
  const body = rows.map((r) => {
    const cell = (side) => {
      const id = uid('cfg');
      const input = h('input', { id, class: 'sim-input', type: 'text', value: r[side], spellcheck: 'false', 'aria-label': `${r.key}, ${side} value` });
      input.addEventListener('input', () => { r[side] = input.value.trim(); paint(); });
      return h('td', {}, input);
    };
    return h('tr', {}, h('td', {}, h('code', {}, r.key)), cell('profile'), cell('site'));
  });
  useProfile.addEventListener('change', paint);
  el.append(
    h('div', { class: 'ix-head' }, h('div', {}, h('div', { class: 'ix-kind' }, 'Explorer'), h('h3', {}, el.dataset.title || 'Configuration explorer'))),
    h('div', { class: 'table-wrap' }, h('table', { class: 't sim-table' }, h('thead', {}, h('tr', {}, h('th', {}, 'Property'), h('th', {}, 'Profile'), h('th', {}, 'Site'))), h('tbody', {}, ...body))),
    h('div', { class: 'sim-checks' }, h('label', {}, useProfile, ' This site uses the profile')),
    h('div', { class: 'sim-io' }, h('div', {}, h('div', { class: 'sim-label' }, 'Effective configuration'), out), h('div', {}, h('div', { class: 'sim-label' }, 'Where each value comes from'), notes)),
    warn,
  );
  paint();
}
