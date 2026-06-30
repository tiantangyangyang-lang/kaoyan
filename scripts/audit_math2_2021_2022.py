"""Audit Math2 2021/2022 source readiness without generating staging."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import subprocess
from collections import Counter
from pathlib import Path
from typing import Any


SCHEMA_VERSION = "math2-2021-2022-readiness-audit-v1"
SOURCE_REPO = "Kaoyan-Math2-Papers"
REQUIREMENT = "docs/requirements/REQ-011-math2-2021-2022-staging-readiness.md"
REPORT_DIR = "content/reports/req-011-math2-2021-2022-staging-readiness"
EXPECTED_NUMBERS = list(range(1, 23))
CHOICE_NUMBERS = list(range(1, 11))
OPTION_LABELS = ["A", "B", "C", "D"]

YEAR_SPECS: dict[int, dict[str, Any]] = {
    2021: {
        "batchId": "math2-2021-wrong-subject-audit",
        "expectedSubjectCode": "math2",
        "sources": [
            {
                "relativePath": "papers/MinerU_markdown_math2_2021_2065687851346780160.md",
                "role": "paper_candidate",
                "expectedSha256": "6c7c470e3edcafa3a5541365406c10cfcd6322db32cb5e27581cb3e8a34f8f1e",
            },
            {
                "relativePath": "solutions/2021/math2_2021/math2_2021.md",
                "role": "solutions_candidate",
                "expectedSha256": "effe54ef9285571d75a9b3eff150fcad8276aa180298f242c289b0626992229d",
            },
        ],
    },
    2022: {
        "batchId": "math2-2022-ocr-boundary-audit",
        "expectedSubjectCode": "math2",
        "sources": [
            {
                "relativePath": "papers/MinerU_markdown_math2_2022_2065687890395758592.md",
                "role": "paper_candidate",
                "expectedSha256": "5ccb6ed1c8d12157bd72d44414dff2616465da113a39295acedceb7675052b70",
            },
            {
                "relativePath": "solutions/2022/math2_2022/math2_2022.md",
                "role": "solutions_candidate",
                "expectedSha256": "9c6f7ffb8c0780413b6c81e37f3e2d4b1a007ddf0b1f02b4ae681d441bd3de6c",
            },
        ],
    },
}

ANSWER_RE = re.compile(r"【答案】|答案[:：]|参考答案")
EXPLANATION_RE = re.compile(r"【解析[^】]*】|【解】|解析[:：]|解答[:：]")
IMAGE_RE = re.compile(r"!\[[^\]]*\]\(([^)]+)\)")
STRICT_QUESTION_RE = re.compile(r"^\s*(?:#{1,6}\s*)?[（(]\s*(\d{1,2})\s*[）)]")
FALLBACK_QUESTION_RE = re.compile(
    r"^\s*(?:#{1,6}\s*)?(?:[（(]\s*)?(\d{1,2})(?:\s*[）)]|[.、])"
)
OPTION_RE = re.compile(r"^\s*[（(]\s*([A-D])\s*[）)]\s*(.*)$")
SECTION_RE = re.compile(r"(选择题|填空题|解答题)")
SUBJECT_RE = re.compile(r"数学\s*([一二三123])")
SUBJECT_MAP = {
    "一": "math1",
    "1": "math1",
    "二": "math2",
    "2": "math2",
    "三": "math3",
    "3": "math3",
}


def normalize_newlines(text: str) -> str:
    return text.replace("\r\n", "\n").replace("\r", "\n")


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
    return "modified" if git_output(root, "status", "--porcelain=v1", "--", relative_path) else "tracked"


def source_repo_state(source_root: Path) -> dict[str, Any]:
    dirty_state = git_output(source_root, "status", "--porcelain=v1").splitlines()
    return {
        "name": SOURCE_REPO,
        "path": str(source_root),
        "commit": git_output(source_root, "rev-parse", "HEAD"),
        "branch": git_output(source_root, "branch", "--show-current"),
        "dirty": bool(dirty_state),
        "dirtyState": dirty_state,
    }


def detect_subject_identity(text: str, expected: str) -> dict[str, Any]:
    lines = normalize_newlines(text).splitlines()
    evidence = [
        {"line": index + 1, "text": line.strip()}
        for index, line in enumerate(lines[:40])
        if "数学" in line
    ][:5]
    detected = "unknown"
    marker = None
    for item in evidence:
        match = SUBJECT_RE.search(item["text"])
        if match:
            marker = match.group(1)
            detected = SUBJECT_MAP.get(marker, "unknown")
            break
    return {
        "expectedSubjectCode": expected,
        "detectedSubjectCode": detected,
        "detectedMarker": marker,
        "matchesExpected": detected == expected,
        "evidence": evidence,
    }


def find_sections(text: str) -> list[dict[str, Any]]:
    return [
        {"line": index + 1, "text": line.strip()}
        for index, line in enumerate(normalize_newlines(text).splitlines())
        if SECTION_RE.search(line)
    ]


def image_references(path: Path, text: str) -> list[dict[str, Any]]:
    images = []
    for reference in IMAGE_RE.findall(text):
        remote = bool(re.match(r"^https?://", reference, re.I))
        images.append({
            "reference": reference,
            "kind": "remote" if remote else "relative",
            "exists": None if remote else (path.parent / reference).is_file(),
        })
    return images


def boundary_scan(text: str, pattern: re.Pattern[str]) -> dict[str, Any]:
    lines = normalize_newlines(text).splitlines()
    hits = []
    for index, line in enumerate(lines):
        match = pattern.match(line)
        if not match:
            continue
        number = int(match.group(1))
        if 1 <= number <= 24:
            hits.append({"number": number, "line": index + 1, "text": line.strip()[:160]})

    counts = Counter(item["number"] for item in hits)
    first_occurrences = []
    seen = set()
    for item in hits:
        if item["number"] not in seen:
            first_occurrences.append(item)
            seen.add(item["number"])
    first_numbers = [item["number"] for item in first_occurrences]
    missing = [number for number in EXPECTED_NUMBERS if number not in seen]
    unexpected = [number for number in sorted(counts) if number not in EXPECTED_NUMBERS]
    return {
        "numbers": [item["number"] for item in hits],
        "firstOccurrenceNumbers": first_numbers,
        "firstOccurrences": first_occurrences,
        "missingExpectedNumbers": missing,
        "duplicateNumbers": [number for number, count in sorted(counts.items()) if count > 1],
        "unexpectedNumbers": unexpected,
        "containsExpectedQuestionSet": not missing,
        "firstOccurrencesMatchExpected": first_numbers[: len(EXPECTED_NUMBERS)] == EXPECTED_NUMBERS,
    }


def block_lines_by_first_occurrence(text: str, scan: dict[str, Any]) -> dict[int, list[str]]:
    lines = normalize_newlines(text).splitlines()
    starts = [
        (item["number"], item["line"] - 1)
        for item in scan["firstOccurrences"]
        if item["number"] in EXPECTED_NUMBERS
    ]
    starts.sort(key=lambda item: item[1])
    blocks: dict[int, list[str]] = {}
    for index, (number, start) in enumerate(starts):
        end = starts[index + 1][1] if index + 1 < len(starts) else len(lines)
        first_line = lines[start]
        match = FALLBACK_QUESTION_RE.match(first_line)
        body = [first_line[match.end():] if match else first_line, *lines[start + 1:end]]
        while body and not body[0].strip():
            body.pop(0)
        while body and not body[-1].strip():
            body.pop()
        blocks[number] = body
    return blocks


def parse_options(body_lines: list[str]) -> list[dict[str, Any]]:
    markers = []
    for index, line in enumerate(body_lines):
        match = OPTION_RE.match(line)
        if match:
            markers.append((index, match.group(1), match.group(2)))
    options = []
    for position, (index, label, first_value) in enumerate(markers):
        end = markers[position + 1][0] if position + 1 < len(markers) else len(body_lines)
        value = "\n".join([first_value, *body_lines[index + 1:end]]).strip()
        options.append({"label": label, "value": value, "lineOffset": index + 1})
    return options


def choice_option_scan(text: str, scan: dict[str, Any]) -> dict[str, Any]:
    blocks = block_lines_by_first_occurrence(text, scan)
    items = []
    complete = []
    incomplete = []
    for number in CHOICE_NUMBERS:
        if number not in blocks:
            item = {
                "questionNumber": number,
                "status": "missing_question_boundary",
                "labels": [],
                "missingLabels": OPTION_LABELS,
                "emptyLabels": [],
            }
            items.append(item)
            incomplete.append(item)
            continue

        options = parse_options(blocks[number])
        labels = [item["label"] for item in options]
        missing = [label for label in OPTION_LABELS if label not in labels]
        empty = [
            item["label"]
            for item in options
            if item["label"] in OPTION_LABELS and not item["value"].strip()
        ]
        status = "complete" if labels[:4] == OPTION_LABELS and not missing and not empty else "incomplete"
        item = {
            "questionNumber": number,
            "status": status,
            "labels": labels,
            "missingLabels": missing,
            "emptyLabels": empty,
            "options": options,
        }
        items.append(item)
        (complete if status == "complete" else incomplete).append(item)

    return {
        "questionsScanned": len(items),
        "completeChoiceQuestions": [item["questionNumber"] for item in complete],
        "incompleteChoiceQuestions": [
            {
                "questionNumber": item["questionNumber"],
                "status": item["status"],
                "labels": item["labels"],
                "missingLabels": item["missingLabels"],
                "emptyLabels": item["emptyLabels"],
            }
            for item in incomplete
        ],
        "allChoiceOptionsComplete": len(incomplete) == 0,
    }


def source_record(source_root: Path, spec: dict[str, Any], expected_subject: str) -> dict[str, Any]:
    relative_path = spec["relativePath"]
    path = source_root / Path(relative_path)
    text = path.read_text(encoding="utf-8-sig")
    file_hash = sha256_file(path)
    strict_scan = boundary_scan(text, STRICT_QUESTION_RE)
    fallback_scan = boundary_scan(text, FALLBACK_QUESTION_RE)
    return {
        "relativePath": relative_path,
        "role": spec["role"],
        "gitState": git_state(source_root, relative_path),
        "bytes": path.stat().st_size,
        "lines": len(normalize_newlines(text).splitlines()),
        "sha256": file_hash,
        "expectedSha256": spec["expectedSha256"],
        "hashMatchesExpected": file_hash == spec["expectedSha256"],
        "subjectIdentity": detect_subject_identity(text, expected_subject),
        "answerMarkers": len(ANSWER_RE.findall(text)),
        "explanationMarkers": len(EXPLANATION_RE.findall(text)),
        "sections": find_sections(text),
        "imageReferences": image_references(path, text),
        "boundaryScans": {
            "strictParenthesized": strict_scan,
            "fallbackNumeric": fallback_scan,
        },
        "choiceOptionScan": choice_option_scan(text, fallback_scan),
    }


def blocker(issue_type: str, severity: str, message: str, source_path: str | None = None) -> dict[str, Any]:
    item: dict[str, Any] = {
        "type": issue_type,
        "severity": severity,
        "message": message,
    }
    if source_path:
        item["sourceRelativePath"] = source_path
    return item


def decide_year(year: int, records: list[dict[str, Any]]) -> dict[str, Any]:
    by_role = {item["role"]: item for item in records}
    blockers = []
    wrong_subjects = [
        item for item in records if not item["subjectIdentity"]["matchesExpected"]
    ]
    if wrong_subjects:
        detected = sorted({
            item["subjectIdentity"]["detectedSubjectCode"] for item in wrong_subjects
        })
        blockers.append(blocker(
            "subject_identity_mismatch",
            "critical",
            (
                f"Expected Math2 source evidence, but candidate title evidence "
                f"detects {', '.join(detected)}."
            ),
        ))
        return {
            "status": "blocked_wrong_subject",
            "stagingReady": False,
            "decision": "do_not_stage_until_true_math2_source_is_supplied_or_approved",
            "blockers": blockers,
            "nextActions": [
                "Maintainer must supply or approve a true Math2 2021 source before staging.",
                "Do not reuse Math3 answers/explanations as Math2 evidence.",
            ],
        }

    paper = by_role.get("paper_candidate")
    solutions = by_role.get("solutions_candidate")
    if year == 2022 and paper and solutions:
        paper_boundary = paper["boundaryScans"]["fallbackNumeric"]
        paper_options = paper["choiceOptionScan"]
        solutions_boundary = solutions["boundaryScans"]["fallbackNumeric"]
        solutions_options = solutions["choiceOptionScan"]
        if (
            not paper_boundary["firstOccurrencesMatchExpected"]
            or not paper_options["allChoiceOptionsComplete"]
        ):
            missing = paper_boundary["missingExpectedNumbers"]
            incomplete = paper_options["incompleteChoiceQuestions"]
            details = []
            if missing:
                details.append(f"missing question boundaries {missing}")
            if incomplete:
                question_numbers = [item["questionNumber"] for item in incomplete]
                details.append(f"incomplete choice options for Q{question_numbers}")
            blockers.append(blocker(
                "paper_candidate_not_mechanically_stageable",
                "error",
                "The 2022 paper candidate is not mechanically stageable: " + "; ".join(details) + ".",
                paper["relativePath"],
            ))
        if (
            not solutions_boundary["firstOccurrencesMatchExpected"]
            or not solutions_options["allChoiceOptionsComplete"]
        ):
            missing = solutions_boundary["missingExpectedNumbers"]
            incomplete = solutions_options["incompleteChoiceQuestions"]
            details = []
            if missing:
                details.append(f"missing question boundaries {missing}")
            if incomplete:
                question_numbers = [item["questionNumber"] for item in incomplete]
                details.append(f"incomplete choice options for Q{question_numbers}")
            blockers.append(blocker(
                "solutions_candidate_not_mechanically_stageable_without_repair",
                "error",
                "The 2022 solutions candidate is not mechanically stageable as-is: "
                + "; ".join(details)
                + ".",
                solutions["relativePath"],
            ))
        if solutions["answerMarkers"] or solutions["explanationMarkers"]:
            blockers.append(blocker(
                "solutions_candidate_requires_source_role_decision",
                "warning",
                (
                    "The 2022 solutions candidate includes explicit answer/"
                    "explanation markers. Using it as primary question evidence or "
                    "answer evidence requires a separate source-role decision and "
                    "cannot be done silently in this audit task."
                ),
                solutions["relativePath"],
            ))
        return {
            "status": "blocked_source_role_decision_required" if blockers else "staging_ready",
            "stagingReady": not blockers,
            "decision": (
                "do_not_stage_in_req_011; create a focused 2022 source-role or "
                "repair requirement before generating blocked staging"
            ) if blockers else "paper_candidate_can_be_used_for_future_blocked_staging",
            "blockers": blockers,
            "nextActions": [
                "Choose whether 2022 may use either candidate as primary or comparison evidence.",
                "Repair or explicitly account for missing Q2/Q7 paper boundaries and missing Q10 solutions boundary.",
                "If approved, generate blocked staging in a separate 2022-only PR.",
                "Do not invent missing boundaries, options, answers, explanations, or formulas.",
            ] if blockers else [
                "Generate 2022 blocked staging in a separate PR."
            ],
        }

    return {
        "status": "unknown",
        "stagingReady": False,
        "decision": "manual_review_required",
        "blockers": [blocker("audit_incomplete", "error", "Year audit could not be completed.")],
        "nextActions": ["Inspect missing source records."],
    }


def build_audit(source_root: Path) -> dict[str, Any]:
    years = []
    for year, spec in YEAR_SPECS.items():
        records = [
            source_record(source_root, source_spec, spec["expectedSubjectCode"])
            for source_spec in spec["sources"]
        ]
        decision = decide_year(year, records)
        years.append({
            "year": year,
            "batchId": spec["batchId"],
            "expectedQuestionNumbers": EXPECTED_NUMBERS,
            "expectedQuestionCounts": {
                "multiple_choice": 10,
                "fill_in_blank": 6,
                "solution": 6,
            },
            "sources": records,
            **decision,
        })

    return {
        "schemaVersion": SCHEMA_VERSION,
        "requirement": REQUIREMENT,
        "reportDirectory": REPORT_DIR,
        "sourceRepository": source_repo_state(source_root),
        "years": years,
        "roadmap": [
            {
                "scope": "2021",
                "recommendation": "Keep blocked until a true Math2 2021 source is supplied or approved.",
            },
            {
                "scope": "2022",
                "recommendation": "Open a 2022-only source-role/repair PR before staging.",
            },
            {
                "scope": "1987-2019",
                "recommendation": (
                    "Handle in later aggregate-split requirements; do not mix with "
                    "REQ-011."
                ),
            },
        ],
    }


def markdown_source_table(records: list[dict[str, Any]]) -> list[str]:
    rows = [
        "| Role | Path | Subject | Hash OK | Boundaries | Choice Options | Answers | Explanations |",
        "|---|---|---|---|---|---|---:|---:|",
    ]
    for item in records:
        subject = item["subjectIdentity"]["detectedSubjectCode"]
        scan = item["boundaryScans"]["fallbackNumeric"]
        options = item["choiceOptionScan"]
        rows.append(
            "| "
            + " | ".join([
                item["role"],
                f"`{item['relativePath']}`",
                subject,
                str(item["hashMatchesExpected"]).lower(),
                "1-22" if scan["firstOccurrencesMatchExpected"] else f"missing {scan['missingExpectedNumbers']}",
                "complete" if options["allChoiceOptionsComplete"] else "incomplete",
                str(item["answerMarkers"]),
                str(item["explanationMarkers"]),
            ])
            + " |"
        )
    return rows


def write_main_markdown(path: Path, audit: dict[str, Any]) -> None:
    lines = [
        "# Math2 2021-2022 Staging Readiness Audit",
        "",
        "- Requirement: `docs/requirements/REQ-011-math2-2021-2022-staging-readiness.md`",
        "- Scope: read-only source audit; no staging, frontend publication, or DB import.",
        f"- Source commit: `{audit['sourceRepository']['commit']}`",
        f"- Source dirty: `{str(audit['sourceRepository']['dirty']).lower()}`",
        "",
        "## Findings",
        "",
    ]
    for year in audit["years"]:
        lines.extend([
            f"### {year['year']}",
            "",
            f"- Status: `{year['status']}`",
            f"- Staging ready: `{str(year['stagingReady']).lower()}`",
            f"- Decision: {year['decision']}",
            "",
            *markdown_source_table(year["sources"]),
            "",
            "Blockers:",
            "",
        ])
        if year["blockers"]:
            lines.extend([f"- `{item['type']}`: {item['message']}" for item in year["blockers"]])
        else:
            lines.append("- None.")
        lines.extend(["", "Next actions:", ""])
        lines.extend([f"- {item}" for item in year["nextActions"]])
        lines.append("")
    lines.extend([
        "## Roadmap",
        "",
        "- REQ-011 stops at audit artifacts for 2021/2022.",
        "- 2021 needs a true Math2 source before any staging work.",
        "- 2022 needs a separate source-role/repair PR before staging.",
        "- 1987-2019 remains a later aggregate split and historical subject-title review task.",
        "",
    ])
    path.write_text("\n".join(lines), encoding="utf-8")


def write_year_audit(path: Path, year: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    lines = [
        f"# Math2 {year['year']} Source-Role Audit",
        "",
        f"- Status: `{year['status']}`",
        f"- Staging ready: `{str(year['stagingReady']).lower()}`",
        f"- Decision: {year['decision']}",
        "",
        "## Source Candidates",
        "",
        *markdown_source_table(year["sources"]),
        "",
        "## Blockers",
        "",
    ]
    if year["blockers"]:
        lines.extend([f"- `{item['type']}`: {item['message']}" for item in year["blockers"]])
    else:
        lines.append("- None.")
    lines.extend(["", "## Next Actions", ""])
    lines.extend([f"- {item}" for item in year["nextActions"]])
    lines.append("")
    path.write_text("\n".join(lines), encoding="utf-8")


def write_boundary_risk_map(path: Path, year: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    lines = [
        f"# Math2 {year['year']} Boundary Risk Map",
        "",
        "This file records mechanical boundary and option scans only. It does not repair OCR or choose a source role.",
        "",
    ]
    for source in year["sources"]:
        fallback = source["boundaryScans"]["fallbackNumeric"]
        strict = source["boundaryScans"]["strictParenthesized"]
        options = source["choiceOptionScan"]
        lines.extend([
            f"## `{source['relativePath']}`",
            "",
            f"- Role: `{source['role']}`",
            f"- Strict first occurrences: `{strict['firstOccurrenceNumbers']}`",
            f"- Fallback first occurrences: `{fallback['firstOccurrenceNumbers']}`",
            f"- Missing fallback boundaries: `{fallback['missingExpectedNumbers']}`",
            f"- Duplicate fallback numbers: `{fallback['duplicateNumbers']}`",
            f"- Choice options complete: `{str(options['allChoiceOptionsComplete']).lower()}`",
            "- Incomplete choice questions:",
            "",
            "```json",
            json.dumps(options["incompleteChoiceQuestions"], ensure_ascii=False, indent=2),
            "```",
            "",
        ])
    path.write_text("\n".join(lines), encoding="utf-8")


def write_outputs(
    report_dir: Path,
    audit: dict[str, Any],
    project_root: Path = Path("."),
) -> None:
    report_dir.mkdir(parents=True, exist_ok=True)
    (report_dir / "audit.json").write_text(
        json.dumps(audit, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    write_main_markdown(report_dir / "audit.md", audit)
    by_year = {item["year"]: item for item in audit["years"]}
    write_year_audit(
        project_root / "content/reports/math2-2021/source-role-audit.md",
        by_year[2021],
    )
    write_year_audit(
        project_root / "content/reports/math2-2022/source-role-audit.md",
        by_year[2022],
    )
    write_boundary_risk_map(
        project_root / "content/reports/math2-2022/boundary-risk-map.md",
        by_year[2022],
    )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("source_root", type=Path)
    parser.add_argument(
        "report_dir",
        type=Path,
        default=Path(REPORT_DIR),
        nargs="?",
    )
    args = parser.parse_args()
    audit = build_audit(args.source_root.resolve())
    write_outputs(args.report_dir, audit, Path("."))
    status = {item["year"]: item["status"] for item in audit["years"]}
    print(f"Math2 2021-2022 readiness audit: {status}")


if __name__ == "__main__":
    main()
