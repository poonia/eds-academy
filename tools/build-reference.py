#!/usr/bin/env python3
"""Generates learning path pages and the reference section from the syllabus, glossary and modules.

Run after changing a module's cheat sheet or further reading, the glossary or the paths:
    python3 tools/build-reference.py && python3 tools/build-site-meta.py
With --check it changes nothing and exits 1 if a generated page is out of date."""
import html, json, re, sys
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent.parent
FONT = 'https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400&family=JetBrains+Mono:wght@500;600;700&family=Schibsted+Grotesk:wght@600;700;800&display=swap'
META = re.compile(r'<!-- site-meta -->.*?<!-- /site-meta -->\n?', re.S)
AS_OF = '9 November 2026'
syl = json.loads((ROOT / 'data/syllabus.json').read_text())
glossary = json.loads((ROOT / 'data/glossary.json').read_text())['terms']
modules = {m['id']: m for m in syl['modules']}
cats = {c['id']: c['name'] for c in syl['categories']}
esc = lambda s: html.escape(s, quote=False)
attr = lambda s: html.escape(s, quote=True)
out = {}


def shell(path, title, desc, kind, body):
    out[path] = f'''<!doctype html>
<html lang="en-CA">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{esc(title)} · EDS Academy</title>
<meta name="description" content="{attr(desc)}">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="{FONT}">
<link rel="stylesheet" href="../assets/css/academy.css">
<script>try{{var t=localStorage.getItem('eds-academy-theme');if(t)document.documentElement.dataset.theme=t}}catch(e){{}}</script>
<script type="module" src="../assets/js/academy.js"></script>
</head>
<body data-page="{kind}">
<main id="main">
{body}
</main>
</body>
</html>
'''


def hero(trail, trail_href, title, lead):
    return f'''<section class="page-hero"><div class="wrap">
    <nav class="crumbs" aria-label="Breadcrumb"><a href="../index.html">Home</a> <span aria-hidden="true">/</span> <a href="{trail_href}">{trail}</a></nav>
    <h1>{esc(title)}</h1>
    <p class="lead">{lead}</p>
  </div></section>'''


def band(body, title='', sub=''):
    head = f'<div class="sec-head"><h2>{title}</h2>' + (f'<p>{sub}</p>' if sub else '') + '</div>' if title else ''
    return f'<section class="band"><div class="wrap">{head}{body}</div></section>'


# Learning paths
for path in syl['paths']:
    flat = path['phases']
    ids = [i for ph in flat for i in ph]
    hours = sum(modules[i]['hours'] for i in ids)
    parts = []
    for n, phase in enumerate(flat, 1):
        rows = []
        for i in phase:
            m = modules[i]
            extra = [p for p in m['pre'] if p not in ids]
            need = ''
            if extra:
                need = '<span class="pp-need">Also needs, not on this path: ' + ', '.join(f'<a href="../{modules[p]["page"]}">{p} {esc(modules[p]["name"])}</a>' for p in extra) + '</span>'
            rows.append(f'<li data-m="{i}"><span class="pp-main"><a href="../{m["page"]}"><code>{i}</code> {esc(m["name"])}</a><span class="muted">{m["hours"]} h</span>{need}</span></li>')
        gate = next(g for g in syl['gates'] if g['level'] == n)
        exam = next(x for x in syl['exams'] if x['scope'] == n)
        rows.append(f'<li data-gate="{n}" class="pp-gate"><span class="pp-main"><a href="../{gate["page"]}">Capstone: {esc(gate["title"])}</a></span></li>')
        rows.append(f'<li data-exam="{n}" class="pp-gate"><span class="pp-main"><a href="../{exam["page"]}">{esc(exam["title"])}</a></span></li>')
        parts.append(f'<section class="pp-phase"><h2>Level {n}: {esc(syl["levels"][str(n)])}</h2><ol class="pp-list">{"".join(rows)}</ol></section>')
    final = next(x for x in syl['exams'] if x['scope'] == 'final')
    parts.append(f'<section class="pp-phase"><h2>Finish</h2><ol class="pp-list"><li data-exam="final" class="pp-gate"><span class="pp-main"><a href="../{final["page"]}">{esc(final["title"])}</a></span></li></ol></section>')
    missing = sum(1 for i in ids for p in modules[i]['pre'] if p not in ids)
    note = f'<aside class="callout tip" data-label="Prerequisites"><p>This path is a suggested order. {missing} prerequisites sit outside it and are flagged where they apply. Read them first if the topic is new to you.</p></aside>'
    body = hero('Learning paths', '../index.html#paths', f'{path["name"]} path', f'{esc(path["who"])}. {len(ids)} modules and about {hours} hours, with a capstone and an exam at each level.')
    body += band(f'{note}<div data-component="path-progress" data-path="{path["id"]}">{"".join(parts)}</div>')
    shell(path['page'], f'{path["name"]} path', f'The {path["name"].lower()} path through EDS Academy: {len(ids)} modules in four levels, with capstones and exams.', 'paths', body)

# Glossary
groups = {}
for term in glossary:
    first = term['term'][0].upper()
    groups.setdefault(first if first.isalpha() else '#', []).append(term)
letters = sorted(groups)
jump = '<nav class="az" aria-label="Jump to letter">' + ''.join(f'<a href="#letter-{"sym" if k == "#" else k.lower()}">{k}</a>' for k in letters) + '</nav>'
sections = []
for k in letters:
    items = []
    for t in groups[k]:
        m = modules.get(t['module'])
        name = esc(t['term']) + (f' <span class="muted">({esc(t["full"])})</span>' if t['full'] else '')
        where = f' <a href="../{m["page"]}">{m["id"]}</a>' if m else ''
        items.append(f'<div data-item data-cat="{m["cat"] if m else ""}" id="{t["id"]}" class="gl-item"><dt>{name}</dt><dd>{esc(t["def"])}{where}</dd></div>')
    sections.append(f'<section data-group><h2 id="letter-{"sym" if k == "#" else k.lower()}">{k}</h2><dl>{"".join(items)}</dl></section>')
body = hero('Reference', 'index.html', 'Glossary', f'{len(glossary)} Edge Delivery Services terms, each linked to the module that teaches it.')
body += band(jump + f'<div data-component="filter-list" data-placeholder="Search terms" data-cat-label="Taught in" data-cats=\'{attr(json.dumps(cats, ensure_ascii=False))}\'>{"".join(sections)}</div>')
shell('reference/glossary.html', 'Glossary', 'Edge Delivery Services terms in plain language, linked to the modules that teach them.', 'reference', body)

# Cheat sheets and resources, extracted from the module pages
sheets, links, seen = [], {}, {}
for m in syl['modules']:
    text = (ROOT / m['page']).read_text()
    sheet = re.search(r'<div class="cheat">\s*<h3>.*?</h3>\s*(<div class="cheat-grid">.*?</div>)\s*</div>\s*</section>', text, re.S)
    if not sheet:
        sys.exit(f"{m['id']}: cheat sheet not found")
    sheets.append(f'<div data-item data-cat="{m["cat"]}" id="{m["id"].lower()}" class="cheat cs-item"><h2><a href="../{m["page"]}#cheat-sheet"><code>{m["id"]}</code> {esc(m["name"])}</a></h2>{sheet.group(1).replace("<h4>", "<h3>").replace("</h4>", "</h3>")}</div>')
    reading = re.search(r'id="further-reading".*?</section>', text, re.S).group(0)
    for url, title in re.findall(r'<a href="(https?://[^"]+)"[^>]*>([^<]+)</a>', reading):
        url = html.unescape(url).replace('https://aem.live', 'https://www.aem.live')
        key = url.rstrip('/').removesuffix('.html')
        entry = links[seen.setdefault(key, url)] if key in seen else links.setdefault(seen.setdefault(key, url), {'title': html.unescape(title), 'mods': []})
        if m['id'] not in entry['mods']:
            entry['mods'].append(m['id'])
body = hero('Reference', 'index.html', 'Cheat sheets', f'All {len(sheets)} module cheat sheets on one page. Filter them, then print what you need.')
body += band(f'<div data-component="filter-list" data-print="true" data-placeholder="Search cheat sheets" data-cat-label="Category" data-cats=\'{attr(json.dumps(cats, ensure_ascii=False))}\'><div class="cs-list">{"".join(sheets)}</div></div>')
shell('reference/cheat-sheets.html', 'Cheat sheets', 'Printable cheat sheets for every EDS Academy module.', 'reference', body)


def source(url):
    host = urlparse(url).netloc
    if host == 'www.aem.live':
        return 'aem'
    if host.endswith('adobe.com'):
        return 'adobe'
    if host == 'github.com':
        return 'github'
    return 'web'


SOURCES = {'aem': 'aem.live documentation', 'adobe': 'Adobe Experience League and developer sites', 'github': 'GitHub repositories', 'web': 'Standards and other sources'}
sections = []
for key, label in SOURCES.items():
    rows = sorted(((u, e) for u, e in links.items() if source(u) == key), key=lambda x: x[1]['title'].lower())
    items = []
    for url, e in rows:
        title = re.sub(r'^(aem\.live|Adobe|GitHub|W3C|Ontario|Adobe Developer|web\.dev): ', '', e['title'])
        used = ', '.join(f'<a href="../{modules[i]["page"]}#further-reading">{i}</a>' for i in e['mods'])
        items.append(f'<li data-item data-cat="{key}"><a href="{attr(url)}" rel="noopener" target="_blank">{esc(title)}</a> <span class="muted">Used in {used}</span></li>')
    sections.append(f'<section data-group><h2>{label}</h2><ul class="res-list">{"".join(items)}</ul></section>')
body = hero('Reference', 'index.html', 'Resources', f'{len(links)} external sources used across the course, with the modules that cite them. Links were last checked on {AS_OF}.')
body += band(f'<aside class="callout update" data-label="Unofficial"><p>EDS Academy is a learning resource, and it is not official Adobe documentation. When sources disagree, follow Adobe’s current documentation.</p></aside><div data-component="filter-list" data-placeholder="Search resources" data-cat-label="Source" data-cats=\'{attr(json.dumps(SOURCES, ensure_ascii=False))}\'>{"".join(sections)}</div>')
shell('reference/resources.html', 'Resources', 'External documentation and sources used across EDS Academy.', 'reference', body)

cards = [('glossary.html', 'Glossary', f'{len(glossary)} terms, each linked to the module that teaches it.'), ('cheat-sheets.html', 'Cheat sheets', f'{len(sheets)} printable one-page summaries.'), ('resources.html', 'Resources', f'{len(links)} external sources, grouped by publisher.'), ('components.html', 'Components', 'Every interactive component in the course, with its markup.')]
grid = '<div class="grid-3">' + ''.join(f'<a class="card ref-card" href="{u}"><h2>{t}</h2><p class="muted" style="margin:0">{d}</p></a>' for u, t, d in cards) + '</div>'
shell('reference/index.html', 'Reference', 'The EDS Academy glossary, cheat sheets, resources and component showcase.', 'reference', hero('Reference', 'index.html', 'Reference', 'Look something up without going back through a module.') + band(grid))

json_links = [{'t': re.sub(r'^(aem\.live|Adobe|GitHub|W3C|Ontario|Adobe Developer|web\.dev): ', '', e['title']), 'u': u, 'x': 'Used in ' + ', '.join(e['mods'])} for u, e in sorted(links.items())]
out['data/resources.json'] = json.dumps({'links': json_links}, ensure_ascii=False, indent=0) + '\n'

stale = []
for path, text in out.items():
    target = ROOT / path
    if '--check' in sys.argv:
        if not target.exists() or META.sub('', target.read_text()) != text:
            stale.append(path)
    else:
        target.parent.mkdir(exist_ok=True)
        keep = META.search(target.read_text()) if target.exists() else None
        if keep:
            text = text.replace('<link rel="preconnect"', keep.group(0) + '<link rel="preconnect"', 1)
        target.write_text(text)
if stale:
    print('generated pages are out of date: run python3 tools/build-reference.py')
    for path in stale:
        print(' -', path)
    sys.exit(1)
print(f'reference: {len(out)} files {"current" if "--check" in sys.argv else "written"}, {len(links)} links, {len(glossary)} terms')
