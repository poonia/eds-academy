/* Filters server-rendered items by text and category. Without JavaScript every item stays visible.
   <div data-component="filter-list" data-placeholder="Search" data-cats='{"A":"Foundations"}' data-print="true">
     <section data-group><h2>A</h2><div data-item data-cat="A">...</div></section>
   </div> */
export function matches(text, cat, query, wanted) {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return (wanted === 'all' || cat === wanted) && words.every((w) => text.includes(w));
}

export default function filterList(el, { h, uid }) {
  const items = [...el.querySelectorAll('[data-item]')].map((node) => ({ node, text: node.textContent.toLowerCase(), cat: node.dataset.cat }));
  const groups = [...el.querySelectorAll('[data-group]')];
  const inputId = uid('fl'); const catId = uid('fl');
  const input = h('input', { id: inputId, class: 'sim-input', type: 'search', placeholder: el.dataset.placeholder || 'Filter', autocomplete: 'off' });
  const names = JSON.parse(el.dataset.cats || '{}');
  const cat = h('select', { id: catId, class: 'sim-input' }, h('option', { value: 'all' }, 'All'), ...Object.entries(names).map(([k, v]) => h('option', { value: k }, v)));
  const count = h('p', { class: 'ix-note', 'aria-live': 'polite', style: 'margin:0' });
  const paint = () => {
    let shown = 0;
    items.forEach((it) => { const ok = matches(it.text, it.cat, input.value, cat.value); it.node.hidden = !ok; if (ok) shown += 1; });
    groups.forEach((g) => { g.hidden = !g.querySelector('[data-item]:not([hidden])'); });
    count.textContent = shown ? `Showing ${shown} of ${items.length}` : 'No matches. Try a shorter word, or choose All.';
  };
  input.addEventListener('input', paint); cat.addEventListener('input', paint);
  const printBtn = el.dataset.print ? h('button', { type: 'button', class: 'btn' }, 'Print what is shown') : null;
  if (printBtn) printBtn.addEventListener('click', () => window.print());
  el.prepend(h('div', { class: 'filter-bar' },
    h('div', {}, h('label', { for: inputId, class: 'sim-label' }, 'Filter'), input),
    Object.keys(names).length ? h('div', {}, h('label', { for: catId, class: 'sim-label' }, el.dataset.catLabel || 'Category'), cat) : null,
    h('div', { class: 'filter-end' }, count, printBtn)));
  paint();
}
