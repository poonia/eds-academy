const { test, expect } = require('@playwright/test');
const syllabus = require('../data/syllabus.json');

const built = syllabus.modules.filter((m) => m.built);
const pages = ['index.html', 'start-here.html', 'reference/components.html', ...built.map((m) => m.page)];

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
