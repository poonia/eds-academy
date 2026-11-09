/* Hotspot tour: select regions of a mockup to reveal explanations.
   <div data-component="hotspots" data-title="...">
     <div class="hs-stage"> ...mockup... <div data-hotspot="Title" data-text="Explanation">...</div> </div>
   </div> */
export default function hotspots(el, { h }) {
  const targets = Array.from(el.querySelectorAll('[data-hotspot]'));
  if (!targets.length) return;
  el.classList.add('ix');
  const panel = h('div', { class: 'hs-panel', 'aria-live': 'polite' });
  let cur = -1;
  const show = (n) => {
    cur = (n + targets.length) % targets.length;
    targets.forEach((t, k) => { t.classList.toggle('active', k === cur); t.setAttribute('aria-pressed', String(k === cur)); });
    const t = targets[cur];
    panel.innerHTML = '';
    panel.append(h('div', { class: 'eyebrow' }, `Hotspot ${cur + 1} of ${targets.length}`), h('h4', {}, t.dataset.hotspot), h('p', {}, t.dataset.text || ''));
  };
  targets.forEach((t, k) => {
    t.classList.add('hs-target'); t.dataset.hsN = String(k + 1);
    t.setAttribute('role', 'button'); t.setAttribute('tabindex', '0'); t.setAttribute('aria-label', `${k + 1}. ${t.dataset.hotspot}`);
    t.addEventListener('click', (e) => { e.preventDefault(); show(k); });
    t.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); show(k); } });
  });
  panel.append(h('p', { class: 'muted' }, `Select a numbered area, or use the tour buttons. ${targets.length} hotspots.`));
  const prev = h('button', { class: 'btn small', type: 'button' }, '← Previous');
  const next = h('button', { class: 'btn small primary', type: 'button' }, 'Start tour →');
  prev.addEventListener('click', () => show(cur - 1));
  next.addEventListener('click', () => { show(cur + 1); next.textContent = 'Next →'; });
  el.prepend(h('div', { class: 'ix-head' }, h('div', {}, h('div', { class: 'ix-kind' }, 'Hotspot tour'), el.dataset.title ? h('h3', {}, el.dataset.title) : null)));
  el.append(panel, h('div', { class: 'ix-foot' }, prev, next));
}
