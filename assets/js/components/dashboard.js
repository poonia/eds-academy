/* Home dashboard: continue card, learning paths with progress, capstone gates.
   <div data-component="dashboard" data-part="continue|paths|gates"></div> */
const LINE_VAR = { author: 'au', developer: 'dev', lead: 'imp' };

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
      const line = syl.paths.find((x) => x.id === store.data.line) || syl.paths.find((x) => x.phases.flat().includes(target.id));
      el.append(h('div', { class: 'ticket' },
        h('div', { class: 'ticket-flag' }, last ? 'You are here' : 'Your first stop'),
        h('div', { class: 'ticket-body' },
          h('h2', {}, h('span', { class: 'mm-id' }, target.id), h('span', {}, target.name)),
          line ? h('span', { class: 'ticket-line', style: `--lc:var(--${LINE_VAR[line.id]}-line)` }, h('span', { class: 'mm-bullet', 'aria-hidden': 'true' }), `${line.name} line`) : null,
          h('div', { class: 'meter', 'aria-hidden': 'true' }, h('span', { style: `width:${(p.done / p.total) * 100}%` })),
          h('span', { class: 'muted', style: 'font-size:14px' }, `${p.done} of ${p.total} topics done · about ${target.hours} hours`),
          h('div', { style: 'display:flex;gap:8px;flex-wrap:wrap' }, h('a', { class: 'btn primary', href: href(target.page) }, p.done ? `Continue ${target.id}` : `Start ${target.id}`), h('a', { class: 'btn', href: href('start-here.html') }, 'How the course works')))));
    }
    if (part === 'paths') {
      const grid = h('div', { class: 'line-cards' });
      syl.paths.forEach((path) => {
        const flat = path.phases.flat();
        const mods = flat.map((id) => syl.byId[id]);
        const hours = mods.reduce((s, m) => s + m.hours, 0);
        const done = mods.filter((m) => moduleProgress(m).complete).length;
        const next = mods.find((m) => !moduleProgress(m).complete);
        const mine = store.data.line === path.id;
        const ride = h('button', { type: 'button', class: 'btn' }, mine ? 'Shown on the map' : 'Show on the map');
        ride.addEventListener('click', () => { store.data.line = path.id; store.save(); const map = document.getElementById('map'); if (map) map.scrollIntoView({ behavior: ctx.reducedMotion() ? 'auto' : 'smooth' }); });
        grid.append(h('article', { class: `line-card${mine ? ' mine' : ''}`, style: `--lc:var(--${LINE_VAR[path.id]}-line);--lt:var(--${LINE_VAR[path.id]})` },
          h('h3', {}, `${path.name} line`),
          h('p', { class: 'muted', style: 'margin:0;font-size:15px' }, path.who),
          h('div', { class: 'line-stats' }, h('span', {}, h('b', {}, String(flat.length)), ' stops'), h('span', {}, h('b', {}, String(hours)), ' hours'), h('span', {}, h('b', {}, String(done)), ' done')),
          h('div', { class: 'meter', 'aria-hidden': 'true' }, h('span', { style: `width:${(done / flat.length) * 100}%` })),
          h('span', { class: 'muted', style: 'font-size:13.5px' }, `${done} of ${flat.length} modules complete`),
          next ? h('div', { style: 'font-size:15px' }, h('span', { class: 'muted' }, 'Next stop: '), modLink(next)) : h('b', {}, 'Line complete'),
          h('div', { class: 'line-actions' }, h('a', { class: 'btn primary', href: href(path.page) }, 'Line guide'), ride)));
      });
      el.append(grid);
    }
    if (part === 'gates') {
      const examLink = (scope, label) => {
        const x = syl.exams.find((e) => e.scope === scope);
        const best = store.get('quizzes', `exam-${scope}`);
        return h('a', { class: 'btn', href: href(x.page) }, best ? `${label}: best ${best.pct}%` : label);
      };
      const grid = h('div', { class: 'gate-cards' });
      syl.gates.forEach((g) => {
        const feeds = syl.modules.filter((m) => m.levels[0] === g.level);
        const st = store.get('capstones', String(g.level));
        grid.append(h('article', { class: 'gate-card' },
          h('div', { class: 'gate-sign', 'aria-hidden': 'true' }, `G${g.level}`),
          h('div', { class: 'eyebrow' }, `End of level ${g.level} · ${syl.levels[g.level]}`),
          h('h3', {}, `Gate ${g.level}: ${g.title}`), h('p', { style: 'margin:0;font-size:15px' }, g.brief),
          h('span', { class: 'muted', style: 'font-size:13.5px' }, `${feeds.length} modules start at this level`),
          st ? h('span', { class: 'tag', style: 'width:fit-content' }, `Status: ${st}`) : null,
          h('div', { class: 'gate-actions' }, h('a', { class: 'btn', href: href(g.page) }, 'Open capstone'), examLink(g.level, `Level ${g.level} exam`))));
      });
      grid.append(h('article', { class: 'gate-card final' },
        h('div', { class: 'gate-sign', 'aria-hidden': 'true' }, 'End'),
        h('div', { class: 'eyebrow' }, 'All levels'), h('h3', {}, 'Final exam'), h('p', { style: 'margin:0;font-size:15px' }, 'Every module, with an emphasis on judgement across modules.'),
        h('div', { class: 'gate-actions' }, examLink('final', 'Final exam'))));
      el.append(grid);
    }
  };
  paint();
  document.addEventListener('academy:progress', paint);
}
