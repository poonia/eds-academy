/* Universal Editor filter sandbox: choose what a container allows and see the insert menu.
   JSON: {"container":"section","components":[{"id":"text","label":"Text"}],"allowed":["text"]} */
export function filterJson(container, ids) {
  return [{ id: container, components: ids }];
}

export default function filterSandbox(el, { h, readJSON }) {
  const cfg = readJSON(el); const all = cfg.components || [];
  el.classList.add('ix');
  const boxes = all.map((c) => { const b = h('input', { type: 'checkbox' }); b.checked = (cfg.allowed || []).includes(c.id); return { c, b }; });
  const output = h('pre', { class: 'sim-out', tabindex: '0', 'aria-label': 'Filter definition' });
  const menu = h('ul', { class: 'sim-notes', 'aria-live': 'polite' });
  const paint = () => {
    const on = boxes.filter((x) => x.b.checked).map((x) => x.c);
    output.textContent = JSON.stringify(filterJson(cfg.container, on.map((c) => c.id)), null, 2);
    menu.replaceChildren(...(on.length ? on.map((c) => h('li', {}, c.label)) : [h('li', {}, 'Nothing can be added to this container.')]));
  };
  boxes.forEach((x) => x.b.addEventListener('change', paint));
  el.append(
    h('div', { class: 'ix-head' }, h('div', {}, h('div', { class: 'ix-kind' }, 'Sandbox'), h('h3', {}, el.dataset.title || 'Filter sandbox'))),
    h('div', { class: 'sim-checks' }, ...boxes.map((x) => h('label', {}, x.b, ` ${x.c.label}`))),
    h('div', { class: 'sim-io' }, h('div', {}, h('div', { class: 'sim-label' }, 'component-filters.json'), output), h('div', {}, h('div', { class: 'sim-label' }, `Add menu in a ${cfg.container}`), menu)),
  );
  paint();
}
