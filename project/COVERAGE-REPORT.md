# EDS Academy coverage and QA report

Reviewed on 9 November 2026 against commit `fa08614` and the Phase 8 fixes. EDS Academy is an unofficial learning resource.

## Result

The course is complete against its syllabus: **45 of 45 modules** and **199 of 199 topics**, each topic with all six parts. Automated checks on all 64 published pages found no outstanding failures. It has **not** been tested by real learners, on a real project, or with a screen reader.

| Item | Built |
| --- | --- |
| Modules | 45 of 45 |
| Topics with why, concept, visual, show, try and pitfalls | 199 of 199 |
| Module closing sections (signature, lab, troubleshooting, enterprise, knowledge check, flashcards, cheat sheet, reading, next steps) | 405 of 405 |
| Capstone gates | 4 of 4 |
| Level exams and final exam | 5 of 5, from a bank of 412 questions |
| Learning paths | 3 of 3 |
| Reference pages | Hub, glossary (102 terms), cheat sheets (45), resources (154 sources), components |
| Diagrams | 117 |
| Interactive component instances in modules | 406, built from 49 components |
| Graded questions in modules | 687 |
| Lab steps | 316 |
| Estimated study time | 99.5 hours (calculated by `tools/estimate-hours.py`), plus capstones and exams |

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
| C1 Environment setup | 5/5 | 9/9 | 4 | 9 | 16 | 7 | 8 Nov 2026 |
| C2 Project anatomy | 4/4 | 9/9 | 2 | 8 | 15 | 6 | 8 Nov 2026 |
| C3 Rendering and decoration | 4/4 | 9/9 | 3 | 8 | 15 | 7 | 8 Nov 2026 |
| C4 Building blocks | 9/9 | 9/9 | 2 | 13 | 20 | 8 | 8 Nov 2026 |
| C5 Styling | 5/5 | 9/9 | 2 | 9 | 16 | 7 | 8 Nov 2026 |
| C6 Performance engineering | 6/6 | 9/9 | 4 | 10 | 17 | 7 | 8 Nov 2026 |
| C7 Universal Editor development | 7/7 | 9/9 | 3 | 11 | 18 | 8 | 8 Nov 2026 |
| C8 Data-driven development | 5/5 | 9/9 | 1 | 9 | 16 | 7 | 8 Nov 2026 |
| C9 Integrations | 4/4 | 9/9 | 4 | 8 | 15 | 7 | 8 Nov 2026 |
| C10 Testing and code quality | 5/5 | 9/9 | 2 | 10 | 16 | 8 | 8 Nov 2026 |
| C11 Advanced developer tooling | 5/5 | 9/9 | 2 | 9 | 16 | 7 | 8 Nov 2026 |
| D1 Project setup and onboarding | 4/4 | 9/9 | 1 | 9 | 15 | 7 | 9 Nov 2026 |
| D2 Configuration service | 4/4 | 9/9 | 2 | 9 | 15 | 7 | 9 Nov 2026 |
| D3 Domains, CDN and go-live | 6/6 | 9/9 | 3 | 10 | 17 | 8 | 9 Nov 2026 |
| D4 Security and access | 5/5 | 9/9 | 2 | 9 | 16 | 8 | 9 Nov 2026 |
| D5 Environments and release management | 4/4 | 9/9 | 3 | 9 | 15 | 8 | 9 Nov 2026 |
| D6 Migration to EDS | 6/6 | 9/9 | 1 | 12 | 17 | 8 | 9 Nov 2026 |
| D7 Monitoring and observability | 5/5 | 9/9 | 1 | 10 | 16 | 7 | 9 Nov 2026 |
| D8 SEO and discoverability operations | 3/3 | 9/9 | 1 | 7 | 14 | 7 | 9 Nov 2026 |
| D9 Governance and operating model | 5/5 | 9/9 | 1 | 10 | 16 | 7 | 9 Nov 2026 |
| D10 Enterprise architecture | 5/5 | 9/9 | 1 | 10 | 16 | 7 | 9 Nov 2026 |
| E1 Experimentation | 2/2 | 9/9 | 1 | 7 | 13 | 7 | 9 Nov 2026 |
| E2 Personalization | 2/2 | 9/9 | 1 | 6 | 13 | 7 | 9 Nov 2026 |
| E3 Commerce | 2/2 | 9/9 | 1 | 6 | 13 | 7 | 9 Nov 2026 |
| E4 Forms | 2/2 | 9/9 | 1 | 7 | 13 | 8 | 9 Nov 2026 |
| E5 Structured content | 2/2 | 9/9 | 1 | 6 | 13 | 7 | 9 Nov 2026 |
| E6 AI and automation | 3/3 | 9/9 | 2 | 8 | 14 | 7 | 9 Nov 2026 |
| E7 Expert accessibility | 1/1 | 9/9 | 0 | 5 | 12 | 7 | 9 Nov 2026 |
| E8 Authoring tool extensions | 1/1 | 9/9 | 0 | 5 | 12 | 7 | 9 Nov 2026 |
| E9 Performance at scale | 1/1 | 9/9 | 1 | 5 | 12 | 7 | 9 Nov 2026 |
| E10 Community and contribution | 1/1 | 9/9 | 0 | 7 | 12 | 7 | 9 Nov 2026 |
