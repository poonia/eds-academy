#!/usr/bin/env python3
"""Fails if quiz answers can be guessed from their length.

Measures how often the correct option is the only longest one, in module quizzes and in the exam bank.
With 3 or 4 options, chance is 25 to 33 percent. The range allows natural variation, and its floor stops "the long one is wrong" becoming a cue."""
import glob, json, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LIMIT = 40
FLOOR = 15
QUIZ = r'data-component="quiz"[^>]*><script type="application/json">(.*?)</script>'


def rate(questions):
    single = [q for q in questions if isinstance(q['answer'], int)]
    hits = 0
    for q in single:
        size = [len(o) for o in q['options']]
        hits += size[q['answer']] == max(size) and size.count(max(size)) == 1
    return hits, len(single), round(100 * hits / len(single), 1)


module = []
for page in glob.glob(str(ROOT / 'modules/*.html')):
    for block in re.findall(QUIZ, Path(page).read_text(), re.S):
        module += json.loads(block.replace('<\\/', '</'))['questions']
exam = json.loads((ROOT / 'data/exam-bank.json').read_text())['questions']
failed = False
for name, questions in (('module quizzes', module), ('exam bank', exam)):
    hits, total, pct = rate(questions)
    print(f'quiz quality: {name}: correct option is uniquely longest in {hits} of {total} ({pct}%)')
    failed |= not FLOOR <= pct <= LIMIT
if failed:
    print(f'quiz quality: outside {FLOOR} to {LIMIT}%. Rewrite options so length does not reveal the answer.')
    sys.exit(1)
