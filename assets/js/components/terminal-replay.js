/* Terminal replay: step through commands and their output.
   JSON: {"steps":[{"cmd":"aem up","out":"...","note":"..."}]} */
export default function terminalReplay(el, { h, readJSON }) {
  const steps = readJSON(el).steps || [];
  el.classList.add('ix');
  const log = h('pre', { class: 'sim-out term', tabindex: '0', 'aria-label': 'Terminal output' });
  const note = h('p', { class: 'ix-note', 'aria-live': 'polite' });
  const next = h('button', { class: 'btn primary small', type: 'button' }, 'Run next command');
  const reset = h('button', { class: 'btn small', type: 'button' }, 'Start again');
  let at = 0;
  const paint = () => {
    log.textContent = steps.slice(0, at).map((s) => `$ ${s.cmd}\n${s.out}`).join('\n\n') || 'Select Run next command to begin.';
    log.scrollTop = log.scrollHeight;
    note.textContent = at ? steps[at - 1].note : `${steps.length} commands.`;
    next.disabled = at >= steps.length;
  };
  next.addEventListener('click', () => { at += 1; paint(); });
  reset.addEventListener('click', () => { at = 0; paint(); next.focus(); });
  el.append(h('div', { class: 'ix-head' }, h('div', {}, h('div', { class: 'ix-kind' }, 'Replay'), h('h3', {}, el.dataset.title || 'Terminal replay'))), log, note, h('div', { class: 'ix-foot' }, next, reset));
  paint();
}
