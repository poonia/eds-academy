/* Redirect validator: finds common problems in a redirects sheet before migration.
   JSON: {"csv":"Source,Destination\n/a,/b","pages":["/b"]} */
export function validate(csv, pages = []) {
  const rows = csv.split('\n').slice(1).map((l) => l.trim()).filter(Boolean).map((l) => l.split(',').map((c) => c.trim()));
  const map = new Map(); const found = [];
  rows.forEach(([src = '', dest = '']) => {
    if (!src.startsWith('/')) found.push(['bad', src, 'Source must be a path that starts with /.']);
    if (src.includes('*')) found.push(['bad', src, 'Wildcards are not supported in the redirects sheet. Use the CDN, with care.']);
    if (!dest) found.push(['bad', src, 'Destination is empty.']);
    if (map.has(src)) found.push(['bad', src, 'Duplicate source.']);
    map.set(src, dest);
  });
  map.forEach((dest, src) => {
    if (src === dest) { found.push(['bad', src, 'Redirects to itself.']); return; }
    const seen = new Set([src]); let at = dest; let hops = 0;
    while (map.has(at) && !seen.has(at)) { seen.add(at); at = map.get(at); hops += 1; }
    if (seen.has(at)) found.push(['bad', src, 'Redirect loop.']);
    else if (hops) found.push(['warn', src, `Chain of ${hops + 1} hops. Point it directly at ${at}.`]);
    else if (at.startsWith('/') && !pages.includes(at)) found.push(['bad', src, `${at} is not a known page, so this would redirect into a 404.`]);
  });
  return { rows: map.size, found };
}

export default function redirectValidator(el, { h, readJSON, uid }) {
  const cfg = readJSON(el);
  el.classList.add('ix');
  const id = uid('rv');
  const input = h('textarea', { id, class: 'sim-text', rows: '9', spellcheck: 'false' }, cfg.csv || '');
  const list = h('ul', { class: 'sim-notes' });
  const verdict = h('div', { class: 'feedback good', 'aria-live': 'polite' });
  const paint = () => {
    const { rows, found } = validate(input.value, cfg.pages);
    list.replaceChildren(...(found.length ? found.map(([, src, msg]) => h('li', {}, h('code', {}, src || '(empty)'), ` ${msg}`)) : [h('li', {}, 'No problems found.')]));
    const errors = found.filter(([k]) => k === 'bad').length;
    verdict.className = `feedback ${found.length ? 'bad' : 'good'}`;
    verdict.textContent = `${rows} redirect${rows === 1 ? '' : 's'} checked: ${errors} error${errors === 1 ? '' : 's'}, ${found.length - errors} warning${found.length - errors === 1 ? '' : 's'}.`;
  };
  input.addEventListener('input', paint);
  el.append(
    h('div', { class: 'ix-head' }, h('div', {}, h('div', { class: 'ix-kind' }, 'Validator'), h('h3', {}, el.dataset.title || 'Redirect validator'))),
    h('div', { class: 'sim-io' }, h('div', {}, h('label', { for: id, class: 'sim-label' }, 'redirects (Source,Destination)'), input), h('div', {}, h('div', { class: 'sim-label' }, 'Findings'), list)),
    h('p', { class: 'ix-note' }, `Known pages in this exercise: ${(cfg.pages || []).join(', ')}`),
    verdict,
  );
  paint();
}
