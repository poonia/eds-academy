#!/usr/bin/env python3
"""Writes the shared head tags on every published page and regenerates sitemap.xml.

Run from anywhere after adding a page or changing a title or description:
    python3 tools/build-site-meta.py
With --check it changes nothing and exits 1 if any file is out of date."""
import html, json, re, sys
from pathlib import Path

SITE_URL = 'https://poonia.github.io/eds-academy/'
ROOT = Path(__file__).resolve().parent.parent
START, END = '<!-- site-meta -->', '<!-- /site-meta -->'
BLOCK = re.compile(re.escape(START) + r'.*?' + re.escape(END) + r'\n?', re.S)
DESCRIPTION = re.compile(r'<meta name="description" content="[^"]*">\n')

syl = json.loads((ROOT / 'data/syllabus.json').read_text())
pages = ['index.html', 'start-here.html', 'reference/components.html']
pages += [m['page'] for m in syl['modules'] if m['built']]
pages += [x['page'] for x in syl['gates'] + syl['exams'] if x['built']]
pages += [p['page'] for p in syl['paths']]
pages += ['reference/index.html', 'reference/glossary.html', 'reference/cheat-sheets.html', 'reference/resources.html']


def head_tags(path, text):
    title = re.search(r'<title>(.*?)</title>', text, re.S).group(1)
    desc = re.search(r'<meta name="description" content="([^"]*)">', text).group(1)
    up = '../' * path.count('/')
    url = SITE_URL if path == 'index.html' else SITE_URL + path
    return '\n'.join([
        START,
        f'<link rel="icon" href="{up}assets/images/favicon.svg" type="image/svg+xml">',
        f'<link rel="canonical" href="{url}">',
        '<meta name="theme-color" content="#f4f6f9" media="(prefers-color-scheme: light)">',
        '<meta name="theme-color" content="#0d1218" media="(prefers-color-scheme: dark)">',
        '<meta property="og:type" content="website">',
        '<meta property="og:site_name" content="EDS Academy">',
        f'<meta property="og:title" content="{title}">',
        f'<meta property="og:description" content="{desc}">',
        f'<meta property="og:url" content="{url}">',
        f'<meta property="og:image" content="{SITE_URL}assets/images/share.png">',
        '<meta property="og:image:width" content="1200">',
        '<meta property="og:image:height" content="630">',
        '<meta property="og:image:alt" content="EDS Academy: a self-paced course on Adobe Edge Delivery Services">',
        '<meta name="twitter:card" content="summary_large_image">',
        END,
    ]) + '\n'


def with_tags(path, text):
    tags = head_tags(path, text)
    if START in text:
        return BLOCK.sub(lambda _: tags, text, count=1)
    match = DESCRIPTION.search(text)
    if not match:
        sys.exit(f'{path}: no <meta name="description"> line to anchor the tags')
    return text[:match.end()] + tags + text[match.end():]


def sitemap():
    urls = [SITE_URL if p == 'index.html' else SITE_URL + p for p in pages]
    entries = ''.join(f'  <url><loc>{html.escape(u)}</loc></url>\n' for u in urls)
    return ('<?xml version="1.0" encoding="UTF-8"?>\n'
            '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
            f'{entries}</urlset>\n')


check = '--check' in sys.argv
stale = []
outputs = {p: with_tags(p, (ROOT / p).read_text()) for p in pages}
outputs['sitemap.xml'] = sitemap()
for name, new in outputs.items():
    target = ROOT / name
    if target.exists() and target.read_text() == new:
        continue
    stale.append(name)
    if not check:
        target.write_text(new)

if check and stale:
    print('Out of date, run python3 tools/build-site-meta.py:')
    for name in stale:
        print(' -', name)
    sys.exit(1)
print(f'site meta: {len(pages)} pages, {len(stale)} updated' if not check else f'site meta: {len(pages)} pages current')
