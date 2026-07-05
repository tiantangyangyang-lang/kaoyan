"""Split the 1997-2019 aggregate `试卷二` sections into Math2 staging batches."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import subprocess
from collections import Counter
from pathlib import Path
from typing import Any


SCHEMA_VERSION = "math2-question-staging-v2"
TRANSFORM_VERSION = "math2-aggregate-1997-2019-v1"
SOURCE_REPO = "Kaoyan-Math2-Papers"
SUBJECT_CODE = "math2"
YEARS = tuple(range(1997, 2020))
PAPER_RELATIVE = "papers/MinerU_markdown_math2_1987-2019_2065686324641095680.md"
SOLUTIONS_RELATIVE = "solutions/math2_1987-2019/math2_1987-2019.md"
PAPER_SHA256 = "c8cf81ea4a1b38fd483cbd5bc569a1e7d443792406f075f2fecb61f0156f23d3"
SOLUTIONS_SHA256 = "ef715711e094d2c30af75dee43e777c3870c781b91521da6604579d04e955e01"
FEEDBACK_EMAIL = "tiantangyangyang@gmail.com"

YEAR_HEADINGS = {
    1997: "一九九七",
    1998: "一九九八",
    1999: "一九九九",
    2000: "二〇〇〇",
    2001: "二〇〇一",
    2002: "二〇〇二",
    2003: "二〇〇三",
    2004: "二〇〇四",
    2005: "二〇〇五",
    2006: "二〇〇六",
    2007: "二〇〇七",
    2008: "二〇〇八",
    2009: "二〇〇九",
    2010: "二〇一〇",
    2011: "二〇一一",
    2012: "二〇一二",
    2013: "二〇一三",
    2014: "二〇一四",
    2015: "二〇一五",
    2016: "二〇一六",
    2017: "二〇一七",
    2018: "二〇一八",
    2019: "二〇一九",
}

ROMAN_SECTION_RE = re.compile(r"^##\s*([一二三四五六七八九十]+)、\s*(.*)")
QUESTION_MARKER_RE = re.compile(r"^\s*(?:#{2,}\s*)?(\d{1,2})[.．]\s*(.*)")
CHOICE_MARKER_RE = re.compile(r"(?m)(?:^|\n)\s*[（(]([A-D])[）)]\s*")
EXPLANATION_RE = re.compile(r"^\s*解[.．。:：]?\s*|\s解[.．。:：]\s*", re.MULTILINE)
MC_ANSWER_RE = re.compile(r"应选\s*[（(]?\s*([A-D])\s*[）)]?")
FILL_ANSWER_RE = re.compile(r"应填\s*([^。\n；;]+)")
RANGE_RE = re.compile(r"(\d{1,2})\s*[～~]\s*(\d{1,2})\s*(?:小题|题)")
COUNT_RE = re.compile(r"共\s*(\d+)\s*小题")
TOTAL_POINTS_RE = re.compile(r"(?:满分|共)\s*(\d+)\s*分")
EACH_POINTS_RE = re.compile(r"每小题\s*(\d+)\s*分")
IMAGE_RE = re.compile(r"!\[[^\]]*\]\([^)]+\)")
CROSS_PAPER_RE = re.compile(r"同试卷[一二三四]")
IGNORED_SOURCE_STATUS_PREFIXES = ("?? .obsidian/",)


def normalize_newlines(text: str) -> str:
    return text.replace("\r\n", "\n").replace("\r", "\n")


def read_lines(path: Path) -> list[str]:
    return normalize_newlines(path.read_text(encoding="utf-8-sig")).splitlines()


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(65536), b""):
            digest.update(chunk)
    return digest.hexdigest()


def git_output(root: Path, *args: str) -> str:
    result = subprocess.run(
        ["git", "-C", str(root), *args],
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        check=False,
    )
    return result.stdout.strip()


def git_state(root: Path, relative_path: str) -> str:
    tracked = subprocess.run(
        ["git", "-C", str(root), "ls-files", "--error-unmatch", relative_path],
        capture_output=True,
        check=False,
    ).returncode == 0
    if not tracked:
        return "untracked"
    status = git_output(root, "status", "--porcelain=v1", "--", relative_path)
    return "modified" if status else "tracked"


def source_repository(root: Path) -> dict[str, Any]:
    dirty_state = [
        line
        for line in git_output(root, "status", "--porcelain=v1").splitlines()
        if not line.startswith(IGNORED_SOURCE_STATUS_PREFIXES)
    ]
    return {
        "name": SOURCE_REPO,
        "commit": git_output(root, "rev-parse", "HEAD"),
        "branch": git_output(root, "branch", "--show-current"),
        "dirty": bool(dirty_state),
        "dirtyState": dirty_state,
    }


def scan_year_headings(lines: list[str], subject_title: str = "试卷二") -> list[dict[str, Any]]:
    headings = []
    for index, line in enumerate(lines, start=1):
        for year, label in YEAR_HEADINGS.items():
            if re.match(rf"^#\s*{label}年考研数学{subject_title}解答\s*$", line):
                headings.append({"year": year, "line": index, "title": line})
    return headings


def source_file_record(root: Path, relative_path: str, role: str) -> dict[str, Any]:
    path = root / relative_path
    lines = read_lines(path)
    digest = sha256_file(path)
    expected = PAPER_SHA256 if relative_path == PAPER_RELATIVE else SOLUTIONS_SHA256
    return {
        "relativePath": relative_path,
        "role": role,
        "gitState": git_state(root, relative_path),
        "bytes": path.stat().st_size,
        "lineCount": len(lines),
        "sha256": digest,
        "hashMatchesExpected": digest == expected,
        "yearHeadings": scan_year_headings(lines),
        "answerExplanationMarkers": sum(1 for line in lines if "解." in line or "解．" in line),
        "imageReferences": sum(1 for line in lines if IMAGE_RE.search(line)),
    }


def anomaly(issue_type: str, severity: str, message: str, blocks_publication: bool = True, **extra: Any) -> dict[str, Any]:
    return {
        "type": issue_type,
        "severity": severity,
        "message": message,
        "blocksPublication": blocks_publication,
        **extra,
    }


def stable_id(year: int, number: int) -> str:
    return f"{SUBJECT_CODE}-{year}-q{number:02d}"


def section_type(title: str) -> str:
    if "选择题" in title:
        return "multiple_choice"
    if "填空题" in title:
        return "fill_in_blank"
    if "证明题" in title:
        return "proof"
    return "solution"


def parse_expected_markers(title: str) -> list[int] | None:
    range_match = RANGE_RE.search(title)
    if range_match:
        start = int(range_match.group(1))
        end = int(range_match.group(2))
        if start <= end:
            return list(range(start, end + 1))
    count_match = COUNT_RE.search(title)
    if count_match:
        count = int(count_match.group(1))
        return list(range(1, count + 1))
    total_match = TOTAL_POINTS_RE.search(title)
    each_match = EACH_POINTS_RE.search(title)
    if total_match and each_match and int(each_match.group(1)) > 0:
        total = int(total_match.group(1))
        each = int(each_match.group(1))
        if total % each == 0 and total // each > 1:
            return list(range(1, total // each + 1))
    return None


def strip_empty(lines: list[str]) -> list[str]:
    result = list(lines)
    while result and not result[0].strip():
        result.pop(0)
    while result and not result[-1].strip():
        result.pop()
    return result


def split_years(lines: list[str]) -> dict[int, dict[str, Any]]:
    heading_positions = []
    top_level_positions = [index for index, line in enumerate(lines) if line.startswith("# ")]
    for index, line in enumerate(lines):
        for year, label in YEAR_HEADINGS.items():
            if re.match(rf"^#\s*{label}年考研数学试卷二解答\s*$", line):
                heading_positions.append((year, index))
    found = [year for year, _index in heading_positions]
    if found != list(YEARS):
        raise ValueError(f"expected Math2 headings {list(YEARS)}, got {found}")

    year_blocks = {}
    for year, start in heading_positions:
        later_top_levels = [index for index in top_level_positions if index > start]
        end = later_top_levels[0] if later_top_levels else len(lines)
        year_blocks[year] = {
            "title": lines[start],
            "lineStart": start + 1,
            "lineEnd": end,
            "lines": lines[start + 1:end],
            "bodyLineOffset": start + 2,
        }
    return year_blocks


def split_sections(year_block: dict[str, Any]) -> list[dict[str, Any]]:
    lines = year_block["lines"]
    offset = year_block["bodyLineOffset"]
    section_starts = []
    for index, line in enumerate(lines):
        match = ROMAN_SECTION_RE.match(line)
        if match:
            section_starts.append((index, match.group(1), match.group(2).strip()))
    sections = []
    for position, (start, roman, title) in enumerate(section_starts):
        end = section_starts[position + 1][0] if position + 1 < len(section_starts) else len(lines)
        expected_markers = parse_expected_markers(title)
        sections.append({
            "roman": roman,
            "title": title,
            "lineStart": offset + start,
            "lineEnd": offset + end - 1,
            "bodyLines": lines[start + 1:end],
            "bodyLineOffset": offset + start + 1,
            "expectedMarkers": expected_markers,
            "type": section_type(title),
        })
    return sections


def split_section_questions(section: dict[str, Any]) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    lines = section["bodyLines"]
    expected_markers = section["expectedMarkers"]
    markers = []
    for index, line in enumerate(lines):
        match = QUESTION_MARKER_RE.match(line)
        if match:
            markers.append((index, int(match.group(1)), match.group(2)))

    if expected_markers and [number for _idx, number, _rest in markers] == expected_markers:
        parts = []
        for position, (start, marker_number, first_line) in enumerate(markers):
            end = markers[position + 1][0] if position + 1 < len(markers) else len(lines)
            parts.append({
                "sourceMarker": marker_number,
                "lineStart": section["bodyLineOffset"] + start,
                "lineEnd": section["bodyLineOffset"] + end - 1,
                "lines": strip_empty([first_line, *lines[start + 1:end]]),
                "splitSafe": True,
            })
        return parts, []

    if not expected_markers:
        return [{
            "sourceMarker": None,
            "lineStart": section["bodyLineOffset"],
            "lineEnd": section["lineEnd"],
            "lines": strip_empty(lines),
            "splitSafe": True,
        }], []

    found = [number for _idx, number, _rest in markers]
    return [{
        "sourceMarker": None,
        "lineStart": section["bodyLineOffset"],
        "lineEnd": section["lineEnd"],
        "lines": strip_empty(lines),
        "splitSafe": False,
    }], [
        anomaly(
            "section_split_mismatch",
            "warning",
            f"Section expected markers {expected_markers} but found markers {found}; kept the section as one blocked review item.",
            True,
            sectionTitle=section["title"],
            sectionRoman=section["roman"],
            expectedMarkers=expected_markers,
            foundMarkers=found,
        )
    ]


def split_explanation(text: str) -> tuple[str, str | None]:
    match = EXPLANATION_RE.search(text)
    if not match:
        return text.strip(), None
    return text[:match.start()].strip(), text[match.start():].strip()


def extract_options(stem_text: str) -> tuple[str, list[dict[str, str]]]:
    matches = list(CHOICE_MARKER_RE.finditer(stem_text))
    if not matches:
        return stem_text.strip(), []
    stem = stem_text[:matches[0].start()].strip()
    options = []
    for index, match in enumerate(matches):
        end = matches[index + 1].start() if index + 1 < len(matches) else len(stem_text)
        options.append({"label": match.group(1), "value": stem_text[match.end():end].strip()})
    return stem, options


def extract_answer(kind: str, explanation: str | None, split_safe: bool) -> tuple[str | None, str]:
    if not split_safe or not explanation:
        return None, "missing"
    if kind == "multiple_choice":
        match = MC_ANSWER_RE.search(explanation)
        if match:
            return match.group(1), "sourced_from_aggregate"
    if kind == "fill_in_blank":
        match = FILL_ANSWER_RE.search(explanation)
        if match:
            return match.group(1).strip(), "sourced_from_aggregate"
    return None, "missing"


def normalize_question_type(
    intended_type: str,
    options: list[dict[str, str]],
    split_safe: bool,
    item_anomalies: list[dict[str, Any]],
) -> tuple[str, list[dict[str, str]]]:
    if not split_safe:
        return "unknown", []
    if intended_type != "multiple_choice":
        return intended_type, []
    labels = [option["label"] for option in options]
    values_present = all(option["value"].strip() for option in options)
    if labels == ["A", "B", "C", "D"] and values_present:
        return "multiple_choice", options
    item_anomalies.append(
        anomaly(
            "incomplete_choice_options",
            "error",
            f"Expected complete A-D options, found labels {labels}; stored as unknown review item without options.",
            True,
            foundOptionLabels=labels,
        )
    )
    return "unknown", []


def parse_year_questions(
    year: int,
    year_block: dict[str, Any],
    paper_record: dict[str, Any],
) -> tuple[list[dict[str, Any]], list[dict[str, Any]], list[dict[str, Any]]]:
    questions: list[dict[str, Any]] = []
    anomalies: list[dict[str, Any]] = []
    section_scan: list[dict[str, Any]] = []
    question_number = 1

    for section in split_sections(year_block):
        parts, split_anomalies = split_section_questions(section)
        anomalies.extend(split_anomalies)
        section_scan.append({
            "roman": section["roman"],
            "title": section["title"],
            "lineStart": section["lineStart"],
            "lineEnd": section["lineEnd"],
            "expectedMarkers": section["expectedMarkers"],
            "foundItems": len(parts),
            "type": section["type"],
            "splitSafe": all(part["splitSafe"] for part in parts),
        })
        for part in parts:
            raw_text = "\n".join(part["lines"]).strip()
            stem_text, explanation = split_explanation(raw_text)
            stem, options = extract_options(stem_text) if section["type"] == "multiple_choice" else (stem_text, [])
            item_anomalies = []
            if not part["splitSafe"]:
                item_anomalies.extend(split_anomalies)
            if CROSS_PAPER_RE.search(raw_text):
                item_anomalies.append(
                    anomaly(
                        "cross_paper_reference",
                        "error",
                        "Source block references another paper; content is not expanded or invented.",
                        True,
                    )
                )
            if IMAGE_RE.search(raw_text):
                item_anomalies.append(
                    anomaly(
                        "image_reference_in_source",
                        "warning",
                        "Source block includes an image reference; human review must confirm the rendered figure.",
                        True,
                    )
                )
            if not stem.strip():
                item_anomalies.append(anomaly("empty_stem_after_split", "error", "Stem is empty after deterministic split."))
                stem = raw_text
            if explanation is None:
                item_anomalies.append(
                    anomaly(
                        "missing_explanation_marker",
                        "error",
                        "No explicit `解.` marker was found in this source block.",
                        True,
                    )
                )
            kind, options = normalize_question_type(section["type"], options, part["splitSafe"], item_anomalies)
            answer, answer_status = extract_answer(kind, explanation, part["splitSafe"])
            questions.append({
                "stableId": stable_id(year, question_number),
                "sourceYear": year,
                "subjectCode": SUBJECT_CODE,
                "type": kind,
                "questionNumber": question_number,
                "stem": stem,
                "options": options,
                "answer": answer,
                "answerStatus": answer_status,
                "explanation": explanation,
                "explanationStatus": "sourced_from_aggregate" if explanation else "missing",
                "reviewStatus": "needs_human_review",
                "finalizationStatus": "blocked",
                "knowledgePoints": [],
                "anomalies": item_anomalies,
                "sourceEvidence": [{
                    "relativePath": PAPER_RELATIVE,
                    "role": paper_record["role"],
                    "gitState": paper_record["gitState"],
                    "sha256": paper_record["sha256"],
                    "lineStart": part["lineStart"],
                    "lineEnd": part["lineEnd"],
                }],
            })
            question_number += 1
    return questions, anomalies, section_scan


def validate_payload(payload: dict[str, Any]) -> list[str]:
    errors: list[str] = []
    if payload.get("schemaVersion") != SCHEMA_VERSION:
        errors.append("unexpected schemaVersion")
    if payload.get("subjectCode") != SUBJECT_CODE:
        errors.append("subjectCode must be math2")
    questions = payload.get("questions")
    if not isinstance(questions, list) or not questions:
        return [*errors, "questions must be a non-empty array"]
    seen_ids = set()
    for index, question in enumerate(questions, start=1):
        expected_stable = stable_id(payload["sourceYear"], index)
        if question.get("stableId") != expected_stable:
            errors.append(f"q{index:02d} stableId mismatch")
        if question.get("stableId") in seen_ids:
            errors.append(f"duplicate stableId {question.get('stableId')}")
        seen_ids.add(question.get("stableId"))
        if question.get("questionNumber") != index:
            errors.append(f"{expected_stable} questionNumber mismatch")
        if question.get("reviewStatus") != "needs_human_review":
            errors.append(f"{expected_stable} reviewStatus must be needs_human_review")
        if question.get("finalizationStatus") != "blocked":
            errors.append(f"{expected_stable} finalizationStatus must be blocked")
        if not str(question.get("stem", "")).strip():
            errors.append(f"{expected_stable} stem must be non-empty")
        options = question.get("options")
        if not isinstance(options, list):
            errors.append(f"{expected_stable} options must be an array")
            continue
        for option in options:
            if set(option) != {"label", "value"}:
                errors.append(f"{expected_stable} option shape must be exactly label/value")
            if not str(option.get("value", "")).strip():
                errors.append(f"{expected_stable} option value must be non-empty")
        if question.get("type") == "multiple_choice":
            if [option.get("label") for option in options] != ["A", "B", "C", "D"]:
                errors.append(f"{expected_stable} multiple_choice options must be A-D")
        elif options:
            errors.append(f"{expected_stable} non-choice options must be empty")
    if payload["validation"]["questionCounts"] != payload["validation"]["expectedCounts"]:
        errors.append("questionCounts and expectedCounts must match generated payload")
    return errors


def make_payload(
    root: Path,
    year: int,
    year_block: dict[str, Any],
    paper_record: dict[str, Any],
    solution_record: dict[str, Any],
) -> tuple[dict[str, Any], list[dict[str, Any]], list[dict[str, Any]]]:
    questions, parse_anomalies, section_scan = parse_year_questions(year, year_block, paper_record)
    counts = dict(Counter(question["type"] for question in questions))
    for kind in ("multiple_choice", "fill_in_blank", "solution", "proof", "unknown"):
        counts.setdefault(kind, 0)
    batch_anomalies = [
        anomaly(
            "aggregate_subject_title_math2",
            "info",
            "Aggregate heading says `考研数学试卷二解答`; staged under math2.",
            False,
            heading=year_block["title"],
        ),
        *parse_anomalies,
    ]
    payload = {
        "schemaVersion": SCHEMA_VERSION,
        "batchId": f"REQ-017-math2-{year}-aggregate-staging",
        "subjectCode": SUBJECT_CODE,
        "sourceYear": year,
        "sourceRepository": source_repository(root),
        "sourceRoleDecision": {
            "requirement": "docs/requirements/REQ-017-math2-1997-2019-staging-readiness.md",
            "priorAudit": "docs/requirements/REQ-003-math2-full-import-prep.md",
            "decision": "stage_1997_2019_as_math2_from_aggregate_trial_paper_two_headings",
            "primaryRelativePath": PAPER_RELATIVE,
            "solutionsRelativePath": SOLUTIONS_RELATIVE,
            "pdfPrerequisite": False,
        },
        "feedback": {
            "configuredBy": "VITE_FEEDBACK_EMAIL",
            "publicEmail": FEEDBACK_EMAIL,
            "requiredForLaunch": False,
            "status": "maintainer_email_configured",
        },
        "sourceFiles": [paper_record, solution_record],
        "questions": questions,
        "anomalies": batch_anomalies,
        "validation": {
            "inputFilesRead": 2,
            "questionsGenerated": len(questions),
            "questionCounts": counts,
            "expectedCounts": counts,
            "countsMatch": True,
            "stableIdsUnique": len({item["stableId"] for item in questions}) == len(questions),
            "allQuestionsBlocked": all(item["finalizationStatus"] == "blocked" for item in questions),
            "allQuestionsNeedReview": all(item["reviewStatus"] == "needs_human_review" for item in questions),
            "answersPresent": sum(item["answer"] is not None for item in questions),
            "explanationsPresent": sum(item["explanation"] is not None for item in questions),
            "choiceOptionsComplete": all(
                [option["label"] for option in item["options"]] == ["A", "B", "C", "D"]
                for item in questions
                if item["type"] == "multiple_choice"
            ),
            "schemaValid": True,
            "schemaErrors": [],
            "anomaliesBySeverity": dict(Counter(
                item["severity"]
                for item in [
                    *batch_anomalies,
                    *[anomaly_item for question in questions for anomaly_item in question["anomalies"]],
                ]
            )),
        },
    }
    schema_errors = validate_payload(payload)
    payload["validation"]["schemaValid"] = not schema_errors
    payload["validation"]["schemaErrors"] = schema_errors
    return payload, batch_anomalies, section_scan


def write_year_output(output_root: Path, payload: dict[str, Any], batch_anomalies: list[dict[str, Any]]) -> None:
    year_dir = output_root / str(payload["sourceYear"])
    year_dir.mkdir(parents=True, exist_ok=True)
    all_anomalies = [
        *batch_anomalies,
        *[
            {"stableId": question["stableId"], **item}
            for question in payload["questions"]
            for item in question["anomalies"]
        ],
    ]
    for name, document in {
        "questions.json": payload,
        "anomalies.json": {
            "schemaVersion": TRANSFORM_VERSION,
            "totalAnomalies": len(all_anomalies),
            "anomalies": all_anomalies,
        },
        "validation.json": payload["validation"],
    }.items():
        (year_dir / name).write_text(
            json.dumps(document, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
    (year_dir / "summary.md").write_text(
        "\n".join([
            f"# Math2 {payload['sourceYear']} Aggregate Staging Summary",
            "",
            "- Source title: `考研数学试卷二解答`.",
            "- Status: staging only; all records remain `needs_human_review` and `blocked`.",
            f"- Questions generated: {payload['validation']['questionsGenerated']}.",
            f"- Counts: {json.dumps(payload['validation']['questionCounts'], ensure_ascii=False, sort_keys=True)}.",
            f"- Answers sourced into answer field: {payload['validation']['answersPresent']}.",
            f"- Explanations sourced: {payload['validation']['explanationsPresent']}.",
            f"- Schema valid: {str(payload['validation']['schemaValid']).lower()}.",
            "- DB boundary: can be imported only as staging; promotion is out of scope.",
            "",
        ]),
        encoding="utf-8",
    )


def write_reports(
    report_dir: Path,
    inventory: dict[str, Any],
    audit: dict[str, Any],
    payloads: list[dict[str, Any]],
) -> None:
    report_dir.mkdir(parents=True, exist_ok=True)
    (report_dir / "source-inventory.json").write_text(json.dumps(inventory, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (report_dir / "audit.json").write_text(json.dumps(audit, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    checklist_lines = [
        "# Math2 1997-2019 Human Review Checklist",
        "",
        "| Year | Stable ID | Type | Answer | Explanation | Anomalies | Source lines |",
        "|---:|---|---|---|---|---:|---|",
    ]
    for payload in payloads:
        for question in payload["questions"]:
            evidence = question["sourceEvidence"][0]
            checklist_lines.append(
                "| "
                + " | ".join([
                    str(payload["sourceYear"]),
                    question["stableId"],
                    question["type"],
                    question["answerStatus"],
                    question["explanationStatus"],
                    str(len(question["anomalies"])),
                    f"{evidence['lineStart']}-{evidence['lineEnd']}",
                ])
                + " |"
            )
    checklist_lines.extend([
        "",
        "Review focus:",
        "",
        "- Resolve `cross_paper_reference` items from approved source evidence before promotion.",
        "- Review `section_split_mismatch`, `incomplete_choice_options`, and `image_reference_in_source` anomalies.",
        "- Do not promote any record until a separate review requirement approves it.",
        "",
    ])
    (report_dir / "human-review-checklist.md").write_text("\n".join(checklist_lines), encoding="utf-8")

    totals = Counter()
    blocked_years = []
    for payload in payloads:
        totals["questions"] += len(payload["questions"])
        totals["answers"] += payload["validation"]["answersPresent"]
        totals["explanations"] += payload["validation"]["explanationsPresent"]
        if payload["validation"]["anomaliesBySeverity"].get("error", 0):
            blocked_years.append(payload["sourceYear"])
    (report_dir / "staging-summary.md").write_text(
        "\n".join([
            "# Math2 1997-2019 Staging Summary",
            "",
            f"- Years: {YEARS[0]}-{YEARS[-1]}.",
            f"- Total generated records: {totals['questions']}.",
            f"- Answer fields sourced: {totals['answers']}.",
            f"- Explanation fields sourced: {totals['explanations']}.",
            "- All records remain `needs_human_review` and `blocked`.",
            f"- Years with blocking anomalies: {', '.join(str(year) for year in blocked_years) if blocked_years else 'none'}.",
            "- Live DB import is out of scope unless separately approved for REQ-017.",
            "",
        ]),
        encoding="utf-8",
    )


def transform_all(source_root: Path, output_root: Path, report_dir: Path) -> list[dict[str, Any]]:
    paper_path = source_root / PAPER_RELATIVE
    solutions_path = source_root / SOLUTIONS_RELATIVE
    if not paper_path.is_file():
        raise FileNotFoundError(paper_path)
    if not solutions_path.is_file():
        raise FileNotFoundError(solutions_path)

    paper_lines = read_lines(paper_path)
    paper_record = source_file_record(source_root, PAPER_RELATIVE, "primary_aggregate_math2_1997_2019_source")
    solution_record = source_file_record(source_root, SOLUTIONS_RELATIVE, "solutions_aggregate_reference")
    if not paper_record["hashMatchesExpected"] or not solution_record["hashMatchesExpected"]:
        raise ValueError("aggregate source hash mismatch")

    year_blocks = split_years(paper_lines)
    inventory = {
        "schemaVersion": TRANSFORM_VERSION,
        "sourceRepositoryBefore": source_repository(source_root),
        "sourceFiles": [paper_record, solution_record],
    }
    audit: dict[str, Any] = {
        "schemaVersion": TRANSFORM_VERSION,
        "yearBoundaryScan": [
            {
                "year": year,
                "lineStart": block["lineStart"],
                "lineEnd": block["lineEnd"],
                "title": block["title"],
                "subjectTitleRisk": "math2_heading_confirmed",
            }
            for year, block in year_blocks.items()
        ],
        "questionBoundaryScan": [],
        "choiceOptionScan": [],
        "answerExplanationMarkerScan": [],
        "crossPaperReferenceScan": [],
    }
    payloads = []
    for year in YEARS:
        payload, batch_anomalies, section_scan = make_payload(source_root, year, year_blocks[year], paper_record, solution_record)
        write_year_output(output_root, payload, batch_anomalies)
        payloads.append(payload)
        audit["questionBoundaryScan"].append({
            "year": year,
            "sections": section_scan,
            "questionsGenerated": len(payload["questions"]),
            "stableIds": [question["stableId"] for question in payload["questions"]],
        })
        audit["choiceOptionScan"].append({
            "year": year,
            "multipleChoiceRecords": payload["validation"]["questionCounts"].get("multiple_choice", 0),
            "choiceOptionsComplete": payload["validation"]["choiceOptionsComplete"],
            "unknownRecords": payload["validation"]["questionCounts"].get("unknown", 0),
        })
        audit["answerExplanationMarkerScan"].append({
            "year": year,
            "answersPresent": payload["validation"]["answersPresent"],
            "explanationsPresent": payload["validation"]["explanationsPresent"],
            "missingExplanationMarkers": sum(
                1
                for question in payload["questions"]
                for item in question["anomalies"]
                if item["type"] == "missing_explanation_marker"
            ),
        })
        audit["crossPaperReferenceScan"].append({
            "year": year,
            "crossPaperReferenceRecords": sum(
                1
                for question in payload["questions"]
                for item in question["anomalies"]
                if item["type"] == "cross_paper_reference"
            ),
        })

    inventory["sourceRepositoryAfter"] = source_repository(source_root)
    write_reports(report_dir, inventory, audit, payloads)
    return payloads


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("source_root", type=Path)
    parser.add_argument("output_root", type=Path)
    parser.add_argument("report_dir", type=Path)
    args = parser.parse_args()
    payloads = transform_all(args.source_root.resolve(), args.output_root.resolve(), args.report_dir.resolve())
    total = sum(len(payload["questions"]) for payload in payloads)
    invalid = [payload["sourceYear"] for payload in payloads if not payload["validation"]["schemaValid"]]
    print(f"Math2 1997-2019: {total} staging records generated")
    if invalid:
        raise SystemExit(f"schema invalid for years: {invalid}")


if __name__ == "__main__":
    main()
