/* Working tabs, accordion and carousel that follow the ARIA Authoring Practices.
   Use the keyboard: the panel lists the keys and what each pattern exposes. */
export function nextIndex(key, i, n) {
  if (key === 'ArrowRight') return (i + 1) % n;
  if (key === 'ArrowLeft') return (i - 1 + n) % n;
  if (key === 'Home') return 0;
  if (key === 'End') return n - 1;
  return i;
}

export default function a11yDemos(el, { h, uid }) {
  el.classList.add('ix');
  const NAMES = ['Overview', 'Rates', 'Fees'];
  const TEXT = ['Plain overview of this account.', 'Rates change with the market.', 'There is no monthly fee.'];
  const base = uid('tab');
  const panels = NAMES.map((n, i) => { const p = h('div', { role: 'tabpanel', id: `${base}-p${i}`, 'aria-labelledby': `${base}-t${i}`, tabindex: '0', class: 'ad-panel' }, TEXT[i]); p.hidden = i !== 0; return p; });
  const tabs = NAMES.map((n, i) => h('button', { type: 'button', role: 'tab', id: `${base}-t${i}`, 'aria-controls': `${base}-p${i}`, 'aria-selected': String(i === 0), tabindex: i === 0 ? '0' : '-1', class: 'chip' }, n));
  const select = (i, focus) => {
    tabs.forEach((t, j) => { t.setAttribute('aria-selected', String(j === i)); t.tabIndex = j === i ? 0 : -1; panels[j].hidden = j !== i; });
    if (focus) tabs[i].focus();
  };
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => select(i));
    t.addEventListener('keydown', (e) => { const n = nextIndex(e.key, i, tabs.length); if (n !== i || e.key === 'Home' || e.key === 'End') { e.preventDefault(); select(n, true); } });
  });
  select(0);

  const accordion = h('div', {}, ...['What can I deposit?', 'When can I withdraw?'].map((q, i) => h('details', { class: 'ad-acc' }, h('summary', {}, q), h('p', {}, i ? 'At any time, without a fee.' : 'Cheques and transfers.'))));

  const SLIDES = ['Save with a plan', 'Borrow with confidence', 'Invest for later'];
  let at = 0;
  const label = h('p', { class: 'ad-slide', 'aria-live': 'polite', 'aria-atomic': 'true' });
  const show = () => { label.textContent = `Slide ${at + 1} of ${SLIDES.length}: ${SLIDES[at]}`; };
  const go = (d) => { at = (at + d + SLIDES.length) % SLIDES.length; show(); };
  const prev = h('button', { type: 'button', class: 'btn small' }, 'Previous slide'); const next = h('button', { type: 'button', class: 'btn small' }, 'Next slide');
  prev.addEventListener('click', () => go(-1)); next.addEventListener('click', () => go(1));
  show();
  const carousel = h('section', { 'aria-roledescription': 'carousel', 'aria-label': 'Featured products' }, label, h('div', { class: 'sim-checks' }, prev, next));

  const part = (title, body, keys) => h('div', { class: 'ad-part' }, h('h4', {}, title), body, h('p', { class: 'ix-note' }, keys));
  el.append(
    h('div', { class: 'ix-head' }, h('div', {}, h('div', { class: 'ix-kind' }, 'Demos'), h('h3', {}, el.dataset.title || 'Accessible patterns'))),
    part('Tabs', h('div', {}, h('div', { role: 'tablist', 'aria-label': 'Account details', class: 'sim-checks' }, ...tabs), ...panels), 'Tab moves into the set. Left and Right arrows change tab. Home and End jump. Only the current tab is in the Tab order.'),
    part('Accordion', accordion, 'Built on native details and summary. Enter or Space toggles, and browsers announce the state.'),
    part('Carousel', carousel, 'It never moves on its own. Buttons are real buttons, and the change is announced by a live region.'),
  );
}
