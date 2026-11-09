/* Step-through player: Next/Back through states of a flow, DOM or diagram.
   <div data-component="stepper" data-title="Publish flow">
     <div class="step" data-label="1. Author edits">...</div> ...
   </div> */
export default function stepper(el, { h }) {
  const steps = Array.from(el.querySelectorAll(':scope > .step'));
  if (!steps.length) return;
  let i = 0;
  el.classList.add('ix');
  const track = h('div', { class: 'st-track', role: 'group', 'aria-label': 'Jump to step' });
  const dots = steps.map((s, n) => { const d = h('button', { class: 'st-dot', type: 'button', 'aria-label': `Step ${n + 1}: ${s.dataset.label || ''}` }); d.addEventListener('click', () => go(n)); track.append(d); return d; });
  const count = h('span', { class: 'st-count', 'aria-live': 'polite' });
  const back = h('button', { class: 'btn small', type: 'button' }, '← Back');
  const next = h('button', { class: 'btn small primary', type: 'button' }, 'Next →');
  const stage = h('div', { class: 'st-stage' });
  steps.forEach((s) => { s.classList.add('st-step'); if (s.dataset.label) s.prepend(h('div', { class: 'st-label' }, s.dataset.label)); stage.append(s); });
  function go(n) {
    i = Math.max(0, Math.min(steps.length - 1, n));
    steps.forEach((s, k) => { s.hidden = k !== i; });
    dots.forEach((d, k) => { d.classList.toggle('on', k <= i); d.setAttribute('aria-current', k === i ? 'step' : 'false'); });
    count.textContent = `Step ${i + 1} of ${steps.length}`;
    back.disabled = i === 0; next.disabled = i === steps.length - 1;
  }
  back.addEventListener('click', () => go(i - 1));
  next.addEventListener('click', () => go(i + 1));
  el.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight' && !e.target.matches('input,select,textarea')) go(i + 1); if (e.key === 'ArrowLeft' && !e.target.matches('input,select,textarea')) go(i - 1); });
  el.append(h('div', { class: 'ix-head' }, h('div', {}, h('div', { class: 'ix-kind' }, 'Step through'), el.dataset.title ? h('h3', {}, el.dataset.title) : null), count), track, stage, h('div', { class: 'ix-foot' }, back, next));
  go(0);
}
