#!/usr/bin/env python3
"""Builds data/search-index.json from the syllabus, glossary and built pages.

Run from the eds-academy folder after adding or changing pages:
    python3 tools/build-search-index.py
It also validates every JSON block inside pages and checks that each built module
page has one section per syllabus topic, printing anything missing."""
import json, re, sys
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
syl = json.loads((ROOT / 'data/syllabus.json').read_text())
glo = json.loads((ROOT / 'data/glossary.json').read_text())


class Page(HTMLParser):
    """Collects topic sections (id, first concept paragraph) and module parts."""
    def __init__(self):
        super().__init__(); self.sections = {}; self.cur = None; self.in_concept = False
        self.in_p = False; self.buf = ''; self.depth = 0; self.concept_depth = None; self.json_blocks = []; self.in_json = False
    def handle_starttag(self, tag, attrs):
        a = dict(attrs); self.depth += 1
        if tag == 'section' and a.get('id'):
            self.cur = a['id']; self.sections[self.cur] = {'cls': a.get('class', ''), 'toc': a.get('data-toc', ''), 'snippet': ''}
        if a.get('data-part') == 'concept': self.in_concept = True; self.concept_depth = self.depth
        if tag == 'p' and self.in_concept and self.cur and not self.sections[self.cur]['snippet']: self.in_p = True; self.buf = ''
        if tag == 'script' and a.get('type') == 'application/json': self.in_json = True; self.buf = ''
    def handle_endtag(self, tag):
        if tag == 'p' and self.in_p: self.in_p = False; self.sections[self.cur]['snippet'] = re.sub(r'\s+', ' ', self.buf).strip()[:180]
        if tag == 'script' and self.in_json: self.in_json = False; self.json_blocks.append(self.buf)
        if self.in_concept and self.depth == self.concept_depth: self.in_concept = False
        self.depth -= 1
    def handle_data(self, data):
        if self.in_p or self.in_json: self.buf += data
    def handle_startendtag(self, tag, attrs):
        self.depth += 1; self.depth -= 1


items, problems = [], []
for m in syl['modules']:
    page = ROOT / m['page']
    parsed = None
    if m['built']:
        if not page.exists():
            problems.append(f"{m['id']}: marked built but {m['page']} is missing"); continue
        parsed = Page(); parsed.feed(page.read_text())
        for i, block in enumerate(parsed.json_blocks):
            try: json.loads(block)
            except json.JSONDecodeError as e: problems.append(f"{m['id']}: JSON block {i + 1} invalid: {e}")
        for t in m['topics']:
            if t['id'] not in parsed.sections: problems.append(f"{m['id']}: no section for topic '{t['id']}'")
    items.append({'k': 'module', 't': f"{m['id']} {m['name']}", 'u': m['page'], 'm': m['id'], 'x': f"{m['signature']} · {len(m['topics'])} topics", 'built': m['built']})
    for t in m['topics']:
        snip = parsed.sections.get(t['id'], {}).get('snippet', '') if parsed else ''
        items.append({'k': 'topic', 't': t['name'], 'u': f"{m['page']}#{t['id']}", 'm': m['id'], 'x': snip or f"L{t['level']} topic in {m['name']}", 'built': m['built']})
    if parsed:
        for sid, s in parsed.sections.items():
            if 'mpart' in s['cls'] and sid in ('lab', 'signature', 'cheat-sheet'):
                items.append({'k': 'practice', 't': f"{m['id']} {s['toc']}", 'u': f"{m['page']}#{sid}", 'm': m['id'], 'x': '', 'built': True})
for g in glo['terms']:
    mod = syl and next((x for x in syl['modules'] if x['id'] == g['module']), None)
    items.append({'k': 'term', 't': g['term'] + (f" ({g['full']})" if g['full'] else ''), 'u': (mod['page'] if mod and mod['built'] else 'index.html#course-map'), 'm': g['module'], 'x': g['def'], 'built': bool(mod and mod['built'])})
for p, t, x in [('start-here.html', 'Start here: how the course works', 'Tracks, levels, module anatomy, tool setup, progress'), ('reference/components.html', 'Component showcase', 'Every interactive component with its markup'), ('index.html#course-map', 'Course map', 'All 45 modules by category and level'), ('index.html#progress', 'Your progress: export, import, reset', 'Back up or move progress')]:
    items.append({'k': 'page', 't': t, 'u': p, 'm': '', 'x': x, 'built': True})
for pth in ['index.html', 'start-here.html', 'reference/components.html']:
    pp = Page(); pp.feed((ROOT / pth).read_text())
    for i, block in enumerate(pp.json_blocks):
        try: json.loads(block)
        except json.JSONDecodeError as e: problems.append(f"{pth}: JSON block {i + 1} invalid: {e}")

(ROOT / 'data/search-index.json').write_text(json.dumps({'asOf': syl['asOf'], 'items': items}, ensure_ascii=False))
print(f"search-index.json: {len(items)} items")
if problems:
    print('PROBLEMS:'); [print(' -', p) for p in problems]; sys.exit(1)
print('All built pages cover their syllabus topics; all JSON blocks parse.')
