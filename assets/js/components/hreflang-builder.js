/* Locale tree explorer and hreflang builder. Shows the language-first folders aem.live recommends,
   and the sitemap entry for a page across the selected languages.
   JSON: {"domain":"https://www.example.com","languages":[{"code":"en","root":true},{"code":"fr"}],"path":"/welcome"} */
export function alternates(domain, languages, path) {
  const clean = path.startsWith('/') ? path : `/${path}`;
  return languages.map((l) => ({ code: l.code, url: `${domain}${l.root ? '' : `/${l.code}`}${clean}` }));
}

export default function hreflangBuilder(el, { h, readJSON, uid }) {
  const cfg = readJSON(el); const langs = cfg.languages || [];
  el.classList.add('ix');
  const pathId = uid('hb');
  const path = h('input', { id: pathId, class: 'sim-input', type: 'text', value: cfg.path || '/welcome', spellcheck: 'false' });
  const boxes = langs.map((l) => { const b = h('input', { type: 'checkbox', checked: 'checked' }); return { l, b }; });
  const tree = h('pre', { class: 'sim-out', tabindex: '0', 'aria-label': 'Content folder tree' });
  const xml = h('pre', { class: 'sim-out', tabindex: '0', 'aria-label': 'Sitemap entry' });
  const note = h('p', { class: 'ix-note', 'aria-live': 'polite' });
  const paint = () => {
    const on = boxes.filter((x) => x.b.checked).map((x) => x.l);
    const page = path.value.trim() || '/';
    const alt = alternates(cfg.domain, on, page);
    const leaf = page.replace(/^\//, '');
    tree.textContent = `/\n${on.map((l) => (l.root ? `├─ ${leaf}   (${l.code}, the root language)` : `├─ ${l.code}/\n│  └─ ${leaf}`)).join('\n')}`;
    xml.textContent = alt.length
      ? `<url>\n  <loc>${alt[0].url}</loc>\n${alt.map((a) => `  <xhtml:link rel="alternate" hreflang="${a.code}" href="${a.url}"/>`).join('\n')}\n</url>`
      : '<!-- Select at least one language -->';
    note.textContent = alt.length < 2 ? 'hreflang only helps when a page has at least two language versions.' : `Pages relate through the shared path ${page}, so keep the same page name in every language folder.`;
  };
  path.addEventListener('input', paint); boxes.forEach((x) => x.b.addEventListener('change', paint));
  el.append(
    h('div', { class: 'ix-head' }, h('div', {}, h('div', { class: 'ix-kind' }, 'Builder'), h('h3', {}, el.dataset.title || 'Locale tree and hreflang'))),
    h('div', { class: 'sim-checks' }, ...boxes.map((x) => h('label', {}, x.b, ` ${x.l.code}${x.l.root ? ' (root)' : ''}`))),
    h('label', { for: pathId, class: 'sim-label' }, 'Page path'), path,
    h('div', { class: 'sim-io', style: 'margin-top:12px' }, h('div', {}, h('div', { class: 'sim-label' }, 'Content folders'), tree), h('div', {}, h('div', { class: 'sim-label' }, 'Sitemap entry'), xml)),
    note,
  );
  paint();
}
