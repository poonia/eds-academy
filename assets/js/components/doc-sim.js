/* Document-to-HTML simulator: type simplified document syntax, see the page markup EDS delivers.
   <div data-component="doc-sim" data-title="..."><script type="application/json">{"source":"# Title\n..."}</script></div> */
const slug = (s) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const inline = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>');
const cells = (line) => line.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim());

export function convert(source) {
  const lines = source.split('\n');
  const head = []; const notes = []; const sections = [{ body: [], attrs: '' }];
  const current = () => sections[sections.length - 1];
  let list = null; let table = null; let blocks = 0;
  const flushList = () => { if (list) { current().body.push(`<ul>${list.map((l) => `<li>${inline(l)}</li>`).join('')}</ul>`); list = null; } };
  const flushTable = () => {
    if (!table) return;
    const raw = table[0][0]; const rows = table.slice(1); table = null;
    const match = raw.match(/^(.*?)\s*\((.*)\)\s*$/);
    const name = match ? match[1] : raw; const low = name.trim().toLowerCase();
    if (low === 'metadata') {
      rows.forEach(([k, v = '']) => {
        const key = k.toLowerCase();
        if (key === 'title') head.push(`<title>${esc(v)}</title>`, `<meta property="og:title" content="${esc(v)}">`);
        else if (key === 'description') head.push(`<meta name="description" content="${esc(v)}">`, `<meta property="og:description" content="${esc(v)}">`);
        else head.push(`<meta name="${esc(slug(k))}" content="${esc(v)}">`);
      });
      notes.push('The Metadata table became head tags and does not appear in the body.');
      return;
    }
    if (low === 'section metadata') {
      rows.forEach(([k, v = '']) => {
        const key = k.toLowerCase();
        if (key === 'style') current().attrs += ` class="section ${esc(v.split(',').map(slug).join(' '))}"`;
        else if (key === 'id') current().attrs += ` id="${esc(slug(v))}"`;
        else current().attrs += ` data-${esc(slug(k))}="${esc(v)}"`;
      });
      notes.push('Section Metadata was applied to its section: Style becomes classes, Id an id, and other rows data attributes.');
      return;
    }
    const classes = [slug(name), ...(match ? match[2].split(',').map(slug).filter(Boolean) : [])].join(' ');
    blocks += 1;
    if (match) notes.push(`The variants in “${raw}” became extra classes: ${classes}.`);
    current().body.push(`<div class="${esc(classes)}">\n${rows.map((r) => `        <div>${r.map((c) => `<div>${inline(c)}</div>`).join('')}</div>`).join('\n')}\n      </div>`);
  };
  const flush = () => { flushList(); flushTable(); };
  lines.forEach((rawLine) => {
    const line = rawLine.trim();
    if (!line) { flush(); return; }
    if (/^-{3,}$/.test(line)) { flush(); sections.push({ body: [], attrs: '' }); return; }
    if (line.startsWith('|')) { flushList(); (table = table || []).push(cells(line)); return; }
    flushTable();
    if (/^- /.test(line)) { (list = list || []).push(line.slice(2)); return; }
    flushList();
    const heading = line.match(/^(#{1,6})\s+(.*)$/);
    const image = line.match(/^!\[(.*?)\]\((.*?)\)$/);
    if (heading) { const n = heading[1].length; current().body.push(`<h${n} id="${slug(heading[2])}">${inline(heading[2])}</h${n}>`); } else if (image) { current().body.push(`<p><img src="./media_1a2b3c.png" alt="${esc(image[1])}" loading="lazy"></p>`); if (!image[1]) notes.push('An image has no alt text, which fails accessibility review.'); } else current().body.push(`<p>${inline(line)}</p>`);
  });
  flush();
  const used = sections.filter((s, i) => s.body.length || s.attrs || i === 0);
  const main = used.map((s) => `    <div${s.attrs}>\n      ${s.body.join('\n      ')}\n    </div>`).join('\n');
  const html = `${head.length ? `<head>\n  ${head.join('\n  ')}\n</head>\n` : ''}<body>\n  <header></header>\n  <main>\n${main}\n  </main>\n  <footer></footer>\n</body>`;
  return { html, notes, sections: used.length, blocks };
}

export default function docSim(el, { h, readJSON, uid }) {
  const start = readJSON(el).source || '# Hello';
  el.classList.add('ix');
  const inputId = uid('ds');
  const input = h('textarea', { id: inputId, class: 'sim-text', rows: '14', spellcheck: 'false' }); input.value = start;
  const output = h('pre', { class: 'sim-out', tabindex: '0', 'aria-label': 'Generated page markup' });
  const summary = h('p', { class: 'ix-note', 'aria-live': 'polite' });
  const notes = h('ul', { class: 'sim-notes' });
  const paint = () => {
    const r = convert(input.value);
    output.textContent = r.html;
    summary.textContent = `${r.sections} section${r.sections === 1 ? '' : 's'} and ${r.blocks} block${r.blocks === 1 ? '' : 's'}.`;
    notes.replaceChildren(...r.notes.map((n) => h('li', {}, n)));
  };
  input.addEventListener('input', paint);
  const reset = h('button', { class: 'btn small', type: 'button' }, 'Reset the example');
  reset.addEventListener('click', () => { input.value = start; paint(); input.focus(); });
  el.append(
    h('div', { class: 'ix-head' }, h('div', {}, h('div', { class: 'ix-kind' }, 'Simulator'), h('h3', {}, el.dataset.title || 'Document to HTML'))),
    h('p', { class: 'ix-note' }, 'Use # for headings, - for lists, --- for a section break, and | cells | for table rows. Row one of a table is the block name.'),
    h('div', { class: 'sim-io' }, h('div', {}, h('label', { for: inputId, class: 'sim-label' }, 'Your document'), input), h('div', {}, h('div', { class: 'sim-label' }, 'Simplified page markup'), output)),
    summary, notes, h('div', { class: 'ix-foot' }, reset),
  );
  paint();
}
