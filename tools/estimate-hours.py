#!/usr/bin/env python3
"""Sets each module's study time in data/syllabus.json from what the page actually contains.

Minutes = words / 150 + 3 per topic (studying its diagram and example) + 0.75 per quiz question
+ 5 per flashcard deck + 8 per other interactive + the lab's stated time, rounded to the nearest half hour.
Capstones and exams are not included.

Run after changing a module's content: python3 tools/estimate-hours.py
With --check it changes nothing and exits 1 if the hours or the home page total are out of date."""
import collections, json, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SYL, HOME = ROOT / 'data/syllabus.json', ROOT / 'index.html'
QUIZ = r'data-component="quiz"[^>]*><script type="application/json">(.*?)</script>'
TOTAL = re.compile(r'(<span id="total-hours">)[\d.]+(</span>)')
TOPICS = re.compile(r'(<span id="total-topics">)\d+(</span>)')
raw = SYL.read_text()
syl = json.loads(raw)
problems = []


def minutes(m):
    html = (ROOT / m['page']).read_text()
    no_code = re.sub(r'<(script|style)[\s\S]*?</\1>', '', html)
    main = no_code[no_code.find('<main'):no_code.find('</main>')]
    words = len(re.sub(r'<[^>]+>', ' ', main).split())
    lab = re.search(r'Time\s+About\s+([\d.]+)\s*(hour|min)', re.sub(r'<[^>]+>', ' ', html))
    if not lab:
        problems.append(f"{m['id']}: lab time not found")
        return 0
    lab_min = float(lab[1]) * (60 if lab[2] == 'hour' else 1)
    used = collections.Counter(re.findall(r'data-component="([\w-]+)"', html))
    questions = sum(len(json.loads(b.replace('<\\/', '</'))['questions']) for b in re.findall(QUIZ, html, re.S))
    others = sum(n for name, n in used.items() if name not in ('quiz', 'flashcards'))
    return words / 150 + 3 * len(m['topics']) + 0.75 * questions + 5 * used['flashcards'] + 8 * others + lab_min


def tidy(x):
    return int(x) if float(x).is_integer() else x


for m in syl['modules']:
    if m['built']:
        m['hours'] = tidy(max(1, round(minutes(m) / 30) / 2))
total = tidy(sum(m['hours'] for m in syl['modules']))
for p in problems:
    print(' -', p)
if problems:
    sys.exit(1)
out = json.dumps(syl, indent=1, ensure_ascii=False) + '\n'
home = HOME.read_text()
if not TOTAL.search(home):
    sys.exit('index.html: total-hours element not found')
new_home = TOTAL.sub(rf'\g<1>{total}\g<2>', home)
new_home = TOPICS.sub(rf"\g<1>{sum(len(m['topics']) for m in syl['modules'])}\g<2>", new_home)
if '--check' in sys.argv:
    if raw != out or home != new_home:
        print('study hours are out of date: run python3 tools/estimate-hours.py')
        sys.exit(1)
    print(f'study hours: {total} current')
else:
    SYL.write_text(out)
    HOME.write_text(new_home)
    print(f'study hours: {total}')
