"""Deterministically transform Math2 2023 with approved comparison-primary role."""

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
SOURCE_YEAR = 2023
SUBJECT_CODE = "math2"
PRIMARY_RELATIVE = "papers/MinerU_markdown_math2_2023_2065687933685170176.md"
COMPARISON_RELATIVE = "solutions/2023/math2_2023/math2_2023.md"
EXPECTED_HASHES = {
    PRIMARY_RELATIVE: "eef3ea76c3491b8753230bfc1089493d2b67f1b1a815bc45de6666a70cdcb02f",
    COMPARISON_RELATIVE: "c353e535aa9dcda945bc9d88c3c441f3f4d23060a3408209ac3e90efa202bed8",
}
EXPECTED_COUNTS = {
    "multiple_choice": 10,
    "fill_in_blank": 6,
    "solution": 6,
}
TOTAL_QUESTIONS = 22

QUESTION_MARKER = re.compile(r"^\s*(?:#+\s*)?[（(]\s*(\d{1,2})\s*[）)]\s*")
OPTION_MARKER = re.compile(
    r"^\s*\$?\s*"
    r"(?:\\(?:mathbf|mathrm|operatorname)\s*\{\s*)?"
    r"(?:\\left\s*)?[（(]?\s*"
    r"(?:\\(?:mathbf|mathrm|operatorname)\s*\{\s*)?"
    r"([A-D])"
    r"(?:\s*\})?\s*"
    r"(?:\\right\s*)?[）)]\s*"
)
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
    if number <= 10:
        return "multiple_choice"
    if number <= 16:
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
        if not 1 <= number <= TOTAL_QUESTIONS:
            continue
        if number in seen:
            raise ValueError(f"duplicate question boundary: {number}")
        seen.add(number)
        starts.append((number, index, line[match.end():]))

    numbers = [number for number, _, _ in starts]
    expected_numbers = list(range(1, TOTAL_QUESTIONS + 1))
    if numbers != expected_numbers:
        raise ValueError(
            f"question boundaries must be 1..{TOTAL_QUESTIONS}, got {numbers}"
        )

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
    file_hash = sha256_file(path)
    return {
        "relativePath": relative_path,
        "role": role,
        "gitState": git_state(root, relative_path),
        "bytes": path.stat().st_size,
        "sha256": file_hash,
        "hashMatchesExpected": file_hash == EXPECTED_HASHES[relative_path],
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
    if payload.get("sourceYear") != SOURCE_YEAR:
        errors.append("sourceYear must be 2023")

    questions = payload.get("questions")
    if not isinstance(questions, list):
        return [*errors, "questions must be an array"]
    if len(questions) != TOTAL_QUESTIONS:
        errors.append(f"questions must contain exactly {TOTAL_QUESTIONS} records")

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
        if question.get("stableId") != stable_id(index):
            errors.append(f"q{index:02d} stableId mismatch")
        if question.get("sourceYear") != SOURCE_YEAR:
            errors.append(f"q{index:02d} sourceYear mismatch")
        if question.get("questionNumber") != index:
            errors.append(f"q{index:02d} questionNumber mismatch")
        if question.get("type") != question_type(index):
            errors.append(f"q{index:02d} type mismatch")
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
            if not str(option.get("value", "")).strip():
                errors.append(f"q{index:02d} option value must be non-empty")
        if question.get("type") == "multiple_choice":
            labels = [option.get("label") for option in options]
            if labels != ["A", "B", "C", "D"]:
                errors.append(f"q{index:02d} options must be A-D, got {labels}")
        elif options:
            errors.append(f"q{index:02d} non-choice options must be empty")
    return errors


def transform(source_root: Path) -> tuple[dict[str, Any], list[dict[str, Any]]]:
    primary_path = source_root / Path(PRIMARY_RELATIVE)
    comparison_path = source_root / Path(COMPARISON_RELATIVE)
    if not primary_path.is_file() or not comparison_path.is_file():
        raise FileNotFoundError("approved Math2 2023 Markdown inputs are missing")

    primary_record = source_file_record(
        source_root, PRIMARY_RELATIVE, "primary_complete_question_transcription"
    )
    comparison_record = source_file_record(
        source_root, COMPARISON_RELATIVE, "comparison_incomplete_question_transcription"
    )
    if not primary_record["hashMatchesExpected"] or not comparison_record["hashMatchesExpected"]:
        raise ValueError("Math2 2023 input hash mismatch")

    primary_blocks = parse_question_blocks(primary_path.read_text(encoding="utf-8-sig"))
    comparison_blocks = parse_question_blocks(
        comparison_path.read_text(encoding="utf-8-sig")
    )
    comparison_by_number = {item["number"]: item for item in comparison_blocks}

    batch_anomalies = [
        anomaly(
            "source_role_decision_option_b",
            "warning",
            (
                "REQ-008 uses the maintainer-approved REQ-004 option (b): "
                "the currently verified complete 2023 transcript is primary. "
                "Live source verification shows the complete transcript is the "
                "MinerU paper path, while the solutions path contains the known "
                "Q2/Q4/Q6/Q7/Q9/Q10 option defects."
            ),
            blocks_publication=False,
            source_relative_path=PRIMARY_RELATIVE,
        ),
        anomaly(
            "primary_is_question_transcription",
            "error",
            (
                "The approved primary file contains question transcription only; "
                "no answer or explanation markers are present."
            ),
            source_relative_path=PRIMARY_RELATIVE,
        ),
        anomaly(
            "comparison_options_incomplete",
            "warning",
            (
                "The solutions comparison transcript is comparison evidence because "
                "its MC options are incomplete for Q2, Q4, Q6, Q7, Q9, and Q10."
            ),
            blocks_publication=False,
            source_relative_path=COMPARISON_RELATIVE,
        ),
    ]
    questions = []

    for block in primary_blocks:
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
            if comparison_labels != ["A", "B", "C", "D"] or any(
                not item["value"].strip() for item in comparison_options
            ):
                question_anomalies.append(
                    anomaly(
                        "comparison_options_incomplete",
                        "warning",
                        (
                            "Comparison transcript has incomplete or empty "
                            f"options for Q{number}; approved primary transcript is used."
                        ),
                        blocks_publication=False,
                        source_relative_path=COMPARISON_RELATIVE,
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
                    "relativePath": PRIMARY_RELATIVE,
                    "role": primary_record["role"],
                    "gitState": primary_record["gitState"],
                    "sha256": primary_record["sha256"],
                    "lineStart": block["lineStart"],
                    "lineEnd": block["lineEnd"],
                },
                {
                    "relativePath": COMPARISON_RELATIVE,
                    "role": comparison_record["role"],
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
        "batchId": "REQ-008-math2-2023-comparison-primary-staging",
        "subjectCode": SUBJECT_CODE,
        "sourceYear": SOURCE_YEAR,
        "sourceRepository": {
            "name": SOURCE_REPO,
            "commit": git_output(source_root, "rev-parse", "HEAD"),
            "branch": git_output(source_root, "branch", "--show-current"),
            "dirty": bool(git_output(source_root, "status", "--porcelain=v1")),
        },
        "sourceRoleDecision": {
            "requirement": "docs/requirements/REQ-008-math2-2023-comparison-primary-staging.md",
            "priorAudit": "docs/requirements/REQ-004-math2-2023-staging.md",
            "decision": "use_verified_complete_transcript_as_primary",
            "primaryRelativePath": PRIMARY_RELATIVE,
            "comparisonRelativePath": COMPARISON_RELATIVE,
            "pathLabelCorrection": (
                "REQ-004 labels the paths in the opposite direction of the current "
                "file contents; REQ-008 uses the path whose live hash/content has "
                "complete Q1-Q22 and complete MC options."
            ),
        },
        "sourceFiles": [primary_record, comparison_record],
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
            "primaryOptionsComplete": all(
                [option["label"] for option in item["options"]] == ["A", "B", "C", "D"]
                for item in questions
                if item["type"] == "multiple_choice"
            ),
            "hashesMatchExpected": all(
                item["hashMatchesExpected"] for item in [primary_record, comparison_record]
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
            "# Math2 2023 Staging Summary",
            "",
            "- Status: blocked staging batch; not published to frontend.",
            "- Source-role decision: use the currently verified complete transcript as primary.",
            f"- Questions: {validation['questionsGenerated']} (10 choice, 6 fill, 6 solution).",
            "- Answers present: 0.",
            "- Explanations present: 0.",
            f"- Primary options complete: {str(validation['primaryOptionsComplete']).lower()}.",
            f"- Schema contract valid: {str(validation['schemaValid']).lower()}.",
            "- Primary: `papers/MinerU_markdown_math2_2023_2065687933685170176.md`.",
            "- Comparison: `solutions/2023/math2_2023/math2_2023.md`.",
            "- The comparison transcript remains incomplete for Q2, Q4, Q6, Q7, Q9, and Q10.",
            "",
        ]),
        encoding="utf-8",
    )


def write_review_checklist(report_path: Path, payload: dict[str, Any]) -> None:
    report_path.parent.mkdir(parents=True, exist_ok=True)
    rows = []
    for question in payload["questions"]:
        rows.append(
            "| "
            + " | ".join([
                question["stableId"],
                str(question["questionNumber"]),
                question["type"],
                "missing",
                "blocked",
                str(len(question["anomalies"])),
            ])
            + " |"
        )
    report_path.write_text(
        "\n".join([
            "# Math2 2023 Human Review Checklist",
            "",
            "REQ-008 generated these records from the approved comparison-primary source role.",
            "Every item remains blocked until a separate human-review and promotion task.",
            "",
            "| Stable ID | Q | Type | Answer | Finalization | Anomalies |",
            "|---|---:|---|---|---|---:|",
            *rows,
            "",
            "Review focus:",
            "",
            "- Confirm the option (b) source-role decision is acceptable for publication review.",
            "- Review all stems/options against the primary transcript.",
            "- Supply answers and explanations only from approved answer evidence in a later task.",
            "- Keep Q2/Q4/Q6/Q7/Q9/Q10 comparison-source defects visible during review.",
            "",
        ]),
        encoding="utf-8",
    )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("source_root", type=Path)
    parser.add_argument("output_dir", type=Path)
    parser.add_argument(
        "--review-checklist",
        type=Path,
        default=Path("content/reports/math2-2023/human-review-checklist.md"),
    )
    args = parser.parse_args()
    payload, anomalies = transform(args.source_root.resolve())
    write_outputs(args.output_dir.resolve(), payload, anomalies)
    write_review_checklist(args.review_checklist, payload)
    print(
        f"Math2 2023: {len(payload['questions'])} questions, "
        f"schemaValid={payload['validation']['schemaValid']}"
    )
    if not payload["validation"]["schemaValid"]:
        raise SystemExit(3)


if __name__ == "__main__":
    main()
