/* Design token editor and fallback-font layout shift demo.
   Shift figures are a teaching model based on text length and relative glyph width. */
export function lines(chars, perLine, widthFactor) {
  return Math.ceil((chars * widthFactor) / perLine);
}

export function shift(chars, perLine, factor, lineHeight) {
  return Math.abs(lines(chars, perLine, factor) - lines(chars, perLine, 1)) * lineHeight;
}

export default function tokenEditor(el, { h, uid }) {
  el.classList.add('ix');
  const cId = uid('te'); const sId = uid('te'); const rId = uid('te');
  const color = h('input', { id: cId, type: 'color', value: '#3b63fb' });
  const size = h('input', { id: sId, type: 'range', min: '14', max: '26', value: '18' });
  const radius = h('input', { id: rId, type: 'range', min: '0', max: '24', value: '8' });
  const css = h('pre', { class: 'sim-out', tabindex: '0', 'aria-label': 'CSS custom properties' });
  const sample = h('div', { class: 'te-sample' }, h('p', {}, 'Your savings, simplified.'), h('a', { class: 'te-button', href: '#signature' }, 'Compare accounts'));
  const adjust = h('input', { type: 'checkbox' });
  const result = h('div', { class: 'feedback bad', 'aria-live': 'polite' });
  const paint = () => {
    sample.style.setProperty('--link-color', color.value);
    sample.style.setProperty('--body-font-size-m', `${size.value}px`);
    sample.style.setProperty('--button-radius', `${radius.value}px`);
    css.textContent = `:root {\n  --link-color: ${color.value};\n  --body-font-size-m: ${size.value}px;\n  --button-radius: ${radius.value}px;\n}`;
    const px = shift(300, 62, adjust.checked ? 1 : 1.09, 28);
    result.className = `feedback ${px ? 'bad' : 'good'}`;
    result.textContent = px ? `When the web font arrives, a 300-character paragraph reflows and later content moves about ${px} px. That is layout shift.` : 'With size-adjust, the fallback takes up the same space as the web font, so swapping fonts moves nothing.';
  };
  [color, size, radius, adjust].forEach((c) => c.addEventListener('input', paint));
  el.append(
    h('div', { class: 'ix-head' }, h('div', {}, h('div', { class: 'ix-kind' }, 'Editor'), h('h3', {}, el.dataset.title || 'Design tokens'))),
    h('div', { class: 'sim-io' }, h('div', {}, h('label', { for: cId, class: 'sim-label' }, 'Link colour'), color, h('label', { for: sId, class: 'sim-label', style: 'margin-top:10px' }, 'Body size'), size, h('label', { for: rId, class: 'sim-label', style: 'margin-top:10px' }, 'Button radius'), radius), h('div', {}, sample, css)),
    h('div', { class: 'sim-checks', style: 'margin-top:14px' }, h('label', {}, adjust, ' Use a size-adjusted fallback font')), result,
    h('p', { class: 'ix-note' }, 'The shift figure is a simplified model, not a measurement.'),
  );
  paint();
}
