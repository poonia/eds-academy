/* Code lab: write a block's decorate() function and check it against the delivered markup.
   The learner's code runs in a sandboxed frame with no access to this page or its storage.
   JSON: {"name":"cards","task":"<p>…</p>","markup":"<div class=\"cards\">…</div>",
          "starter":"export default function decorate(block) {…}","solution":"…",
          "checks":[{"label":"…","test":"block.querySelectorAll('li').length === 2"}],
          "hints":["…"],"fetch":{"/query-index.json":{…}},"meta":{"published-time":"…"}}
   A check's test is a JavaScript expression evaluated with block, main and document in scope. */

/* Simplified versions of the aem.js helpers that labs may import. */
const HELPERS = String.raw`
function toClassName(name) {
  return typeof name === 'string' ? name.toLowerCase().replace(/[^0-9a-z]/gi, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') : '';
}
function toCamelCase(name) { return toClassName(name).replace(/-([a-z])/g, (g) => g[1].toUpperCase()); }
function readBlockConfig(block) {
  const config = {};
  block.querySelectorAll(':scope > div').forEach((row) => {
    const cols = [...row.children];
    if (!cols[1]) return;
    const col = cols[1];
    const name = toClassName(cols[0].textContent);
    let value;
    if (col.querySelector('a')) { const as = [...col.querySelectorAll('a')]; value = as.length === 1 ? as[0].href : as.map((a) => a.href); }
    else if (col.querySelector('img')) { const im = [...col.querySelectorAll('img')]; value = im.length === 1 ? im[0].src : im.map((i) => i.src); }
    else if (col.querySelector('p')) { const ps = [...col.querySelectorAll('p')]; value = ps.length === 1 ? ps[0].textContent : ps.map((p) => p.textContent); }
    else value = col.textContent;
    config[name] = value;
  });
  return config;
}
function createOptimizedPicture(src, alt = '', eager = false, breakpoints = [{ media: '(min-width: 600px)', width: '2000' }, { width: '750' }]) {
  const url = new URL(src, 'https://example.com');
  const picture = document.createElement('picture');
  const { pathname } = url;
  breakpoints.forEach((br) => {
    const source = document.createElement('source');
    if (br.media) source.setAttribute('media', br.media);
    source.setAttribute('type', 'image/webp');
    source.setAttribute('srcset', pathname + '?width=' + br.width + '&format=webply&optimize=medium');
    picture.append(source);
  });
  const img = document.createElement('img');
  img.setAttribute('loading', eager ? 'eager' : 'lazy');
  img.setAttribute('alt', alt);
  img.setAttribute('src', pathname + '?width=' + breakpoints[breakpoints.length - 1].width + '&format=jpg&optimize=medium');
  picture.append(img);
  return picture;
}
function getMetadata(name) { return (window.__meta || {})[name] || ''; }
function moveInstrumentation(from, to) {
  [...from.attributes].map(({ nodeName }) => nodeName)
    .filter((attr) => attr.startsWith('data-aue-') || attr.startsWith('data-richtext-'))
    .forEach((attr) => { to.setAttribute(attr, from.getAttribute(attr)); from.removeAttribute(attr); });
}
async function loadScript() { return undefined; }
async function loadCSS() { return undefined; }
`;

/* Turn module code into something the runner can call: drop imports, expose the default export. */
export function prepare(code) {
  return code
    .replace(/^\s*import\s[^;]*?;\s*$/gm, '')
    .replace(/export\s+default\s+(async\s+)?function\s*([\w$]*)\s*\(/, (_, a = '', n) => `window.__decorate = ${a}function ${n || 'decorate'}(`)
    .replace(/export\s+default\s+/, 'window.__decorate = ')
    .replace(/export\s+(?=(async\s+)?function|const|let|class)/g, '')
    .replace(/<\/script/gi, '<\\/script');
}

/* Indent HTML so the result is readable. */
export function pretty(html) {
  const tpl = document.createElement('template');
  tpl.innerHTML = html;
  const out = [];
  const walk = (node, depth) => {
    const pad = '  '.repeat(depth);
    node.childNodes.forEach((n) => {
      if (n.nodeType === 3) { const t = n.textContent.trim(); if (t) out.push(pad + t); return; }
      if (n.nodeType !== 1) return;
      const attrs = [...n.attributes].map((a) => (a.value === '' ? ` ${a.name}` : ` ${a.name}="${a.value}"`)).join('');
      const tag = n.tagName.toLowerCase();
      if (['img', 'source', 'br', 'input', 'hr'].includes(tag)) { out.push(`${pad}<${tag}${attrs}>`); return; }
      const only = n.childNodes.length === 1 && n.firstChild.nodeType === 3;
      if (only || !n.childNodes.length) { out.push(`${pad}<${tag}${attrs}>${n.textContent.trim()}</${tag}>`); return; }
      out.push(`${pad}<${tag}${attrs}>`); walk(n, depth + 1); out.push(`${pad}</${tag}>`);
    });
  };
  walk(tpl.content, 0);
  return out.join('\n');
}

function frameDoc(cfg, code, token) {
  const json = (v) => JSON.stringify(v).replace(/</g, '\\u003c');
  return `<!doctype html><html><head><meta charset="utf-8"></head><body><main></main>
<script>
const __token = ${json(token)};
const __send = (d) => parent.postMessage(Object.assign({ __lab: __token }, d), '*');
window.__meta = ${json(cfg.meta || {})};
window.__errors = [];
window.addEventListener('error', (e) => { window.__errors.push(e.message); });
window.addEventListener('unhandledrejection', (e) => { window.__errors.push(String((e.reason && e.reason.message) || e.reason)); });
const __routes = ${json(cfg.fetch || {})};
window.fetch = async (url) => {
  const path = new URL(String(url), 'https://example.com').pathname;
  if (!(path in __routes)) return new Response('Not found', { status: 404 });
  return new Response(JSON.stringify(__routes[path]), { status: 200, headers: { 'content-type': 'application/json' } });
};
${HELPERS}
const __main = document.querySelector('main');
__main.innerHTML = '<div class="section"><div class="${cfg.name}-wrapper">' + ${json(cfg.markup)} + '</div></div>';
const __block = __main.querySelector('.${cfg.name}');
__block.classList.add('block');
__block.dataset.blockName = ${json(cfg.name)};
__block.dataset.blockStatus = 'loading';
</script>
<script type="module">
${prepare(code)}
</script>
<script type="module">
const checks = ${json((cfg.checks || []).map((c) => c.test))};
const timeout = (ms) => new Promise((resolve) => { setTimeout(() => resolve('timeout'), ms); });
let error = '';
if (typeof window.__decorate !== 'function') {
  error = window.__errors[0] || 'No default export was found. Start with: export default function decorate(block) {';
} else {
  try {
    const r = await Promise.race([Promise.resolve(window.__decorate(__block)).then(() => 'ok'), timeout(3000)]);
    if (r === 'timeout') error = 'decorate() did not finish within 3 seconds.';
    await timeout(60);
  } catch (e) { error = e.message; }
}
__block.dataset.blockStatus = 'loaded';
const results = checks.map((t) => { try { return !!(new Function('block', 'main', 'document', 'return (' + t + ');'))(__block, __main, document); } catch (e) { return false; } });
__send({ type: 'done', results, error: error || window.__errors[0] || '', html: __main.querySelector('.section > div').innerHTML });
</script></body></html>`;
}

export default function codeLab(el, { h, readJSON, store, uid }) {
  const cfg = readJSON(el);
  const id = el.dataset.id || uid('lab');
  const key = `code:${id}`;
  const saved = store.get('labs', key) || {};
  el.classList.add('ix', 'code-lab');
  const edId = uid('cl');
  const editor = h('textarea', { id: edId, class: 'sim-text cl-editor', spellcheck: 'false', autocapitalize: 'off', autocomplete: 'off', wrap: 'off' });
  editor.value = saved.draft || cfg.starter || '';
  editor.rows = Math.min(24, Math.max(8, editor.value.split('\n').length + 2));
  const run = h('button', { type: 'button', class: 'btn primary small' }, 'Run checks');
  const hintBtn = h('button', { type: 'button', class: 'btn small' }, 'Show a hint');
  const reset = h('button', { type: 'button', class: 'btn small ghost' }, 'Reset code');
  const solBtn = h('button', { type: 'button', class: 'btn small ghost', disabled: true }, 'Show solution');
  const status = h('p', { class: 'cl-status', 'aria-live': 'polite' });
  const list = h('ul', { class: 'cl-checks' }, ...(cfg.checks || []).map((c) => h('li', {}, h('span', { class: 'cl-mark' }, 'Not run'), h('span', {}, c.label))));
  const hintBox = h('div', { class: 'cl-hints', 'aria-live': 'polite' });
  const err = h('div', { class: 'feedback bad', hidden: true, role: 'alert' });
  const outPre = h('pre', { class: 'sim-out', tabindex: '0', 'aria-label': 'DOM after decorate()' });
  const outBox = h('details', { class: 'describe cl-out' }, h('summary', {}, 'DOM after your decorate()'), outPre);
  const solPre = h('pre', { class: 'sim-out', tabindex: '0', 'aria-label': 'Solution' });
  const solBox = h('details', { class: 'describe', hidden: true }, h('summary', {}, 'One possible solution'), solPre);
  solPre.textContent = cfg.solution || '';
  let hintAt = 0; let frame = null; let busy = false;

  const persist = (extra = {}) => store.set('labs', key, { ...(store.get('labs', key) || {}), draft: editor.value, ...extra });
  editor.addEventListener('input', () => persist());
  if (saved.passed) status.textContent = 'You have passed this lab before. Run the checks again at any time.';

  const finish = (msg) => {
    busy = false; run.disabled = false; solBtn.disabled = false;
    if (frame) { frame.remove(); frame = null; }
    const { results = [], error = '', html = '' } = msg;
    const passed = results.filter(Boolean).length;
    [...list.children].forEach((li, i) => {
      li.className = results[i] ? 'pass' : 'fail';
      li.firstChild.textContent = results[i] ? 'Pass' : 'Not yet';
    });
    err.hidden = !error;
    err.innerHTML = '';
    if (error) err.append(h('strong', {}, 'Your code reported an error.'), error);
    outPre.textContent = pretty(html);
    const all = results.length > 0 && passed === results.length;
    status.textContent = all ? `All ${results.length} checks pass. Well done.` : `${passed} of ${results.length} checks pass.`;
    status.className = `cl-status ${all ? 'good' : ''}`;
    if (all) persist({ passed: true });
  };

  window.addEventListener('message', (e) => {
    if (!frame || e.source !== frame.contentWindow || !e.data || e.data.__lab !== frame.dataset.token) return;
    finish(e.data);
  });

  run.addEventListener('click', () => {
    if (busy) return;
    busy = true; run.disabled = true; status.textContent = 'Running your code…';
    const token = uid('run');
    frame = h('iframe', { sandbox: 'allow-scripts', title: 'Code runner', tabindex: '-1', 'aria-hidden': 'true', class: 'cl-frame' });
    frame.dataset.token = token;
    frame.srcdoc = frameDoc(cfg, editor.value, token);
    document.body.append(frame);
    setTimeout(() => { if (busy && frame && frame.dataset.token === token) finish({ results: (cfg.checks || []).map(() => false), error: 'The code did not finish. Check for an endless loop.' }); }, 6000);
  });
  hintBtn.addEventListener('click', () => {
    const hints = cfg.hints || [];
    if (!hints.length) return;
    hintBox.append(h('p', { class: 'ix-note' }, h('b', {}, `Hint ${hintAt + 1}: `), hints[hintAt]));
    hintAt += 1;
    if (hintAt >= hints.length) { hintBtn.disabled = true; hintBtn.textContent = 'No more hints'; }
  });
  reset.addEventListener('click', () => { editor.value = cfg.starter || ''; persist(); editor.focus(); });
  solBtn.addEventListener('click', () => { solBox.hidden = false; solBox.open = true; solPre.focus(); });

  const markup = h('pre', { class: 'sim-out', tabindex: '0', 'aria-label': 'Delivered markup' });
  markup.textContent = pretty(cfg.markup || '');
  el.append(
    h('div', { class: 'ix-head' }, h('div', {}, h('div', { class: 'ix-kind' }, 'Code lab'), h('h3', {}, el.dataset.title || 'Write the decorate function'))),
    h('div', { class: 'cl-task', html: cfg.task || '' }),
    h('details', { class: 'describe' }, h('summary', {}, 'Markup delivered to your block'), markup),
    h('label', { for: edId, class: 'sim-label', style: 'margin-top:12px' }, `blocks/${cfg.name}/${cfg.name}.js`),
    editor,
    h('p', { class: 'ix-note' }, 'Tab moves to the next control. Use spaces to indent. Imports from aem.js and scripts.js are provided for you.'),
    h('div', { class: 'sim-checks' }, run, hintBtn, reset, solBtn),
    status, err, list, hintBox, outBox, solBox,
  );
}
