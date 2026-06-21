"""Transform mixed-marker Math1 papers from 2021-2023 and 2025."""

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


SCHEMA_VERSION = "math1-modern-transform-v1"
SOURCE_REPO = "Kaoyan-Math1-Papers"
SUPPORTED_YEARS = (2021, 2022, 2023, 2025)
PAPER_NAMES = {
    2021: "2021年考研数学(一)真题.md",
    2022: "2022年考研数学(一)真题.md",
    2023: "2023年考研数学(一)真题.md",
    2025: "2025年数学一真题.md",
}
# Line starts are intentionally explicit because OCR destroyed several visible question markers.
QUESTION_START_LINES = {
    2021: [9, 19, 29, 39, 49, 59, 69, 79, 86, 95, 107, 109, 111, 113, 115, 117, 123, 127, 131, 135, 142, 149],
    2022: [5, 11, 13, 20, 30, 37, 45, 52, 62, 72, 84, 85, 86, 87, 88, 89, 93, 97, 101, 105, 109, 117],
    2023: [14, 24, 34, 41, 48, 58, 66, 70, 80, 93, 105, 106, 108, 110, 111, 112, 116, 121, 125, 133, 149, 164],
    2025: [7, 42, 76, 100, 125, 159, 175, 199, 223, 241, 251, 261, 271, 283, 307, 323, 359, 369, 401, 441, 469, 496],
}
SOLUTION_START_LINES = {
    2023: [7, 27, 55, 81, 99, 119, 157, 179, 201, 225, 251, 259, 271, 287, 301, 317, 337, 354, 376, 390, 449, 490],
}
INLINE_ANSWER_RE = re.compile(r"【答案】\s*([^\n]+)")
INLINE_EXPLANATION_RE = re.compile(r"【(?:解析|解|证明)】")
REPLACEMENT_CHAR_RE = re.compile("\ufffd")
QUICK_ANSWER_RE = re.compile(r"(?m)^[（(](\d{1,2})[）)]\s*(.+?)(?:\n|$)")


def question_type(number):
    if 1 <= number <= 10:
        return "multiple_choice"
    if 11 <= number <= 16:
        return "fill_in_blank"
    return "solution"


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


def strip_inline_solution(block):
    match = INLINE_EXPLANATION_RE.search(block)
    if match:
        return block[:match.start()].strip()
    return block.strip()


def parse_paper_by_line_map(text, year):
    lines = normalize_newlines(text).splitlines()
    starts = QUESTION_START_LINES[year]
    questions = []
    anomalies = []
    for index, line_number in enumerate(starts):
        end_line = starts[index + 1] - 1 if index + 1 < len(starts) else len(lines)
        raw_block = "\n".join(lines[line_number - 1:end_line]).strip()
        number = index + 1
        kind = question_type(number)
        stem = strip_inline_solution(raw_block) if year == 2025 else raw_block
        item_anomalies = []
        if year == 2022:
            item_anomalies.append({
                "type": "high_ocr_risk_source",
                "questionNumber": number,
                "severity": "warning",
                "message": "2022 paper transcription contains severe OCR corruption; verify against PDF",
            })
        if REPLACEMENT_CHAR_RE.search(raw_block):
            item_anomalies.append({
                "type": "replacement_character_detected",
                "questionNumber": number,
                "severity": "warning",
                "message": "Unicode replacement character found in source block",
            })
        if number in ({3, 4, 12, 17} if year == 2022 else set()):
            item_anomalies.append({
                "type": "question_start_recovered_by_line_map",
                "questionNumber": number,
                "severity": "warning",
                "message": "Question start marker was missing or malformed and was recovered by audited line map",
            })
        if number == 7 and year == 2023:
            item_anomalies.append({
                "type": "question_start_embedded_in_prior_ocr_line",
                "questionNumber": number,
                "severity": "warning",
                "message": "Question 7 starts inside a corrupted line and requires PDF verification",
            })
        questions.append({
            "questionNumber": number,
            "questionType": kind,
            "rawText": stem,
            "fullBlock": raw_block,
            "options": extract_options(stem) if kind == "multiple_choice" else [],
            "anomalies": item_anomalies,
        })
        anomalies.extend(item_anomalies)
    return questions, anomalies


def parse_solution_candidates(text):
    text = normalize_newlines(text)
    matches = list(SOLUTION_MARKER.finditer(text))
    solutions = {}
    for index, match in enumerate(matches):
        number = int(match.group(1))
        if not 1 <= number <= 22 or number in solutions:
            continue
        end = matches[index + 1].start() if index + 1 < len(matches) else len(text)
        block = text[match.start():end].strip()
        answer_match = ANSWER_MARKER.search(block)
        solutions[number] = {
            "answer": answer_match.group(1).strip() if answer_match else None,
            "explanation": block,
        }
    return solutions


def parse_solution_by_line_map(text, year):
    lines = normalize_newlines(text).splitlines()
    starts = SOLUTION_START_LINES[year]
    solutions = {}
    for index, line_number in enumerate(starts):
        end_line = starts[index + 1] - 1 if index + 1 < len(starts) else len(lines)
        block = "\n".join(lines[line_number - 1:end_line]).strip()
        answer_match = INLINE_ANSWER_RE.search(block)
        solutions[index + 1] = {
            "answer": answer_match.group(1).strip() if answer_match else None,
            "explanation": block,
        }
    return solutions


def parse_quick_answers(text):
    marker = "答案速查"
    quick_text = text[text.rfind(marker):] if marker in text else ""
    answers = {}
    for match in QUICK_ANSWER_RE.finditer(quick_text):
        number = int(match.group(1))
        if 1 <= number <= 22 and number not in answers:
            answers[number] = {
                "answer": match.group(2).strip(),
                "explanation": None,
            }
    return answers


def transform(source_root, year):
    if year not in SUPPORTED_YEARS:
        raise ValueError(f"modern converter supports only {SUPPORTED_YEARS}")

    paper_relative = f"papers/{PAPER_NAMES[year]}"
    paper_path = source_root / Path(paper_relative)
    if not paper_path.is_file():
        raise FileNotFoundError(paper_path)

    solution_relative = f"solutions/{year}年解析/{year}年解析.md"
    solution_path = source_root / Path(solution_relative)
    if year == 2025:
        solution_path = None
        solution_relative = None

    paper_text = paper_path.read_text(encoding="utf-8-sig")
    parsed_questions, anomalies = parse_paper_by_line_map(paper_text, year)
    solutions = {}
    if solution_path and solution_path.is_file():
        solution_text = solution_path.read_text(encoding="utf-8-sig")
        if year == 2022:
            solutions = parse_quick_answers(solution_text)
        elif year == 2023:
            solutions = parse_solution_by_line_map(solution_text, year)
        else:
            solutions = parse_solution_candidates(solution_text)

    metadata = git_metadata(source_root)
    paper_hash = sha256_file(paper_path)
    solution_hash = sha256_file(solution_path) if solution_path else None
    questions = []
    for parsed in parsed_questions:
        number = parsed["questionNumber"]
        solution = solutions.get(number, {})
        if year == 2025:
            answer_match = INLINE_ANSWER_RE.search(parsed["fullBlock"])
            explanation_match = INLINE_EXPLANATION_RE.search(parsed["fullBlock"])
            solution = {
                "answer": answer_match.group(1).strip() if answer_match else None,
                "explanation": parsed["fullBlock"][explanation_match.start():].strip()
                if explanation_match else None,
            }

        item_anomalies = list(parsed["anomalies"])
        item_anomalies.extend(detect_ocr_risks(parsed["rawText"], number))
        item_anomalies.extend(check_katex_structure(parsed["rawText"]))
        if parsed["questionType"] == "multiple_choice":
            labels = sorted({option["label"] for option in parsed["options"]})
            if labels != ["A", "B", "C", "D"]:
                item_anomalies.append({
                    "type": "incomplete_options",
                    "questionNumber": number,
                    "severity": "warning",
                    "message": f"Extracted option labels: {labels}",
                })
        anomalies.extend(item for item in item_anomalies if item not in parsed["anomalies"])
        source_paths = [paper_relative]
        if solution_relative:
            source_paths.append(solution_relative)
        questions.append(OrderedDict([
            ("stableId", stable_id(year, number)),
            ("sourceRepo", SOURCE_REPO),
            ("sourceRelativePaths", source_paths),
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
        "multiple_choice": sum(q["questionType"] == "multiple_choice" for q in questions),
        "fill_in_blank": sum(q["questionType"] == "fill_in_blank" for q in questions),
        "solution": sum(q["questionType"] == "solution" for q in questions),
    }
    expected = {"multiple_choice": 10, "fill_in_blank": 6, "solution": 6}
    payload = OrderedDict([
        ("schemaVersion", SCHEMA_VERSION),
        ("task", f"cc-math1-{year}-modern"),
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
            "countsMatch": counts == expected,
            "totalAnomalies": len(anomalies),
            "anomaliesBySeverity": {
                severity: sum(item.get("severity") == severity for item in anomalies)
                for severity in ("error", "warning", "info")
            },
            "allQuestionsNeedsReview": all(q["reviewStatus"] == "needs_human_review" for q in questions),
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
    (output_dir / "summary.md").write_text(
        "\n".join([
            f"# Math1 {year} Modern Transformation Summary",
            "",
            f"- Questions: {len(payload['questions'])}",
            f"- Counts match: {payload['validation']['countsMatch']}",
            f"- Anomalies: {len(anomalies)}",
            "- Review status: all `needs_human_review`",
            "",
        ]),
        encoding="utf-8",
    )


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
