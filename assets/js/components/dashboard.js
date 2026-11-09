/* Home dashboard: continue card, learning paths with progress, capstone gates.
   <div data-component="dashboard" data-part="continue|paths|gates"></div> */
export default function dashboard(el, ctx) {
  const { h, syl, href, store, moduleProgress, modLink } = ctx;
  const part = el.dataset.part || 'continue';
  const paint = () => {
    el.innerHTML = '';
    if (part === 'continue') {
      const last = store.data.last && syl.byId[store.data.last];
      const firstOpen = syl.modules.find((m) => m.built && !moduleProgress(m).complete);
      const target = (last && last.built && !moduleProgress(last).complete) ? last : (firstOpen || syl.modules[0]);
      const p = moduleProgress(target);
      el.append(h('div', { class: 'card', style: 'display:grid;gap:10px' },
        h('div', { class: 'eyebrow' }, last ? 'Pick up where you left off' : 'Start your first module'),
        h('h2', { style: 'font-size:21px' }, `${target.id} · ${target.name}`),
        h('div', { class: 'meter', 'aria-hidden': 'true' }, h('span', { style: `width:${(p.done / p.total) * 100}%` })),
        h('span', { class: 'muted', style: 'font-size:14px' }, `${p.done} of ${p.total} topics done · about ${target.hours} hours`),
        h('div', { style: 'display:flex;gap:8px;flex-wrap:wrap' }, h('a', { class: 'btn primary', href: href(target.page) }, p.done ? 'Continue' : 'Start module'), h('a', { class: 'btn', href: href('start-here.html') }, 'How the course works'))));
    }
    if (part === 'paths') {
      const grid = h('div', { class: 'grid-3' });
      syl.paths.forEach((path) => {
        const flat = path.phases.flat();
        const mods = flat.map((id) => syl.byId[id]);
        const hours = mods.reduce((s, m) => s + m.hours, 0);
        const done = mods.filter((m) => moduleProgress(m).complete).length;
        const next = mods.find((m) => !moduleProgress(m).complete);
        const phases = h('ol', { style: 'margin:0;padding-left:1.2em;font-size:14px' });
        path.phases.forEach((ph, i) => phases.append(h('li', {}, h('b', {}, `L${i + 1}: `), ph.join(', '))));
        grid.append(h('div', { class: 'card', style: 'display:grid;gap:10px;align-content:start' },
          h('div', { class: 'eyebrow' }, `${flat.length} modules · ${hours} h`),
          h('h3', {}, `${path.name} path`), h('p', { class: 'muted', style: 'margin:0;font-size:14.5px' }, path.who),
          h('div', { class: 'meter', 'aria-hidden': 'true' }, h('span', { style: `width:${(done / flat.length) * 100}%` })),
          h('span', { class: 'muted', style: 'font-size:13.5px' }, `${done} of ${flat.length} modules complete`),
          next ? h('div', { style: 'font-size:14.5px' }, h('span', { class: 'muted' }, 'Next: '), modLink(next)) : h('b', {}, 'Path complete'),
          h('a', { class: 'btn', style: 'width:fit-content', href: href(path.page) }, 'Open path'),
          h('details', {}, h('summary', { style: 'cursor:pointer;font-size:14px;color:var(--accent);font-weight:700' }, 'Show the full order'), phases)));
      });
      el.append(grid);
    }
    if (part === 'gates') {
      const examLink = (scope, label) => {
        const x = syl.exams.find((e) => e.scope === scope);
        const best = store.get('quizzes', `exam-${scope}`);
        return h('a', { class: 'btn', href: href(x.page) }, best ? `${label}: best ${best.pct}%` : label);
      };
      const grid = h('div', { class: 'grid-3' });
      syl.gates.forEach((g) => {
        const feeds = syl.modules.filter((m) => m.levels[0] === g.level);
        const st = store.get('capstones', String(g.level));
        grid.append(h('div', { class: 'card', style: 'display:grid;gap:8px;align-content:start' },
          h('div', { class: 'eyebrow' }, `Level ${g.level} · ${syl.levels[g.level]}`),
          h('h3', {}, `Gate ${g.level}: ${g.title}`), h('p', { style: 'margin:0;font-size:15px' }, g.brief),
          h('span', { class: 'muted', style: 'font-size:13.5px' }, `${feeds.length} modules start at this level`),
          st ? h('span', { class: 'tag', style: 'width:fit-content' }, `Status: ${st}`) : null,
          h('div', { class: 'gate-actions' }, h('a', { class: 'btn', href: href(g.page) }, 'Open capstone'), examLink(g.level, `Level ${g.level} exam`))));
      });
      grid.append(h('div', { class: 'card', style: 'display:grid;gap:8px;align-content:start' },
        h('div', { class: 'eyebrow' }, 'All levels'), h('h3', {}, 'Final exam'), h('p', { style: 'margin:0;font-size:15px' }, 'Every module, with an emphasis on judgement across modules.'),
        h('div', { class: 'gate-actions' }, examLink('final', 'Final exam'))));
      el.append(grid);
    }
  };
  paint();
  document.addEventListener('academy:progress', paint);
}
