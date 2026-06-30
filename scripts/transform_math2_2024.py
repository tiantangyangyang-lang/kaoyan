"""Deterministically transform Math2 2024 from the approved Markdown source."""

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
SOURCE_YEAR = 2024
SUBJECT_CODE = "math2"
PRIMARY_RELATIVE = "solutions/2024/math2_2024.md"
FEEDBACK_EMAIL = "tiantangyangyang@gmail.com"
EXPECTED_PRIMARY_HASH = "38d3a737c302a4ae79094fbaacb489d33fcb7b15de1330aa6b20888aaea8358b"
EXPECTED_IMAGE_HASHES = {
    "solutions/2024/images/7884391bcaec6d4b3b606a079c578a4913ccb65a0f43986faeb8ca2af3e7e68e.jpg": "143fbb6e676f2d2c9d81665184043e8c7b44dd0730008d37a99c4e177b557c54",
    "solutions/2024/images/d98314f433fa3074d0317cf7d9672b1e6b185e8a8e5a3e2a22ab1853b1498ae1.jpg": "ddef685f158502f8b177dd0d3c36ef61a58e8b0b1cc897bfccae1a0f3fdff128",
    "solutions/2024/images/ccde6b36e7a52892b052d64b0476872615cb2aba24502e52d014c6603b5e2c11.jpg": "390bb4fd531eb7723b9ca56744b3ef38079eb98566fb7f7250634355302cfd69",
}
EXPECTED_COUNTS = {
    "multiple_choice": 10,
    "fill_in_blank": 6,
    "solution": 6,
}
TOTAL_QUESTIONS = 22

QUESTION_MARKER = re.compile(r"^\s*(\d{1,2})\.\s*")
OPTION_MARKER = re.compile(r"^\s*([A-D])\.\s*")
ANSWER_MARKER = re.compile(r"【答案】|答案[:：]|参考答案")
EXPLANATION_MARKER = re.compile(r"【解】|【解析】|解答[:：]")
IMAGE_MARKER = re.compile(r"!\[[^\]]*\]\(([^)]+)\)")
IMAGE_LINE = re.compile(r"^\s*!\[[^\]]*\]\(([^)]+)\)\s*$")
FILL_HEADING = re.compile(r"\s*二、填空题[:：].*$")


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


def clean_body_lines(body_lines: list[str]) -> tuple[list[str], list[str]]:
    image_refs = []
    cleaned = []
    for line in body_lines:
        match = IMAGE_LINE.match(line)
        if match:
            image_refs.append(match.group(1))
            continue
        cleaned.append(line)
    while cleaned and not cleaned[0].strip():
        cleaned.pop(0)
    while cleaned and not cleaned[-1].strip():
        cleaned.pop()
    return cleaned, image_refs


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
        value = FILL_HEADING.sub("", value).strip()
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
        "hashMatchesExpected": file_hash == EXPECTED_PRIMARY_HASH,
        "answerMarkers": len(ANSWER_MARKER.findall(text)),
        "explanationMarkers": len(EXPLANATION_MARKER.findall(text)),
        "imageReferences": IMAGE_MARKER.findall(text),
    }


def image_file_record(root: Path, relative_path: str) -> dict[str, Any]:
    path = root / Path(relative_path)
    file_hash = sha256_file(path)
    return {
        "relativePath": relative_path,
        "role": "non_blocking_watermark_artifact",
        "gitState": git_state(root, relative_path),
        "bytes": path.stat().st_size,
        "sha256": file_hash,
        "hashMatchesExpected": file_hash == EXPECTED_IMAGE_HASHES.get(relative_path),
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
        errors.append("sourceYear must be 2024")

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
            if "二、填空题" in str(option.get("value", "")):
                errors.append(f"q{index:02d} option contains fill-in heading")
        if question.get("type") == "multiple_choice":
            labels = [option.get("label") for option in options]
            if labels != ["A", "B", "C", "D"]:
                errors.append(f"q{index:02d} options must be A-D, got {labels}")
        elif options:
            errors.append(f"q{index:02d} non-choice options must be empty")
    return errors


def transform(source_root: Path) -> tuple[dict[str, Any], list[dict[str, Any]]]:
    primary_path = source_root / Path(PRIMARY_RELATIVE)
    if not primary_path.is_file():
        raise FileNotFoundError("approved Math2 2024 Markdown input is missing")

    primary_record = source_file_record(
        source_root, PRIMARY_RELATIVE, "maintainer_approved_markdown_source"
    )
    if not primary_record["hashMatchesExpected"]:
        raise ValueError("Math2 2024 input hash mismatch")

    source_image_relatives = [
        str((Path(PRIMARY_RELATIVE).parent / Path(ref)).as_posix())
        for ref in primary_record["imageReferences"]
    ]
    image_records = [
        image_file_record(source_root, relative_path)
        for relative_path in source_image_relatives
    ]
    if not all(item["hashMatchesExpected"] for item in image_records):
        raise ValueError("Math2 2024 image artifact hash mismatch")

    primary_blocks = parse_question_blocks(primary_path.read_text(encoding="utf-8-sig"))
    batch_anomalies = [
        anomaly(
            "maintainer_source_decision",
            "warning",
            (
                "REQ-010 uses the maintainer-approved Markdown source "
                "solutions/2024/math2_2024.md; the origin PDF is not a prerequisite."
            ),
            blocks_publication=False,
            source_relative_path=PRIMARY_RELATIVE,
        ),
        anomaly(
            "source_contains_no_answers_or_explanations",
            "error",
            (
                "The approved Markdown contains no explicit answer or explanation markers; "
                "all answers and explanations remain missing."
            ),
            source_relative_path=PRIMARY_RELATIVE,
        ),
        anomaly(
            "maintainer_feedback_email_configured",
            "warning",
            (
                "The maintainer supplied tiantangyangyang@gmail.com as the public "
                "feedback mailbox for exact issue reports."
            ),
            blocks_publication=False,
        ),
    ]
    questions = []

    for block in primary_blocks:
        number = block["number"]
        kind = question_type(number)
        body_lines, omitted_images = clean_body_lines(block["bodyLines"])
        stem, options = extract_stem_and_options(body_lines, kind)
        question_anomalies = [
            anomaly(
                "missing_answer_and_explanation",
                "error",
                "No explicit answer or explanation exists in the approved Markdown source.",
            )
        ]
        if omitted_images:
            question_anomalies.append(
                anomaly(
                    "watermark_image_references_omitted",
                    "warning",
                    (
                        "Trailing image references are REQ-009 watermark/logo artifacts "
                        "and are omitted from the question stem."
                    ),
                    blocks_publication=False,
                    source_relative_path=PRIMARY_RELATIVE,
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
                }
            ],
        })

    counts = {
        kind: sum(question["type"] == kind for question in questions)
        for kind in EXPECTED_COUNTS
    }
    payload = {
        "schemaVersion": SCHEMA_VERSION,
        "batchId": "REQ-010-math2-2024-markdown-staging",
        "subjectCode": SUBJECT_CODE,
        "sourceYear": SOURCE_YEAR,
        "sourceRepository": {
            "name": SOURCE_REPO,
            "commit": git_output(source_root, "rev-parse", "HEAD"),
            "branch": git_output(source_root, "branch", "--show-current"),
            "dirty": bool(git_output(source_root, "status", "--porcelain=v1")),
            "dirtyState": git_output(source_root, "status", "--porcelain=v1").splitlines(),
        },
        "sourceRoleDecision": {
            "requirement": "docs/requirements/REQ-010-math2-2024-markdown-staging.md",
            "priorAudit": "docs/requirements/REQ-009-math2-2024-source-role-image-audit.md",
            "decision": "use_solutions_2024_markdown_as_approved_primary_source",
            "primaryRelativePath": PRIMARY_RELATIVE,
            "pdfPrerequisite": False,
        },
        "feedback": {
            "configuredBy": "VITE_FEEDBACK_EMAIL",
            "publicEmail": FEEDBACK_EMAIL,
            "requiredForLaunch": False,
            "status": "maintainer_email_configured",
        },
        "sourceFiles": [primary_record, *image_records],
        "questions": questions,
        "anomalies": batch_anomalies,
        "validation": {
            "inputFilesRead": 1 + len(image_records),
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
            "hashesMatchExpected": primary_record["hashMatchesExpected"]
            and all(item["hashMatchesExpected"] for item in image_records),
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
            "# Math2 2024 Staging Summary",
            "",
            "- Status: blocked staging batch; not published to frontend or database.",
            "- Source decision: use `solutions/2024/math2_2024.md` as the approved Markdown source.",
            "- PDF prerequisite: false.",
            f"- Questions: {validation['questionsGenerated']} (10 choice, 6 fill, 6 solution).",
            "- Answers present: 0.",
            "- Explanations present: 0.",
            f"- Primary options complete: {str(validation['primaryOptionsComplete']).lower()}.",
            f"- Schema contract valid: {str(validation['schemaValid']).lower()}.",
            f"- Feedback email: `{FEEDBACK_EMAIL}` by default; `VITE_FEEDBACK_EMAIL` may override it.",
            "- Launch boundary: missing answers/explanations are allowed for first launch if the promotion task keeps the under-review state visible.",
            "- Image references: three REQ-009 watermark/logo artifacts recorded as non-blocking source files.",
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
            "# Math2 2024 Human Review Checklist",
            "",
            "REQ-010 generated these records from `solutions/2024/math2_2024.md`.",
            "Every item remains blocked until a separate review or promotion task.",
            "",
            "| Stable ID | Q | Type | Answer | Finalization | Anomalies |",
            "|---|---:|---|---|---|---:|",
            *rows,
            "",
            "Review focus:",
            "",
            "- Confirm Q1-Q22 stems/options against the approved Markdown source.",
            "- Supply answers and explanations only from approved answer evidence in a later task.",
            f"- Use `{FEEDBACK_EMAIL}` as the public user feedback mailbox unless deployment overrides `VITE_FEEDBACK_EMAIL`.",
            "- Missing answers/explanations may be launched only with visible under-review state and issue-report path.",
            "- Do not run a DB import in REQ-010; defer database import until broader Math2 year coverage is ready.",
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
        default=Path("content/reports/math2-2024/human-review-checklist.md"),
    )
    args = parser.parse_args()
    payload, anomalies = transform(args.source_root.resolve())
    write_outputs(args.output_dir.resolve(), payload, anomalies)
    write_review_checklist(args.review_checklist, payload)
    print(
        f"Math2 2024: {len(payload['questions'])} questions, "
        f"schemaValid={payload['validation']['schemaValid']}"
    )
    if not payload["validation"]["schemaValid"]:
        raise SystemExit(3)


if __name__ == "__main__":
    main()
