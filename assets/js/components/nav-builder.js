/* Nav document builder: three sections of a /nav document become brand, sections and tools.
   JSON: {"source":"Acme Bank\n---\n- Savings\n  - TFSA\n---\nSign in"} */
export function parseNav(source) {
  const parts = source.split(/^\s*---\s*$/m).map((p) => p.split('\n').filter((l) => l.trim()));
  const menu = [];
  (parts[1] || []).forEach((line) => {
    const nested = /^\s+- /.test(line); const text = line.replace(/^\s*-\s*/, '').trim();
    if (nested && menu.length) menu[menu.length - 1].children.push(text);
    else menu.push({ text, children: [] });
  });
  return { brand: (parts[0] || []).join(' ').trim(), menu, tools: (parts[2] || []).map((l) => l.replace(/^\s*-\s*/, '').trim()), count: parts.length };
}

export default function navBuilder(el, { h, readJSON, uid }) {
  const start = readJSON(el).source || '';
  el.classList.add('ix');
  const id = uid('nb');
  const input = h('textarea', { id, class: 'sim-text', rows: '11', spellcheck: 'false' }); input.value = start;
  const preview = h('div', { class: 'nav-preview' });
  const status = h('p', { class: 'ix-note', 'aria-live': 'polite' });
  const paint = () => {
    const nav = parseNav(input.value);
    preview.replaceChildren(
      h('strong', { class: 'nav-brand' }, nav.brand || '(no brand)'),
      h('ul', { class: 'nav-menu' }, ...nav.menu.map((m) => h('li', {}, m.text, m.children.length ? h('ul', {}, ...m.children.map((c) => h('li', {}, c))) : null))),
      h('span', { class: 'nav-tools' }, nav.tools.join(' · ')),
    );
    status.textContent = nav.count === 3
      ? `Three sections found. ${nav.menu.length} top-level item${nav.menu.length === 1 ? '' : 's'}.`
      : `Found ${nav.count} section${nav.count === 1 ? '' : 's'}. The boilerplate header expects three, in the order brand, sections, tools.`;
  };
  input.addEventListener('input', paint);
  el.append(
    h('div', { class: 'ix-head' }, h('div', {}, h('div', { class: 'ix-kind' }, 'Builder'), h('h3', {}, el.dataset.title || 'Nav document builder'))),
    h('p', { class: 'ix-note' }, 'Separate sections with ---. Use a dash for a menu item and an indented dash for a dropdown item.'),
    h('div', { class: 'sim-io' }, h('div', {}, h('label', { for: id, class: 'sim-label' }, 'The /nav document'), input), h('div', {}, h('div', { class: 'sim-label' }, 'Live preview'), preview, status)),
  );
  paint();
}
