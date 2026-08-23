# -*- coding: utf-8 -*-
"""
공부별 학습앱 · 매일 문제 자동 생성기 (v3)
- 기준(BASE): questions_base.json  (앱에 내장된 전체 문제은행 = 3·4·5·6학년 학원수준 포함)
- 매일 추가: 학년별 새 연산 문제(무작위 숫자) — 무료, AI 불필요
- 출력: questions.json  (앱의 '클라우드 자동 업데이트'로 받아감)
- 중복 방지: (과목, 학년, 문제)가 같으면 추가하지 않음
정답(a)은 0부터: 0=첫째 보기, 1=둘째 …

사용법:
  같은 폴더에 questions_base.json 을 두고 실행하면 questions.json 이 만들어집니다.
    python generate_questions.py
"""
import json, os, random, datetime

HERE = os.path.dirname(os.path.abspath(__file__))
TODAY = datetime.date.today().isoformat()
random.seed(TODAY)

# ---------- 1) 기준 문제 불러오기 ----------
base_path = os.path.join(HERE, "questions_base.json")
try:
    with open(base_path, encoding="utf-8") as f:
        BASE = json.load(f)
    if not isinstance(BASE, list):
        BASE = []
except Exception:
    BASE = []

# ---------- 2) 매일 추가되는 연산 문제(무작위) ----------
def wrong_choices(ans, n=3, spread=6):
    opts = set(); tries = 0
    while len(opts) < n and tries < 100:
        tries += 1
        d = random.randint(-spread, spread)
        if d == 0: continue
        v = ans + d
        if v < 0 or v == ans: continue
        opts.add(v)
    while len(opts) < n:
        opts.add(ans + len(opts) + 1)
    return list(opts)

def make_mc(subject, g, unit, question, ans, src, spread=6):
    ans = int(ans)
    choices = wrong_choices(ans, 3, spread) + [ans]
    random.shuffle(choices)
    a = choices.index(ans)
    return {"subject": subject, "g": g, "u": unit, "q": question,
            "c": [str(x) for x in choices], "a": a, "e": f"정답은 {ans}!", "src": src}

def daily_math():
    out = []; src = f"매일 연산({TODAY})"
    for _ in range(4):
        a, b = random.randint(11, 39), random.randint(2, 9)
        out.append(make_mc("mat", 3, "곱셈", f"{a} × {b} = ?", a*b, src, 8))
    for _ in range(3):
        b = random.randint(2, 9); q = random.randint(2, 9)
        out.append(make_mc("mat", 3, "나눗셈", f"{b*q} ÷ {b} = ?", q, src, 5))
    for _ in range(4):
        a, b = random.randint(101, 499), random.randint(3, 9)
        out.append(make_mc("mat", 4, "곱셈과 나눗셈", f"{a} × {b} = ?", a*b, src, 20))
    for _ in range(4):
        a, b, c = random.randint(2, 9), random.randint(2, 9), random.randint(2, 9)
        out.append(make_mc("mat", 5, "자연수의 혼합 계산", f"{a} + {b} × {c} = ?", a+b*c, src, 10))
    for _ in range(3):
        q = random.randint(2, 9); d = random.choice([2, 4, 5])
        out.append(make_mc("mat", 6, "소수의 나눗셈", f"{(q*d)/10:.1f} ÷ {d/10:.1f} = ?", q, src, 5))
    for _ in range(3):
        whole = random.choice([50, 100, 200, 400]); part = whole // random.choice([2, 4, 5])
        out.append(make_mc("mat", 6, "비와 비율", f"전체 {whole} 중 {part} 은(는) 몇 %?", round(part/whole*100), src, 8))
    return out

# ---------- 3) 합치기(중복 제거) ----------
def key(o): return (o.get("subject"), o.get("g"), o.get("q"), tuple(o.get("c") or []), o.get("a"))
seen = set(); result = []
for o in BASE + daily_math():
    k = key(o)
    if k in seen: continue
    seen.add(k); result.append(o)

# ---------- 4) 저장 ----------
with open(os.path.join(HERE, "questions.json"), "w", encoding="utf-8") as f:
    json.dump(result, f, ensure_ascii=False)

by_grade = {}
for o in result: by_grade[o.get("g")] = by_grade.get(o.get("g"), 0) + 1
print(f"[{TODAY}] questions.json 생성 완료 · 총 {len(result)}문제")
print("학년별:", by_grade)
