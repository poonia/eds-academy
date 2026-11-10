/* EDS Academy shared runtime.
   Loaded on every page as an ES module. Pages hold content only; this file builds the
   site chrome, module layout, progress tracking, code blocks, diagrams, glossary,
   search, and lazily loads one module per interactive component. */

const ROOT = new URL('../../', import.meta.url);
export const href = (p) => new URL(p, ROOT).href;
export const AS_OF = '9 Nov 2026';
const STORE_KEY = 'eds-academy-v1';
const THEME_KEY = 'eds-academy-theme';
const MERMAID_URL = 'https://cdn.jsdelivr.net/npm/mermaid@11.4.1/dist/mermaid.esm.min.mjs';
const HLJS_URL = 'https://cdn.jsdelivr.net/npm/@highlightjs/cdn-assets@11.9.0/es/highlight.min.js';

const COMPONENTS = {
  quiz: 'quiz.js', flashcards: 'flashcards.js', stepper: 'stepper.js', hotspots: 'hotspots.js',
  order: 'order.js', match: 'match.js', 'decision-tree': 'decision-tree.js', scorer: 'scorer.js',
  explorer: 'explorer.js', 'cwv-sim': 'cwv-sim.js', phases: 'phases.js', tabs: 'tabs.js',
  'course-map': 'course-map.js', dashboard: 'dashboard.js',
  'doc-sim': 'doc-sim.js', 'sheet-json': 'sheet-json.js', 'nav-builder': 'nav-builder.js', 'image-explorer': 'image-explorer.js',
  'hreflang-builder': 'hreflang-builder.js', 'form-sheet': 'form-sheet.js', 'traffic-split': 'traffic-split.js',
  'filter-sandbox': 'filter-sandbox.js', 'terminal-replay': 'terminal-replay.js', 'file-tree': 'file-tree.js',
  'block-playground': 'block-playground.js', 'token-editor': 'token-editor.js', waterfall: 'waterfall.js', 'model-preview': 'model-preview.js',
  'query-playground': 'query-playground.js', 'a11y-fixit': 'a11y-fixit.js', 'admin-request': 'admin-request.js',
  'config-explorer': 'config-explorer.js', 'cdn-sim': 'cdn-sim.js', 'csp-builder': 'csp-builder.js', 'redirect-validator': 'redirect-validator.js',
  'rum-dashboard': 'rum-dashboard.js', 'robots-builder': 'robots-builder.js', 'raci-matrix': 'raci-matrix.js', 'routing-sim': 'routing-sim.js',
  'experiment-results': 'experiment-results.js', 'flicker-timeline': 'flicker-timeline.js', 'form-rules': 'form-rules.js', 'cf-html': 'cf-html.js',
  'a11y-demos': 'a11y-demos.js', 'portfolio-dash': 'portfolio-dash.js', exam: 'exam.js', capstone: 'capstone.js',
  'filter-list': 'filter-list.js', 'path-progress': 'path-progress.js',
  'code-lab': 'code-lab.js', 'debug-lab': 'debug-lab.js', 'practice-hub': 'practice-hub.js',
};

/* ---------- small helpers ---------- */
export const $ = (s, el = document) => el.querySelector(s);
export const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
export function h(tag, attrs = {}, ...kids) {
  const el = document.createElement(tag);
  Object.entries(attrs || {}).forEach(([k, v]) => {
    if (v === false || v == null) return;
    if (k === 'class') el.className = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k === 'text') el.textContent = v;
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? '' : v);
  });
  kids.flat().forEach((k) => { if (k != null && k !== false) el.append(k.nodeType ? k : document.createTextNode(String(k))); });
  return el;
}
export function esc(s) { return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
export function readJSON(el) {
  const s = el.querySelector(':scope > script[type="application/json"]');
  if (!s) return {};
  try { return JSON.parse(s.textContent); } catch (e) { console.warn('[academy] bad JSON in', el, e); return {}; }
}
let uidN = 0;
export const uid = (p = 'x') => `${p}-${++uidN}`;
export function slugify(s) { return String(s).toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
export const reducedMotion = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
export function shuffle(arr) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i -= 1) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

/* Keyboard users need a tab stop to scroll a diagram that is wider than its frame. */
function markScrollable(n) {
  if (n.scrollWidth > n.clientWidth + 1) { n.setAttribute('tabindex', '0'); n.setAttribute('aria-label', 'Diagram, scrollable'); } else { n.removeAttribute('tabindex'); n.removeAttribute('aria-label'); }
}
/* The same for wide tables, which scroll sideways inside .table-wrap on small screens. */
function markTables(root = document) {
  root.querySelectorAll('.table-wrap').forEach((w) => {
    if (w.scrollWidth > w.clientWidth + 1) { w.setAttribute('tabindex', '0'); w.setAttribute('role', 'region'); w.setAttribute('aria-label', 'Table, scrolls sideways'); } else if (w.getAttribute('aria-label') === 'Table, scrolls sideways') { w.removeAttribute('tabindex'); w.removeAttribute('role'); w.removeAttribute('aria-label'); }
  });
}
let scrollTimer;
window.addEventListener('resize', () => { clearTimeout(scrollTimer); scrollTimer = setTimeout(() => { document.querySelectorAll('pre.mermaid[data-rendered]').forEach(markScrollable); markTables(); }, 150); });
document.addEventListener('toggle', (e) => { if (e.target.tagName === 'DETAILS') markTables(e.target); }, true);

/* ---------- progress store ---------- */
function fresh() { return { v: 1, topics: {}, modules: {}, quizzes: {}, labs: {}, capstones: {}, checklists: {}, cards: {}, last: null }; }
export const store = {
  data: fresh(),
  load() {
    try {
      const v = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
      this.data = v && v.v === 1 ? Object.assign(fresh(), v) : fresh();
    } catch (e) { this.data = fresh(); }
    return this.data;
  },
  save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(this.data)); } catch (e) { /* storage unavailable: progress stays in memory */ }
    document.dispatchEvent(new CustomEvent('academy:progress'));
  },
  set(bucket, key, val) { if (val === undefined || val === null || val === false) delete this.data[bucket][key]; else this.data[bucket][key] = val; this.save(); },
  get(bucket, key) { return this.data[bucket] ? this.data[bucket][key] : undefined; },
  export() { return JSON.stringify(this.data, null, 1); },
  import(text) { const v = JSON.parse(text); if (!v || v.v !== 1) throw new Error('Not an EDS Academy progress file'); this.data = Object.assign(fresh(), v); this.save(); },
  reset() { this.data = fresh(); this.save(); },
};
store.load();

let SYL = null;
export async function syllabus() {
  if (SYL) return SYL;
  const res = await fetch(href('data/syllabus.json'));
  SYL = await res.json();
  SYL.byId = {};
  SYL.modules.forEach((m, i) => { m.index = i; SYL.byId[m.id] = m; m.next = []; });
  SYL.modules.forEach((m) => m.pre.forEach((p) => SYL.byId[p] && SYL.byId[p].next.push(m.id)));
  return SYL;
}
export function moduleProgress(m) {
  const done = m.topics.filter((t) => store.get('topics', `${m.id}/${t.id}`)).length;
  return { done, total: m.topics.length, complete: store.get('modules', m.id) === 'done' || (done === m.topics.length && done > 0) };
}
export function overallProgress(syl) {
  let topics = 0; let topicsDone = 0; let hours = 0; let hoursDone = 0; let modsDone = 0;
  syl.modules.forEach((m) => {
    const p = moduleProgress(m);
    topics += p.total; topicsDone += p.done; hours += m.hours;
    if (p.complete) { modsDone += 1; hoursDone += m.hours; }
  });
  return { topics, topicsDone, hours, hoursDone, modsDone, mods: syl.modules.length };
}
export function trackTags(tracks, syl) {
  return tracks.map((t) => h('span', { class: `tag ${t}`, title: syl.tracks[t].name }, syl.tracks[t].short));
}
export function levelBadges(levels, syl) {
  const [a, b] = levels; const out = [];
  for (let l = a; l <= b; l += 1) out.push(h('span', { class: 'lvl', 'data-l': l, title: syl.levels[l] }, `L${l}`));
  return out;
}
export function levelText(m) { return m.levels[0] === m.levels[1] ? `L${m.levels[0]}` : `L${m.levels[0]}–L${m.levels[1]}`; }
export function modLink(m, label) {
  if (m.built) return h('a', { class: 'mod-link', href: href(m.page) }, h('code', {}, m.id), h('span', {}, label || m.name));
  return h('span', { class: 'mod-link planned', title: 'Not built yet' }, h('code', {}, m.id), h('span', {}, `${label || m.name} (not built yet)`));
}

/* ---------- icons ---------- */
const ICON = {
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
  sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
  moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>',
  auto: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 3v18" /><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor"/></svg>',
  menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"/></svg>',
  tip: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z"/></svg>',
  warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 3 2 21h20L12 3z"/><path d="M12 10v5M12 18h.01"/></svg>',
  enterprise: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="4" y="3" width="16" height="18" rx="1"/><path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2"/></svg>',
  performance: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z"/></svg>',
  accessibility: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="4" r="2"/><path d="M4 8h16M12 8v6M8 22l4-8 4 8"/></svg>',
  verify: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14M12 17h.01"/></svg>',
  update: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/></svg>',
};
const CALLOUT_LABEL = { tip: 'Tip', warning: 'Warning', enterprise: 'Enterprise note', performance: 'Performance note', accessibility: 'Accessibility note', verify: 'Verify', update: 'Update' };
const BRAND_SVG = '<svg class="brand-mark" viewBox="0 0 32 32" aria-hidden="true"><rect x="1" y="1" width="30" height="30" rx="8" fill="var(--accent)"/><path d="M9 10h14M9 16h9M9 22h14" stroke="var(--accent-ink)" stroke-width="2.6" stroke-linecap="round"/><circle cx="23" cy="16" r="2.4" fill="var(--accent-ink)"/></svg>';

/* ---------- theme ---------- */
function currentTheme() { try { return localStorage.getItem(THEME_KEY) || 'system'; } catch (e) { return 'system'; } }
function applyTheme(t) {
  if (t === 'system') delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = t;
  try { if (t === 'system') localStorage.removeItem(THEME_KEY); else localStorage.setItem(THEME_KEY, t); } catch (e) { /* ignore */ }
  document.dispatchEvent(new CustomEvent('academy:theme'));
}
function themeButton() {
  const order = ['system', 'light', 'dark'];
  const label = { system: 'Theme: follows your system', light: 'Theme: light', dark: 'Theme: dark' };
  const icon = { system: ICON.auto, light: ICON.sun, dark: ICON.moon };
  const btn = h('button', { class: 'icon-btn', type: 'button' });
  const paint = () => { const t = currentTheme(); btn.innerHTML = icon[t]; btn.setAttribute('aria-label', `${label[t]}. Select to change.`); btn.title = label[t]; };
  btn.addEventListener('click', () => { const t = currentTheme(); applyTheme(order[(order.indexOf(t) + 1) % order.length]); paint(); });
  paint();
  if (window.matchMedia) window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => document.dispatchEvent(new CustomEvent('academy:theme')));
  return btn;
}

/* ---------- chrome ---------- */
function ring(pct) {
  const r = 11; const c = 2 * Math.PI * r;
  return `<svg class="ring" viewBox="0 0 28 28" aria-hidden="true"><circle cx="14" cy="14" r="${r}" fill="none" stroke="var(--surface-3)" stroke-width="4"/><circle cx="14" cy="14" r="${r}" fill="none" stroke="var(--good)" stroke-width="4" stroke-linecap="round" stroke-dasharray="${(c * pct).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 14 14)"/></svg>`;
}
function buildHeader(syl) {
  const page = document.body.dataset.page || '';
  const links = [['index.html', 'Home', 'home'], ['start-here.html', 'Start here', 'start'], ['index.html#course-map', 'Course map', 'map'], ['index.html#paths', 'Paths', 'paths'], ['practice/index.html', 'Practice', 'practice'], ['reference/index.html', 'Reference', 'reference']];
  const nav = h('nav', { class: 'primary-nav', 'aria-label': 'Primary' });
  const mnav = h('nav', { class: 'mobile-nav wrap', 'aria-label': 'Primary (mobile)', id: 'mobile-nav' });
  links.forEach(([u, t, k]) => {
    const a = h('a', { href: href(u) }, t); if (k === page) a.setAttribute('aria-current', 'page');
    nav.append(a); mnav.append(a.cloneNode(true));
  });
  const searchBtn = h('button', { class: 'search-btn', type: 'button', 'aria-label': 'Search the course', html: `${ICON.search}<span>Search the course</span><kbd>/</kbd>` });
  searchBtn.addEventListener('click', openSearch);
  const chip = h('a', { class: 'progress-chip', href: href('index.html#progress'), 'aria-label': 'Your progress' });
  const paintChip = () => { const o = overallProgress(syl); chip.innerHTML = `${ring(o.topics ? o.topicsDone / o.topics : 0)}<span class="pc-text">${o.topicsDone}/${o.topics} topics</span>`; chip.setAttribute('aria-label', `Your progress: ${o.topicsDone} of ${o.topics} topics done`); };
  paintChip(); document.addEventListener('academy:progress', paintChip);
  const menuBtn = h('button', { class: 'icon-btn menu-btn', type: 'button', 'aria-label': 'Open menu', 'aria-expanded': 'false', 'aria-controls': 'mobile-nav', html: ICON.menu });
  menuBtn.addEventListener('click', () => { const open = mnav.classList.toggle('open'); menuBtn.setAttribute('aria-expanded', String(open)); });
  const head = h('header', { class: 'site-head' },
    h('div', { class: 'wrap sh-inner' },
      h('a', { class: 'brand', href: href('index.html'), html: `${BRAND_SVG}<span>EDS Academy</span>` }),
      nav, h('span', { class: 'sh-spacer' }), searchBtn, themeButton(), chip, menuBtn),
    mnav);
  document.body.prepend(h('a', { class: 'skip', href: '#main' }, 'Skip to content'), head);
  const foot = h('footer', { class: 'site-foot' }, h('div', { class: 'wrap' },
    h('p', {}, `EDS Academy · Content as of ${(syl.byId[document.body.dataset.module] || {}).asOf || AS_OF}. Edge Delivery Services changes continuously: items marked Verify need checking against aem.live before you rely on them.`),
    h('p', {}, 'Learning resource, not official Adobe documentation. Examples use fictional companies.')));
  document.body.append(foot);
  document.addEventListener('keydown', (e) => {
    const tag = (e.target.tagName || '').toLowerCase();
    if (['input', 'textarea', 'select'].includes(tag) || e.target.isContentEditable) return;
    if (e.key === '/' || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k')) { e.preventDefault(); openSearch(); }
  });
}

/* ---------- module page ---------- */
const PART_LABEL = { why: 'Why it matters', concept: 'Concept', visual: 'Visual', show: 'Show it', try: 'Try it', pitfalls: 'Pitfalls' };
function buildModule(syl) {
  const m = syl.byId[document.body.dataset.module];
  if (!m) return;
  const cat = syl.categories.find((c) => c.id === m.cat);
  store.data.last = m.id; store.save();
  const main = $('#main');
  const layout = h('div', { class: 'wrap module-layout' });
  const toc = h('aside', { class: 'toc', id: 'toc', 'aria-label': 'Module contents' });
  const scrim = h('div', { class: 'toc-scrim' });
  const content = h('div', { class: 'module-content' });
  main.parentNode.insertBefore(layout, main);
  layout.append(toc, content); content.append(main); document.body.append(scrim);

  // hero
  const tocBtn = h('button', { class: 'btn small menu-toc-btn', type: 'button', 'aria-controls': 'toc', 'aria-expanded': 'false', html: `${ICON.menu.replace('<svg', '<svg width="16" height="16"')} Module contents` });
  const closeToc = () => { toc.classList.remove('open'); scrim.classList.remove('open'); tocBtn.setAttribute('aria-expanded', 'false'); };
  tocBtn.addEventListener('click', () => { const o = toc.classList.toggle('open'); scrim.classList.toggle('open', o); tocBtn.setAttribute('aria-expanded', String(o)); if (o) { const a = $('a', toc); if (a) a.focus(); } });
  scrim.addEventListener('click', closeToc);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && toc.classList.contains('open')) { closeToc(); tocBtn.focus(); } });
  const pre = h('div', { class: 'prereq' }, h('span', { class: 'muted' }, m.pre.length ? 'Before this:' : 'Prerequisites: none, start here.'));
  m.pre.forEach((p) => { const pm = syl.byId[p]; pre.append(pm.built ? h('a', { href: href(pm.page) }, h('code', {}, pm.id), pm.name) : h('span', { class: 'planned', title: 'Not built yet' }, h('code', {}, pm.id), pm.name)); });
  const meterSpan = h('span');
  const progText = h('span', { class: 'muted', style: 'font-size:14px' });
  const hero = h('header', { class: 'mod-hero' },
    tocBtn,
    h('nav', { class: 'crumbs', 'aria-label': 'Breadcrumb' }, h('a', { href: href('index.html') }, 'Home'), h('span', { 'aria-hidden': 'true' }, '/'), h('a', { href: href('index.html#course-map') }, `Category ${m.cat}: ${cat.name}`), h('span', { 'aria-hidden': 'true' }, '/'), h('span', { 'aria-current': 'page' }, m.id)),
    h('h1', {}, h('span', { class: 'mid' }, m.id), m.name),
    h('div', { class: 'mod-meta' }, h('span', { class: 'badges' }, levelBadges(m.levels, syl)), h('span', { class: 'badges' }, trackTags(m.tracks, syl)), h('span', { class: 'sep', 'aria-hidden': 'true' }), h('span', {}, `About ${m.hours} hours`), h('span', {}, `${m.topics.length} topics`)),
    pre,
    h('div', { style: 'display:grid;gap:6px;margin-top:16px;max-width:360px' }, progText, h('div', { class: 'meter' }, meterSpan)),
    h('p', { class: 'asof' }, `Content as of ${m.asOf || AS_OF}. Signature interactive: ${m.signature}.`));
  main.prepend(hero);
  const paintProg = () => { const p = moduleProgress(m); meterSpan.style.width = `${(p.done / p.total) * 100}%`; progText.textContent = `${p.done} of ${p.total} topics done${p.complete ? ' · module complete' : ''}`; };

  // topics
  const tocList = h('ol');
  toc.append(h('p', { class: 'toc-title' }, `${m.id} · ${m.name}`));
  const tocProg = h('div', { class: 'toc-progress' }); const tocMeter = h('span'); const tocTxt = h('span');
  tocProg.append(tocTxt, h('div', { class: 'meter' }, tocMeter)); toc.append(tocProg, tocList);
  const tocLinks = [];
  const addToc = (id, label, n, topicKey) => {
    const a = h('a', { href: `#${id}` }, h('span', { class: 'n' }, n || ''), h('span', {}, label), h('span', { class: 'ck', 'aria-hidden': 'true' }));
    a.addEventListener('click', () => { if (window.innerWidth <= 1060) closeToc(); });
    if (topicKey) a.dataset.key = topicKey;
    tocList.append(h('li', {}, a)); tocLinks.push(a); return a;
  };
  const intro = $('section.intro', main);
  if (intro) { intro.id = intro.id || 'overview'; addToc(intro.id, intro.dataset.toc || 'Overview', '·'); }
  tocList.append(h('li', { class: 'toc-group' }, 'Topics'));
  const topicEls = $$('section.topic', main);
  const known = new Map(m.topics.map((t) => [t.id, t]));
  topicEls.forEach((sec, i) => {
    const t = known.get(sec.id) || { id: sec.id, name: sec.dataset.topic || sec.id, level: Number(sec.dataset.level || m.levels[0]) };
    const key = `${m.id}/${t.id}`;
    const h2 = $('h2', sec) || h('h2', {}, t.name);
    const lv = Number(sec.dataset.level || t.level);
    const done = h('button', { class: 'done-btn', type: 'button', 'aria-pressed': String(!!store.get('topics', key)) });
    const paintDone = () => { const on = !!store.get('topics', key); done.setAttribute('aria-pressed', String(on)); done.textContent = on ? '✓ Done' : 'Mark done'; done.setAttribute('aria-label', `${on ? 'Done' : 'Mark done'}: ${t.name}`); };
    done.addEventListener('click', () => { store.set('topics', key, store.get('topics', key) ? null : Date.now()); paintDone(); });
    paintDone();
    const badges = h('div', { class: 'badges' }, h('span', { class: 'lvl', 'data-l': lv, title: syl.levels[lv] }, `L${lv}`), trackTags(sec.dataset.tracks ? sec.dataset.tracks.split(',') : m.tracks, syl));
    if (sec.dataset.added !== undefined) badges.append(h('span', { class: 'tag added' }, 'Added'));
    const head = h('header', { class: 'topic-head' }, h('span', { class: 'topic-num', 'aria-hidden': 'true' }, String(i + 1).padStart(2, '0')), h2, badges, done);
    sec.prepend(head);
    $$('[data-part]', sec).forEach((p) => { const lab = PART_LABEL[p.dataset.part]; if (lab) p.prepend(h('h3', { class: 'part-label' }, lab)); });
    addToc(sec.id, t.name, String(i + 1).padStart(2, '0'), key);
  });
  const parts = $$('section.mpart', main);
  if (parts.length) tocList.append(h('li', { class: 'toc-group' }, 'Practice and review'));
  parts.forEach((sec) => addToc(sec.id, sec.dataset.toc || ($('h2', sec) || {}).textContent || sec.id, '·'));

  const paintToc = () => {
    tocLinks.forEach((a) => { if (a.dataset.key) $('.ck', a).textContent = store.get('topics', a.dataset.key) ? '✓' : ''; });
    const p = moduleProgress(m); tocMeter.style.width = `${(p.done / p.total) * 100}%`; tocTxt.textContent = `${p.done}/${p.total} topics done`;
    paintProg();
  };
  paintToc(); document.addEventListener('academy:progress', paintToc);

  // scrollspy
  if ('IntersectionObserver' in window) {
    const map = new Map(tocLinks.map((a) => [a.getAttribute('href').slice(1), a]));
    const visible = new Set();
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) visible.add(en.target.id); else visible.delete(en.target.id); });
      const first = [...map.keys()].find((id) => visible.has(id));
      if (first) tocLinks.forEach((a) => { const on = a === map.get(first); a.classList.toggle('active', on); if (on) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current'); });
    }, { rootMargin: `-${70}px 0px -60% 0px` });
    map.forEach((a, id) => { const el = document.getElementById(id); if (el) io.observe(el); });
  }

  // auto next steps
  $$('[data-auto="next-steps"]', main).forEach((box) => buildNextSteps(box, m, syl));

  // module complete + prev/next
  const doneBtn = h('button', { class: 'btn primary', type: 'button' });
  const doneMsg = h('div');
  const paintModDone = () => { const p = moduleProgress(m); const flag = store.get('modules', m.id) === 'done'; doneBtn.textContent = flag ? 'Marked complete (undo)' : 'Mark module complete'; doneMsg.innerHTML = `<strong>${p.complete ? 'Module complete.' : `${p.done} of ${p.total} topics done.`}</strong><br><span class="muted">Your progress is saved in this browser.</span>`; };
  doneBtn.addEventListener('click', () => { store.set('modules', m.id, store.get('modules', m.id) === 'done' ? null : 'done'); });
  paintModDone(); document.addEventListener('academy:progress', paintModDone);
  content.append(h('section', { class: 'module-done', 'aria-label': 'Module progress' }, doneMsg, doneBtn));
  const prev = syl.modules[m.index - 1]; const next = syl.modules[m.index + 1];
  const pn = (mm, dir) => {
    if (!mm) return h('div', { 'aria-hidden': 'true', style: 'visibility:hidden' });
    const inner = [h('small', {}, dir === 'p' ? '← Previous module' : 'Next module →'), h('span', {}, h('b', {}, `${mm.id} `), mm.name), mm.built ? null : h('small', {}, 'Not built yet')];
    return mm.built ? h('a', { href: href(mm.page), class: dir === 'n' ? 'nx' : '' }, inner) : h('div', { class: dir === 'n' ? 'nx' : '' }, inner);
  };
  content.append(h('nav', { class: 'prevnext', 'aria-label': 'Module navigation' }, pn(prev, 'p'), pn(next, 'n')));
}

function buildNextSteps(box, m, syl) {
  const grid = h('div', { class: 'next-grid' });
  syl.paths.forEach((p) => {
    const flat = p.phases.flat(); const i = flat.indexOf(m.id);
    if (i === -1) return;
    const nx = flat[i + 1] ? syl.byId[flat[i + 1]] : null;
    grid.append(h('div', { class: 'next-card' }, h('h3', {}, `${p.name} path`), nx ? modLink(nx) : h('span', { class: 'muted' }, 'This is the last module on this path.')));
  });
  if (m.next.length) {
    const rel = h('div', { class: 'next-card' }, h('h3', {}, 'This module unlocks'));
    m.next.forEach((id) => rel.append(h('div', {}, modLink(syl.byId[id]))));
    grid.append(rel);
  }
  const gate = syl.gates.find((g) => g.level === m.levels[0]);
  if (gate) grid.append(h('div', { class: 'next-card' }, h('h3', {}, `Feeds capstone gate ${gate.level}`), h('b', {}, gate.title), h('span', { class: 'muted', style: 'font-size:14px' }, gate.brief), gate.built ? h('a', { href: href(gate.page) }, 'Open capstone') : h('span', { class: 'muted', style: 'font-size:13px' }, 'Capstone page not built yet.')));
  box.append(grid);
}

/* ---------- callouts & checklists ---------- */
function enhanceCallouts(root = document) {
  $$('.callout', root).forEach((c) => {
    if (c.dataset.enhanced) return; c.dataset.enhanced = '1';
    const type = Object.keys(CALLOUT_LABEL).find((k) => c.classList.contains(k)) || 'tip';
    const custom = c.dataset.label;
    c.setAttribute('role', 'note');
    c.prepend(h('p', { class: 'callout-label', html: `${ICON[type]}<span>${esc(custom || CALLOUT_LABEL[type])}</span>` }));
    if (!c.getAttribute('role') && (type === 'warning' || type === 'verify')) c.setAttribute('role', 'note');
  });
}
function enhanceChecklists(root = document) {
  $$('ul.checklist[data-id]', root).forEach((ul) => {
    const id = ul.dataset.id; const saved = new Set(store.get('checklists', id) || []);
    $$(':scope > li', ul).forEach((li, i) => {
      const input = h('input', { type: 'checkbox' }); input.checked = saved.has(i);
      const span = h('span', { class: 'cl-text' }); while (li.firstChild) span.append(li.firstChild);
      li.append(h('label', {}, input, span));
      input.addEventListener('change', () => { const cur = new Set(store.get('checklists', id) || []); if (input.checked) cur.add(i); else cur.delete(i); store.set('checklists', id, [...cur].sort((a, b) => a - b)); });
    });
  });
}

/* ---------- code blocks ---------- */
let hljsPromise = null;
function loadHljs() { if (!hljsPromise) hljsPromise = import(HLJS_URL).then((m) => m.default || m.HighlightJS).catch(() => null); return hljsPromise; }
function dedent(src) {
  const lines = src.replace(/\t/g, '  ').split('\n');
  while (lines.length && !lines[0].trim()) lines.shift();
  while (lines.length && !lines[lines.length - 1].trim()) lines.pop();
  const ind = Math.min(...lines.filter((l) => l.trim()).map((l) => l.match(/^ */)[0].length));
  return lines.map((l) => l.slice(Number.isFinite(ind) ? ind : 0)).join('\n');
}
function splitHighlighted(html) {
  // Split highlighted HTML into lines, closing and reopening spans across line breaks.
  const out = []; let cur = ''; const stack = [];
  const re = /(<span[^>]*>)|(<\/span>)|(\n)|([^<\n]+|<(?!\/?span)[^>]*>)/g; let mt;
  while ((mt = re.exec(html))) {
    if (mt[1]) { stack.push(mt[1]); cur += mt[1]; } else if (mt[2]) { stack.pop(); cur += mt[2]; } else if (mt[3]) { cur += '</span>'.repeat(stack.length); out.push(cur); cur = stack.join(''); } else cur += mt[4];
  }
  out.push(cur);
  return out;
}
function parseLines(spec) {
  const set = new Set(); if (!spec) return set;
  spec.split(',').forEach((part) => { const [a, b] = part.split('-').map((x) => parseInt(x, 10)); if (!Number.isNaN(a)) for (let i = a; i <= (b || a); i += 1) set.add(i); });
  return set;
}
async function enhanceCode(root = document) {
  const blocks = $$('figure.code:not([data-enhanced])', root);
  if (!blocks.length) return;
  const hljs = await loadHljs();
  blocks.forEach((fig) => {
    fig.dataset.enhanced = '1';
    const srcEl = fig.querySelector(':scope > script[type="text/plain"], :scope > textarea.src, :scope > pre');
    const raw = srcEl ? (srcEl.tagName === 'TEXTAREA' ? srcEl.value : srcEl.textContent) : '';
    const code = dedent(raw);
    if (srcEl) srcEl.remove();
    const lang = fig.dataset.lang || 'plaintext';
    let html = esc(code);
    if (hljs && lang !== 'plaintext' && lang !== 'text') {
      try { html = hljs.getLanguage(lang) ? hljs.highlight(code, { language: lang, ignoreIllegals: true }).value : esc(code); } catch (e) { html = esc(code); }
    }
    const hl = parseLines(fig.dataset.lines);
    const notesEl = fig.querySelector(':scope > ol.code-explain');
    const notes = new Map();
    if (notesEl) $$(':scope > li', notesEl).forEach((li, i) => { const ln = parseInt(li.dataset.line, 10); notes.set(ln, i + 1); li.prepend(h('span', { class: 'ref', 'aria-hidden': 'true' }, String(i + 1))); const lbl = h('span', { class: 'sr-only' }, `Line ${ln}: `); li.insertBefore(lbl, li.children[1] || null); });
    const lines = splitHighlighted(html).map((l, i) => {
      const n = i + 1; const cls = ['ln']; if (hl.has(n)) cls.push('hl'); if (notes.has(n)) cls.push('noted');
      return `<span class="${cls.join(' ')}"${notes.has(n) ? ` data-note="${notes.get(n)}"` : ''}>${l || ' '}</span>`;
    }).join('');
    const pre = h('pre', { class: 'code-pre', tabindex: '0', 'aria-label': `${fig.dataset.file || 'Code sample'}${hl.size ? `, highlighted lines ${fig.dataset.lines}` : ''}` });
    pre.innerHTML = `<code class="language-${esc(lang)}">${lines}</code>`;
    const status = h('span', { class: 'copy-status', 'aria-live': 'polite' });
    const copy = h('button', { class: 'btn small', type: 'button' }, 'Copy');
    copy.addEventListener('click', async () => {
      const done = (msg) => { status.textContent = msg; setTimeout(() => { status.textContent = ''; }, 2200); };
      try { await navigator.clipboard.writeText(code); done('Copied'); } catch (e) {
        const r = document.createRange(); r.selectNodeContents(pre.querySelector('code')); const s = window.getSelection(); s.removeAllRanges(); s.addRange(r); done('Selected: press Ctrl+C or Cmd+C');
      }
    });
    const tools = h('div', { class: 'tools' }, status);
    if (notesEl) {
      const ex = h('button', { class: 'btn small', type: 'button', 'aria-pressed': 'false' }, 'Explain lines');
      ex.addEventListener('click', () => { const on = fig.classList.toggle('explaining'); ex.setAttribute('aria-pressed', String(on)); });
      tools.append(ex);
    }
    tools.append(copy);
    const head = h('div', { class: 'code-head' }, h('span', { class: 'code-file' }, fig.dataset.file || 'Example'), h('span', { class: 'code-lang' }, lang), tools);
    fig.prepend(head, pre);
    if (notesEl) fig.insertBefore(notesEl, pre.nextSibling);
  });
}

/* ---------- diagrams (Mermaid) ---------- */
let mermaidPromise = null;
function cssVar(n) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }
function mermaidConfig() {
  const dark = (document.documentElement.dataset.theme === 'dark') || (!document.documentElement.dataset.theme && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const v = (n) => cssVar(n);
  return {
    startOnLoad: false, securityLevel: 'strict', theme: 'base', fontFamily: getComputedStyle(document.body).fontFamily,
    flowchart: { curve: 'basis', padding: 12, htmlLabels: true }, sequence: { mirrorActors: false, wrap: true },
    themeVariables: {
      darkMode: dark, background: v('--surface'), fontSize: '15px',
      primaryColor: v('--surface-2'), primaryTextColor: v('--ink'), primaryBorderColor: v('--line-strong'),
      secondaryColor: v('--accent-soft'), secondaryTextColor: v('--ink'), secondaryBorderColor: v('--accent'),
      tertiaryColor: v('--surface'), tertiaryTextColor: v('--ink'), tertiaryBorderColor: v('--line'),
      lineColor: v('--muted'), textColor: v('--ink'), mainBkg: v('--surface-2'), nodeBorder: v('--line-strong'),
      clusterBkg: v('--surface'), clusterBorder: v('--line-strong'), titleColor: v('--ink'), edgeLabelBackground: v('--surface'),
      actorBkg: v('--surface-2'), actorBorder: v('--line-strong'), actorTextColor: v('--ink'), actorLineColor: v('--line-strong'),
      signalColor: v('--ink-2'), signalTextColor: v('--ink'), labelBoxBkgColor: v('--surface-2'), labelBoxBorderColor: v('--line-strong'), labelTextColor: v('--ink'),
      loopTextColor: v('--ink'), noteBkgColor: v('--accent-soft'), noteBorderColor: v('--accent'), noteTextColor: v('--ink'),
      activationBkgColor: v('--accent-soft'), activationBorderColor: v('--accent'),
      stateBkg: v('--surface-2'), stateLabelColor: v('--ink'), compositeBackground: v('--surface'), transitionColor: v('--muted'), transitionLabelColor: v('--ink-2'),
      altBackground: v('--surface-2'), labelColor: v('--ink'),
    },
  };
}
async function renderMermaid(root = document) {
  const nodes = $$('.diagram pre.mermaid', root);
  if (!nodes.length) return;
  nodes.forEach((n) => { if (!n.dataset.src) n.dataset.src = n.textContent; });
  if (!mermaidPromise) mermaidPromise = import(MERMAID_URL).then((mod) => mod.default).catch(() => null);
  const mermaid = await mermaidPromise;
  if (!mermaid) {
    nodes.forEach((n) => {
      const fig = n.closest('figure');
      if (fig && !$('.diagram-error', fig)) fig.prepend(h('p', { class: 'diagram-error' }, 'The diagram library could not load, so the diagram source and its text description are shown instead.'));
      const d = fig && $('details.describe', fig); if (d) d.open = true;
    });
    return;
  }
  mermaid.initialize(mermaidConfig());
  for (const n of nodes) {
    n.removeAttribute('data-processed'); n.dataset.rendered = 'false'; n.textContent = n.dataset.src; if (n.nextElementSibling && n.nextElementSibling.classList.contains('scroll-hint')) n.nextElementSibling.remove();
    try {
      const { svg } = await mermaid.render(uid('mmd'), n.dataset.src);
      n.innerHTML = svg; n.dataset.rendered = 'true';
      const s = $('svg', n);
      if (s && s.viewBox && s.viewBox.baseVal && s.viewBox.baseVal.width) {
        const natural = s.viewBox.baseVal.width; const avail = n.clientWidth || 600;
        if (natural * 0.72 > avail) { s.style.maxWidth = 'none'; s.style.width = `${Math.round(natural * 0.72)}px`; n.after(h('p', { class: 'scroll-hint' }, 'Scroll sideways to see the whole diagram.')); }
      }
      markScrollable(n);
      if (s) { s.setAttribute('role', 'img'); const cap = n.closest('figure') && $('figcaption', n.closest('figure')); s.setAttribute('aria-label', cap ? cap.textContent.trim() : 'Diagram'); }
    } catch (e) {
      console.warn('[academy] mermaid render failed', e);
      n.textContent = n.dataset.src;
      const fig = n.closest('figure'); if (fig && !$('.diagram-error', fig)) fig.prepend(h('p', { class: 'diagram-error' }, 'This diagram could not be drawn; its source is shown instead.'));
    }
  }
}

/* ---------- glossary ---------- */
let GLOSS = null;
async function glossary() { if (!GLOSS) { try { GLOSS = await (await fetch(href('data/glossary.json'))).json(); } catch (e) { GLOSS = { terms: [] }; } } return GLOSS; }
async function enhanceGlossary() {
  const g = await glossary();
  const scope = $$('#main [data-part="concept"], #main [data-part="why"]');
  if (!scope.length || !g.terms.length) return;
  const pop = h('div', { class: 'gpop', id: 'gpop', role: 'tooltip', hidden: true });
  document.body.append(pop);
  const entries = []; g.terms.forEach((t) => (t.match || [t.term]).forEach((s) => entries.push([s, t])));
  entries.sort((a, b) => b[0].length - a[0].length);
  const used = new Set();
  const reEsc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  scope.forEach((sec) => {
    const walker = document.createTreeWalker(sec, NodeFilter.SHOW_TEXT, { acceptNode: (n) => (n.parentElement.closest('a, button, code, pre, h2, h3, h4, .gterm, figure, .callout-label, script, kbd') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT) });
    const texts = []; while (walker.nextNode()) texts.push(walker.currentNode);
    texts.forEach((node) => {
      for (const [s, t] of entries) {
        if (used.has(t.id)) continue;
        const re = new RegExp(`(^|[^A-Za-z0-9-])(${reEsc(s)})(?![A-Za-z0-9-])`);
        const mt = node.nodeValue.match(re);
        if (!mt) continue;
        used.add(t.id);
        const start = mt.index + mt[1].length;
        const after = node.splitText(start); const rest = after.splitText(s.length);
        const btn = h('button', { type: 'button', class: 'gterm', 'data-term': t.id }, after.nodeValue);
        after.replaceWith(btn);
        node = rest; // continue scanning remaining text
      }
    });
  });
  let current = null;
  const show = (btn) => {
    const t = g.terms.find((x) => x.id === btn.dataset.term); if (!t) return;
    pop.innerHTML = `<b>${esc(t.term)}${t.full ? ` · ${esc(t.full)}` : ''}</b>${esc(t.def)}`;
    pop.hidden = false; btn.setAttribute('aria-describedby', 'gpop'); current = btn;
    const r = btn.getBoundingClientRect(); const pw = pop.offsetWidth;
    let left = r.left + window.scrollX; left = Math.min(left, window.scrollX + document.documentElement.clientWidth - pw - 16); left = Math.max(window.scrollX + 16, left);
    pop.style.left = `${left}px`; pop.style.top = `${r.bottom + window.scrollY + 8}px`;
  };
  const hide = () => { pop.hidden = true; if (current) current.removeAttribute('aria-describedby'); current = null; };
  document.addEventListener('mouseover', (e) => { const b = e.target.closest && e.target.closest('.gterm'); if (b) show(b); });
  document.addEventListener('mouseout', (e) => { const b = e.target.closest && e.target.closest('.gterm'); if (b && !b.contains(e.relatedTarget)) hide(); });
  document.addEventListener('focusin', (e) => { if (e.target.classList && e.target.classList.contains('gterm')) show(e.target); });
  document.addEventListener('focusout', (e) => { if (e.target.classList && e.target.classList.contains('gterm')) hide(); });
  document.addEventListener('click', (e) => { const b = e.target.closest && e.target.closest('.gterm'); if (b) { if (current === b && !pop.hidden) hide(); else show(b); } });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') hide(); });
}

/* ---------- search ---------- */
let INDEX = null; let dlg = null;
async function searchIndex() { if (!INDEX) { try { INDEX = await (await fetch(href('data/search-index.json'))).json(); } catch (e) { INDEX = { items: [] }; } } return INDEX; }
function openSearch() {
  if (!dlg) {
    const input = h('input', { type: 'search', placeholder: 'Search modules, topics, terms and resources', 'aria-label': 'Search the course', autocomplete: 'off', role: 'combobox', 'aria-expanded': 'true', 'aria-controls': 'sd-results' });
    const list = h('ul', { class: 'sd-results', id: 'sd-results', role: 'listbox', 'aria-label': 'Results' });
    const count = h('span', { 'aria-live': 'polite' });
    const close = h('button', { class: 'btn small ghost', type: 'button' }, 'Close');
    dlg = h('dialog', { class: 'search-dlg', 'aria-label': 'Search' }, h('div', { class: 'sd-head', html: ICON.search.replace('<svg', '<svg width="18" height="18"') }, input, close), list, h('div', { class: 'sd-foot' }, count, h('span', {}, '↑ ↓ to move · Enter to open · Esc to close')));
    document.body.append(dlg);
    close.addEventListener('click', () => dlg.close());
    dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
    let sel = 0; let items = [];
    const paint = async () => {
      const idx = await searchIndex(); const q = input.value.trim().toLowerCase();
      list.innerHTML = '';
      if (!q) { count.textContent = 'Type to search.'; items = []; return; }
      const words = q.split(/\s+/);
      items = idx.items.map((it) => {
        const t = it.t.toLowerCase(); const x = (it.x || '').toLowerCase(); let s = 0;
        for (const w of words) { if (t.includes(w)) s += t.startsWith(w) ? 6 : 4; else if (x.includes(w)) s += 1; else return null; }
        if (t === q || t.split(' (')[0] === q) s += 20; if (it.k === 'module') s += 2; if (it.built) s += 1;
        return { it, s };
      }).filter(Boolean).sort((a, b) => b.s - a.s).slice(0, 30).map((r) => r.it);
      count.textContent = items.length ? `${items.length} result${items.length === 1 ? '' : 's'}` : 'No results. Try fewer or shorter words.';
      sel = 0;
      items.forEach((it, i) => {
        const a = h('a', { ...(it.k === 'resource' ? { target: '_blank', rel: 'noopener' } : {}), href: href(it.built === false ? 'index.html#course-map' : it.u), role: 'option', id: `sd-o${i}`, 'aria-selected': String(i === 0) }, h('span', { class: 'k' }, `${it.k}${it.m ? ` · ${it.m}` : ''}`), h('b', {}, it.t), it.x ? h('span', { class: 'x' }, it.x) : null, it.built === false ? h('span', { class: 'planned-note' }, 'Not built yet') : null);
        list.append(h('li', {}, a));
      });
      input.setAttribute('aria-activedescendant', items.length ? 'sd-o0' : '');
    };
    const move = (d) => {
      const opts = $$('a', list); if (!opts.length) return;
      sel = (sel + d + opts.length) % opts.length;
      opts.forEach((o, i) => o.setAttribute('aria-selected', String(i === sel)));
      opts[sel].scrollIntoView({ block: 'nearest' }); input.setAttribute('aria-activedescendant', opts[sel].id);
    };
    input.addEventListener('input', paint);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { e.preventDefault(); dlg.close(); return; }
      if (e.key === 'ArrowDown') { e.preventDefault(); move(1); } else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); } else if (e.key === 'Enter') { const o = $$('a', list)[sel]; if (o) { e.preventDefault(); window.location.href = o.href; dlg.close(); } }
    });
    list.addEventListener('click', () => dlg.close());
  }
  if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
  $('input', dlg).focus(); $('input', dlg).select();
}

/* ---------- progress panel ---------- */
function progressPanel(el, syl) {
  el.classList.add('pp');
  const stats = h('div', { class: 'grid-3' });
  const paint = () => {
    const o = overallProgress(syl);
    const quizzes = Object.values(store.data.quizzes);
    const avg = quizzes.length ? Math.round((quizzes.reduce((s, q) => s + q.score / q.total, 0) / quizzes.length) * 100) : null;
    stats.innerHTML = '';
    [[o.modsDone, `of ${o.mods} modules complete`], [o.topicsDone, `of ${o.topics} topics done`], [o.hoursDone, `of ${o.hours} hours completed`], [avg === null ? '–' : `${avg}%`, `average knowledge-check score (${quizzes.length} taken)`], [Object.keys(store.data.labs).length, 'labs marked done']].forEach(([b, s]) => stats.append(h('div', { class: 'stat card' }, h('b', {}, String(b)), h('span', {}, s))));
  };
  paint(); document.addEventListener('academy:progress', paint);
  const exp = h('textarea', { readonly: true, 'aria-label': 'Progress export', rows: '4' });
  const imp = h('textarea', { 'aria-label': 'Paste progress to import', placeholder: 'Paste exported progress here', rows: '4' });
  const msg = h('span', { class: 'pp-msg', 'aria-live': 'polite' });
  const btnExp = h('button', { class: 'btn small', type: 'button' }, 'Show export text');
  btnExp.addEventListener('click', () => { exp.value = store.export(); exp.focus(); exp.select(); msg.textContent = 'Copy this text and keep it somewhere safe.'; });
  const btnImp = h('button', { class: 'btn small', type: 'button' }, 'Import');
  btnImp.addEventListener('click', () => { try { store.import(imp.value); msg.textContent = 'Progress imported.'; imp.value = ''; } catch (e) { msg.textContent = `Import failed: ${e.message}`; } });
  const confirmRow = h('span', { hidden: true });
  const yes = h('button', { class: 'btn small', type: 'button', style: 'border-color:var(--bad);color:var(--bad)' }, 'Yes, erase my progress');
  const no = h('button', { class: 'btn small ghost', type: 'button' }, 'Cancel');
  confirmRow.append(h('span', { style: 'margin-right:8px' }, 'This cannot be undone.'), yes, no);
  const btnReset = h('button', { class: 'btn small', type: 'button' }, 'Reset progress');
  btnReset.addEventListener('click', () => { confirmRow.hidden = false; btnReset.hidden = true; yes.focus(); });
  no.addEventListener('click', () => { confirmRow.hidden = true; btnReset.hidden = false; btnReset.focus(); });
  yes.addEventListener('click', () => { store.reset(); confirmRow.hidden = true; btnReset.hidden = false; msg.textContent = 'Progress reset.'; });
  el.append(stats,
    h('div', { class: 'grid-2', style: 'margin-top:16px' },
      h('div', {}, h('h3', { class: 'pp-h' }, 'Back up or move your progress'), h('p', { class: 'muted', style: 'font-size:14.5px' }, 'Progress lives in this browser only. Export it to keep a copy or move to another device.'), exp, h('div', { class: 'pp-row' }, btnExp)),
      h('div', {}, h('h3', { class: 'pp-h' }, 'Restore progress'), h('p', { class: 'muted', style: 'font-size:14.5px' }, 'Paste text from an earlier export.'), imp, h('div', { class: 'pp-row' }, btnImp, btnReset, confirmRow))),
    h('div', { class: 'pp-row' }, msg));
}

/* ---------- components ---------- */
async function initComponents(root, ctx) {
  const els = $$('[data-component]', root).filter((el) => !el.dataset.ready);
  await Promise.all(els.map(async (el) => {
    const name = el.dataset.component; el.dataset.ready = '1';
    if (name === 'progress-panel') { progressPanel(el, ctx.syl); return; }
    const file = COMPONENTS[name]; if (!file) { console.warn('[academy] unknown component', name); return; }
    try { const mod = await import(`./components/${file}`); await mod.default(el, ctx); } catch (e) { console.error(`[academy] component ${name} failed`, e); el.append(h('p', { class: 'feedback bad' }, `This interactive (${name}) could not start.`)); }
  }));
}
export async function enhance(root, ctx) {
  enhanceCallouts(root); enhanceChecklists(root);
  await initComponents(root, ctx);
  await enhanceCode(root);
  await renderMermaid(root);
  markTables(root.nodeType === 9 ? document : root);
}

/* ---------- boot ---------- */
async function boot() {
  document.documentElement.classList.add('js');
  const syl = await syllabus();
  buildHeader(syl);
  if (document.body.dataset.page === 'module') buildModule(syl);
  const ctx = { syl, store, href, h, $, $$, esc, readJSON, uid, shuffle, reducedMotion, enhance: (el) => enhance(el, ctx), trackTags, levelBadges, levelText, modLink, moduleProgress, overallProgress };
  await enhance(document, ctx);
  enhanceGlossary();
  if (location.hash) { const t = document.getElementById(decodeURIComponent(location.hash.slice(1))); if (t) t.scrollIntoView(); }
  let themeTimer = null;
  document.addEventListener('academy:theme', () => { clearTimeout(themeTimer); themeTimer = setTimeout(() => renderMermaid(document), 60); });
  document.documentElement.dataset.ready = 'true';
}
boot().catch((e) => { console.error('[academy] boot failed', e); document.documentElement.dataset.ready = 'error'; });
