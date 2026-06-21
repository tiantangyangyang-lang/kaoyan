"""Transform one sequential-numbered Math1 paper from 2004 through 2020."""

import argparse
import json
import re
import subprocess
import sys
from collections import OrderedDict
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from scripts.transform_m1_2020 import (
    ANSWER_MARKER,
    OPTION_MARKER,
    SOLUTION_MARKER,
    check_katex_structure,
    detect_ocr_risks,
    normalize_newlines,
    sha256_file,
)


SCHEMA_VERSION = "math1-sequential-transform-v1"
SOURCE_REPO = "Kaoyan-Math1-Papers"
QUESTION_MARKER = re.compile(
    r"(?m)^\s*(?:[（(]\s*(\d{1,2})\s*[）)]|(\d{1,2})\s*[）)])\s*"
)


def expected_ranges(year):
    if 2004 <= year <= 2006:
        return {
            "fill_in_blank": range(1, 7),
            "multiple_choice": range(7, 15),
            "solution": range(15, 24),
        }
    if year == 2007:
        return {
            "multiple_choice": range(1, 9),
            "fill_in_blank": range(9, 15),
            "solution": range(15, 25),
        }
    if 2008 <= year <= 2020:
        return {
            "multiple_choice": range(1, 9),
            "fill_in_blank": range(9, 15),
            "solution": range(15, 24),
        }
    raise ValueError("sequential converter only supports Math1 years 2004-2020")


def question_type(year, number):
    for kind, numbers in expected_ranges(year).items():
        if number in numbers:
            return kind
    return "unknown"


def expected_counts(year):
    return {kind: len(list(numbers)) for kind, numbers in expected_ranges(year).items()}


def stable_id(year, number):
    return f"math1-{year}-q{number:02d}"


def extract_options(text):
    matches = list(OPTION_MARKER.finditer(text))
    options = []
    for index, match in enumerate(matches):
        end = matches[index + 1].start() if index + 1 < len(matches) else len(text)
        options.append({
            "label": match.group(1),
            "value": text[match.end():end].strip(),
        })
    return options


def parse_paper(text, year):
    text = normalize_newlines(text)
    expected_numbers = {
        number for numbers in expected_ranges(year).values() for number in numbers
    }
    markers = []
    seen = set()
    for match in QUESTION_MARKER.finditer(text):
        number = int(match.group(1) or match.group(2))
        if number in expected_numbers and number not in seen:
            seen.add(number)
            markers.append((number, match.start(), match.end()))

    questions = []
    for index, (number, _start, marker_end) in enumerate(markers):
        end = markers[index + 1][1] if index + 1 < len(markers) else len(text)
        raw = text[marker_end:end].strip()
        kind = question_type(year, number)
        questions.append({
            "questionNumber": number,
            "questionType": kind,
            "rawText": raw,
            "options": extract_options(raw) if kind == "multiple_choice" else [],
        })
    missing = sorted(expected_numbers - seen)
    anomalies = [{
        "type": "missing_question",
        "questionNumber": number,
        "severity": "error",
        "message": f"Question {number} was not found in the paper",
    } for number in missing]
    return questions, anomalies


def parse_solutions(text, year):
    text = normalize_newlines(text)
    expected_numbers = {
        number for numbers in expected_ranges(year).values() for number in numbers
    }
    matches = [
        match for match in SOLUTION_MARKER.finditer(text)
        if int(match.group(1)) in expected_numbers
    ]
    solutions = {}
    anomalies = []
    for index, match in enumerate(matches):
        number = int(match.group(1))
        end = matches[index + 1].start() if index + 1 < len(matches) else len(text)
        block = text[match.start():end].strip()
        answer_match = ANSWER_MARKER.search(block)
        if number in solutions:
            anomalies.append({
                "type": "duplicate_solution",
                "questionNumber": number,
                "severity": "warning",
                "message": f"Duplicate solution block for question {number}",
            })
            continue
        solutions[number] = {
            "answer": answer_match.group(1).strip() if answer_match else None,
            "explanation": block,
        }
    for number in sorted(expected_numbers - set(solutions)):
        anomalies.append({
            "type": "missing_solution",
            "questionNumber": number,
            "severity": "warning",
            "message": f"Solution block for question {number} was not found",
        })
    return solutions, anomalies


def git_metadata(root):
    def run(*args):
        result = subprocess.run(
            ["git", "-C", str(root), *args],
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            check=False,
        )
        return result.stdout.strip()

    return {
        "headCommit": run("rev-parse", "HEAD") or "unknown",
        "dirty": bool(run("status", "--porcelain=v1")),
    }


def transform(source_root, year):
    paper_relative = f"papers/{year}年考研数学(一)真题.md"
    solution_relative = f"solutions/{year}年解析/{year}年解析.md"
    paper_path = source_root / Path(paper_relative)
    solution_path = source_root / Path(solution_relative)
    if not paper_path.is_file():
        raise FileNotFoundError(paper_path)
    if not solution_path.is_file():
        raise FileNotFoundError(solution_path)

    paper_text = paper_path.read_text(encoding="utf-8-sig")
    solution_text = solution_path.read_text(encoding="utf-8-sig")
    paper_questions, anomalies = parse_paper(paper_text, year)
    solutions, solution_anomalies = parse_solutions(solution_text, year)
    anomalies.extend(solution_anomalies)

    metadata = git_metadata(source_root)
    paper_hash = sha256_file(paper_path)
    solution_hash = sha256_file(solution_path)
    questions = []
    for parsed in paper_questions:
        number = parsed["questionNumber"]
        solution = solutions.get(number, {})
        item_anomalies = detect_ocr_risks(parsed["rawText"], number)
        item_anomalies.extend(check_katex_structure(parsed["rawText"]))
        if parsed["questionType"] == "multiple_choice":
            labels = [option["label"] for option in parsed["options"]]
            if labels != ["A", "B", "C", "D"]:
                item_anomalies.append({
                    "type": "incomplete_options",
                    "questionNumber": number,
                    "severity": "warning",
                    "message": f"Extracted option labels: {labels}",
                })
        anomalies.extend(item_anomalies)
        questions.append(OrderedDict([
            ("stableId", stable_id(year, number)),
            ("sourceRepo", SOURCE_REPO),
            ("sourceRelativePaths", [paper_relative, solution_relative]),
            ("sourceCommit", metadata["headCommit"]),
            ("sourceDirty", metadata["dirty"]),
            ("sourceYear", year),
            ("subjectCode", "math1"),
            ("sourceFileHashes", {"paper": paper_hash, "solutions": solution_hash}),
            ("transformVersion", SCHEMA_VERSION),
            ("reviewStatus", "needs_human_review"),
            ("questionNumber", number),
            ("questionType", parsed["questionType"]),
            ("stem", parsed["rawText"]),
            ("options", parsed["options"]),
            ("answerCandidate", solution.get("answer")),
            ("answerStatus", "candidate_from_solutions" if solution.get("answer") else "missing"),
            ("explanationCandidate", solution.get("explanation")),
            ("explanationStatus", "candidate_from_solutions" if solution.get("explanation") else "missing"),
            ("anomalies", item_anomalies),
        ]))

    counts = {
        kind: sum(question["questionType"] == kind for question in questions)
        for kind in expected_counts(year)
    }
    expected = expected_counts(year)
    counts_match = counts == expected
    if not counts_match:
        anomalies.append({
            "type": "question_count_mismatch",
            "severity": "error",
            "message": f"Expected {expected}, got {counts}",
        })
    payload = OrderedDict([
        ("schemaVersion", SCHEMA_VERSION),
        ("task", f"cc-math1-{year}"),
        ("subjectCode", "math1"),
        ("sourceYear", year),
        ("sourceRepo", SOURCE_REPO),
        ("sourceCommit", metadata["headCommit"]),
        ("sourceDirty", metadata["dirty"]),
        ("sourceInfo", {
            "paperRelativePath": paper_relative,
            "paperSha256": paper_hash,
            "solutionsRelativePath": solution_relative,
            "solutionsSha256": solution_hash,
        }),
        ("questions", questions),
        ("validation", {
            "questionsGenerated": len(questions),
            "questionCounts": counts,
            "expectedCounts": expected,
            "countsMatch": counts_match,
            "totalAnomalies": len(anomalies),
            "anomaliesBySeverity": {
                severity: sum(item.get("severity") == severity for item in anomalies)
                for severity in ("error", "warning", "info")
            },
            "allQuestionsNeedsReview": all(
                question["reviewStatus"] == "needs_human_review" for question in questions
            ),
        }),
    ])
    return payload, anomalies


def write_output(output_dir, payload, anomalies):
    output_dir.mkdir(parents=True, exist_ok=True)
    for name, data in (
        ("questions.json", payload),
        ("anomalies.json", {"schemaVersion": SCHEMA_VERSION, "anomalies": anomalies}),
        ("validation.json", payload["validation"]),
    ):
        (output_dir / name).write_text(
            json.dumps(data, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
    year = payload["sourceYear"]
    lines = [
        f"# Math1 {year} Transformation Summary",
        "",
        f"- Questions: {len(payload['questions'])}",
        f"- Counts match: {payload['validation']['countsMatch']}",
        f"- Anomalies: {len(anomalies)}",
        "- Review status: all `needs_human_review`",
    ]
    (output_dir / "summary.md").write_text("\n".join(lines) + "\n", encoding="utf-8")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("source_root", type=Path)
    parser.add_argument("year", type=int)
    parser.add_argument("output_dir", type=Path)
    args = parser.parse_args()
    payload, anomalies = transform(args.source_root.resolve(), args.year)
    write_output(args.output_dir, payload, anomalies)
    print(f"Math1 {args.year}: {len(payload['questions'])} questions, {len(anomalies)} anomalies")
    if payload["validation"]["anomaliesBySeverity"]["error"]:
        raise SystemExit(3)


if __name__ == "__main__":
    main()
