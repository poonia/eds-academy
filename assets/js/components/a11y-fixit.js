/* Accessibility fix-it: apply fixes to a broken snippet.
   JSON: {"code":"<a>...","issues":[{"label":"...","bad":"text","good":"text","why":"..."}]} */
export function apply(code, issues, on) {
  return issues.reduce((c, issue, i) => (on.includes(i) ? c.replace(issue.bad, issue.good) : c), code);
}

export default function a11yFixit(el, { h, readJSON }) {
  const cfg = readJSON(el); const issues = cfg.issues || [];
  el.classList.add('ix');
  const boxes = issues.map((issue) => h('input', { type: 'checkbox', 'aria-label': issue.label }));
  const out = h('pre', { class: 'sim-out', tabindex: '0', 'aria-label': 'Block markup' });
  const why = h('ul', { class: 'sim-notes' });
  const score = h('div', { class: 'feedback bad', 'aria-live': 'polite' });
  const paint = () => {
    const on = boxes.flatMap((b, i) => (b.checked ? [i] : []));
    out.textContent = apply(cfg.code, issues, on);
    why.replaceChildren(...on.map((i) => h('li', {}, issues[i].why)));
    const done = on.length === issues.length;
    score.className = `feedback ${done ? 'good' : 'bad'}`;
    score.textContent = done ? 'All issues are fixed. Now confirm it with a keyboard and a screen reader.' : `${issues.length - on.length} of ${issues.length} issues remain.`;
  };
  boxes.forEach((b) => b.addEventListener('change', paint));
  el.append(h('div', { class: 'ix-head' }, h('div', {}, h('div', { class: 'ix-kind' }, 'Exercise'), h('h3', {}, el.dataset.title || 'Accessibility fix-it'))), h('div', { class: 'sim-checks', style: 'display:grid' }, ...boxes.map((b, i) => h('label', {}, b, ` ${issues[i].label}`))), out, why, score);
  paint();
}
