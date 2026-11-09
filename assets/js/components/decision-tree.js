/* Decision tree: answer questions, reach a recommendation with reasons.
   JSON: {"start":"q1","nodes":{"q1":{"q":"...","options":[{"label":"...","hint":"...","next":"q2"}]},
          "r1":{"result":"...","why":"...","link":"#anchor","linkText":"..."}}} */
export default function decisionTree(el, { h, readJSON }) {
  const data = readJSON(el);
  const nodes = data.nodes || {};
  let path = [];
  el.classList.add('ix');
  const trail = h('div', { class: 'dt-trail', 'aria-label': 'Your answers so far' });
  const stage = h('div', { 'aria-live': 'polite' });
  const back = h('button', { class: 'btn small', type: 'button' }, '← Back');
  const restart = h('button', { class: 'btn small ghost', type: 'button' }, 'Start over');
  const render = (focus) => {
    const curId = path.length ? path[path.length - 1].next : data.start;
    const node = nodes[curId];
    trail.innerHTML = '';
    path.forEach((p, i) => trail.append(h('span', {}, `${i + 1}. ${p.label}`)));
    stage.innerHTML = '';
    if (!node) return;
    if (node.result) {
      const box = h('div', { class: 'dt-result' }, h('div', { class: 'eyebrow' }, 'Recommendation'), h('h4', {}, node.result), h('p', {}, node.why || ''));
      if (node.link) box.append(h('a', { href: node.link }, node.linkText || 'Read more'));
      stage.append(box);
    } else {
      const q = h('p', { class: 'dt-q', tabindex: '-1' }, node.q);
      const opts = h('div', { class: 'dt-opts' });
      node.options.forEach((o) => { const b = h('button', { class: 'dt-opt', type: 'button' }, h('span', {}, o.label), o.hint ? h('small', {}, o.hint) : null); b.addEventListener('click', () => { path.push(o); render(true); }); opts.append(b); });
      stage.append(q, opts);
      if (focus) q.focus();
    }
    back.disabled = !path.length; restart.disabled = !path.length;
    if (focus && node.result) stage.querySelector('h4').setAttribute('tabindex', '-1'), stage.querySelector('h4').focus();
  };
  back.addEventListener('click', () => { path.pop(); render(true); });
  restart.addEventListener('click', () => { path = []; render(true); });
  el.append(h('div', { class: 'ix-head' }, h('div', {}, h('div', { class: 'ix-kind' }, 'Decision tree'), h('h3', {}, el.dataset.title || data.title || 'Find your answer'))), trail, stage, h('div', { class: 'ix-foot' }, back, restart));
  render(false);
}
