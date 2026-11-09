/* Tabs: before/after code, side-by-side options.
   <div data-component="tabs"><div data-tab="Before">...</div><div data-tab="After">...</div></div> */
export default function tabs(el, { h, uid }) {
  const panels = Array.from(el.querySelectorAll(':scope > [data-tab]'));
  if (!panels.length) return;
  el.classList.add('tabs-ui');
  const list = h('div', { class: 'tablist', role: 'tablist', 'aria-label': el.dataset.label || 'Views' });
  const tabsEls = panels.map((p, i) => {
    const pid = p.id || uid('tp'); const tid = uid('tb'); p.id = pid;
    p.setAttribute('role', 'tabpanel'); p.setAttribute('aria-labelledby', tid); p.tabIndex = 0;
    const t = h('button', { role: 'tab', id: tid, type: 'button', 'aria-controls': pid }, p.dataset.tab);
    t.addEventListener('click', () => sel(i));
    t.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); const j = (i + (e.key === 'ArrowRight' ? 1 : panels.length - 1)) % panels.length; sel(j); tabsEls[j].focus(); }
    });
    list.append(t); return t;
  });
  function sel(i) { tabsEls.forEach((t, k) => { t.setAttribute('aria-selected', String(k === i)); t.tabIndex = k === i ? 0 : -1; }); panels.forEach((p, k) => { p.hidden = k !== i; }); }
  el.prepend(list); sel(0);
}
