"""Deterministic Math1 2020 paper and solution transformer."""

import hashlib
import json
import re
import sys
from collections import OrderedDict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple


SCHEMA_VERSION = "question-transform-v1"
TASK = "cc-math1-2020"
SUBJECT_CODE = "math1"
SOURCE_YEAR = 2020
SOURCE_REPO = "Kaoyan-Math1-Papers"
PAPER_RELATIVE = "papers/2020\u5e74\u8003\u7814\u6570\u5b66(\u4e00)\u771f\u9898.md"
SOLUTION_RELATIVE = (
    "solutions/2020\u5e74\u89e3\u6790/2020\u5e74\u89e3\u6790.md"
)

EXPECTED_QUESTION_COUNTS = {
    "multiple_choice": 8,
    "fill_in_blank": 6,
    "solution": 9,
}


def sha256_file(filepath: Path) -> str:
    sha = hashlib.sha256()
    with open(filepath, "rb") as source:
        for chunk in iter(lambda: source.read(65536), b""):
            sha.update(chunk)
    return sha.hexdigest().upper()


def sha256_text(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest().upper()


def normalize_newlines(text: str) -> str:
    return text.replace("\r\n", "\n").replace("\r", "\n")


def validate_json_schema(obj: Any) -> List[str]:
    errors = []
    if not isinstance(obj, dict):
        return ["Root must be a JSON object"]
    if obj.get("schemaVersion") != SCHEMA_VERSION:
        errors.append(f"schemaVersion must be '{SCHEMA_VERSION}'")
    if not isinstance(obj.get("questions"), list):
        errors.append("'questions' must be a list")
    if not isinstance(obj.get("sourceInfo"), dict):
        errors.append("'sourceInfo' must be an object")
    if not isinstance(obj.get("validation"), dict):
        errors.append("'validation' must be an object")
    return errors


def read_file_text(path: Path) -> str:
    with open(path, "r", encoding="utf-8-sig") as source:
        return source.read()


def resolve_source_file(source_dir: Path, relative_path: str) -> Optional[Path]:
    for candidate in (
        source_dir / SOURCE_REPO / relative_path,
        source_dir / relative_path,
    ):
        if candidate.is_file():
            return candidate
    return None


def detect_question_type(qnum: int) -> str:
    if 1 <= qnum <= 8:
        return "multiple_choice"
    if 9 <= qnum <= 14:
        return "fill_in_blank"
    if 15 <= qnum <= 23:
        return "solution"
    return "unknown"


def make_stable_id(qnum: int) -> str:
    return f"{SUBJECT_CODE}-{SOURCE_YEAR}-q{qnum:02d}"


QUESTION_MARKER = re.compile(
    r"(?m)^\s*(?:[\uFF08(]\s*(\d{1,2})\s*[\uFF09)]|"
    r"(\d{1,2})\s*[\uFF09)])\s*"
)
OPTION_MARKER = re.compile(
    r"(?m)^\s*[\uFF08(]([A-D])[\uFF09)]\s*"
)
SOLUTION_MARKER = re.compile(
    r"[\uFF08(]\s*(\d{1,2})\s*[\uFF09)]\s*"
    r"(?=\u3010(?:\u7b54\u6848|\u89e3|\u8bc1\u660e)\u3011)"
)
ANSWER_MARKER = re.compile(r"\u3010\u7b54\u6848\u3011\s*(.+?)(?:\n|$)")


def extract_options(text: str) -> List[Dict[str, str]]:
    matches = list(OPTION_MARKER.finditer(text))
    options = []
    for index, match in enumerate(matches):
        end = matches[index + 1].start() if index + 1 < len(matches) else len(text)
        options.append({
            "label": match.group(1),
            "value": text[match.end():end].strip(),
        })
    return options


def parse_paper_questions(
    paper_text: str,
) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
    text = normalize_newlines(paper_text)
    anomalies: List[Dict[str, Any]] = []
    questions: Dict[int, Dict[str, Any]] = {}
    markers = []
    seen = set()

    for match in QUESTION_MARKER.finditer(text):
        qnum = int(match.group(1) or match.group(2))
        if 1 <= qnum <= 23 and qnum not in seen:
            seen.add(qnum)
            markers.append((qnum, match.start(), match.end()))

    for index, (qnum, _start, marker_end) in enumerate(markers):
        content_end = markers[index + 1][1] if index + 1 < len(markers) else len(text)
        raw_text = text[marker_end:content_end].strip()
        question_type = detect_question_type(qnum)
        questions[qnum] = {
            "questionNumber": qnum,
            "questionType": question_type,
            "stableId": make_stable_id(qnum),
            "rawText": raw_text,
            "options": extract_options(raw_text) if question_type == "multiple_choice" else [],
            "anomalies": [],
        }

    for qnum in range(1, 24):
        if qnum not in questions:
            anomalies.append({
                "type": "missing_question",
                "questionNumber": qnum,
                "severity": "error",
                "message": f"Question {qnum} not found in paper text",
            })

    return [questions[qnum] for qnum in sorted(questions)], anomalies


def parse_solutions(
    solutions_text: str,
) -> Tuple[Dict[int, Dict[str, Any]], List[Dict[str, Any]]]:
    text = normalize_newlines(solutions_text)
    anomalies: List[Dict[str, Any]] = []
    solutions: Dict[int, Dict[str, Any]] = {}
    matches = [
        match for match in SOLUTION_MARKER.finditer(text)
        if 1 <= int(match.group(1)) <= 23
    ]

    if "\u4e00\u3001\u586b\u7a7a\u9898" in text:
        anomalies.append({
            "type": "section_header_mismatch",
            "severity": "warning",
            "message": "Solutions first section header says fill-in-blank but Q1-Q8 are multiple choice",
        })

    for index, match in enumerate(matches):
        qnum = int(match.group(1))
        end = matches[index + 1].start() if index + 1 < len(matches) else len(text)
        block = text[match.start():end].strip()
        if match.start() > 0 and text[match.start() - 1] != "\n":
            anomalies.append({
                "type": "embedded_solution_marker",
                "questionNumber": qnum,
                "severity": "warning",
                "message": f"Solution marker for question {qnum} is joined to prior text",
            })
        answer_match = ANSWER_MARKER.search(block)
        solution = {
            "questionNumber": qnum,
            "answer": answer_match.group(1).strip() if answer_match else None,
            "explanationRaw": block,
            "anomalies": [],
        }
        if qnum in solutions:
            anomalies.append({
                "type": "duplicate_solution",
                "questionNumber": qnum,
                "severity": "warning",
                "message": f"Duplicate solution block found for question {qnum}",
            })
        else:
            solutions[qnum] = solution

    for qnum in range(1, 24):
        if qnum not in solutions:
            anomalies.append({
                "type": "missing_solution",
                "questionNumber": qnum,
                "severity": "warning",
                "message": f"No solution block found for question {qnum}",
            })
    return solutions, anomalies


OCR_RISK_PATTERNS = [
    (re.compile(r"rx\s*(?:\^?\s*2|\u00b2)"), "rx\u00b2/rx^2 OCR noise pattern"),
    (re.compile(r"\bl\s+i\s+m\b"), "fragmented 'l i m' OCR noise"),
]


def detect_ocr_risks(text: str, qnum: int) -> List[Dict[str, Any]]:
    return [
        {
            "type": "ocr_risk",
            "questionNumber": qnum,
            "pattern": description,
            "severity": "warning",
        }
        for pattern, description in OCR_RISK_PATTERNS
        if pattern.search(text)
    ]


def check_katex_structure(text: str) -> List[Dict[str, Any]]:
    issues = []
    if text.count("$") % 2:
        issues.append({
            "type": "katex_unmatched_dollar",
            "severity": "warning",
            "message": "Odd number of dollar signs",
        })
    return issues


def _source_metadata(
    paper_path: Path,
    solutions_path: Optional[Path],
    source_snapshot_path: Optional[Path],
) -> Tuple[str, str]:
    source_paths = [paper_path] + ([solutions_path] if solutions_path else [])
    latest = max(path.stat().st_mtime for path in source_paths)
    generated_at = datetime.fromtimestamp(latest, timezone.utc).isoformat()
    source_commit = "source-mirror-no-git"

    if source_snapshot_path and source_snapshot_path.is_file():
        with open(source_snapshot_path, "r", encoding="utf-8-sig") as source:
            snapshot = json.load(source)
        generated_at = snapshot.get("capturedAt", generated_at)
        for repo in snapshot.get("repositories", []):
            if Path(repo.get("root", "")).name == SOURCE_REPO:
                source_commit = repo.get("headCommit", source_commit)
                break
    return generated_at, source_commit


def transform(
    source_dir: Path,
    output_dir: Path,
    source_snapshot_path: Optional[Path] = None,
) -> Tuple[Dict[str, Any], List[Dict[str, Any]]]:
    del output_dir  # Kept in the public API; transform itself is side-effect free.
    anomalies: List[Dict[str, Any]] = []
    paper_path = resolve_source_file(source_dir, PAPER_RELATIVE)
    solutions_path = resolve_source_file(source_dir, SOLUTION_RELATIVE)

    if not paper_path:
        return {"questions": []}, [{
            "type": "missing_source",
            "severity": "error",
            "message": f"Exam paper file not found: {PAPER_RELATIVE}",
        }]
    if not solutions_path:
        anomalies.append({
            "type": "missing_source",
            "severity": "warning",
            "message": f"Solutions file not found: {SOLUTION_RELATIVE}",
        })

    paper_text = read_file_text(paper_path)
    solutions_text = read_file_text(solutions_path) if solutions_path else ""
    generated_at, source_commit = _source_metadata(
        paper_path, solutions_path, source_snapshot_path
    )
    paper_questions, paper_anomalies = parse_paper_questions(paper_text)
    solutions, solution_anomalies = parse_solutions(solutions_text) if solutions_text else ({}, [])
    anomalies.extend(paper_anomalies)
    anomalies.extend(solution_anomalies)

    paper_hash = sha256_file(paper_path)
    solutions_hash = sha256_file(solutions_path) if solutions_path else None
    questions = []

    for parsed in paper_questions:
        qnum = parsed["questionNumber"]
        solution = solutions.get(qnum, {})
        question_anomalies = []
        question_anomalies.extend(detect_ocr_risks(parsed["rawText"], qnum))
        question_anomalies.extend(check_katex_structure(parsed["rawText"]))
        if solution.get("explanationRaw"):
            question_anomalies.extend(
                detect_ocr_risks(solution["explanationRaw"], qnum)
            )

        if parsed["questionType"] == "multiple_choice":
            labels = {option["label"] for option in parsed["options"]}
            if labels != {"A", "B", "C", "D"}:
                question_anomalies.append({
                    "type": "incomplete_options",
                    "questionNumber": qnum,
                    "severity": "warning",
                    "message": f"Extracted option labels: {sorted(labels)}",
                })

        anomalies.extend(question_anomalies)
        source_paths = [PAPER_RELATIVE]
        if solutions_path:
            source_paths.append(SOLUTION_RELATIVE)
        questions.append(OrderedDict([
            ("stableId", make_stable_id(qnum)),
            ("sourceRepo", SOURCE_REPO),
            ("sourceRelativePaths", source_paths),
            ("sourceCommit", source_commit),
            ("sourceYear", SOURCE_YEAR),
            ("subjectCode", SUBJECT_CODE),
            ("sourceFileHashes", OrderedDict([
                ("paper", paper_hash),
                ("solutions", solutions_hash),
            ])),
            ("transformVersion", SCHEMA_VERSION),
            ("reviewStatus", "needs_human_review"),
            ("questionNumber", qnum),
            ("questionType", parsed["questionType"]),
            ("stem", parsed["rawText"]),
            ("options", parsed["options"]),
            ("answerCandidate", solution.get("answer")),
            (
                "answerStatus",
                "candidate_from_solutions" if solution.get("answer") else "missing",
            ),
            ("explanationCandidate", solution.get("explanationRaw")),
            (
                "explanationStatus",
                "candidate_from_solutions"
                if solution.get("explanationRaw") else "missing",
            ),
            ("anomalies", question_anomalies),
        ]))

    counts = {
        question_type: sum(q["questionType"] == question_type for q in questions)
        for question_type in EXPECTED_QUESTION_COUNTS
    }
    for question_type, expected in EXPECTED_QUESTION_COUNTS.items():
        if counts[question_type] != expected:
            anomalies.append({
                "type": "question_count_mismatch",
                "questionType": question_type,
                "expected": expected,
                "actual": counts[question_type],
                "severity": "error",
                "message": f"Expected {expected} {question_type} questions",
            })

    validation = OrderedDict([
        ("schemaVersion", SCHEMA_VERSION),
        ("generatedAt", generated_at),
        ("inputFilesRead", 1 + int(bool(solutions_path))),
        ("questionsGenerated", len(questions)),
        ("questionCounts", counts),
        ("expectedCounts", EXPECTED_QUESTION_COUNTS),
        ("countsMatch", counts == EXPECTED_QUESTION_COUNTS),
        ("totalAnomalies", len(anomalies)),
        ("anomaliesBySeverity", {
            severity: sum(a.get("severity") == severity for a in anomalies)
            for severity in ("error", "warning", "info")
        }),
        ("allQuestionsNeedsReview", all(
            q["reviewStatus"] == "needs_human_review" for q in questions
        )),
    ])
    payload = OrderedDict([
        ("schemaVersion", SCHEMA_VERSION),
        ("task", TASK),
        ("subjectCode", SUBJECT_CODE),
        ("sourceYear", SOURCE_YEAR),
        ("sourceRepo", SOURCE_REPO),
        ("sourceCommit", source_commit),
        ("sourceInfo", OrderedDict([
            ("paperRelativePath", PAPER_RELATIVE),
            ("paperSha256", paper_hash),
            ("solutionsRelativePath", SOLUTION_RELATIVE),
            ("solutionsSha256", solutions_hash),
        ])),
        ("questions", questions),
        ("validation", validation),
    ])
    return payload, anomalies


def write_output(
    output_dir: Path,
    payload: Dict[str, Any],
    anomalies: List[Dict[str, Any]],
) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)
    generated_at = payload["validation"]["generatedAt"]
    with open(output_dir / "questions.json", "w", encoding="utf-8") as target:
        json.dump(payload, target, ensure_ascii=False, indent=2)
    with open(output_dir / "anomalies.json", "w", encoding="utf-8") as target:
        json.dump({
            "schemaVersion": SCHEMA_VERSION,
            "generatedAt": generated_at,
            "totalAnomalies": len(anomalies),
            "anomalies": anomalies,
        }, target, ensure_ascii=False, indent=2)
    with open(output_dir / "validation.json", "w", encoding="utf-8") as target:
        json.dump(payload["validation"], target, ensure_ascii=False, indent=2)

    lines = [
        "# Math1 2020 Transformation Summary",
        "",
        f"**Generated**: {generated_at}",
        f"**Questions**: {len(payload['questions'])}",
        f"**Anomalies**: {len(anomalies)}",
        "**Review status**: All `needs_human_review`",
        "",
        "## Question Counts",
    ]
    for question_type, count in payload["validation"]["questionCounts"].items():
        lines.append(
            f"- {question_type}: {count} "
            f"(expected {EXPECTED_QUESTION_COUNTS[question_type]})"
        )
    lines.extend(["", "## Anomalies"])
    for anomaly in anomalies:
        lines.append(
            f"- [{anomaly.get('severity', 'unknown')}] "
            f"{anomaly.get('type', 'unknown')}: {anomaly.get('message', '')}"
        )
    lines.extend([
        "",
        "## Source Files",
        f"- `{PAPER_RELATIVE}`: `{payload['sourceInfo']['paperSha256']}`",
        f"- `{SOLUTION_RELATIVE}`: `{payload['sourceInfo']['solutionsSha256']}`",
    ])
    (output_dir / "summary.md").write_text(
        "\n".join(lines) + "\n", encoding="utf-8"
    )


def main() -> None:
    if len(sys.argv) not in (3, 4):
        print(
            f"Usage: python {sys.argv[0]} <source-dir> <output-dir> "
            "[source-before.json]",
            file=sys.stderr,
        )
        raise SystemExit(1)
    source_dir = Path(sys.argv[1])
    output_dir = Path(sys.argv[2])
    source_snapshot = Path(sys.argv[3]) if len(sys.argv) == 4 else None
    payload, anomalies = transform(source_dir, output_dir, source_snapshot)
    write_output(output_dir, payload, anomalies)
    validation = payload["validation"]
    print(f"Questions generated: {validation['questionsGenerated']}")
    print(f"Anomalies: {validation['totalAnomalies']}")
    print(f"Counts match: {validation['countsMatch']}")
    if validation["anomaliesBySeverity"]["error"]:
        raise SystemExit(3)


if __name__ == "__main__":
    main()
