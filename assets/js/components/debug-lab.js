/* Debug case: a symptom, evidence to open one piece at a time, then a diagnosis.
   JSON: {"symptom":"…","clues":[{"label":"Network panel","kind":"table","head":["URL","Status"],"rows":[[…]]},
          {"label":"Console","kind":"text","body":"…"}],
          "question":"…","options":["…"],"answer":0,"explain":"…","fix":"…","fixLang":"javascript"} */
export default function debugLab(el, { h, readJSON, store, uid, enhance }) {
  const cfg = readJSON(el);
  const id = el.dataset.id || uid('dbg');
  const key = `debug:${id}`;
  const clues = cfg.clues || [];
  const opened = new Set();
  el.classList.add('ix', 'debug-lab');
  const counter = h('span', { class: 'q-score', 'aria-live': 'polite' }, `0 of ${clues.length} clues opened`);

  const clueEls = clues.map((c, i) => {
    let body;
    if (c.kind === 'table') {
      body = h('div', { class: 'table-wrap' }, h('table', { class: 't' },
        h('thead', {}, h('tr', {}, ...c.head.map((x) => h('th', {}, x)))),
        h('tbody', {}, ...c.rows.map((r) => h('tr', {}, ...r.map((x) => h('td', {}, x)))))));
    } else {
      body = h('pre', { class: 'sim-out', tabindex: '0', 'aria-label': c.label });
      body.textContent = c.body;
    }
    const d = h('details', { class: 'dbg-clue' }, h('summary', {}, c.label), c.note ? h('p', { class: 'ix-note' }, c.note) : null, body);
    d.addEventListener('toggle', () => { if (d.open) { opened.add(i); counter.textContent = `${opened.size} of ${clues.length} clues opened`; } });
    return d;
  });

  const name = uid('dbg');
  const promptId = uid('dbgq');
  const inputs = (cfg.options || []).map((o, oi) => {
    const input = h('input', { type: 'radio', name, value: String(oi) });
    const mark = h('span', { class: 'mark', 'aria-hidden': 'true' });
    return { input, mark, lab: h('label', { class: 'q-opt' }, input, h('span', {}, o), mark) };
  });
  const check = h('button', { type: 'button', class: 'btn primary small', style: 'margin-top:10px' }, 'Check diagnosis');
  const fb = h('div', { 'aria-live': 'polite' });
  const fixBox = h('div', { hidden: true });
  if (cfg.fix) {
    const pre = h('pre', { class: 'sim-out', tabindex: '0', 'aria-label': 'The fix' });
    pre.textContent = cfg.fix;
    fixBox.append(h('div', { class: 'sim-label', style: 'margin-top:12px' }, 'The fix'), pre);
  }
  check.addEventListener('click', () => {
    const chosen = inputs.findIndex((x) => x.input.checked);
    if (chosen < 0) { fb.className = 'feedback bad'; fb.textContent = 'Choose a diagnosis first.'; return; }
    const ok = chosen === cfg.answer;
    inputs.forEach((x, i) => {
      x.lab.classList.remove('correct', 'wrong'); x.mark.textContent = '';
      if (ok && i === cfg.answer) { x.lab.classList.add('correct'); x.mark.textContent = 'Correct'; }
      if (!ok && i === chosen) { x.lab.classList.add('wrong'); x.mark.textContent = 'Not this'; }
    });
    fb.className = `feedback ${ok ? 'good' : 'bad'}`;
    fb.innerHTML = '';
    if (ok) {
      fb.append(h('strong', {}, `Solved, using ${opened.size} of ${clues.length} clues.`), cfg.explain || '');
      fixBox.hidden = false;
      store.set('labs', key, { passed: true, clues: opened.size });
    } else {
      fb.append(h('strong', {}, 'Not quite.'), opened.size < clues.length ? 'Open another clue and look again.' : 'Compare each clue with what you expected to see.');
    }
  });

  const prev = store.get('labs', key);
  const symptom = h('div', {}, h('aside', { class: 'callout warning', 'data-label': 'Symptom' }, h('p', {}, cfg.symptom || '')));
  el.append(
    h('div', { class: 'ix-head' }, h('div', {}, h('div', { class: 'ix-kind' }, 'Debug case'), h('h3', {}, el.dataset.title || 'Find the cause')), counter),
    symptom,
    h('p', { class: 'ix-note' }, 'Open only the evidence you need. Fewer clues is better, as it is in real debugging.'),
    h('div', { class: 'dbg-clues' }, ...clueEls),
    h('div', { class: 'q', style: 'margin-top:14px' },
      h('div', { class: 'q-prompt', id: promptId }, h('span', {}, cfg.question || 'What is the cause?')),
      h('div', { class: 'q-opts', role: 'radiogroup', 'aria-labelledby': promptId }, ...inputs.map((x) => x.lab)),
      check, fb, fixBox),
    prev ? h('p', { class: 'ix-note' }, `Solved before, using ${prev.clues} of ${clues.length} clues.`) : null,
  );
  if (enhance) enhance(symptom);
}
