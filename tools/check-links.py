#!/usr/bin/env python3
"""Checks local links with exact-case matching, as on GitHub Pages' case-sensitive hosts.

Run from anywhere: python3 tools/check-links.py
Covers href and src in HTML, url() in CSS, relative imports in JS, the component map,
built pages in the syllabus, and search index targets. Exits 1 on any problem."""
import json, os, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SKIP_DIRS = {'.git', '.claude', 'node_modules', 'test-results', 'playwright-report'}
EXTERNAL = ('http:', 'https:', 'mailto:', 'tel:', 'data:', 'javascript:', 'blob:', '//', '#')
SITE_PATH = '/eds-academy/'  # Only 404.html may use it: Pages serves that file at any depth.

files = set()
for folder, dirs, names in os.walk(ROOT):
    dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
    files.update((Path(folder) / n).relative_to(ROOT).as_posix() for n in names)

problems, checked = [], 0


def exists(path):
    return path in files or f'{path}/index.html'.lstrip('/') in files


def check(source, ref, base=None):
    """base is the folder the reference resolves from: the source's own folder by default."""
    global checked
    ref = ref.split('#')[0].split('?')[0]
    if not ref or ref.startswith(EXTERNAL):
        return
    checked += 1
    if ref.startswith('/'):
        if source == '404.html' and ref.startswith(SITE_PATH):
            ref = ref[len(SITE_PATH):] or 'index.html'
            if not exists(ref):
                problems.append(f'{source}: {ref} is missing or differs in case')
        else:
            problems.append(f'{source}: {ref} is root-absolute, which breaks under /eds-academy/')
        return
    start = os.path.dirname(source) if base is None else base
    target = os.path.normpath(os.path.join(start, ref))
    if target.startswith('..'):
        problems.append(f'{source}: {ref} escapes the site root')
    elif not exists(target):
        problems.append(f'{source}: {ref} is missing or differs in case')


def visible_html(text):
    """Removes code samples, and script bodies while keeping the opening tags that load files."""
    text = re.sub(r'<(pre|code|textarea)\b[^>]*>.*?</\1>', '', text, flags=re.S | re.I)
    return re.sub(r'(<script\b[^>]*>).*?</script>', r'\1', text, flags=re.S | re.I)


def read(path):
    return (ROOT / path).read_text(encoding='utf8')


for name in sorted(files):
    if name.startswith('project/'):
        continue
    if name.endswith('.html'):
        for ref in re.findall(r'''\b(?:href|src)=["']([^"']+)["']''', visible_html(read(name))):
            check(name, ref)
    elif name.endswith('.css'):
        for ref in re.findall(r'''url\(["']?([^"')]+)["']?\)''', read(name)):
            check(name, ref)
    elif name.endswith('.js') and name.startswith('assets/'):
        for ref in re.findall(r'''(?:from\s+|import\s*\()["'`](\.[^"'`$]+)["'`]''', read(name)):
            check(name, ref)

for component in re.findall(r"""['\w-]+:\s*'([\w-]+\.js)'""", read('assets/js/academy.js')):
    check('assets/js/academy.js', f'components/{component}')

syllabus = json.loads(read('data/syllabus.json'))
for module in syllabus['modules']:
    if module['built']:
        check('data/syllabus.json', module['page'], base='')

for item in json.loads(read('data/search-index.json'))['items']:
    if item.get('built') is not False:
        check('data/search-index.json', item['u'], base='')

print(f'links: {checked} local references checked, {len(problems)} problems')
for problem in sorted(set(problems)):
    print(' -', problem)
sys.exit(1 if problems else 0)
