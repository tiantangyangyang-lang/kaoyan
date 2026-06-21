#!/usr/bin/env python3
"""Fix math1-2002 staging: extract answers and explanations from bundled blocks."""
import json
import re
from pathlib import Path

# Paths
SOL_PATH = Path(r"D:\work\kaoyan\content\reports\agent-runs\20260617-204620-cc-math1-year-2002\source-mirror\Kaoyan-Math1-Papers\solutions\2002年解析\2002年解析.md")
QUESTIONS_PATH = Path(r"D:\work\kaoyan\content\staging\math1\2002\questions.json")

# Read source solution
sol_text = SOL_PATH.read_text(encoding="utf-8")

# Split solution into per-question blocks
# Solution uses absolute numbering: (1)-(5) for fill-in, (6)-(10) for MC, (11)-(20) for free-response
# Markers: "(N)【答案】", "（N）【答案】", "(N)【解】", "（N）【解】"
pattern = r'(?:^|\n)([（(])(\d+)([）)])\s*【(答案|解)】'
matches = list(re.finditer(pattern, sol_text, re.MULTILINE))

sol_blocks = {}
for i, m in enumerate(matches):
    num = int(m.group(2))
    start = m.start() + 1  # skip newline
    end = matches[i+1].start() if i+1 < len(matches) else len(sol_text)
    block = sol_text[start:end].strip()
    if num not in sol_blocks:
        sol_blocks[num] = block

print(f"Extracted {len(sol_blocks)} solution blocks: {sorted(sol_blocks.keys())}")

# Answers from solution file (verified against source)
answers = {
    1: "1.",
    2: "-2.",
    3: r"$y = \sqrt{x + 1}$ .",
    4: "2.",
    5: "4.",
    6: "（A）.",
    7: "(C).",
    8: "（B）.",
    9: "（B）.",
    10: "(D).",
}

# Read questions
with open(QUESTIONS_PATH, "r", encoding="utf-8") as f:
    data = json.load(f)

# Map stableId to absolute question number
abs_map = {
    f"math1-2002-q{n:02d}": n for n in range(1, 21)
}

# Fix each question
for q in data["questions"]:
    stable_id = q["stableId"]
    abs_num = abs_map.get(stable_id)
    if abs_num is None:
        continue

    # Assign explanation from solution file
    if abs_num in sol_blocks:
        q["explanationCandidate"] = sol_blocks[abs_num]
        q["explanationStatus"] = "candidate_from_solutions"

    # Assign answer
    if abs_num in answers:
        q["answerCandidate"] = answers[abs_num]
        q["answerStatus"] = "candidate_from_solutions"

    # Clear anomalies for q01-q10 (previously had missing_solution warnings)
    if abs_num <= 10:
        q["anomalies"] = []

# Fix q09 options - correct image mapping from paper
q09 = next(q for q in data["questions"] if q["stableId"] == "math1-2002-q09")
q09["options"] = [
    {"label": "A", "value": "![](images/5a83b0446d5d8be79a045e814853bc7c8100c050854275d5d10f62e99d7d957a.jpg)"},
    {"label": "B", "value": "![](images/8127aa31eb9b732b4b21f0f9cef9fb714092b8e440718188c6f9f5e6bca799ea.jpg)"},
    {"label": "C", "value": "![](images/6a75d47c3f3e7e51ebaa752538b7c072f125f4e206a99dc4cf9ded5b5eb9967e.jpg)"},
    {"label": "D", "value": "![](images/9e0f14659cf0e9e2d0d8f7fb57cbd30d2d222507d38b5194e452c67cb2205a15.jpg)"},
]

# Fix q10 options
q10 = next(q for q in data["questions"] if q["stableId"] == "math1-2002-q10")
q10["options"] = [
    {"label": "A", "value": r"$f_{1}(x) + f_{2}(x)$ 必为某一随机变量的概率密度"},
    {"label": "B", "value": r"$f_{1}(x)f_{2}(x)$ 必为某一随机变量的概率密度."},
    {"label": "C", "value": r"$F_{1}(x) + F_{2}(x)$ 必为某一随机变量的分布函数"},
    {"label": "D", "value": r"$F_{1}(x)F_{2}(x)$ 必为某一随机变量的分布函数"},
]

# Add OCR noise warning for q06
q06 = next(q for q in data["questions"] if q["stableId"] == "math1-2002-q06")
q06["anomalies"] = [{
    "type": "ocr_noise_in_stem",
    "severity": "warning",
    "message": "Stem contains garbled OCR text between properties ①② and ③④: repeated f(x,y) and x0,y0 fragments; source paper line 15",
}]

# Update validation
data["validation"]["totalAnomalies"] = 3
data["validation"]["anomaliesBySeverity"] = {"error": 0, "warning": 3, "info": 0}

# Write back
with open(QUESTIONS_PATH, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("Written fixed questions.json")

# Verify
with open(QUESTIONS_PATH, "r", encoding="utf-8") as f:
    verify = json.load(f)

missing_answers = sum(1 for q in verify["questions"] if q["answerStatus"] == "missing")
missing_explanations = sum(1 for q in verify["questions"] if q["explanationStatus"] == "missing")
print(f"Total questions: {len(verify['questions'])}")
print(f"Missing answers: {missing_answers} (expecting 0)")
print(f"Missing explanations: {missing_explanations} (expecting 0)")

if missing_answers == 0 and missing_explanations == 0:
    print("VERIFICATION PASSED")
else:
    print("VERIFICATION FAILED - check output")
    for q in verify["questions"]:
        if q["answerStatus"] == "missing" or q["explanationStatus"] == "missing":
            print(f"  {q['stableId']}: answer={q['answerStatus']}, explanation={q['explanationStatus']}")
