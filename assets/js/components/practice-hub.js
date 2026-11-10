/* Practice hub: every code lab and debug case in the course, with this learner's status.
   JSON: {"items":[{"id":"c4-cards-lab","kind":"code","title":"…","module":"C4","topic":"…","url":"…"}]} */
const KINDS = { all: 'All', code: 'Code labs', debug: 'Debug cases' };

export default function practiceHub(el, { h, readJSON, store }) {
  const { items = [] } = readJSON(el);
  const done = (it) => !!(store.get('labs', `${it.kind}:${it.id}`) || {}).passed;
  let kind = 'all';
  const summary = h('p', { class: 'ph-meta', 'aria-live': 'polite' });
  const list = h('ul', { class: 'ph-list', role: 'list', style: 'list-style:none;padding:0;margin:0' });
  const buttons = Object.entries(KINDS).map(([k, label]) => {
    const b = h('button', { type: 'button', class: 'chip', 'aria-pressed': String(k === kind) }, label);
    b.addEventListener('click', () => { kind = k; buttons.forEach((x) => x.setAttribute('aria-pressed', String(x === b))); paint(); });
    return b;
  });
  const paint = () => {
    const shown = items.filter((it) => kind === 'all' || it.kind === kind);
    list.replaceChildren(...shown.map((it) => {
      const ok = done(it);
      return h('li', { class: `ph-item${ok ? ' done' : ''}` },
        h('div', {},
          h('h3', {}, h('a', { href: it.url }, it.title)),
          h('div', { class: 'ph-meta' }, `${it.kind === 'code' ? 'Code lab' : 'Debug case'} · ${it.module} · ${it.topic}`)),
        h('span', { class: 'ph-state' }, ok ? 'Done' : 'Not started'));
    }));
    const n = items.filter(done).length;
    summary.textContent = `${n} of ${items.length} exercises done. ${shown.length} shown.`;
  };
  el.append(h('div', { class: 'ph-filters', role: 'group', 'aria-label': 'Show' }, ...buttons), summary, list);
  paint();
  document.addEventListener('academy:progress', paint);
}
