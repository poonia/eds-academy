const { test, expect } = require('@playwright/test');
const syllabus = require('../data/syllabus.json');

const built = syllabus.modules.filter((m) => m.built);
const pages = ['index.html', 'start-here.html', 'reference/components.html', ...built.map((m) => m.page), ...syllabus.gates.map((g) => g.page), ...syllabus.exams.map((x) => x.page), ...syllabus.paths.map((p) => p.page), 'practice/index.html', 'reference/index.html', 'reference/glossary.html', 'reference/cheat-sheets.html', 'reference/resources.html'];

/* Records uncaught errors, runtime errors and failed same-origin requests. */
function watch(page) {
  const problems = [];
  page.on('pageerror', (e) => problems.push(`uncaught: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error' && m.text().startsWith('[academy]')) problems.push(m.text()); });
  page.on('response', (r) => {
    if (r.status() >= 400 && r.url().startsWith('http://127.0.0.1')) problems.push(`${r.status()} ${r.url()}`);
  });
  return problems;
}

async function open(page, path) {
  await page.goto(path);
  await page.waitForSelector('html[data-ready="true"]');
}

for (const path of pages) {
  test(`renders ${path}`, async ({ page }) => {
    const problems = watch(page);
    await open(page, path);
    const report = await page.evaluate(() => ({
      empty: [...document.querySelectorAll('[data-component]')].filter((e) => !e.children.length).map((e) => e.dataset.component),
      diagramErrors: document.querySelectorAll('.diagram-error').length,
      unrendered: [...document.querySelectorAll('pre.mermaid')].filter((e) => !e.querySelector('svg')).length,
    }));
    expect(report).toEqual({ empty: [], diagramErrors: 0, unrendered: 0 });
    expect(problems).toEqual([]);
  });

  test(`has no sideways scroll at 360 px: ${path}`, async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 780 });
    await open(page, path);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
}

test('marking a topic done updates progress', async ({ page }) => {
  await open(page, built[0].page);
  await expect(page.locator('.progress-chip .pc-text')).toHaveText(/^0\//);
  await page.getByRole('button', { name: /^Mark done/ }).first().click();
  await expect(page.locator('.progress-chip .pc-text')).toHaveText(/^1\//);
  await page.reload();
  await page.waitForSelector('html[data-ready="true"]');
  await expect(page.locator('.progress-chip .pc-text')).toHaveText(/^1\//);
});

test('search never links to a page that does not exist', async ({ page, request }) => {
  await open(page, 'index.html');
  await page.keyboard.press('/');
  await page.locator('dialog[open] input').fill('performance');
  await expect(page.locator('dialog[open] a[role=option]').first()).toBeVisible();
  const links = await page.locator('dialog[open] a[role=option]').evaluateAll((all) => all.map((a) => a.href));
  for (const link of new Set(links.map((l) => l.split('#')[0]))) {
    expect((await request.get(link)).status(), link).toBe(200);
  }
});

test('simulators respond to input', async ({ page }) => {
  await open(page, 'modules/b1-page-structure.html');
  const doc = page.locator('[data-component="doc-sim"]');
  await doc.locator('textarea').fill('# Hello there\n\n| Columns (dark) |\n| a | b |');
  await expect(doc.locator('pre')).toContainText('<h1 id="hello-there">');
  await expect(doc.locator('pre')).toContainText('class="columns dark"');

  await open(page, 'modules/b3-spreadsheets.html');
  const redirects = page.locator('[data-component="sheet-json"][data-mode="redirects"]');
  await redirects.locator('input').fill('/loop');
  await expect(redirects.locator('.feedback')).toContainText('Loop');

  await open(page, 'modules/b5-images-media.html');
  const images = page.locator('[data-component="image-explorer"]');
  await images.locator('input[type=range]').fill('800');
  await expect(images.locator('pre')).toContainText('width=2000');

  await open(page, 'modules/b10-forms-experiments.html');
  const form = page.locator('[data-component="form-sheet"]');
  await expect(form.locator('.form-preview label').first()).toContainText('Your name *');
  await form.locator('.sim-text').fill('Name,Type,Label\nx,select,Pick');
  await expect(form.locator('.sim-notes')).toContainText('needs Options');
});

test('developer simulators respond to input', async ({ page }) => {
  await open(page, 'modules/c1-environment-setup.html');
  const term = page.locator('[data-component="terminal-replay"]');
  await term.getByRole('button', { name: 'Run next command' }).click();
  await expect(term.locator('pre')).toContainText('npm install -g @adobe/aem-cli');

  await open(page, 'modules/c4-building-blocks.html');
  const play = page.locator('[data-component="block-playground"]');
  await expect(play.locator('pre').last()).toContainText('<ul>');
  await play.locator('select').selectOption('columns');
  await expect(play.locator('pre').last()).toContainText('columns-2-cols');

  await open(page, 'modules/c6-performance-engineering.html');
  const fall = page.locator('[data-component="waterfall"]');
  await expect(fall.locator('.feedback')).toContainText('Slower');
  for (const box of await fall.locator('input[type=checkbox]').all()) await box.check();
  await expect(fall.locator('.feedback')).toContainText('Within');

  await open(page, 'modules/c7-ue-development.html');
  const model = page.locator('[data-component="model-preview"]');
  await expect(model.locator('.sim-notes')).toContainText('Field collapse');
  await model.locator('.sim-text').fill('{');
  await expect(model.locator('.sim-notes')).toContainText('Invalid JSON');

  await open(page, 'modules/c11-advanced-tooling.html');
  const admin = page.locator('[data-component="admin-request"]');
  await admin.locator('select').selectOption('unpublish');
  await expect(admin.locator('pre')).toContainText('-X DELETE');
});

test('implementation simulators respond to input', async ({ page }) => {
  await open(page, 'modules/d2-configuration-service.html');
  const cfg = page.locator('[data-component="config-explorer"]');
  await expect(cfg.locator('.sim-notes')).toContainText('public.custom.brand comes from the site');
  await cfg.getByLabel('public.custom.brand, site value').fill('');
  await expect(cfg.locator('.sim-notes')).toContainText('public.custom.brand comes from the profile');
  await cfg.getByLabel('code.repo, site value').fill('other');
  await expect(cfg.locator('.feedback')).toContainText('risky');

  await open(page, 'modules/d3-cdn-go-live.html');
  const cdn = page.locator('[data-component="cdn-sim"]');
  await expect(cdn.locator('.feedback')).toContainText('6 settings');
  for (const box of await cdn.locator('input[type=checkbox]').all()) await box.check();
  await expect(cdn.locator('.feedback')).toContainText('matches');
  await cdn.locator('select').selectOption('page');
  await expect(cdn.locator('.feedback')).toContainText('1 setting');

  await open(page, 'modules/d4-security-access.html');
  const csp = page.locator('[data-component="csp-builder"]');
  await expect(csp.locator('.sim-notes')).toContainText('blocked');
  await csp.getByLabel("'strict-dynamic'").uncheck();
  await expect(csp.locator('.feedback')).toContainText('Without strict-dynamic');

  await open(page, 'modules/d6-migration.html');
  const red = page.locator('[data-component="redirect-validator"]');
  await expect(red.locator('.sim-notes')).toContainText('Redirect loop');
  await red.locator('.sim-text').fill('Source,Destination\n/a,/about');
  await expect(red.locator('.feedback')).toContainText('0 errors');

  await open(page, 'modules/d7-monitoring.html');
  const rum = page.locator('[data-component="rum-dashboard"]');
  await expect(rum.locator('.rd-cards')).toContainText('Estimated page views');
  await rum.locator('select').nth(1).selectOption('/support');
  await expect(rum.locator('.feedback')).toContainText('Alert: LCP 2540ms');
  await rum.locator('select').nth(0).selectOption('mobile');
  await expect(rum.locator('.feedback')).toContainText('Too few samples');

  await open(page, 'modules/d8-seo-operations.html');
  const robots = page.locator('[data-component="robots-builder"]');
  await expect(robots.locator('pre').first()).toContainText('Disallow: /search');
  await robots.getByLabel('Disallow paths, comma separated').fill('/');
  await expect(robots.locator('.feedback')).toContainText('whole site');

  await open(page, 'modules/d9-governance.html');
  const raci = page.locator('[data-component="raci-matrix"]');
  await expect(raci.locator('tbody tr').first()).toContainText('Nobody is Accountable');
  await raci.getByRole('button', { name: 'Show a suggested model' }).click();
  await expect(raci.locator('tbody tr').first()).toContainText('One clear owner');

  await open(page, 'modules/d10-enterprise-architecture.html');
  const route = page.locator('[data-component="routing-sim"]');
  await expect(route.locator('pre')).toContainText('main--acme--acme.aem.live');
  await route.getByLabel('Path').fill('/account/x');
  await expect(route.locator('pre')).toContainText('adobeaemcloud');
});

test('advanced simulators respond to input', async ({ page }) => {
  await open(page, 'modules/e1-experimentation.html');
  const exp = page.locator('[data-component="experiment-results"]');
  await expect(exp.locator('.feedback')).toContainText('Not significant');
  await exp.locator('select').selectOption('1');
  await expect(exp.locator('.feedback')).toContainText('Significant at 95%');

  await open(page, 'modules/e2-personalization.html');
  const flick = page.locator('[data-component="flicker-timeline"]');
  await expect(flick.locator('.feedback')).toContainText('Within');
  await flick.locator('select').first().selectOption('targetFirst');
  await expect(flick.locator('.feedback')).toContainText('Over');
  await expect(flick.locator('.sim-notes')).toContainText('flicker');

  await open(page, 'modules/e4-forms.html');
  const rules = page.locator('[data-component="form-rules"]');
  await expect(rules.getByLabel('Additional deduction')).toBeHidden();
  await rules.getByLabel('Gross salary', { exact: true }).fill('60000');
  await expect(rules.getByLabel('Additional deduction')).toBeVisible();

  await open(page, 'modules/e5-structured-content.html');
  const cf = page.locator('[data-component="cf-html"]');
  await expect(cf.locator('pre')).toContainText('<h1>Acme opens new branch</h1>');
  await expect(cf.locator('pre')).toContainText('<li>Toronto</li>');
  await cf.locator('.sim-text').first().fill('{');
  await expect(cf.locator('.feedback')).toContainText('Invalid JSON');

  await open(page, 'modules/e7-expert-accessibility.html');
  const demos = page.locator('[data-component="a11y-demos"]');
  await demos.getByRole('tab', { name: 'Overview' }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(demos.getByRole('tab', { name: 'Rates' })).toBeFocused();
  await expect(demos.getByRole('tabpanel')).toContainText('Rates change');
  await demos.getByRole('button', { name: 'Next slide' }).click();
  await expect(demos.locator('.ad-slide')).toContainText('Slide 2 of 3');

  await open(page, 'modules/e9-performance-at-scale.html');
  const dash = page.locator('[data-component="portfolio-dash"]');
  await expect(dash.locator('tbody tr').first()).toContainText('Retail');
  await dash.getByLabel('LCP budget (ms)').fill('3000');
  await expect(dash.locator('tbody tr').first()).toContainText('Business');
});

test('an exam draws a fair paper and marks it correctly', async ({ page }) => {
  await open(page, 'exams/level-1.html');
  const logic = await page.evaluate(async () => {
    const mod = await import(new URL('../assets/js/components/exam.js', location.href).href);
    const load = (p) => fetch(new URL(p, location.href).href).then((r) => r.json());
    const [{ questions }, syl] = await Promise.all([load('../data/exam-bank.json'), load('../data/syllabus.json')]);
    const paper = mod.drawExam(mod.poolFor(questions, syl.modules, 1, 'all'), 30);
    const answers = paper.map((q) => (Array.isArray(q.answer) ? q.answer : [q.answer]));
    const right = mod.mark(paper, answers, 70);
    const wrong = mod.mark(paper, paper.map(() => []), 70);
    return { n: paper.length, unique: new Set(paper.map((q) => q.q)).size, pct: right.pct, passed: right.passed, modules: right.modules.length, failed: wrong.passed, level4Dev: mod.poolFor(questions, syl.modules, 4, 'dev').length };
  });
  expect(logic).toMatchObject({ n: 30, unique: 30, pct: 100, passed: true, failed: false });
  expect(logic.modules).toBeGreaterThan(5);
  expect(logic.level4Dev).toBeGreaterThanOrEqual(30);

  const exam = page.locator('[data-component="exam"]');
  await exam.getByRole('button', { name: 'Start exam' }).click();
  await expect(exam.locator('.q')).toHaveCount(30);
  await exam.getByRole('button', { name: 'Finish and mark' }).click();
  await expect(exam.locator('.feedback')).toContainText('30 questions are unanswered');
  for (const q of await exam.locator('.q').all()) await q.locator('input').first().check();
  await expect(exam.locator('.ex-status')).toContainText('30 of 30');
  await exam.getByRole('button', { name: 'Finish and mark' }).click();
  await expect(exam.locator('.ex-result')).toContainText('of 30 correct');
  await expect(exam.locator('.ex-result')).toBeFocused();
  await exam.getByRole('button', { name: 'Take a new paper' }).click();
  await expect(exam.getByText('Your best score')).toBeVisible();
});

test('a capstone tracks evidence and reports status on the home page', async ({ page }) => {
  await open(page, 'capstones/gate-1.html');
  const cap = page.locator('[data-component="capstone"]');
  await expect(cap.locator('.feedback')).toContainText('Not started');
  for (const box of await cap.locator('.cap-reqs input').all()) await box.check();
  for (const s of await cap.locator('select').all()) await s.selectOption('Meets');
  await expect(cap.locator('.feedback')).toContainText('In progress');
  await cap.locator('.sim-text').fill('https://main--site--org.aem.live/');
  await expect(cap.locator('.feedback')).toContainText('Ready for review');
  await expect(cap.locator('pre')).toContainText('[x]');
  await page.reload();
  await page.waitForSelector('html[data-ready="true"]');
  await expect(page.locator('[data-component="capstone"] .feedback')).toContainText('Ready for review');
  await open(page, 'index.html');
  await expect(page.locator('[data-part="gates"]')).toContainText('Status: Ready for review');
});

test('a learning path shows progress and missing prerequisites', async ({ page }) => {
  await open(page, 'paths/author.html');
  const view = page.locator('[data-component="path-progress"]');
  await expect(view.locator('.card')).toContainText('0 of 23 modules complete');
  await expect(view.locator('li[data-m="D8"]')).toContainText('Also needs, not on this path');
  await page.evaluate(() => localStorage.setItem('eds-academy-v1', JSON.stringify({ v: 1, topics: {}, modules: { A1: 'done' }, quizzes: {}, labs: {}, capstones: {}, checklists: {}, cards: {}, last: null })));
  await page.reload();
  await page.waitForSelector('html[data-ready="true"]');
  await expect(page.locator('[data-component="path-progress"] .card')).toContainText('1 of 23 modules complete');
  await expect(page.locator('li[data-m="A1"]')).toContainText('Done');
  await expect(page.locator('[data-component="path-progress"] .card')).toContainText('A2');
});

test('reference pages filter their content', async ({ page }) => {
  await open(page, 'reference/glossary.html');
  const list = page.locator('[data-component="filter-list"]');
  await expect(page.locator('#repoless')).toBeVisible();
  await list.getByLabel('Filter').fill('repoless');
  await expect(list.locator('.filter-end')).toContainText('Showing');
  await expect(page.locator('#repoless')).toBeVisible();
  await expect(page.locator('#hlxignore')).toBeHidden();
  await list.getByLabel('Filter').fill('zzzz');
  await expect(list.locator('.filter-end')).toContainText('No matches');

  await open(page, 'reference/cheat-sheets.html');
  const sheets = page.locator('[data-component="filter-list"]');
  await expect(sheets.locator('.filter-end')).toContainText('of 45');
  await sheets.getByLabel('Category').selectOption('E');
  await expect(sheets.locator('.filter-end')).toContainText('Showing 10 of 45');
  await expect(page.locator('#a1')).toBeHidden();

  await open(page, 'reference/resources.html');
  const res = page.locator('[data-component="filter-list"]');
  await res.getByLabel('Source').selectOption('github');
  await expect(res.locator('[data-item]:visible').first()).toContainText('Used in');
});

test('search finds a term in the glossary and external resources', async ({ page }) => {
  await open(page, 'index.html');
  await page.keyboard.press('/');
  const box = page.getByRole('combobox', { name: 'Search the course' });
  await box.fill('repoless');
  await expect(page.locator('.sd-results a[href$="reference/glossary.html#repoless"]')).toHaveCount(1);
  await box.fill('Target integration');
  await expect(page.locator('.sd-results a[target="_blank"]').first()).toHaveAttribute('href', /aem\.live/);
  await box.fill('zzzzzz');
  await expect(page.locator('.sd-foot')).toContainText('No results');
});

test('the ready self-check starts collapsed and opens on demand', async ({ page }) => {
  await page.goto('modules/c4-building-blocks.html');
  await page.waitForSelector('html[data-ready="true"]');
  const fold = page.locator('[data-variant="ready"] details.q-fold');
  await expect(fold).not.toHaveAttribute('open', '');
  await expect(fold.locator('.q').first()).toBeHidden();
  await fold.locator('summary').focus();
  await page.keyboard.press('Enter');
  await expect(fold.locator('.q').first()).toBeVisible();
  await fold.locator('.q-opt').first().click();
  await expect(fold.locator('.q-score')).toContainText('2 to go');
  await page.reload();
  await page.waitForSelector('html[data-ready="true"]');
  await expect(fold).not.toHaveAttribute('open', '');
});

const LAB_PAGES = [...new Set(built.map((m) => m.page))].filter((p) => require('fs').readFileSync(require('path').join(__dirname, '..', p), 'utf8').includes('data-component="code-lab"'));

for (const labPage of LAB_PAGES) {
  test(`every code lab solution passes its checks: ${labPage}`, async ({ page }) => {
    await page.goto(labPage);
    await page.waitForSelector('html[data-ready="true"]');
    const labs = page.locator('[data-component="code-lab"]');
    for (let i = 0; i < await labs.count(); i += 1) {
      const lab = labs.nth(i);
      const solution = await lab.evaluate((el) => JSON.parse(el.querySelector('script[type="application/json"]').textContent).solution);
      await lab.locator('textarea').fill(solution);
      await lab.getByRole('button', { name: 'Run checks' }).click();
      await expect(lab.locator('.cl-status')).toContainText('All', { timeout: 10000 });
      await expect(lab.locator('.cl-checks li.fail')).toHaveCount(0);
    }
  });
}

test('a code lab starter does not pass, and reports what is missing', async ({ page }) => {
  await page.goto('modules/c4-building-blocks.html#block-contract');
  await page.waitForSelector('html[data-ready="true"]');
  const lab = page.locator('[data-component="code-lab"][data-id="c4-quote"]');
  await lab.getByRole('button', { name: 'Run checks' }).click();
  await expect(lab.locator('.cl-status')).toContainText('of 5 checks pass', { timeout: 10000 });
  await expect(lab.locator('.cl-checks li.fail').first()).toBeVisible();
  await lab.getByRole('button', { name: 'Show a hint' }).click();
  await expect(lab.locator('.cl-hints')).toContainText('Hint 1');
});

test('a debug case is solved after choosing the right cause, and the hub records it', async ({ page }) => {
  await page.goto('modules/c4-building-blocks.html#debugging-blocks');
  await page.waitForSelector('html[data-ready="true"]');
  const dbg = page.locator('[data-component="debug-lab"][data-id="c4-hero-banner"]');
  await dbg.locator('summary', { hasText: 'Network panel' }).click();
  await expect(dbg.locator('.q-score')).toContainText('1 of 4');
  await dbg.locator('.q-opt').nth(1).click();
  await dbg.getByRole('button', { name: 'Check diagnosis' }).click();
  await expect(dbg.locator('.feedback')).toContainText('Not quite');
  await dbg.locator('.q-opt').first().click();
  await dbg.getByRole('button', { name: 'Check diagnosis' }).click();
  await expect(dbg.locator('.feedback')).toContainText('Solved, using 1 of 4 clues');
  await page.goto('practice/index.html');
  await page.waitForSelector('html[data-ready="true"]');
  const hub = page.locator('[data-component="practice-hub"]');
  await expect(hub.locator('.ph-item')).toHaveCount(19);
  await expect(hub.locator('.ph-item.done')).toHaveCount(1);
  await hub.getByRole('button', { name: 'Code labs' }).click();
  await expect(hub.locator('.ph-item')).toHaveCount(9);
});

test('primary navigation reaches the reference section', async ({ page }) => {
  await open(page, 'index.html');
  await page.locator('.primary-nav').getByRole('link', { name: 'Reference' }).click();
  await page.waitForSelector('html[data-ready="true"]');
  await expect(page.locator('h1')).toHaveText('Reference');
  await expect(page.locator('.primary-nav [aria-current="page"]')).toHaveText('Reference');
});

test('a missing URL at any depth shows the styled 404 page', async ({ page }) => {
  const problems = watch(page);
  const response = await page.goto('/eds-academy/no/such/deep/page.html');
  expect(response.status()).toBe(404);
  problems.length = 0; // The document's own 404 is expected.
  await page.waitForSelector('html[data-ready="true"]');
  await expect(page.locator('h1')).toHaveText('We could not find that page');
  await expect(page.locator('a.brand')).toHaveAttribute('href', /\/eds-academy\/index\.html$/);
  expect(await page.evaluate(() => getComputedStyle(document.querySelector('.btn.primary')).borderRadius)).not.toBe('0px');
  expect(problems).toEqual([]);
});

test('the network map switches lines, moves with the keyboard and sets the line on module pages', async ({ page }) => {
  await open(page, 'index.html');
  const map = page.locator('[data-component="metro-map"]');
  await map.getByRole('button', { name: 'Author line', exact: true }).click();
  await expect(map.locator('.mm-detail')).toContainText('Author line · stop 1 of 27');
  await map.locator('.mm-st[tabindex="0"]').focus();
  await page.keyboard.press('ArrowRight');
  await expect(map.locator('.mm-detail h3')).toContainText('A2');
  await expect(map.locator('.mm-detail')).toContainText('stop 2 of 27');
  await page.keyboard.press('End');
  await expect(map.locator('.mm-detail h3')).toContainText('G4');
  await open(page, 'modules/b1-page-structure.html');
  await expect(page.locator('.mod-line')).toContainText('Author line · stop 5 of 23');
  await expect(page.locator('.mod-line .next')).toContainText('B2');
});
