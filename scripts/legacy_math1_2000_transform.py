#!/usr/bin/env python3
"""
Deterministic legacy parser for Math1 2000.
Converts legacy_section_based paper+solutions into structured JSON with hierarchical IDs.

Input: paper markdown, solution markdown
Output: questions.json, validation.json, anomalies.json, summary.md
"""

import json
import re
import hashlib
import os
import sys
from pathlib import Path

# ── Configuration ──────────────────────────────────────────────
SOURCE_MIRROR = Path(r"D:\work\kaoyan\content\reports\agent-runs\20260616-191126-cc-math1-year-2000\source-mirror\Kaoyan-Math1-Papers")
PAPER_PATH = SOURCE_MIRROR / "papers" / "2000年考研数学(一)真题.md"
SOLUTION_PATH = SOURCE_MIRROR / "solutions" / "2000年解析" / "2000年解析.md"
OUTPUT_DIR = Path(r"D:\work\kaoyan\content\staging\math1\2000")
REPORT_DIR = Path(r"D:\work\kaoyan\content\reports\math1-2000")

SOURCE_REPO = "Kaoyan-Math1-Papers"
SOURCE_COMMIT = "3151b4acf26ea19ccd427b869a715e65e1990091"
SOURCE_DIRTY = True
SUBJECT_CODE = "math1"
SOURCE_YEAR = 2000
TRANSFORM_VERSION = "math1-legacy-transform-v2"

# ── Helper functions ───────────────────────────────────────────
def compute_sha256(path):
    """Compute SHA-256 hash of a file."""
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            h.update(chunk)
    return h.hexdigest().upper()

def read_file(path):
    """Read file as text."""
    with open(path, "r", encoding="utf-8") as f:
        return f.read()

# ── Paper Parsing: Section-based ───────────────────────────────
# Chinese numerals for sections
CN_NUMERALS = {
    "一": 1, "二": 2, "三": 3, "四": 4, "五": 5,
    "六": 6, "七": 7, "八": 8, "九": 9, "十": 10,
    "十一": 11, "十二": 12, "十三": 13
}

def parse_paper_sections(text):
    """
    Parse paper into major sections (一, 二, ..., 十三).
    Returns list of dicts: {section_num, label, title, content, sub_questions}
    """
    # Split on section headers: # 一、... or # 十一、...
    # Pattern: # + space + CN numeral + 、 + rest
    section_pattern = re.compile(
        r'^#\s+(一|二|三|四|五|六|七|八|九|十|十一|十二|十三)、(.+)$',
        re.MULTILINE
    )

    # Find all section boundaries
    matches = list(section_pattern.finditer(text))

    sections = []
    for i, m in enumerate(matches):
        cn_num = m.group(1)
        title = m.group(2).strip()
        section_num = CN_NUMERALS[cn_num]

        start = m.end()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        content = text[start:end].strip()

        sections.append({
            "section_num": section_num,
            "cn_label": cn_num,
            "title": title,
            "raw_content": content
        })

    return sections

def parse_sub_questions(section):
    """
    Within a section, detect sub-questions marked as (1), (2), etc.
    Returns list of sub-question dicts.
    """
    content = section["raw_content"]

    # Check for parenthesized numbers: (1), (2), (3) etc
    # Also handle （1） (full-width parentheses)
    sub_pattern = re.compile(
        r'(?:^|\n)\s*[（(](\d+)[）)]\s*(.+?)(?=\n\s*[（(]\d+[）)]|\Z)',
        re.DOTALL
    )

    subs = list(sub_pattern.finditer(content))

    if not subs:
        # No sub-questions — the whole section is one question
        return [{
            "sub_number": None,
            "stem": content.strip(),
            "options": []
        }]

    sub_questions = []
    for s in subs:
        sub_num = int(s.group(1))
        sub_text = s.group(2).strip()
        sub_questions.append({
            "sub_number": sub_num,
            "stem": sub_text,
            "options": []
        })

    return sub_questions

def extract_options(stem_text):
    """
    Extract multiple-choice options (A), (B), (C), (D) from stem text.
    Returns (stem_without_options, options_list).
    """
    # Pattern for options: (A) ... , (B) ... etc
    # Also handle （A）, (A), etc.
    option_pattern = re.compile(
        r'(?:^|\n)\s*[（(]([A-D])[）)]\s*(.+?)(?=\n\s*[（(][A-D][）)]|\Z)',
        re.DOTALL
    )

    opts = list(option_pattern.finditer(stem_text))
    if not opts:
        return stem_text, []

    # Extract the stem part (before first option)
    first_opt_start = opts[0].start()
    # Clean up: remove trailing whitespace and the option separator
    clean_stem = stem_text[:first_opt_start].strip()
    # Remove trailing "( )" or "（ ）"
    clean_stem = re.sub(r'\s*[（(]\s*[）)]\s*$', '', clean_stem)

    options = []
    for o in opts:
        label = o.group(1)
        value = o.group(2).strip()
        # Clean trailing dots
        value = re.sub(r'\s*\.\s*$', '', value)
        options.append({"label": label, "value": value})

    return clean_stem, options

def determine_question_type(section):
    """Determine question type from section title."""
    title = section["title"]
    if "填空" in title:
        return "fill_in_blank"
    elif "选择" in title:
        return "multiple_choice"
    else:
        return "solution"  # General solution/calculation question

# ── Solution Parsing ───────────────────────────────────────────
def parse_solutions(text):
    """
    Parse solution markdown into blocks keyed by flat question number.
    Solution uses flat numbering: (1)-(5) for section 一, (6)-(10) for 二, (11)-(21) for 三-十三.

    Returns dict: {flat_num: {"answer": ..., "explanation": ...}}
    """
    solutions = {}

    # Solution sections: 一、填空题, 二、选择题, 三、解答题
    # Within each, individual solutions start with (N) or （N）

    # Split into three major blocks
    block_pattern = re.compile(
        r'^#\s+(一|二|三)、(.+)$',
        re.MULTILINE
    )

    blocks = list(block_pattern.finditer(text))

    solution_blocks = {}
    for i, m in enumerate(blocks):
        cn_num = m.group(1)
        block_title = m.group(2).strip()
        start = m.end()
        end = blocks[i + 1].start() if i + 1 < len(blocks) else len(text)
        solution_blocks[cn_num] = {
            "title": block_title,
            "content": text[start:end].strip()
        }

    # Parse individual solutions within each block
    # Pattern: (N)【答案】 or （N）【答案】 or (N)【解】
    sol_pattern = re.compile(
        r'(?:^|\n)\s*[（(](\d+)[）)]\s*【(答案|解)】\s*(.+?)(?=\n\s*[（(]\d+[）)]\s*【|\Z)',
        re.DOTALL
    )

    for cn_num, block in solution_blocks.items():
        content = block["content"]
        matches = list(sol_pattern.finditer(content))

        for m in matches:
            qnum = int(m.group(1))
            sol_type = m.group(2)  # "答案" or "解"
            sol_content = m.group(3).strip()

            if qnum not in solutions:
                solutions[qnum] = {"answer": None, "explanation": None}

            if sol_type == "答案":
                # Extract answer: everything before 【解】 or end
                # Answer line: the first sentence or formula
                solutions[qnum]["answer"] = sol_content
            elif sol_type == "解":
                solutions[qnum]["explanation"] = sol_content

    # Also look for answers embedded in explanations (pattern: (N)【答案】... within 解 blocks)
    answer_inline_pattern = re.compile(
        r'[（(](\d+)[）)]【答案】\s*(.+?)(?=\n|【解】|$)',
        re.MULTILINE
    )

    for cn_num, block in solution_blocks.items():
        content = block["content"]
        matches = list(answer_inline_pattern.finditer(content))
        for m in matches:
            qnum = int(m.group(1))
            ans = m.group(2).strip()
            if qnum not in solutions:
                solutions[qnum] = {"answer": None, "explanation": None}
            if solutions[qnum]["answer"] is None:
                solutions[qnum]["answer"] = ans

    return solutions

# ── Mapping: Paper sections → Solution flat numbers ────────────
# Section 一: sub-questions (1)-(5) → solution (1)-(5)
# Section 二: sub-questions (1)-(5) → solution (6)-(10)
# Sections 三-十三: single questions → solution (11)-(21)
# Exception: Section 十一 has 3 sub-parts, but solution maps as single (19)

def build_solution_mapping(sections):
    """
    Build mapping from hierarchical ID → flat solution number.

    Returns dict: {hierarchical_id: flat_solution_num}
    """
    mapping = {}
    flat_counter = 1

    for section in sections:
        s_num = section["section_num"]
        subs = section.get("sub_questions", [])

        if s_num <= 2:
            # Sections 一 and 二: each sub-question maps to sequential flat number
            for sq in subs:
                hid = f"math1-2000-s{s_num:02d}-q{sq['sub_number']:02d}"
                mapping[hid] = flat_counter
                flat_counter += 1
        elif s_num == 11:
            # Section 十一 has 3 sub-parts — still maps to single solution number
            for sq in subs:
                hid = f"math1-2000-s{s_num:02d}-q{sq['sub_number']:02d}"
                mapping[hid] = flat_counter  # All sub-parts share same solution
            flat_counter += 1
        else:
            hid = f"math1-2000-s{s_num:02d}"
            mapping[hid] = flat_counter
            flat_counter += 1

    return mapping

# ── Main conversion ────────────────────────────────────────────
def convert():
    # Read source files
    paper_text = read_file(PAPER_PATH)
    solution_text = read_file(SOLUTION_PATH)

    # Compute hashes
    paper_sha = compute_sha256(PAPER_PATH)
    solution_sha = compute_sha256(SOLUTION_PATH)

    # Parse paper
    sections = parse_paper_sections(paper_text)

    # Parse sub-questions within each section
    for section in sections:
        subs = parse_sub_questions(section)
        section["sub_questions"] = subs

        # Extract options for choice questions
        qtype = determine_question_type(section)
        section["question_type"] = qtype

        for sq in subs:
            if qtype == "multiple_choice":
                clean_stem, options = extract_options(sq["stem"])
                sq["stem"] = clean_stem
                sq["options"] = options
            else:
                sq["options"] = []

    # Parse solutions
    solutions = parse_solutions(solution_text)

    # Build mapping
    sol_map = build_solution_mapping(sections)

    # Build questions array
    questions = []
    anomalies = []

    for section in sections:
        s_num = section["section_num"]
        qtype = section["question_type"]
        subs = section["sub_questions"]

        for sq in subs:
            # Build hierarchical ID
            if len(subs) > 1:
                hid = f"math1-2000-s{s_num:02d}-q{sq['sub_number']:02d}"
                flat_qnum = sq.get("sub_number", None)
            else:
                hid = f"math1-2000-s{s_num:02d}"
                flat_qnum = None

            # Get solution
            flat_sol_num = sol_map.get(hid)
            sol = solutions.get(flat_sol_num, {"answer": None, "explanation": None}) if flat_sol_num else {"answer": None, "explanation": None}

            # Build question object
            q = {
                "stableId": hid,
                "sourceRepo": SOURCE_REPO,
                "sourceRelativePaths": [
                    "papers/2000年考研数学(一)真题.md",
                    "solutions/2000年解析/2000年解析.md"
                ],
                "sourceCommit": SOURCE_COMMIT,
                "sourceDirty": SOURCE_DIRTY,
                "sourceYear": SOURCE_YEAR,
                "subjectCode": SUBJECT_CODE,
                "sourceFileHashes": {
                    "paper": paper_sha,
                    "solutions": solution_sha
                },
                "transformVersion": TRANSFORM_VERSION,
                "reviewStatus": "needs_human_review",
                "sectionNumber": s_num,
                "sectionLabel": section["cn_label"],
                "sectionTitle": section["title"],
                "questionNumber": flat_qnum,
                "questionType": qtype,
                "stem": sq["stem"],
                "options": sq.get("options", []),
                "answerCandidate": sol["answer"] if sol else None,
                "answerStatus": "candidate_from_solutions" if sol and sol["answer"] else "missing",
                "explanationCandidate": sol["explanation"] if sol else None,
                "explanationStatus": "candidate_from_solutions" if sol and sol["explanation"] else "missing",
                "anomalies": []
            }

            # Check for anomalies
            q_anomalies = []
            if qtype == "multiple_choice":
                expected_options = {"A", "B", "C", "D"}
                actual_options = {o["label"] for o in q.get("options", [])}
                if actual_options != expected_options:
                    q_anomalies.append({
                        "type": "incomplete_options",
                        "message": f"Expected options A,B,C,D, found {sorted(actual_options)}"
                    })

            if q["answerStatus"] == "missing":
                q_anomalies.append({
                    "type": "missing_answer",
                    "message": f"No answer candidate found for {hid}"
                })

            if q["explanationStatus"] == "missing":
                q_anomalies.append({
                    "type": "missing_explanation",
                    "message": f"No explanation candidate found for {hid}"
                })

            q["anomalies"] = q_anomalies
            if q_anomalies:
                for a in q_anomalies:
                    anomalies.append({
                        "questionId": hid,
                        **a
                    })

            questions.append(q)

    # ── Validation ──────────────────────────────────────────────
    total = len(questions)
    fill_count = sum(1 for q in questions if q["questionType"] == "fill_in_blank")
    choice_count = sum(1 for q in questions if q["questionType"] == "multiple_choice")
    sol_count = sum(1 for q in questions if q["questionType"] == "solution")

    # Expected counts for math1 2000:
    # 5 fill + 5 choice + 8 solo + 3 sub-part solo + 2 solo = 23
    expected_fill = 5
    expected_choice = 5
    expected_sol = 13  # sections 三-十三, counting 十一's 3 sub-parts
    expected_total = 23

    counts_match = (fill_count == expected_fill and
                    choice_count == expected_choice and
                    sol_count == expected_sol and
                    total == expected_total)

    # Check ID uniqueness
    ids = [q["stableId"] for q in questions]
    ids_unique = len(ids) == len(set(ids))

    # Check all reviewStatus are needs_human_review
    all_needs_review = all(q["reviewStatus"] == "needs_human_review" for q in questions)

    validation = {
        "questionsGenerated": total,
        "questionCounts": {
            "fill_in_blank": fill_count,
            "multiple_choice": choice_count,
            "solution": sol_count
        },
        "expectedCounts": {
            "fill_in_blank": expected_fill,
            "multiple_choice": expected_choice,
            "solution": expected_sol,
            "total": expected_total
        },
        "countsMatch": counts_match,
        "idsUnique": ids_unique,
        "allQuestionsNeedsReview": all_needs_review,
        "totalAnomalies": len(anomalies),
        "anomaliesBySeverity": {
            "error": sum(1 for a in anomalies if a.get("severity") == "error"),
            "warning": len(anomalies),
            "info": 0
        }
    }

    # ── Output ──────────────────────────────────────────────────
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    REPORT_DIR.mkdir(parents=True, exist_ok=True)

    # questions.json
    output = {
        "schemaVersion": TRANSFORM_VERSION,
        "task": "cc-math1-2000-legacy",
        "subjectCode": SUBJECT_CODE,
        "sourceYear": SOURCE_YEAR,
        "sourceRepo": SOURCE_REPO,
        "sourceCommit": SOURCE_COMMIT,
        "sourceDirty": SOURCE_DIRTY,
        "sourceInfo": {
            "paperRelativePath": "papers/2000年考研数学(一)真题.md",
            "paperSha256": paper_sha,
            "solutionsRelativePath": "solutions/2000年解析/2000年解析.md",
            "solutionsSha256": solution_sha
        },
        "sectionStructure": {
            "totalSections": len(sections),
            "sectionLabels": [s["cn_label"] for s in sections],
            "sectionTitles": [s["title"] for s in sections]
        },
        "idScheme": "hierarchical_section_based",
        "questions": questions
    }

    with open(OUTPUT_DIR / "questions.json", "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    # validation.json
    with open(OUTPUT_DIR / "validation.json", "w", encoding="utf-8") as f:
        json.dump(validation, f, ensure_ascii=False, indent=2)

    # anomalies.json
    anomalies_output = {
        "schemaVersion": TRANSFORM_VERSION,
        "anomalies": anomalies
    }
    with open(OUTPUT_DIR / "anomalies.json", "w", encoding="utf-8") as f:
        json.dump(anomalies_output, f, ensure_ascii=False, indent=2)

    # summary.md
    status_emoji = "✅" if counts_match and ids_unique else "⚠️"
    summary = f"""# Math1 2000 Legacy Transformation Summary

- Questions: {total} (expected {expected_total})
- Breakdown: {fill_count} fill-in-blank + {choice_count} multiple-choice + {sol_count} solution
- Counts match: {counts_match}
- IDs unique: {ids_unique}
- Anomalies: {len(anomalies)}
- Review status: all `needs_human_review`
- ID scheme: hierarchical (`math1-2000-sNN` / `math1-2000-sNN-qNN`)
"""
    with open(OUTPUT_DIR / "summary.md", "w", encoding="utf-8") as f:
        f.write(summary)

    # Print results
    print(f"Questions generated: {total}")
    print(f"  Fill-in-blank: {fill_count}")
    print(f"  Multiple-choice: {choice_count}")
    print(f"  Solution: {sol_count}")
    print(f"Counts match expected: {counts_match}")
    print(f"IDs unique: {ids_unique}")
    print(f"Anomalies: {len(anomalies)}")
    print(f"Output: {OUTPUT_DIR}")

    return validation, anomalies

if __name__ == "__main__":
    convert()
