# EDS Academy coverage and QA report

Reviewed on 9 November 2026 against commit `fa08614` and the Phase 8 fixes, then updated after Category C, Category E and D6 were expanded. EDS Academy is an unofficial learning resource.

## Result

The course is complete against its syllabus: **45 of 45 modules** and **253 of 253 topics**, each topic with all six parts. Automated checks on all 64 published pages found no outstanding failures. It has **not** been tested by real learners, on a real project, or with a screen reader.

| Item | Built |
| --- | --- |
| Modules | 45 of 45 |
| Topics with why, concept, visual, show, try and pitfalls | 253 of 253 |
| Module closing sections (signature, lab, troubleshooting, enterprise, knowledge check, flashcards, cheat sheet, reading, next steps) | 405 of 405 |
| Capstone gates | 4 of 4 |
| Level exams and final exam | 5 of 5, from a bank of 482 questions |
| Learning paths | 3 of 3 |
| Reference pages | Hub, glossary (102 terms), cheat sheets (45), resources (161 sources), components |
| Diagrams | 172 |
| Interactive component instances in modules | 462, built from 53 components |
| Graded questions in modules | 811 |
| Lab steps | 328 |
| Practice | 9 code labs with automatic checks, 10 debug cases, and a practice hub |
| Estimated study time | 107 hours (calculated by `tools/estimate-hours.py`), plus capstones and exams |

## Checks

| Check | Scope | Result |
| --- | --- | --- |
| Topic and section coverage | All modules | Pass |
| Quiz data: valid answers, explanations, no repeated options | All modules | Pass |
| Correct-answer position, single-answer questions | 657 questions | Balanced: 206, 216, 223, then 12 in fourth place |
| Local links, including case | All files | Pass, 1,422 references |
| In-page fragment links | All pages | Pass |
| External links | All 154 sources | All resolve |
| Sideways scroll at 320, 768, 1024, 1440 px, and 360 px in the test suite | 64 pages | 0 problems |
| Diagrams and code render | 64 pages, light and dark | 0 problems |
| Console errors and failed requests | 64 pages, light and dark | 0 problems |
| Accessibility: axe-core 4.10.2, WCAG 2.0 to 2.2 A and AA, plus best practices | 64 pages, light and dark, default page state | Pass after fixes |
| Flows: progress import, bad import, theme, mobile menus, skip link, search keys, keyboard exam | Sample pages | Pass |
| Resilience: no JavaScript, blocked storage, blocked CDNs, 404 | Sample pages | Pass |
| Browser test suite | 141 tests, all pages | Pass |

## Found and fixed in this review

| Severity | Finding | Fix |
| --- | --- | --- |
| Content | Adobe now lists the `crontab` scheduling sheet as deprecated, and B8 and D5 taught it | Both now teach Scheduled Publishing, and mention `crontab` only as deprecated |
| Content | D2 understated that file-based configuration is no longer supported | Corrected |
| Content | D3 omitted that bring-your-own-DNS no longer accepts new domains | Added |
| Content | B1 did not state that folder mapping is deprecated | Added |
| Critical (axe) | E7’s tabs demo used an invalid `aria-pressed` on a tab | Removed |
| Serious (axe) | Code comment colour failed contrast in light mode | Darkened |
| Serious (axe) | Glossary A to Z links were under the 24 px target size | Enlarged |
| Serious (axe) | Wide diagrams could not be scrolled by keyboard | Now focusable when they overflow |
| Serious (axe) | Decision tree used `aria-label` on a plain `div` | Added a role |
| Moderate and minor (axe) | Heading order, nested landmarks, content outside landmarks, empty table headers, button role on headings | Fixed |
| Content | The site-wide date still read 30 October | Updated; Category A pages keep their own date |

## What this does not prove

- **Accessibility:** automated tools find only some issues. No screen reader or user testing was done, and axe scanned each page’s default state, so unopened steps and dialogs were not fully covered.
- **Labs and code samples** have not been run on a real project, CDN, Commerce backend, Forms licence or AEM sandbox.
- **Exams and capstones** are self-assessments. Pass marks and time estimates have not been calibrated, and no one has completed a capstone.
- **Devices:** tests used Chromium only, not Safari, Firefox or physical phones.
- **Lighthouse** was not run on this site.
- **Accessibility tooling** is not in the repository, so future changes are not automatically rescanned.

## Open items

Confirm with Adobe, or for the specific contract, before relying on these. Details are in `BUILD-LOG.md`.

- Experience Workspace support terms and HIPAA status; licence entitlements; Request Publish compliance fit.
- B6 library and starter documents; B7 feature exceptions; B10 plugin access and form block columns.
- C7 full field list and extension points; C9 CSP changes for specific tags; C11 edge options per CDN.
- Cloud Manager pipeline access for Edge environments; customer alerting for telemetry.
- Experimentation plugin availability; Forms submit actions per environment; Commerce drop-in licence terms; MCP capabilities per AEM release.
- AODA duties for a specific organization need legal review.

**Design decision pending:** 25 prerequisites sit outside the learning path that uses them. Path pages flag these, and the syllabus is unchanged.

## Module coverage

| Module | Topics complete | Closing sections | Diagrams | Interactives | Graded questions | Lab steps | Content date |
| --- | --- | --- | --- | --- | --- | --- | --- |
| A1 What EDS is and where it fits | 6/6 | 9/9 | 6 | 10 | 15 | 7 | 30 Oct 2026 |
| A2 Core architecture | 7/7 | 9/9 | 7 | 13 | 15 | 6 | 30 Oct 2026 |
| A3 Web performance fundamentals | 5/5 | 9/9 | 3 | 12 | 14 | 6 | 30 Oct 2026 |
| A4 Authoring options landscape | 6/6 | 9/9 | 6 | 13 | 17 | 6 | 30 Oct 2026 |
| B1 Page structure fundamentals | 8/8 | 9/9 | 5 | 13 | 19 | 6 | 9 Nov 2026 |
| B2 AEM Sidekick | 5/5 | 9/9 | 5 | 9 | 16 | 7 | 8 Nov 2026 |
| B3 Spreadsheets and structured content | 7/7 | 9/9 | 6 | 12 | 18 | 7 | 8 Nov 2026 |
| B4 Shared and reusable content | 3/3 | 9/9 | 3 | 7 | 14 | 6 | 8 Nov 2026 |
| B5 Images, media and assets | 4/4 | 9/9 | 3 | 8 | 15 | 6 | 8 Nov 2026 |
| B6 Document Authoring (da.live) | 6/6 | 9/9 | 5 | 10 | 17 | 7 | 8 Nov 2026 |
| B7 Universal Editor with AEM Sites | 7/7 | 9/9 | 7 | 12 | 18 | 7 | 8 Nov 2026 |
| B8 Publishing workflow and quality | 5/5 | 9/9 | 3 | 9 | 16 | 7 | 9 Nov 2026 |
| B9 Localization and multi-site content | 3/3 | 9/9 | 2 | 7 | 14 | 7 | 8 Nov 2026 |
| B10 Forms and experimentation for authors | 4/4 | 9/9 | 3 | 10 | 15 | 7 | 8 Nov 2026 |
| C1 Environment setup | 7/7 | 9/9 | 6 | 11 | 21 | 7 | 9 Nov 2026 |
| C2 Project anatomy | 5/5 | 9/9 | 4 | 9 | 19 | 6 | 9 Nov 2026 |
| C3 Rendering and decoration | 6/6 | 9/9 | 5 | 10 | 20 | 7 | 9 Nov 2026 |
| C4 Building blocks | 12/12 | 9/9 | 4 | 16 | 27 | 8 | 9 Nov 2026 |
| C5 Styling | 7/7 | 9/9 | 4 | 11 | 21 | 7 | 9 Nov 2026 |
| C6 Performance engineering | 8/8 | 9/9 | 6 | 12 | 22 | 7 | 9 Nov 2026 |
| C7 Universal Editor development | 10/10 | 9/9 | 5 | 14 | 25 | 8 | 9 Nov 2026 |
| C8 Data-driven development | 8/8 | 9/9 | 4 | 12 | 22 | 7 | 9 Nov 2026 |
| C9 Integrations | 6/6 | 9/9 | 6 | 10 | 20 | 7 | 9 Nov 2026 |
| C10 Testing and code quality | 7/7 | 9/9 | 4 | 12 | 21 | 8 | 9 Nov 2026 |
| C11 Advanced developer tooling | 7/7 | 9/9 | 4 | 11 | 21 | 7 | 9 Nov 2026 |
| D1 Project setup and onboarding | 4/4 | 9/9 | 1 | 9 | 15 | 7 | 9 Nov 2026 |
| D2 Configuration service | 4/4 | 9/9 | 2 | 9 | 15 | 7 | 9 Nov 2026 |
| D3 Domains, CDN and go-live | 6/6 | 9/9 | 3 | 10 | 17 | 8 | 9 Nov 2026 |
| D4 Security and access | 5/5 | 9/9 | 2 | 9 | 16 | 8 | 9 Nov 2026 |
| D5 Environments and release management | 4/4 | 9/9 | 3 | 9 | 15 | 8 | 9 Nov 2026 |
| D6 Migration to EDS | 9/9 | 9/9 | 6 | 15 | 23 | 10 | 9 Nov 2026 |
| D7 Monitoring and observability | 5/5 | 9/9 | 1 | 10 | 16 | 7 | 9 Nov 2026 |
| D8 SEO and discoverability operations | 3/3 | 9/9 | 1 | 7 | 14 | 7 | 9 Nov 2026 |
| D9 Governance and operating model | 5/5 | 9/9 | 1 | 10 | 16 | 7 | 9 Nov 2026 |
| D10 Enterprise architecture | 5/5 | 9/9 | 1 | 10 | 16 | 7 | 9 Nov 2026 |
| E1 Experimentation | 4/4 | 9/9 | 3 | 10 | 18 | 9 | 9 Nov 2026 |
| E2 Personalization | 4/4 | 9/9 | 4 | 8 | 18 | 8 | 9 Nov 2026 |
| E3 Commerce | 6/6 | 9/9 | 5 | 10 | 21 | 9 | 9 Nov 2026 |
| E4 Forms | 5/5 | 9/9 | 4 | 10 | 19 | 10 | 9 Nov 2026 |
| E5 Structured content | 4/4 | 9/9 | 3 | 8 | 18 | 8 | 9 Nov 2026 |
| E6 AI and automation | 5/5 | 9/9 | 4 | 10 | 19 | 7 | 9 Nov 2026 |
| E7 Expert accessibility | 5/5 | 9/9 | 3 | 10 | 20 | 8 | 9 Nov 2026 |
| E8 Authoring tool extensions | 4/4 | 9/9 | 3 | 8 | 18 | 7 | 9 Nov 2026 |
| E9 Performance at scale | 4/4 | 9/9 | 4 | 8 | 18 | 8 | 9 Nov 2026 |
| E10 Community and contribution | 3/3 | 9/9 | 2 | 9 | 17 | 7 | 9 Nov 2026 |

## Transit redesign (10 Nov 2026)
- New visual identity: a transit network. Learning paths are lines (Author green, Developer violet, Implementation lead orange), modules are stations, capstone gates are interchanges. Warm paper and night-map themes, Archivo display type, square corners, no pills or uppercase labels.
- New `metro-map` component on the home page, with a vertical layout on phones. Module pages show the learner's line with previous and next stops, and the contents list is drawn as stations on a line.
- Home page rebuilt: a "You are here" ticket, one card per line, the network map, the four stops of every module, gates, and the station index.
- Re-ran checks, the 151-test browser suite and the 65-page axe, overflow, diagram, console and request sweep in light and dark.

