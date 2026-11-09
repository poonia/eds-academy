/* Exam: draws a fresh paper from data/exam-bank.json, marks it at the end, and shows
   what to review by module. Self-assessment only: answers ship to the browser.
   <div data-component="exam" data-scope="1|2|3|4|final"></div>
   Settings (questions drawn, pass mark, suggested minutes) come from syllabus.exams. */
const mix = (arr, rng) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i -= 1) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

export function poolFor(bank, modules, scope, track) {
  const byId = new Map(modules.map((m) => [m.id, m]));
  return bank.filter((q) => {
    const m = byId.get(q.m);
    if (!m || (track !== 'all' && !m.tracks.includes(track))) return false;
    if (q.scope !== undefined) return scope === 'final' || q.scope === scope;
    return scope === 'final' || (scope >= m.levels[0] && scope <= m.levels[1]);
  });
}

/* Up to a third scenarios written for exams; the rest spread evenly across modules. */
export function drawExam(pool, count, rng = Math.random) {
  const written = mix(pool.filter((q) => q.scope !== undefined), rng).slice(0, Math.ceil(count / 3));
  const groups = new Map();
  mix(pool.filter((q) => q.scope === undefined), rng).forEach((q) => { if (!groups.has(q.m)) groups.set(q.m, []); groups.get(q.m).push(q); });
  const paper = [...written]; const lists = mix([...groups.values()], rng);
  for (let i = 0; paper.length < count && lists.some((l) => l.length); i += 1) {
    const list = lists[i % lists.length];
    if (list.length) paper.push(list.pop());
  }
  return mix(paper, rng).map((q) => {
    const order = mix(q.options.map((_, i) => i), rng);
    const where = new Map(order.map((old, pos) => [old, pos]));
    return { ...q, options: order.map((i) => q.options[i]), answer: Array.isArray(q.answer) ? q.answer.map((a) => where.get(a)).sort((a, b) => a - b) : where.get(q.answer) };
  });
}

export function isRight(q, chosen) {
  const want = Array.isArray(q.answer) ? q.answer : [q.answer];
  return chosen.length === want.length && want.every((a) => chosen.includes(a));
}

export function mark(paper, answers, passMark) {
  const byModule = new Map();
  let score = 0;
  paper.forEach((q, i) => {
    const ok = isRight(q, answers[i] || []);
    if (ok) score += 1;
    const row = byModule.get(q.m) || { m: q.m, right: 0, total: 0 };
    row.total += 1; if (ok) row.right += 1;
    byModule.set(q.m, row);
  });
  const pct = paper.length ? Math.round((score / paper.length) * 100) : 0;
  return { score, total: paper.length, pct, passed: pct >= passMark, modules: [...byModule.values()].sort((a, b) => (a.right / a.total) - (b.right / b.total) || a.m.localeCompare(b.m)) };
}

export default async function exam(el, { h, syl, store, href, uid }) {
  const raw = el.dataset.scope;
  const scope = raw === 'final' ? 'final' : Number(raw);
  const cfg = syl.exams.find((x) => x.scope === scope);
  el.classList.add('ix');
  const body = h('div');
  el.append(h('div', { class: 'ix-head' }, h('div', {}, h('div', { class: 'ix-kind' }, 'Self-assessment'), h('h3', {}, cfg.title))), body);
  let bank;
  try {
    const res = await fetch(href('data/exam-bank.json'));
    if (!res.ok) throw new Error(String(res.status));
    bank = (await res.json()).questions;
  } catch (e) { body.append(h('p', { class: 'feedback bad' }, 'The question bank could not be loaded. Check your connection and reload.')); return; }

  const saveKey = `exam-${raw}`;
  const best = () => store.get('quizzes', saveKey);
  const link = (id) => { const m = syl.byId[id]; return h('a', { href: href(m.page) }, `${m.id} ${m.name}`); };

  const showStart = () => {
    const tracks = Object.entries(syl.tracks).filter(([k]) => poolFor(bank, syl.modules, scope, k).length >= 20);
    const id = uid('ex');
    const track = h('select', { id, class: 'sim-input' }, h('option', { value: 'all' }, 'All tracks'), ...tracks.map(([k, t]) => h('option', { value: k }, t.name)));
    const start = h('button', { type: 'button', class: 'btn primary' }, 'Start exam');
    const info = h('p', { 'aria-live': 'polite' });
    const paint = () => { const n = Math.min(cfg.draw, poolFor(bank, syl.modules, scope, track.value).length); info.textContent = `${n} questions, a pass mark of ${cfg.pass}%, and about ${cfg.minutes} minutes. There is no time limit.`; };
    track.addEventListener('input', paint);
    start.addEventListener('click', () => {
      const pool = poolFor(bank, syl.modules, scope, track.value);
      showPaper(drawExam(pool, cfg.draw), track.value);
    });
    const b = best();
    body.replaceChildren(
      h('div', { style: 'max-width:320px' }, h('label', { for: id, class: 'sim-label' }, 'Your track'), track),
      info,
      b ? h('p', { class: 'ix-note' }, `Your best score: ${b.pct}% (${b.passed ? 'pass' : 'not yet a pass'}).`) : null,
      start,
    );
    paint();
  };

  const showPaper = (paper, track) => {
    const answers = paper.map(() => []);
    const status = h('p', { class: 'ex-status', 'aria-live': 'polite' });
    const paint = () => { const done = answers.filter((a) => a.length).length; status.textContent = `${done} of ${paper.length} answered`; };
    const list = paper.map((q, qi) => {
      const multi = Array.isArray(q.answer); const name = uid('ex'); const pid = uid('exp');
      const opts = h('div', { class: 'q-opts', role: multi ? 'group' : 'radiogroup', 'aria-labelledby': pid });
      q.options.forEach((o, oi) => {
        const input = h('input', { type: multi ? 'checkbox' : 'radio', name, value: String(oi) });
        input.addEventListener('change', () => { answers[qi] = [...opts.querySelectorAll('input:checked')].map((x) => Number(x.value)); paint(); });
        opts.append(h('label', { class: 'q-opt' }, input, h('span', {}, o)));
      });
      return h('div', { class: 'q' }, h('div', { class: 'q-prompt', id: pid }, h('span', { class: 'qn' }, `Q${qi + 1}`), h('span', {}, q.q)), opts);
    });
    const warn = h('div', { 'aria-live': 'polite' });
    const submit = h('button', { type: 'button', class: 'btn primary' }, 'Finish and mark');
    let warned = false;
    submit.addEventListener('click', () => {
      const left = answers.filter((a) => !a.length).length;
      if (left && !warned) { warned = true; warn.className = 'feedback bad'; warn.textContent = `${left} question${left === 1 ? ' is' : 's are'} unanswered and will be marked wrong. Select Finish and mark again to continue.`; return; }
      showResult(paper, answers, track);
    });
    body.replaceChildren(status, ...list, warn, h('div', { style: 'margin-top:12px' }, submit));
    paint();
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 90 });
  };

  const showResult = (paper, answers, track) => {
    const r = mark(paper, answers, cfg.pass);
    const old = best();
    if (!old || r.pct > old.pct) store.set('quizzes', saveKey, { score: r.score, total: r.total, pct: r.pct, passed: r.passed, track, at: Date.now() });
    const title = h('h3', { tabindex: '-1', class: 'ex-result' }, `${r.pct}%: ${r.score} of ${r.total} correct`);
    const weak = r.modules.filter((x) => x.right < x.total);
    const review = paper.map((q, i) => ({ q, i })).filter(({ q, i }) => !isRight(q, answers[i] || []));
    const answerText = (q) => (Array.isArray(q.answer) ? q.answer : [q.answer]).map((a) => q.options[a]).join('; ');
    const again = h('button', { type: 'button', class: 'btn' }, 'Take a new paper');
    again.addEventListener('click', showStart);
    body.replaceChildren(
      title,
      h('div', { class: `feedback ${r.passed ? 'good' : 'bad'}` }, r.passed ? `Pass. The mark needed was ${cfg.pass}%. This is a self-assessment, not a certificate.` : `Not yet. The mark needed was ${cfg.pass}%. Review the modules below, and take a new paper.`),
      weak.length ? h('h4', {}, 'What to review') : null,
      weak.length ? h('div', { class: 'table-wrap' }, h('table', { class: 't' }, h('thead', {}, h('tr', {}, h('th', {}, 'Module'), h('th', {}, 'Correct'))), h('tbody', {}, ...weak.map((x) => h('tr', {}, h('td', {}, link(x.m)), h('td', {}, `${x.right} of ${x.total}`)))))) : null,
      review.length ? h('h4', {}, 'Questions you missed') : null,
      ...review.map(({ q, i }) => h('div', { class: 'q' }, h('div', { class: 'q-prompt' }, h('span', { class: 'qn' }, `Q${i + 1}`), h('span', {}, q.q)), h('p', {}, h('b', {}, 'Answer: '), answerText(q)), h('p', { class: 'ix-note' }, q.explain))),
      h('div', { style: 'margin-top:12px' }, again),
    );
    title.focus();
  };
  showStart();
}
