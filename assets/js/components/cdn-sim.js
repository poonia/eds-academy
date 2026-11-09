/* CDN request simulator: set up a production CDN and see what a request does. */
export const ORIGINS = {
  main: { host: 'main--website--acme.aem.live', problem: '' },
  stage: { host: 'stage--website--acme.aem.live', problem: 'Only main triggers push invalidation by default. A production-like CDN on another branch needs cdn.prod.branch, limited to dev, develop, stg, stage, uat or qa.' },
  page: { host: 'main--website--acme.aem.page', problem: 'aem.page is the content preview tier. It has different caching and shows unpublished content.' },
};

export const SETTINGS = [
  ['forwardedHost', 'Send X-Forwarded-Host', 'Without X-Forwarded-Host, the origin is not told the production domain. Adobe lists this header as required.'],
  ['pushInvalidation', 'Send X-Push-Invalidation: enabled', 'Without the opt-in header the origin will not enable long cache TTLs, so the CDN keeps fetching more often.'],
  ['originCache', 'Honour origin cache control', 'The CDN should take its cache lifetime from the origin response. A fixed TTL can keep stale pages after a publish.'],
  ['query', 'Forward query strings and include them in the cache key', 'Query parameters must reach the origin and be part of the cache key, or different requests can share one cached response.'],
  ['age', 'Suppress or zero the Age header', 'Age must be removed or set to 0, or browsers count CDN time against their own freshness.'],
  ['gzip', 'Compress responses', 'Compression should be on. Without it, each visitor downloads more.'],
];

export function evaluate(origin, on) {
  const problems = [];
  if (ORIGINS[origin].problem) problems.push(ORIGINS[origin].problem);
  SETTINGS.forEach(([key, , problem]) => { if (!on[key]) problems.push(problem); });
  return problems;
}

export function trace(origin, on, path = '/savings') {
  const o = ORIGINS[origin];
  const lines = [`GET https://www.acme.com${path}?ref=mail`, `  CDN cache key: ${path}${on.query ? '?ref=mail' : ' (query dropped)'}`, `  CDN to origin: https://${o.host}${path}${on.query ? '?ref=mail' : ''}`];
  if (on.forwardedHost) lines.push('    X-Forwarded-Host: www.acme.com');
  if (on.pushInvalidation) lines.push('    X-Push-Invalidation: enabled');
  lines.push(`  To browser: ${on.age ? 'Age: 0' : 'Age: 7200'}${on.gzip ? ', content-encoding: gzip' : ', uncompressed'}`);
  return lines.join('\n');
}

export default function cdnSim(el, { h, uid }) {
  el.classList.add('ix');
  const id = uid('cdn');
  const select = h('select', { id, class: 'sim-input' }, ...Object.entries(ORIGINS).map(([k, o]) => h('option', { value: k }, o.host)));
  const boxes = Object.fromEntries(SETTINGS.map(([k]) => [k, h('input', { type: 'checkbox' })]));
  const out = h('pre', { class: 'sim-out', tabindex: '0', 'aria-label': 'Request trace' });
  const notes = h('ul', { class: 'sim-notes' });
  const verdict = h('div', { class: 'feedback bad', 'aria-live': 'polite' });
  const paint = () => {
    const on = Object.fromEntries(Object.entries(boxes).map(([k, b]) => [k, b.checked]));
    const problems = evaluate(select.value, on);
    out.textContent = trace(select.value, on);
    notes.replaceChildren(...problems.map((p) => h('li', {}, p)));
    verdict.className = `feedback ${problems.length ? 'bad' : 'good'}`;
    verdict.textContent = problems.length ? `${problems.length} setting${problems.length === 1 ? '' : 's'} to fix before go-live.` : 'Configuration matches Adobe’s requirements. Now test it on a staging hostname.';
  };
  select.addEventListener('input', paint);
  Object.values(boxes).forEach((b) => b.addEventListener('change', paint));
  el.append(
    h('div', { class: 'ix-head' }, h('div', {}, h('div', { class: 'ix-kind' }, 'Simulator'), h('h3', {}, el.dataset.title || 'CDN request simulator'))),
    h('label', { for: id, class: 'sim-label' }, 'Origin'), select,
    h('div', { class: 'sim-checks' }, ...SETTINGS.map(([k, label]) => h('label', {}, boxes[k], ` ${label}`))),
    h('div', { class: 'sim-io' }, h('div', {}, h('div', { class: 'sim-label' }, 'Request trace (illustrative)'), out), h('div', {}, h('div', { class: 'sim-label' }, 'What needs fixing'), notes)),
    verdict,
  );
  paint();
}
