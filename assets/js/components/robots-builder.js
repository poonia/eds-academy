/* robots.txt and sitemap builder, with a crawl tester for one path. */
export function buildRobots(domain, disallow) {
  return ['User-agent: *', ...(disallow.length ? disallow.map((d) => `Disallow: ${d}`) : ['Allow: /']), `Sitemap: https://${domain}/sitemap.xml`].join('\n');
}

export function buildSitemap(domain, langs) {
  if (langs.length < 2) return `sitemaps:\n  default:\n    origin: https://${domain}\n    source: /query-index.json\n    destination: /sitemap.xml\n    lastmod: YYYY-MM-DD`;
  return `sitemaps:\n  site:\n    origin: https://${domain}\n    lastmod: YYYY-MM-DD\n    languages:\n${langs.map((l) => `      ${l}:\n        source: /${l}/query-index.json\n        destination: /sitemap-${l}.xml\n        hreflang: ${l}\n        alternate: /${l}/{path}`).join('\n')}`;
}

export function crawlable(path, disallow) {
  return !disallow.some((d) => path.startsWith(d));
}

export default function robotsBuilder(el, { h, uid }) {
  el.classList.add('ix');
  const field = (label, value) => { const id = uid('rb'); const input = h('input', { id, class: 'sim-input', type: 'text', value, spellcheck: 'false' }); return { input, node: h('div', {}, h('label', { for: id, class: 'sim-label' }, label), input) }; };
  const domain = field('Production domain', 'www.acme.com');
  const dis = field('Disallow paths, comma separated', '/search');
  const langs = field('Languages, comma separated', 'en,fr');
  const test = field('Test a path', '/search/results');
  const robots = h('pre', { class: 'sim-out', tabindex: '0', 'aria-label': 'robots.txt' });
  const sitemap = h('pre', { class: 'sim-out', tabindex: '0', 'aria-label': 'Sitemap configuration' });
  const note = h('div', { class: 'feedback good', 'aria-live': 'polite' });
  const list = (v) => v.split(',').map((x) => x.trim()).filter(Boolean);
  const paint = () => {
    const d = list(dis.input.value);
    robots.textContent = buildRobots(domain.input.value, d);
    sitemap.textContent = buildSitemap(domain.input.value, list(langs.input.value));
    if (d.includes('/')) { note.className = 'feedback bad'; note.textContent = 'Disallow: / stops crawlers from reading the whole site. This is the classic launch mistake.'; return; }
    const ok = crawlable(test.input.value, d);
    note.className = 'feedback good';
    note.textContent = ok ? `${test.input.value} can be crawled.` : `${test.input.value} cannot be crawled, but it can still appear in search results, and a noindex on it would never be seen. To remove a page, allow crawling and set robots: noindex.`;
  };
  [domain, dis, langs, test].forEach((f) => f.input.addEventListener('input', paint));
  el.append(
    h('div', { class: 'ix-head' }, h('div', {}, h('div', { class: 'ix-kind' }, 'Builder'), h('h3', {}, el.dataset.title || 'robots.txt and sitemap builder'))),
    h('div', { class: 'sim-grid', style: 'margin:12px 0' }, domain.node, dis.node, langs.node, test.node),
    h('div', { class: 'sim-io' }, h('div', {}, h('div', { class: 'sim-label' }, 'robots.txt'), robots), h('div', {}, h('div', { class: 'sim-label' }, 'helix-sitemap.yaml'), sitemap)),
    note,
  );
  paint();
}
