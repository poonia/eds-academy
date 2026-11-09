/* Responsive image explorer: shows which rendition the boilerplate's default picture serves.
   Breakpoints follow createOptimizedPicture in aem.js: 2000 at min-width 600px, otherwise 750. */
export function rendition(viewport, webp, ext = 'jpeg') {
  const width = viewport >= 600 ? 2000 : 750;
  const format = webp ? 'webply' : ext;
  return { width, format, url: `./media_1a2b3c.${ext === 'jpeg' ? 'jpg' : ext}?width=${width}&format=${format}&optimize=medium` };
}

export default function imageExplorer(el, { h, uid }) {
  el.classList.add('ix');
  const sliderId = uid('ie');
  const slider = h('input', { id: sliderId, type: 'range', min: '320', max: '1600', step: '10', value: '390' });
  const webp = h('input', { type: 'checkbox', checked: 'checked' });
  const lcp = h('input', { type: 'checkbox' });
  const value = h('output', { for: sliderId });
  const frame = h('div', { class: 'ie-frame', 'aria-hidden': 'true' }, h('div', { class: 'ie-bar' }));
  const url = h('pre', { class: 'sim-out', tabindex: '0', 'aria-label': 'Selected image request' });
  const note = h('div', { class: 'feedback good', 'aria-live': 'polite' });
  const paint = () => {
    const vw = Number(slider.value); const r = rendition(vw, webp.checked);
    value.textContent = `${vw} px wide`;
    frame.style.width = `${Math.round((vw / 1600) * 100)}%`;
    frame.firstChild.textContent = `${r.width} px rendition`;
    url.textContent = `<img src="${r.url}"\n     alt="Advisor with a client"\n     loading="${lcp.checked ? 'eager' : 'lazy'}">`;
    note.textContent = `${vw >= 600 ? 'At 600 px and wider' : 'Below 600 px'} the default picture requests the ${r.width} px rendition${webp.checked ? ' as WebP' : ' in its original format, the fallback for browsers without WebP'}. ${lcp.checked ? 'The first image loads eagerly because it is often the LCP element.' : 'Images load lazily by default.'} Resizing the image in your document does not change any of this.`;
  };
  [slider, webp, lcp].forEach((c) => c.addEventListener('input', paint));
  el.append(
    h('div', { class: 'ix-head' }, h('div', {}, h('div', { class: 'ix-kind' }, 'Explorer'), h('h3', {}, el.dataset.title || 'Responsive image explorer'))),
    h('label', { for: sliderId, class: 'sim-label' }, 'Viewport width: ', value), slider, frame,
    h('div', { class: 'sim-checks' }, h('label', {}, webp, ' Browser supports WebP'), h('label', {}, lcp, ' This is the first image on the page')),
    url, note,
  );
  paint();
}
