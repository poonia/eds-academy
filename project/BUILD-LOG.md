# EDS Academy build log

Prompt: EDS Academy full interactive course build prompt (syllabus as of 30 Oct 2026).
Run mode: AGENT. This log is the resume point for later runs.

## Status

| Phase | Scope | Status |
| --- | --- | --- |
| 0 | Foundation: CSS, runtime, 14 components, syllabus, glossary, home, start here, components page | Done (30 Oct 2026) |
| 1 | Category A: A1–A4 | Done (30 Oct 2026) |
| 2 | Category B: B1–B10 | Done (8 Nov 2026) |
| 3 | Category C: C1–C11 | Done (8 Nov 2026) |
| 4 | Category D: D1–D10 | Next: set `START AT: PHASE 4` |
| 5 | Category E: E1–E10 | Not started |
| 6 | Capstones 1–4, level exams 1–4, final exam | Not started |
| 7 | Path pages, full glossary page, cheat sheets page, resources page, search | Not started (search works now from the generated index) |
| 8 | Full QA pass and coverage report | Not started |

## Accuracy note

Built with web access, but only some aem.live pages could be fetched directly. Facts were
taken from pages that could be opened:

- aem.live: architecture, Admin API reference, repoless, configuration service setup,
  Keeping it 100 (markdown version), FAQ, feature lifecycle, authoring with AEM,
  "Document Authoring is now Experience Workspace", markup sections and blocks.
- Experience League: Cloud Manager 2026.4.0 release notes, authoring for EDS,
  commerce storefront performance practices.

## Fact checks (8 Nov 2026)

| Module | Item | Outcome |
| --- | --- | --- |
| A1 | Licence entitlements | Stays flagged: contract-specific |
| A1 | `.plain.html` | Confirmed; home page is `/index.plain.html` |
| A1, A4 | Experience Workspace support | Open: lifecycle stage 3 shown, no SLA stated on aem.live. Get terms from Adobe |
| A2 | Admin API tokens | Resolved: `x-auth-token`, sign-in token or scoped API key |
| A2 | Anonymous `/status` | Corrected: returns 401 for helix-website; lab updated |
| A2 | `adobe/helix-website` hosts | Confirmed: both respond |
| A2 | "Normalized format" | Clarified: Admin API reports a `.md` resource; the format name is not documented |
| A3 | Boilerplate `scripts.js` | Corrected: `loadDelayed()` has no timer and imports `consent-check.js` |
| A4 | Approval workflow | Updated: Request Publish exists and needs onboarding; compliance fit stays per customer |
| A4 | Content Fragment markup | Confirmed: depends on mapping, overlay and JSON2HTML |

## Decisions

- **Experience Workspace.** aem.live now presents Document Authoring as Experience Workspace.
  Syllabus topic names are kept ("Document Authoring (da.live)"); pages explain the rename.
  Module B6 should be written as "Document Authoring / Experience Workspace".
- **Delayed phase timing.** aem.live says the delayed phase should start at least 3 s after
  LCP, but newer boilerplate versions no longer enforce it with a timer. A3 teaches both.
- **Feature lifecycle.** aem.live's model is a seven-stage "adoption arc"
  (Interest → Repeatable → Increasing use → Mainstream → Decreasing use → Discouraged → Removed).
  A1 topic 6 maps "early access vs GA" onto it.
- **Admin API auth header.** Config-service examples on aem.live use `x-auth-token`; course
  examples use the same.
- **Universal Editor feature availability.** aem.live's AEM authoring page says workflows, MSM,
  translation and launches are available; the lifecycle pages track exceptions. Pages tell
  learners to check per feature.
- **Glossary** starts with 60 terms; extend it in each phase.

## Module log

### A1 What EDS is and where it fits
- Topics (6/6): origins-and-naming, eds-vs-traditional-aem-sites, eds-vs-headless,
  fit-assessment, licensing-and-product-packaging, feature-lifecycle
- Visuals: 6 Mermaid (timeline, 2 flowcharts, decision flow, flowchart, state diagram), 6 tables
- Interactives: Ready? check, order (naming), match, 4 inline checks, signature scorer (8 questions),
  lab checklist, 8-question knowledge check, 11 flashcards
- VERIFY: licence entitlements per contract; `.plain.html` availability on a given site;
  current support terms for DA / Experience Workspace

### A2 Core architecture
- Topics (7/7): content-sources, storage-buses, rendering-pipeline, preview-vs-live,
  admin-service-and-admin-api, delivery-and-cdn, caching-and-invalidation
- Visuals: 7 Mermaid (flowcharts, sequence, state), tabs (authored → HTML → decorated), tables
- Interactives: signature explorer (13 components), publish stepper (6 steps), 2 match, order,
  inline checks, knowledge check (8), flashcards (11)
- VERIFY: how tokens are obtained and scoped (Admin API authentication section);
  anonymous access to `/status` for public sites; `adobe/helix-website` as aem.live's repo;
  "normalized format" wording for Content Bus storage

### A3 Web performance fundamentals
- Topics (5/5): core-web-vitals, lighthouse-100, three-phase-loading, why-no-framework-no-build,
  payload-budgets
- Visuals: 3 Mermaid, 2 HTML exhibits (payload bars), hotspot PR mockup, tables
- Interactives: signature CWV simulator (with CLS and INP "feel it" demos), phase visualizer
  (12 resources, teaching LCP model), match ×2, inline checks, knowledge check (8), flashcards (11)
- VERIFY: exact `scripts.js` contents differ by boilerplate version (sample marked simplified)

### A4 Authoring options landscape
- Topics (6/6): document-based-authoring, document-authoring-da-live,
  universal-editor-with-aem-sites, content-fragments-to-eds, choosing-an-option, repoless
- Visuals: 6 Mermaid (flowcharts, sequence, quadrant), 2 hotspot mockups, tabs, tables
- Interactives: signature decision tree (12 nodes), inline checks, knowledge check (8), flashcards (11)
- VERIFY: Experience Workspace support level; approval workflow fit for regulated content;
  Content Fragment HTML markup depends on mapping

### B1–B10 Category B (built 8 Nov 2026)
- All 52 syllabus topics written, each with why, concept, visual, show, try and pitfalls.
- New components: doc-sim, sheet-json, nav-builder, image-explorer, filter-sandbox, hreflang-builder,
  form-sheet, traffic-split. B2, B6 and B7 use hotspots; B8 uses scorer.
- Sources read 8 Nov 2026: aem.live docs and developer pages, adobe/aem-boilerplate,
  adobe/aem-block-collection, adobe/aem-experimentation.
- Glossary extended to 75 terms (85 after Category C). Module `asOf` in the syllabus overrides the global date.
- The labs have not been run against a real site, AEM sandbox or da.live project.
- VERIFY: B6 library and starter documents; B6 support terms; B7 feature exceptions on lifecycle
  pages; B10 plugin access and form block columns; B3 taxonomy on document-based sites is a convention.
- B7: aem.live recommends Experience Workspace over Universal Editor for new projects. A4's decision
  tree does not reflect that yet.

### C1–C11 Category C (built 8 Nov 2026)
- All 59 syllabus topics written. New components: terminal-replay, file-tree, block-playground,
  token-editor, waterfall, model-preview, query-playground, a11y-fixit, admin-request.
  C3 and C9 use stepper, C10 also uses order.
- Sources read 8 Nov 2026: aem.live developer docs, adobe/aem-boilerplate,
  adobe-rnd/aem-boilerplate-xwalk, adobe/aem-block-collection.
- The current boilerplate has no `delayed.js`; C2, C6 and C9 teach `consent-check.js` and `consented.js`.
- Waterfall and fallback-font figures are teaching models, and are labelled as such.
- Code samples and labs have not been run against a real project or AEM sandbox.
- VERIFY: C7 full field type list and UE extension points; C9 CSP changes for specific tags;
  C11 edge worker options per CDN; C11 prerequisite D2 is not built yet.

### Review of phases 1 and 2 (8 Nov 2026)
- Quiz answers were not evenly positioned (B modules about 80% first option). Options are now
  permuted statically in all modules; new pages get the same treatment at authoring time.
- A4 now notes aem.live's recommendation of Experience Workspace for new projects.
- B7 corrected to `component-definition.json`. All 65 external links resolved.

## Coverage matrix (built modules)

| Module | Topic id | Page anchor |
| --- | --- | --- |
| A1 | origins-and-naming … feature-lifecycle | modules/a1-what-eds-is.html#<topic id> |
| A2 | content-sources … caching-and-invalidation | modules/a2-core-architecture.html#<topic id> |
| A3 | core-web-vitals … payload-budgets | modules/a3-web-performance.html#<topic id> |
| A4 | document-based-authoring … repoless | modules/a4-authoring-options.html#<topic id> |

`python3 tools/build-search-index.py` verifies that every syllabus topic of every built module
has a matching section and that every JSON block parses (last run: pass, 320 index items).

## QA (30 Oct 2026)

Tested in Chromium via Playwright: all 7 pages at 1280 px, module pages at 360 px, dark mode.
No console errors (excluding blocked font requests in the test sandbox), all Mermaid diagrams
render, all components initialize, no horizontal page overflow. Interaction run covered: mark
done → sidebar, header ring, home map and dashboard update; inline and full quizzes;
decision tree; hotspots; flashcards (flip, known); explain lines; search (/ and Esc);
theme switch re-renders diagrams; glossary tooltip; order, match, scorer; phase visualizer.

## Next run

Set `START AT: PHASE 4`. Write D1–D10 with the same template, add their glossary terms and `asOf`,
flip `built` to true in `data/syllabus.json`, run `npm run check && npm test`, and update this log.
