/* Scorer: answer questions, see a live verdict and the reasons behind it.
   JSON: {"questions":[{"q":"...","options":[{"label":"...","score":2,"note":"..."}]}],
          "bands":[{"min":0,"verdict":"...","text":"..."}]}  (bands sorted by min ascending) */
export default function scorer(el, { h, readJSON, uid }) {
  const data = readJSON(el);
  const qs = data.questions || [];
  const bands = (data.bands || []).slice().sort((a, b) => a.min - b.min);
  const maxScore = qs.reduce((s, q) => s + Math.max(...q.options.map((o) => o.score)), 0);
  const minScore = qs.reduce((s, q) => s + Math.min(...q.options.map((o) => o.score)), 0);
  el.classList.add('ix');
  const list = h('div');
  const picks = new Array(qs.length).fill(null);
  qs.forEach((q, qi) => {
    const name = uid('sc');
    const opts = h('div', { class: 'sc-opts' });
    q.options.forEach((o, oi) => {
      const input = h('input', { type: 'radio', name, value: String(oi) });
      input.addEventListener('change', () => { picks[qi] = oi; paint(); });
      opts.append(h('label', {}, input, o.label));
    });
    list.append(h('div', { class: 'sc-q' }, h('fieldset', {}, h('legend', {}, `${qi + 1}. ${q.q}`), opts)));
  });
  const pin = h('span');
  const verdict = h('div', { class: 'sc-verdict' });
  const text = h('p', { style: 'margin:4px 0 0;font-size:15px' });
  const reasons = h('ul', { class: 'sc-reasons' });
  const answered = h('span', { class: 'ix-note' });
  const result = h('div', { class: 'sc-result', 'aria-live': 'polite' }, h('div', { class: 'sc-gauge' }, h('div', { class: 'sc-bar', 'aria-hidden': 'true' }, pin), answered), verdict, text, reasons);
  function paint() {
    const n = picks.filter((p) => p !== null).length;
    const score = picks.reduce((s, p, i) => s + (p === null ? 0 : qs[i].options[p].score), 0);
    answered.textContent = `${n} of ${qs.length} answered`;
    const pct = maxScore === minScore ? 0.5 : (score - minScore) / (maxScore - minScore);
    pin.style.left = `${Math.round(pct * 100)}%`;
    if (!n) { verdict.textContent = 'Answer the questions to see a verdict.'; text.textContent = ''; reasons.innerHTML = ''; return; }
    const scaled = n === qs.length ? score : Math.round((score / n) * qs.length);
    const band = bands.filter((b) => scaled >= b.min).pop() || bands[0];
    verdict.textContent = `${band.verdict}${n < qs.length ? ' (so far)' : ''}`;
    text.textContent = band.text || '';
    reasons.innerHTML = '';
    picks.forEach((p, i) => { if (p !== null && qs[i].options[p].note) reasons.append(h('li', {}, qs[i].options[p].note)); });
  }
  el.append(h('div', { class: 'ix-head' }, h('div', {}, h('div', { class: 'ix-kind' }, 'Scorer'), h('h3', {}, el.dataset.title || data.title || 'Score it'))), data.intro ? h('p', { class: 'ix-note' }, data.intro) : null, list, result);
  paint();
}
