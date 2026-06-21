"""Transform one legacy-section-based Math1 paper from 1987-2003, excluding 1994."""

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
    check_katex_structure,
    detect_ocr_risks,
    normalize_newlines,
    sha256_file,
)


SCHEMA_VERSION = "math1-legacy-transform-v1"
SOURCE_REPO = "Kaoyan-Math1-Papers"
ROMAN_SECTION_RE = re.compile(r"(?m)^#\s*([一二三四五六七八九十]+)[、.]?\s*([^\n]*)")
SOLUTION_SECTION_RE = re.compile(r"(?m)^(?:#\s*)?([一二三四五六七八九十]+)、\s*([^\n]*)")
LOCAL_MARKER_RE = re.compile(r"(?m)^\s*[（(](\d{1,2})[）)]\s*")
COUNT_RE = re.compile(r"共\s*(\d+)\s*小题")
CHOICE_MARKERS = {"A", "B", "C", "D"}
ROMAN_TO_INT = {
    "一": 1,
    "二": 2,
    "三": 3,
    "四": 4,
    "五": 5,
    "六": 6,
    "七": 7,
    "八": 8,
    "九": 9,
    "十": 10,
    "十一": 11,
    "十二": 12,
    "十三": 13,
    "十四": 14,
    "十五": 15,
}


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


def parse_section_count(title):
    match = COUNT_RE.search(title)
    return int(match.group(1)) if match else 1


def question_type_from_title(title):
    if "填空题" in title:
        return "fill_in_blank"
    if "选择题" in title:
        return "multiple_choice"
    return "solution"


def split_section_local(body, expected_count):
    markers = list(LOCAL_MARKER_RE.finditer(body))
    if expected_count == 1:
        return [body.strip()], []

    found_numbers = [int(match.group(1)) for match in markers]
    if found_numbers == list(range(1, expected_count + 1)):
        parts = []
        for index, match in enumerate(markers):
            end = markers[index + 1].start() if index + 1 < len(markers) else len(body)
            parts.append(body[match.start():end].strip())
        return parts, []

    anomalies = [{
        "type": "section_split_mismatch",
        "severity": "warning",
        "message": f"Expected local markers 1..{expected_count}, found {found_numbers}",
    }]
    return [body.strip()], anomalies


def parse_paper_sections(text):
    text = normalize_newlines(text)
    matches = list(ROMAN_SECTION_RE.finditer(text))
    sections = []
    anomalies = []
    qnum = 1

    for index, match in enumerate(matches):
        roman_label = match.group(1)
        title = match.group(2).strip()
        end = matches[index + 1].start() if index + 1 < len(matches) else len(text)
        body = text[match.end():end].strip()
        expected_count = parse_section_count(title)
        question_type = question_type_from_title(title)
        parts, split_anomalies = split_section_local(body, expected_count)

        section_questions = []
        if expected_count == 1 or len(parts) != expected_count:
            section_questions.append({
                "questionNumber": qnum,
                "questionType": question_type,
                "rawText": body,
                "options": extract_options(body) if question_type == "multiple_choice" else [],
                "romanLabel": roman_label,
                "sectionTitle": title,
                "sectionIndex": index + 1,
                "partIndex": 1,
            })
            qnum += 1
        else:
            for part_index, part in enumerate(parts, start=1):
                section_questions.append({
                    "questionNumber": qnum,
                    "questionType": question_type,
                    "rawText": part,
                    "options": extract_options(part) if question_type == "multiple_choice" else [],
                    "romanLabel": roman_label,
                    "sectionTitle": title,
                    "sectionIndex": index + 1,
                    "partIndex": part_index,
                })
                qnum += 1

        for anomaly in split_anomalies:
            anomaly["sectionLabel"] = roman_label
        anomalies.extend(split_anomalies)
        sections.append({
            "romanLabel": roman_label,
            "sectionTitle": title,
            "questionType": question_type,
            "expectedCount": expected_count,
            "body": body,
            "questions": section_questions,
            "startQuestion": section_questions[0]["questionNumber"],
            "endQuestion": section_questions[-1]["questionNumber"],
        })

    questions = []
    for section in sections:
        questions.extend(section["questions"])
    return sections, questions, anomalies


def split_solution_block_by_global_numbers(block_text):
    markers = list(LOCAL_MARKER_RE.finditer(block_text))
    parts = {}
    for index, match in enumerate(markers):
        number = int(match.group(1))
        end = markers[index + 1].start() if index + 1 < len(markers) else len(block_text)
        parts[number] = block_text[match.start():end].strip()
    return parts


def parse_solution_blocks(text, paper_sections):
    text = normalize_newlines(text)
    matches = list(SOLUTION_SECTION_RE.finditer(text))
    paper_by_roman = {section["romanLabel"]: section for section in paper_sections}
    solutions = {}
    anomalies = []

    for index, match in enumerate(matches):
        roman_label = match.group(1)
        title = match.group(2).strip()
        end = matches[index + 1].start() if index + 1 < len(matches) else len(text)
        block_body = text[match.end():end].strip()
        paper_section = paper_by_roman.get(roman_label)
        if not paper_section:
            anomalies.append({
                "type": "orphan_solution_section",
                "sectionLabel": roman_label,
                "severity": "warning",
                "message": f"Solution section {roman_label} has no matching paper section",
            })
            continue

        global_parts = split_solution_block_by_global_numbers(block_body)
        max_question = paper_sections[-1]["endQuestion"]
        uses_global_numbers = any(
            paper_section["startQuestion"] <= number <= max_question
            for number in global_parts
        ) and any(number > paper_section["endQuestion"] for number in global_parts)

        if uses_global_numbers:
            for question in global_parts:
                if 1 <= question <= max_question:
                    block = global_parts[question]
                    answer_match = ANSWER_MARKER.search(block)
                    solutions[question] = {
                        "answer": answer_match.group(1).strip() if answer_match else None,
                        "explanation": block,
                    }
            continue

        expected_count = len(paper_section["questions"])
        local_parts, split_anomalies = split_section_local(block_body, expected_count)
        for anomaly in split_anomalies:
            anomaly["sectionLabel"] = roman_label
        anomalies.extend(split_anomalies)

        if expected_count == 1 or len(local_parts) != expected_count:
            question_number = paper_section["questions"][0]["questionNumber"]
            answer_match = ANSWER_MARKER.search(block_body)
            solutions[question_number] = {
                "answer": answer_match.group(1).strip() if answer_match else None,
                "explanation": block_body,
            }
            continue

        for part_index, part in enumerate(local_parts, start=1):
            question_number = paper_section["questions"][part_index - 1]["questionNumber"]
            answer_match = ANSWER_MARKER.search(part)
            solutions[question_number] = {
                "answer": answer_match.group(1).strip() if answer_match else None,
                "explanation": part,
            }

    return solutions, anomalies


def expected_counts_from_sections(sections):
    counts = {"fill_in_blank": 0, "multiple_choice": 0, "solution": 0}
    for section in sections:
        counts[section["questionType"]] += len(section["questions"])
    return counts


def transform(source_root, year):
    if year < 1987 or year > 2003 or year == 1994:
        raise ValueError("legacy converter only supports Math1 years 1987-2003 excluding 1994")

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
    paper_sections, parsed_questions, anomalies = parse_paper_sections(paper_text)
    solutions, solution_anomalies = parse_solution_blocks(solution_text, paper_sections)
    anomalies.extend(solution_anomalies)

    metadata = git_metadata(source_root)
    paper_hash = sha256_file(paper_path)
    solution_hash = sha256_file(solution_path)
    questions = []

    for parsed in parsed_questions:
        number = parsed["questionNumber"]
        solution = solutions.get(number, {})
        item_anomalies = detect_ocr_risks(parsed["rawText"], number)
        item_anomalies.extend(check_katex_structure(parsed["rawText"]))
        if solution.get("explanation"):
            item_anomalies.extend(detect_ocr_risks(solution["explanation"], number))
        if parsed["questionType"] == "multiple_choice":
            labels = {option["label"] for option in parsed["options"]}
            if labels != CHOICE_MARKERS:
                item_anomalies.append({
                    "type": "incomplete_options",
                    "questionNumber": number,
                    "severity": "warning",
                    "message": f"Extracted option labels: {sorted(labels)}",
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

    expected = expected_counts_from_sections(paper_sections)
    counts = {
        kind: sum(question["questionType"] == kind for question in questions)
        for kind in expected
    }
    if counts != expected:
        anomalies.append({
            "type": "question_count_mismatch",
            "severity": "error",
            "message": f"Expected {expected}, got {counts}",
        })

    for number in range(1, len(questions) + 1):
        if number not in solutions:
            anomalies.append({
                "type": "missing_solution",
                "questionNumber": number,
                "severity": "warning",
                "message": f"Solution block for question {number} was not found",
            })

    payload = OrderedDict([
        ("schemaVersion", SCHEMA_VERSION),
        ("task", f"cc-math1-{year}-legacy"),
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
        f"# Math1 {year} Legacy Transformation Summary",
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
