"""Deterministically transform the audited Math2 2020 Markdown pilot."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import subprocess
from pathlib import Path
from typing import Any


SCHEMA_VERSION = "math2-question-staging-v2"
SOURCE_REPO = "Kaoyan-Math2-Papers"
SOURCE_YEAR = 2020
SUBJECT_CODE = "math2"
PAPER_RELATIVE = "papers/MinerU_markdown_math2_2020_2065687152877731840.md"
COMPARISON_RELATIVE = "solutions/2020/math2_2020/math2_2020.md"
EXPECTED_COUNTS = {
    "multiple_choice": 8,
    "fill_in_blank": 6,
    "solution": 9,
}

QUESTION_MARKER = re.compile(r"^\s*[（(]\s*(\d{1,2})\s*[）)]\s*")
OPTION_MARKER = re.compile(r"^\s*[（(]\s*([A-D])\s*[）)]\s*")
ANSWER_MARKER = re.compile(r"【答案】|答案[:：]|参考答案")
EXPLANATION_MARKER = re.compile(r"【解】|【解析】|解答[:：]")
IMAGE_MARKER = re.compile(r"!\[[^\]]*\]\(([^)]+)\)")


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
    status = git_output(root, "status", "--porcelain=v1", "--", relative_path)
    return "modified" if status else "tracked"


def question_type(number: int) -> str:
    if number <= 8:
        return "multiple_choice"
    if number <= 14:
        return "fill_in_blank"
    return "solution"


def stable_id(number: int) -> str:
    return f"math2-{SOURCE_YEAR}-q{number:02d}"


def parse_question_blocks(text: str) -> list[dict[str, Any]]:
    lines = normalize_newlines(text).splitlines()
    starts: list[tuple[int, int, str]] = []
    seen: set[int] = set()

    for index, line in enumerate(lines):
        match = QUESTION_MARKER.match(line)
        if not match:
            continue
        number = int(match.group(1))
        if not 1 <= number <= 23:
            continue
        if number in seen:
            raise ValueError(f"duplicate question boundary: {number}")
        seen.add(number)
        starts.append((number, index, line[match.end():]))

    numbers = [number for number, _, _ in starts]
    if numbers != list(range(1, 24)):
        raise ValueError(f"question boundaries must be 1..23, got {numbers}")

    blocks = []
    for position, (number, start_index, first_line) in enumerate(starts):
        end_index = starts[position + 1][1] if position + 1 < len(starts) else len(lines)
        body_lines = [first_line, *lines[start_index + 1:end_index]]
        while body_lines and not body_lines[0].strip():
            body_lines.pop(0)
        while body_lines and not body_lines[-1].strip():
            body_lines.pop()
        blocks.append({
            "number": number,
            "lineStart": start_index + 1,
            "lineEnd": end_index,
            "bodyLines": body_lines,
        })
    return blocks


def extract_stem_and_options(
    body_lines: list[str],
    kind: str,
) -> tuple[str, list[dict[str, str]]]:
    if kind != "multiple_choice":
        return "\n".join(body_lines).strip(), []

    markers: list[tuple[int, str, str]] = []
    for index, line in enumerate(body_lines):
        match = OPTION_MARKER.match(line)
        if match:
            markers.append((index, match.group(1), line[match.end():]))

    options: list[dict[str, str]] = []
    for position, (index, label, first_line) in enumerate(markers):
        end = markers[position + 1][0] if position + 1 < len(markers) else len(body_lines)
        value = "\n".join([first_line, *body_lines[index + 1:end]]).strip()
        options.append({"label": label, "value": value})

    stem_end = markers[0][0] if markers else len(body_lines)
    return "\n".join(body_lines[:stem_end]).strip(), options


def source_file_record(root: Path, relative_path: str, role: str) -> dict[str, Any]:
    path = root / Path(relative_path)
    text = path.read_text(encoding="utf-8-sig")
    return {
        "relativePath": relative_path,
        "role": role,
        "gitState": git_state(root, relative_path),
        "bytes": path.stat().st_size,
        "sha256": sha256_file(path),
        "answerMarkers": len(ANSWER_MARKER.findall(text)),
        "explanationMarkers": len(EXPLANATION_MARKER.findall(text)),
        "imageReferences": IMAGE_MARKER.findall(text),
    }


def anomaly(
    issue_type: str,
    severity: str,
    message: str,
    blocks_publication: bool = True,
    source_relative_path: str | None = None,
) -> dict[str, Any]:
    result: dict[str, Any] = {
        "type": issue_type,
        "severity": severity,
        "message": message,
        "blocksPublication": blocks_publication,
    }
    if source_relative_path:
        result["sourceRelativePath"] = source_relative_path
    return result


def validate_payload(payload: dict[str, Any]) -> list[str]:
    errors: list[str] = []
    if payload.get("schemaVersion") != SCHEMA_VERSION:
        errors.append("unexpected schemaVersion")
    if payload.get("subjectCode") != SUBJECT_CODE:
        errors.append("subjectCode must be math2")
    questions = payload.get("questions")
    if not isinstance(questions, list):
        return [*errors, "questions must be an array"]
    if len(questions) != 23:
        errors.append("questions must contain exactly 23 records")

    required = {
        "stableId", "sourceYear", "subjectCode", "type", "questionNumber",
        "stem", "options", "answer", "answerStatus", "explanation",
        "explanationStatus", "reviewStatus", "finalizationStatus",
        "knowledgePoints", "anomalies", "sourceEvidence",
    }
    stable_ids: set[str] = set()
    for index, question in enumerate(questions, start=1):
        missing = sorted(required - set(question))
        if missing:
            errors.append(f"q{index:02d} missing fields: {missing}")
        if question.get("stableId") in stable_ids:
            errors.append(f"duplicate stableId: {question.get('stableId')}")
        stable_ids.add(question.get("stableId"))
        if question.get("questionNumber") != index:
            errors.append(f"q{index:02d} questionNumber mismatch")
        if not isinstance(question.get("stem"), str) or not question.get("stem", "").strip():
            errors.append(f"q{index:02d} stem must be non-empty")
        if question.get("answer") is not None or question.get("answerStatus") != "missing":
            errors.append(f"q{index:02d} answer must remain explicitly missing")
        if (
            question.get("explanation") is not None
            or question.get("explanationStatus") != "missing"
        ):
            errors.append(f"q{index:02d} explanation must remain explicitly missing")
        if question.get("reviewStatus") != "needs_human_review":
            errors.append(f"q{index:02d} reviewStatus must be needs_human_review")
        if question.get("finalizationStatus") != "blocked":
            errors.append(f"q{index:02d} finalizationStatus must be blocked")
        options = question.get("options")
        if not isinstance(options, list):
            errors.append(f"q{index:02d} options must be an array")
            continue
        for option in options:
            if set(option) != {"label", "value"}:
                errors.append(
                    f"q{index:02d} option fields must be exactly label/value"
                )
            if "text" in option:
                errors.append(f"q{index:02d} option.text is forbidden")
        if question.get("type") == "multiple_choice":
            labels = [option.get("label") for option in options]
            if labels != ["A", "B", "C", "D"]:
                errors.append(f"q{index:02d} options must be A-D, got {labels}")
        elif options:
            errors.append(f"q{index:02d} non-choice options must be empty")
    return errors


def transform(source_root: Path) -> tuple[dict[str, Any], list[dict[str, Any]]]:
    paper_path = source_root / Path(PAPER_RELATIVE)
    comparison_path = source_root / Path(COMPARISON_RELATIVE)
    if not paper_path.is_file() or not comparison_path.is_file():
        raise FileNotFoundError("audited Math2 2020 Markdown inputs are missing")

    paper_record = source_file_record(
        source_root, PAPER_RELATIVE, "primary_paper_transcription"
    )
    comparison_record = source_file_record(
        source_root, COMPARISON_RELATIVE, "comparison_paper_transcription"
    )
    paper_blocks = parse_question_blocks(paper_path.read_text(encoding="utf-8-sig"))
    comparison_blocks = parse_question_blocks(
        comparison_path.read_text(encoding="utf-8-sig")
    )
    comparison_by_number = {item["number"]: item for item in comparison_blocks}

    batch_anomalies = [
        anomaly(
            "solution_path_contains_paper_transcription",
            "error",
            (
                "The Markdown under solutions/2020 has 23 question boundaries but no "
                "explicit answer or explanation markers; it is comparison-only evidence."
            ),
            source_relative_path=COMPARISON_RELATIVE,
        )
    ]
    questions = []

    for block in paper_blocks:
        number = block["number"]
        kind = question_type(number)
        stem, options = extract_stem_and_options(block["bodyLines"], kind)
        comparison = comparison_by_number[number]
        _, comparison_options = extract_stem_and_options(comparison["bodyLines"], kind)
        question_anomalies = [
            anomaly(
                "missing_answer_and_explanation",
                "error",
                "No explicit answer or explanation exists in either audited Markdown input.",
            )
        ]
        if kind == "multiple_choice":
            comparison_labels = [item["label"] for item in comparison_options]
            if comparison_labels != ["A", "B", "C", "D"]:
                question_anomalies.append(
                    anomaly(
                        "comparison_incomplete_options",
                        "warning",
                        f"Comparison transcript option labels are {comparison_labels}.",
                        source_relative_path=COMPARISON_RELATIVE,
                    )
                )
        if number == 22 and (
            re.search(r"x_\{?4\}?", stem) or re.search(r"y_\{?4\}?", stem)
        ):
            question_anomalies.append(
                anomaly(
                    "formula_dimension_conflict",
                    "error",
                    (
                        "The source describes three-variable quadratic forms but the "
                        "transformation contains x_4/y_4; mathematical repair is forbidden."
                    ),
                    source_relative_path=PAPER_RELATIVE,
                )
            )

        questions.append({
            "stableId": stable_id(number),
            "sourceYear": SOURCE_YEAR,
            "subjectCode": SUBJECT_CODE,
            "type": kind,
            "questionNumber": number,
            "stem": stem,
            "options": options,
            "answer": None,
            "answerStatus": "missing",
            "explanation": None,
            "explanationStatus": "missing",
            "reviewStatus": "needs_human_review",
            "finalizationStatus": "blocked",
            "knowledgePoints": [],
            "anomalies": question_anomalies,
            "sourceEvidence": [
                {
                    "relativePath": PAPER_RELATIVE,
                    "role": "primary_paper_transcription",
                    "gitState": paper_record["gitState"],
                    "sha256": paper_record["sha256"],
                    "lineStart": block["lineStart"],
                    "lineEnd": block["lineEnd"],
                },
                {
                    "relativePath": COMPARISON_RELATIVE,
                    "role": "comparison_paper_transcription",
                    "gitState": comparison_record["gitState"],
                    "sha256": comparison_record["sha256"],
                    "lineStart": comparison["lineStart"],
                    "lineEnd": comparison["lineEnd"],
                },
            ],
        })

    counts = {
        kind: sum(question["type"] == kind for question in questions)
        for kind in EXPECTED_COUNTS
    }
    payload = {
        "schemaVersion": SCHEMA_VERSION,
        "batchId": "REQ-002-math2-2020-pilot",
        "subjectCode": SUBJECT_CODE,
        "sourceYear": SOURCE_YEAR,
        "sourceRepository": {
            "name": SOURCE_REPO,
            "commit": git_output(source_root, "rev-parse", "HEAD"),
            "branch": git_output(source_root, "branch", "--show-current"),
            "dirty": bool(git_output(source_root, "status", "--porcelain=v1")),
        },
        "sourceFiles": [paper_record, comparison_record],
        "questions": questions,
        "anomalies": batch_anomalies,
        "validation": {
            "inputFilesRead": 2,
            "questionsGenerated": len(questions),
            "questionCounts": counts,
            "expectedCounts": EXPECTED_COUNTS,
            "countsMatch": counts == EXPECTED_COUNTS,
            "stableIdsUnique": len({item["stableId"] for item in questions}) == len(questions),
            "allQuestionsBlocked": all(
                item["finalizationStatus"] == "blocked" for item in questions
            ),
            "answersPresent": sum(item["answer"] is not None for item in questions),
            "explanationsPresent": sum(
                item["explanation"] is not None for item in questions
            ),
            "schemaValid": True,
            "schemaErrors": [],
        },
    }
    schema_errors = validate_payload(payload)
    payload["validation"]["schemaValid"] = not schema_errors
    payload["validation"]["schemaErrors"] = schema_errors
    return payload, batch_anomalies


def write_outputs(
    output_dir: Path,
    payload: dict[str, Any],
    batch_anomalies: list[dict[str, Any]],
) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)
    all_anomalies = [
        *batch_anomalies,
        *[
            {"stableId": question["stableId"], **item}
            for question in payload["questions"]
            for item in question["anomalies"]
        ],
    ]
    documents = {
        "questions.json": payload,
        "anomalies.json": {
            "schemaVersion": SCHEMA_VERSION,
            "totalAnomalies": len(all_anomalies),
            "anomalies": all_anomalies,
        },
        "validation.json": payload["validation"],
    }
    for name, document in documents.items():
        (output_dir / name).write_text(
            json.dumps(document, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )

    validation = payload["validation"]
    (output_dir / "summary.md").write_text(
        "\n".join([
            "# Math2 2020 Pilot Summary",
            "",
            "- Status: blocked staging pilot; not published to frontend.",
            f"- Questions: {validation['questionsGenerated']} (8 choice, 6 fill, 9 solution).",
            "- Answers present: 0.",
            "- Explanations present: 0.",
            f"- Schema valid: {str(validation['schemaValid']).lower()}.",
            "- Primary: `papers/MinerU_markdown_math2_2020_2065687152877731840.md`.",
            "- Comparison-only: `solutions/2020/math2_2020/math2_2020.md`.",
            "- Q22 remains blocked for a three-variable/four-dimensional formula conflict.",
            "",
        ]),
        encoding="utf-8",
    )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("source_root", type=Path)
    parser.add_argument("output_dir", type=Path)
    args = parser.parse_args()
    payload, anomalies = transform(args.source_root.resolve())
    write_outputs(args.output_dir.resolve(), payload, anomalies)
    print(
        f"Math2 2020: {len(payload['questions'])} questions, "
        f"schemaValid={payload['validation']['schemaValid']}"
    )
    if not payload["validation"]["schemaValid"]:
        raise SystemExit(3)


if __name__ == "__main__":
    main()
