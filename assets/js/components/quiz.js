/* Quiz engine: single and multiple choice, scenario questions, instant feedback.
   Authoring:
   <div data-component="quiz" data-id="a1-check" data-variant="check|ready|inline" data-title="...">
     <script type="application/json">{"questions":[{"q":"...","options":["..."],"answer":1,
       "explain":"...","scenario":false}]}</script>
   </div>
   "answer" is an index, or an array of indexes for multiple choice. */
export default function quiz(el, { h, readJSON, store, uid }) {
  const data = readJSON(el);
  const qs = data.questions || [];
  const variant = el.dataset.variant || 'check';
  const id = el.dataset.id || uid('quiz');
  const kind = { check: 'Knowledge check', ready: 'Ready? Self-check', inline: 'Check yourself' }[variant] || 'Quiz';
  el.classList.add('ix');
  const scoreEl = h('span', { class: 'q-score', 'aria-live': 'polite' });
  const heading = h('div', {}, h('div', { class: 'ix-kind' }, kind), el.dataset.title ? h('h3', {}, el.dataset.title) : null);
  const score = qs.length > 1 ? scoreEl : null;
  // The pre-module self-check is optional, so it starts collapsed on every page load.
  const collapsible = variant === 'ready';
  const root = collapsible ? h('details', { class: 'q-fold' }) : el;
  root.append(collapsible
    ? h('summary', { class: 'ix-head' }, heading, h('span', { class: 'q-fold-side' }, score, h('span', { class: 'q-fold-icon', 'aria-hidden': 'true' })))
    : h('div', { class: 'ix-head' }, heading, score));
  if (collapsible) el.append(root);
  const results = new Array(qs.length).fill(null);
  const paintScore = () => {
    const answered = results.filter((r) => r !== null).length;
    const right = results.filter((r) => r === true).length;
    scoreEl.textContent = `${right} / ${qs.length} correct${answered < qs.length ? ` · ${qs.length - answered} to go` : ''}`;
    if (answered === qs.length && variant !== 'inline') {
      store.set('quizzes', id, { score: right, total: qs.length, at: Date.now() });
      summary.hidden = false;
      summary.className = `feedback ${right === qs.length ? 'good' : 'bad'}`;
      summary.innerHTML = variant === 'ready'
        ? (right === qs.length ? '<strong>Ready.</strong>You have what this module builds on.' : '<strong>Worth a quick review first.</strong>Open the linked prerequisite modules above, or carry on and come back if something feels unfamiliar.')
        : `<strong>${right} of ${qs.length} correct.</strong>${right === qs.length ? 'Nicely done. Your score is saved.' : 'Review the explanations, then retry. Your best attempt is the one saved most recently.'}`;
    }
  };
  qs.forEach((q, qi) => {
    const multi = Array.isArray(q.answer);
    const answer = new Set(multi ? q.answer : [q.answer]);
    const name = uid('q');
    const box = h('div', { class: 'q' });
    const promptId = uid('qp');
    box.append(h('div', { class: 'q-prompt', id: promptId }, qs.length > 1 ? h('span', { class: 'qn' }, `Q${qi + 1}`) : null, h('span', {}, q.q, q.scenario ? h('span', { class: 'q-scenario' }, 'Scenario') : null, multi ? h('span', { class: 'muted', style: 'font-weight:400;font-size:14px' }, ' (choose all that apply)') : null)));
    const opts = h('div', { class: 'q-opts', role: multi ? 'group' : 'radiogroup', 'aria-labelledby': promptId });
    const inputs = [];
    q.options.forEach((o, oi) => {
      const input = h('input', { type: multi ? 'checkbox' : 'radio', name, value: String(oi) });
      const mark = h('span', { class: 'mark', 'aria-hidden': 'true' });
      const lab = h('label', { class: 'q-opt' }, input, h('span', {}, o), mark);
      inputs.push({ input, lab, mark, oi });
      opts.append(lab);
    });
    box.append(opts);
    const fb = h('div', { 'aria-live': 'polite' });
    const check = () => {
      const chosen = new Set(inputs.filter((x) => x.input.checked).map((x) => x.oi));
      if (!chosen.size) return;
      const ok = chosen.size === answer.size && [...chosen].every((c) => answer.has(c));
      inputs.forEach((x) => {
        x.lab.classList.remove('correct', 'wrong'); x.mark.textContent = '';
        if (answer.has(x.oi)) { x.lab.classList.add('correct'); x.mark.textContent = 'Correct'; }
        else if (chosen.has(x.oi)) { x.lab.classList.add('wrong'); x.mark.textContent = 'Not this'; }
      });
      fb.className = `feedback ${ok ? 'good' : 'bad'}`;
      fb.innerHTML = '';
      fb.append(h('strong', {}, ok ? 'Correct.' : 'Not quite.'), q.explain || '');
      results[qi] = ok; paintScore();
    };
    if (multi) {
      const btn = h('button', { class: 'btn small', type: 'button', style: 'margin-top:10px' }, 'Check answer');
      btn.addEventListener('click', check);
      box.append(btn);
    } else inputs.forEach((x) => x.input.addEventListener('change', check));
    box.append(fb);
    root.append(box);
  });
  const summary = h('div', { hidden: true, 'aria-live': 'polite' });
  const retry = h('button', { class: 'btn small', type: 'button' }, 'Retry');
  retry.addEventListener('click', () => {
    el.querySelectorAll('input').forEach((i) => { i.checked = false; });
    el.querySelectorAll('.q-opt').forEach((l) => l.classList.remove('correct', 'wrong'));
    el.querySelectorAll('.q-opt .mark').forEach((m) => { m.textContent = ''; });
    el.querySelectorAll('.q > [aria-live]').forEach((f) => { f.className = ''; f.innerHTML = ''; });
    results.fill(null); summary.hidden = true; paintScore();
  });
  if (variant !== 'inline') {
    const prev = store.get('quizzes', id);
    root.append(summary, h('div', { class: 'ix-foot' }, retry, prev ? h('span', { class: 'ix-note' }, `Last saved score: ${prev.score}/${prev.total}`) : null));
  }
  if (qs.length > 1) paintScore();
}
