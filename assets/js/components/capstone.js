/* Capstone self-assessment: requirements, rubric, evidence and a review pack.
   Everything stays in this browser.
   JSON: {"level":1,"title":"...","requirements":["..."],"rubric":[{"name":"","notYet":"","meets":"","exceeds":""}]} */
export const SCALE = ['', 'Not yet', 'Meets', 'Exceeds'];

export function status({ reqs, scores, evidence, reviewed }) {
  const started = reqs.some(Boolean) || scores.some(Boolean) || Boolean(evidence.trim());
  if (!started) return 'Not started';
  const ready = reqs.every(Boolean) && scores.every((s) => s === 'Meets' || s === 'Exceeds') && Boolean(evidence.trim());
  if (!ready) return 'In progress';
  return reviewed ? 'Reviewed' : 'Ready for review';
}

export function pack(cfg, st) {
  const lines = [`# Gate ${cfg.level}: ${cfg.title}`, '', `Status: ${status(st)}`, '', '## Requirements'];
  cfg.requirements.forEach((r, i) => lines.push(`- [${st.reqs[i] ? 'x' : ' '}] ${r}`));
  lines.push('', '## Rubric');
  cfg.rubric.forEach((r, i) => lines.push(`- ${r.name}: ${st.scores[i] || 'Not scored'}`));
  lines.push('', '## Evidence', st.evidence.trim() || '(none yet)');
  return lines.join('\n');
}

export default function capstone(el, { h, readJSON, store, uid }) {
  const cfg = readJSON(el);
  el.classList.add('ix');
  const key = `capstone-gate-${cfg.level}`;
  const saved = store.get('checklists', key) || {};
  const st = {
    reqs: cfg.requirements.map((_, i) => Boolean((saved.reqs || [])[i])),
    scores: cfg.rubric.map((_, i) => (saved.scores || [])[i] || ''),
    evidence: saved.evidence || '',
    reviewed: Boolean(saved.reviewed),
  };
  const badge = h('div', { class: 'feedback bad', 'aria-live': 'polite' });
  const out = h('pre', { class: 'sim-out', tabindex: '0', 'aria-label': 'Review pack' });
  const persist = () => {
    store.set('checklists', key, st);
    const s = status(st);
    store.set('capstones', String(cfg.level), s === 'Not started' ? undefined : s);
    return s;
  };
  const NEXT = { 'Not started': 'Begin with the first milestone.', 'In progress': 'To be ready: tick every requirement, score every criterion at Meets or better, and add evidence.', 'Ready for review': 'Ready. Ask a colleague to review your evidence against the rubric.', Reviewed: 'Reviewed. Well done on completing this gate.' };
  const paint = () => {
    const s = persist();
    badge.className = `feedback ${s === 'Ready for review' || s === 'Reviewed' ? 'good' : 'cap-status'}`;
    badge.textContent = `Status: ${s}. ${NEXT[s]}`;
    out.textContent = pack(cfg, st);
  };
  const reqList = h('div', { class: 'cap-reqs' }, ...cfg.requirements.map((r, i) => { const b = h('input', { type: 'checkbox' }); b.checked = st.reqs[i]; b.addEventListener('change', () => { st.reqs[i] = b.checked; paint(); }); return h('label', {}, b, ` ${r}`); }));
  const rows = cfg.rubric.map((r, i) => {
    const s = h('select', { class: 'sim-input', 'aria-label': `Score for ${r.name}` }, ...SCALE.map((v) => h('option', { value: v }, v || 'Choose')));
    s.value = st.scores[i];
    s.addEventListener('input', () => { st.scores[i] = s.value; paint(); });
    return h('tr', {}, h('th', { scope: 'row' }, r.name), h('td', {}, r.notYet), h('td', {}, r.meets), h('td', {}, r.exceeds), h('td', {}, s));
  });
  const eId = uid('cap');
  const evidence = h('textarea', { id: eId, class: 'sim-text', rows: '5', placeholder: 'Links to your site, repository, pull requests and reports' }, st.evidence);
  evidence.addEventListener('input', () => { st.evidence = evidence.value; paint(); });
  const reviewed = h('input', { type: 'checkbox' }); reviewed.checked = st.reviewed;
  reviewed.addEventListener('change', () => { st.reviewed = reviewed.checked; paint(); });
  const copy = h('button', { type: 'button', class: 'btn small' }, 'Copy review pack');
  const copied = h('span', { class: 'ix-note', 'aria-live': 'polite', style: 'margin-left:10px' });
  copy.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(out.textContent); copied.textContent = 'Copied.'; } catch (e) { copied.textContent = 'Copy failed. Select the text instead.'; }
  });
  el.append(
    h('div', { class: 'ix-head' }, h('div', {}, h('div', { class: 'ix-kind' }, 'Self-assessment'), h('h3', {}, el.dataset.title || 'Capstone self-assessment'))),
    h('h4', {}, 'Requirements'), reqList,
    h('h4', {}, 'Rubric'),
    h('div', { class: 'table-wrap' }, h('table', { class: 't cap-rubric' }, h('thead', {}, h('tr', {}, ...['Criterion', 'Not yet', 'Meets', 'Exceeds', 'Your score'].map((x) => h('th', {}, x)))), h('tbody', {}, ...rows))),
    h('label', { for: eId, class: 'sim-label', style: 'margin-top:14px' }, 'Evidence'), evidence,
    h('p', { class: 'ix-note' }, 'Saved only in this browser. Do not paste passwords, API keys or tokens.'),
    h('div', { class: 'sim-checks' }, h('label', {}, reviewed, ' A colleague has reviewed my evidence against this rubric')),
    badge,
    h('h4', {}, 'Review pack'), out,
    h('div', { style: 'margin-top:8px' }, copy, copied),
  );
  paint();
}
