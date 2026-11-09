/* CSP header builder: choose directives and see which sample scripts would run. */
export const SCRIPTS = [
  ['nonce', '<script nonce="aem" src="/scripts/aem.js">', 'Trusted script with the nonce marker'],
  ['dynamic', 'import("/blocks/hero/hero.js") from a trusted script', 'Loaded by a trusted script'],
  ['plain', '<script src="https://tags.example.com/t.js">', 'Third-party tag in the markup, no nonce'],
  ['inline', '<script>alert(1)</script> injected into content', 'Injected inline script, no nonce'],
];

export function policy({ nonce, strict, base, object }) {
  const src = [nonce && "'nonce-aem'", strict && "'strict-dynamic'"].filter(Boolean).join(' ');
  return [src && `script-src ${src}`, base && "base-uri 'self'", object && "object-src 'none'"].filter(Boolean).join('; ') + ((src || base || object) ? ';' : '');
}

export function allowed(kind, { nonce, strict }) {
  if (!nonce && !strict) return true;
  if (!nonce) return false;
  if (kind === 'nonce') return true;
  return kind === 'dynamic' && strict;
}

export default function cspBuilder(el, { h, uid }) {
  el.classList.add('ix');
  const opts = [['nonce', "'nonce-aem'"], ['strict', "'strict-dynamic'"], ['base', "base-uri 'self'"], ['object', "object-src 'none'"]];
  const boxes = Object.fromEntries(opts.map(([k]) => { const b = h('input', { type: 'checkbox' }); b.checked = true; return [k, b]; }));
  const modeId = uid('csp'); const whereId = uid('csp');
  const mode = h('select', { id: modeId, class: 'sim-input' }, h('option', { value: 'content-security-policy' }, 'Enforce'), h('option', { value: 'content-security-policy-report-only' }, 'Report only'));
  const where = h('select', { id: whereId, class: 'sim-input' }, h('option', { value: 'header' }, 'Response header (configuration service)'), h('option', { value: 'meta' }, 'Meta tag in head.html'));
  const out = h('pre', { class: 'sim-out', tabindex: '0', 'aria-label': 'Policy delivery' });
  const list = h('ul', { class: 'sim-notes' });
  const note = h('div', { class: 'feedback good', 'aria-live': 'polite' });
  const paint = () => {
    const on = Object.fromEntries(Object.entries(boxes).map(([k, b]) => [k, b.checked]));
    const value = policy(on); const report = mode.value.endsWith('only'); const meta = where.value === 'meta';
    out.textContent = meta
      ? `<meta http-equiv="Content-Security-Policy"\n  content="${value}"\n  move-to-http-header="true">`
      : JSON.stringify({ '/**': [{ key: mode.value, value }] }, null, 2);
    list.replaceChildren(...SCRIPTS.map(([kind, label, why]) => {
      const ok = allowed(kind, on);
      return h('li', {}, h('code', {}, label), ` ${why}: `, h('b', {}, ok ? 'runs' : report && !meta ? 'runs, and is reported' : 'blocked'));
    }));
    let text = 'This is Adobe’s recommended policy: only scripts with the nonce, and those they load, can run.'; let bad = false;
    if (meta && report) { text = 'Browsers ignore report-only in a meta tag. Use the response header to test without enforcing.'; bad = true; } else if (!on.nonce && on.strict) { text = 'strict-dynamic needs a nonce to start the trust chain. With no nonce, every script is blocked.'; bad = true; } else if (on.nonce && !on.strict) { text = 'Without strict-dynamic, scripts loaded by your trusted scripts are blocked, including blocks.'; bad = true; } else if (!on.nonce) { text = 'There is no script-src, so this policy does not limit scripts.'; bad = true; } else if (!on.base || !on.object) { text = 'Scripts are covered, but Adobe’s recommended policy also sets base-uri and object-src.'; bad = true; } else if (report) { text = 'Report only gives no protection. Use it to find what would break, then enforce.'; bad = true; }
    note.className = `feedback ${bad ? 'bad' : 'good'}`; note.textContent = text;
  };
  [mode, where].forEach((c) => c.addEventListener('input', paint));
  Object.values(boxes).forEach((b) => b.addEventListener('change', paint));
  el.append(
    h('div', { class: 'ix-head' }, h('div', {}, h('div', { class: 'ix-kind' }, 'Builder'), h('h3', {}, el.dataset.title || 'CSP header builder'))),
    h('div', { class: 'sim-checks' }, ...opts.map(([k, label]) => h('label', {}, boxes[k], ' ', h('code', {}, label)))),
    h('div', { class: 'sim-grid', style: 'margin:12px 0' }, h('div', {}, h('label', { for: modeId, class: 'sim-label' }, 'Mode'), mode), h('div', {}, h('label', { for: whereId, class: 'sim-label' }, 'Delivered by'), where)),
    h('div', { class: 'sim-io' }, h('div', {}, h('div', { class: 'sim-label' }, 'Configuration'), out), h('div', {}, h('div', { class: 'sim-label' }, 'Sample scripts'), list)),
    note,
  );
  paint();
}
