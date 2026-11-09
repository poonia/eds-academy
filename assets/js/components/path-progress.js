/* Adds live progress to a learning path page. The page's links work without it.
   <div data-component="path-progress" data-path="author">
     <li data-m="A1">...</li> <li data-gate="1">...</li> <li data-exam="final">...</li>
   </div> */
export default function pathProgress(el, { h, syl, store, moduleProgress, modLink }) {
  const path = syl.paths.find((p) => p.id === el.dataset.path);
  const mods = path.phases.flat().map((id) => syl.byId[id]);
  const summary = h('div', { class: 'card', style: 'display:grid;gap:10px;margin-bottom:18px', 'aria-live': 'polite' });
  el.prepend(summary);
  const put = (node, text) => {
    let s = node.querySelector(':scope > .pp-status');
    if (!s) { s = h('span', { class: 'pp-status' }); node.append(s); }
    s.textContent = text;
    node.classList.toggle('pp-done', /^(Done|Reviewed|Passed)/.test(text));
  };
  const paint = () => {
    el.querySelectorAll('[data-m]').forEach((node) => {
      const p = moduleProgress(syl.byId[node.dataset.m]);
      put(node, p.complete ? 'Done' : p.done ? `${p.done} of ${p.total} topics` : 'Not started');
    });
    el.querySelectorAll('[data-gate]').forEach((node) => put(node, store.get('capstones', node.dataset.gate) || 'Not started'));
    el.querySelectorAll('[data-exam]').forEach((node) => { const b = store.get('quizzes', `exam-${node.dataset.exam}`); put(node, b ? `${b.passed ? 'Passed' : 'Best'}: ${b.pct}%` : 'Not taken'); });
    const done = mods.filter((m) => moduleProgress(m).complete).length;
    const next = mods.find((m) => !moduleProgress(m).complete);
    summary.replaceChildren(
      h('div', { class: 'meter', 'aria-hidden': 'true' }, h('span', { style: `width:${(done / mods.length) * 100}%` })),
      h('b', {}, `${done} of ${mods.length} modules complete`),
      next ? h('div', {}, h('span', { class: 'muted' }, 'Next: '), modLink(next)) : h('b', {}, 'Every module on this path is complete.'),
    );
  };
  paint();
  document.addEventListener('academy:progress', paint);
}
