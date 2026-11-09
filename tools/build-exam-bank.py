#!/usr/bin/env python3
"""Builds data/exam-bank.json from every module's knowledge check and data/exam-scenarios.json.

Run after changing a module's quiz or an exam scenario: python3 tools/build-exam-bank.py
With --check it changes nothing and exits 1 if the bank is out of date or a question is invalid."""
import json, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BANK = ROOT / 'data/exam-bank.json'
syl = json.loads((ROOT / 'data/syllabus.json').read_text())
ids = {m['id'] for m in syl['modules']}
scopes = {x['scope'] for x in syl['exams']}
overlay = json.loads((ROOT / 'data/exam-scenarios.json').read_text())
used = set()
questions, problems = [], []


def valid(q, where):
    n = len(q['options'])
    answers = q['answer'] if isinstance(q['answer'], list) else [q['answer']]
    if n < 2 or len(set(q['options'])) != n:
        problems.append(f'{where}: options are missing or repeated: {q["q"][:50]}')
    if not answers or not all(isinstance(a, int) and 0 <= a < n for a in answers):
        problems.append(f'{where}: answer is out of range: {q["q"][:50]}')
    if not q.get('explain'):
        problems.append(f'{where}: no explanation: {q["q"][:50]}')


for m in syl['modules']:
    if not m['built']:
        continue
    text = (ROOT / m['page']).read_text()
    block = re.search(r'data-id="%s-check"><script type="application/json">(.*?)</script>' % m['id'].lower(), text, re.S)
    if not block:
        block = re.search(r'id="knowledge-check".*?<script type="application/json">\s*(.*?)</script>', text, re.S)
    if not block:
        problems.append(f"{m['id']}: knowledge check not found")
        continue
    for q in json.loads(block.group(1).replace('<\\/', '</'))['questions']:
        valid(q, m['id'])
        text_q = q['q']
        for table in ('rewrite', 'explain', 'exclude'):
            if text_q in overlay[table]:
                used.add((table, text_q))
        if text_q in overlay['exclude']:
            continue
        questions.append({'q': overlay['rewrite'].get(text_q, text_q), 'options': q['options'], 'answer': q['answer'], 'explain': overlay['explain'].get(text_q, q['explain']), 'm': m['id']})

for table in ('rewrite', 'explain', 'exclude'):
    for text_q in overlay[table]:
        if (table, text_q) not in used:
            problems.append(f'exam-scenarios: {table} entry matches no module question: {text_q[:50]}')

for q in overlay['questions']:
    valid(q, 'exam-scenarios')
    if q['m'] not in ids or q['scope'] not in scopes:
        problems.append(f'exam-scenarios: bad module or scope: {q["q"][:50]}')
    questions.append(q)

for x in syl['exams']:
    pool = [q for q in questions if ('scope' in q and (x['scope'] == 'final' or q['scope'] == x['scope'])) or ('scope' not in q and (x['scope'] == 'final' or any(m['id'] == q['m'] and m['levels'][0] <= x['scope'] <= m['levels'][1] for m in syl['modules'])))]
    if len(pool) < x['draw']:
        problems.append(f"{x['title']}: only {len(pool)} questions for a draw of {x['draw']}")

output = json.dumps({'questions': questions}, ensure_ascii=False, separators=(',', ':')) + '\n'
for p in problems:
    print(' -', p)
if problems:
    sys.exit(1)
if '--check' in sys.argv:
    if not BANK.exists() or BANK.read_text() != output:
        print('exam bank is out of date: run python3 tools/build-exam-bank.py')
        sys.exit(1)
    print(f'exam bank: {len(questions)} questions current')
else:
    BANK.write_text(output)
    print(f'exam-bank.json: {len(questions)} questions')
