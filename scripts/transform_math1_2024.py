"""Transform the multi-version Math1 2024 source set without hiding conflicts."""

import argparse
import json
import re
import subprocess
import sys
import unicodedata
from collections import OrderedDict
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from scripts.transform_m1_2020 import (
    OPTION_MARKER,
    check_katex_structure,
    detect_ocr_risks,
    normalize_newlines,
    sha256_file,
)


SCHEMA_VERSION = "math1-2024-multiversion-transform-v1"
SOURCE_REPO = "Kaoyan-Math1-Papers"
PRIMARY_PAPER = "papers/2024年数学(一)真题及参考答案.md"
SOLUTION_COPY = "solutions/2024年解析/2024.md"
ALTERNATIVE_COMBINED = "papers/2024考研数学一真题+答案.md"
ALTERNATIVE_PAPER_ONLY = "papers/2024考研数学一真题.md"
SOURCE_PATHS = (
    PRIMARY_PAPER,
    SOLUTION_COPY,
    ALTERNATIVE_COMBINED,
    ALTERNATIVE_PAPER_ONLY,
)
SECTION_RE = re.compile(r"(?m)^#?\s*([一二三])、[^\n]*$")
# Q21 has its answer marker glued to OCR debris on the same line.
ANSWER_RE = re.compile(r"(?m)【答案】[ \t]*(.*)$")
EXPECTED_SECTION_COUNTS = {"一": 10, "二": 6, "三": 6}


def question_type(number):
    if number <= 10:
        return "multiple_choice"
    if number <= 16:
        return "fill_in_blank"
    return "solution"


def stable_id(number):
    return f"math1-2024-q{number:02d}"


def extract_options(text):
    matches = list(OPTION_MARKER.finditer(text))
    options = []
    for index, match in enumerate(matches):
        end = matches[index + 1].start() if index + 1 < len(matches) else len(text)
        options.append({"label": match.group(1), "value": text[match.end():end].strip()})
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


def parse_answer_terminated_sections(text):
    """Split a combined paper where every scored question ends with an answer line."""
    text = normalize_newlines(text)
    sections = list(SECTION_RE.finditer(text))
    parsed = []
    section_counts = {}
    for section_index, section in enumerate(sections):
        numeral = section.group(1)
        end = sections[section_index + 1].start() if section_index + 1 < len(sections) else len(text)
        body = text[section.end():end]
        answers = list(ANSWER_RE.finditer(body))
        cursor = 0
        for answer in answers:
            stem = body[cursor:answer.start()].strip()
            parsed.append({"section": numeral, "stem": stem, "answer": answer.group(1).strip() or None})
            cursor = answer.end()
        section_counts[numeral] = len(answers)
    return parsed, section_counts


def normalized_answer(value):
    if value is None:
        return None
    value = unicodedata.normalize("NFKC", value)
    # This normalization is comparison-only. It removes Markdown/LaTeX presentation
    # punctuation while retaining identifiers, numbers, operators, and Chinese text.
    value = re.sub(r"[\s$\\{}()\[\],，。.;；:：]", "", value)
    return value


def source_set(root):
    paths = {relative: root / Path(relative) for relative in SOURCE_PATHS}
    missing = [relative for relative, path in paths.items() if not path.is_file()]
    if missing:
        raise FileNotFoundError(f"Missing 2024 source files: {missing}")
    return paths


def transform(source_root):
    paths = source_set(source_root)
    primary_text = paths[PRIMARY_PAPER].read_text(encoding="utf-8-sig")
    primary, section_counts = parse_answer_terminated_sections(primary_text)
    if section_counts != EXPECTED_SECTION_COUNTS:
        raise ValueError(f"Unexpected primary section counts: {section_counts}")

    solution_copy, solution_counts = parse_answer_terminated_sections(
        paths[SOLUTION_COPY].read_text(encoding="utf-8-sig")
    )
    alternative, alternative_counts = parse_answer_terminated_sections(
        paths[ALTERNATIVE_COMBINED].read_text(encoding="utf-8-sig")
    )
    if solution_counts != EXPECTED_SECTION_COUNTS or alternative_counts != EXPECTED_SECTION_COUNTS:
        raise ValueError(
            f"Unexpected comparison counts: solution={solution_counts}, alternative={alternative_counts}"
        )

    metadata = git_metadata(source_root)
    hashes = {relative: sha256_file(path) for relative, path in paths.items()}
    anomalies = [{
        "type": "multiple_paper_versions",
        "stableId": "math1-2024-source-set",
        "severity": "warning",
        "message": (
            "Three 2024 paper candidates exist. The longest complete combined paper is primary; "
            "all alternatives remain provenance and require human comparison."
        ),
    }]
    if hashes[PRIMARY_PAPER] == hashes[SOLUTION_COPY]:
        anomalies.append({
            "type": "solution_file_duplicates_primary_paper",
            "stableId": "math1-2024-source-set",
            "severity": "info",
            "message": "The independent solution Markdown is byte-identical to the primary combined paper.",
        })

    questions = []
    for index, item in enumerate(primary):
        number = index + 1
        kind = question_type(number)
        item_anomalies = []
        item_anomalies.extend(detect_ocr_risks(item["stem"], number))
        item_anomalies.extend(check_katex_structure(item["stem"]))
        options = extract_options(item["stem"]) if kind == "multiple_choice" else []
        if kind == "multiple_choice":
            labels = sorted({option["label"] for option in options})
            if labels != ["A", "B", "C", "D"]:
                item_anomalies.append({
                    "type": "incomplete_options",
                    "questionNumber": number,
                    "severity": "warning",
                    "message": f"Extracted option labels: {labels}",
                })

        solution_answer = solution_copy[index]["answer"]
        if normalized_answer(item["answer"]) != normalized_answer(solution_answer):
            item_anomalies.append({
                "type": "primary_solution_copy_answer_conflict",
                "questionNumber": number,
                "severity": "error",
                "message": f"Primary answer {item['answer']!r} differs from solution copy {solution_answer!r}.",
            })

        alternative_answer = alternative[index]["answer"]
        if normalized_answer(item["answer"]) != normalized_answer(alternative_answer):
            item_anomalies.append({
                "type": "alternative_answer_conflict",
                "questionNumber": number,
                "severity": "warning",
                "message": (
                    f"Primary answer {item['answer']!r} differs from "
                    f"`{ALTERNATIVE_COMBINED}` answer {alternative_answer!r}."
                ),
            })

        anomalies.extend(item_anomalies)
        questions.append(OrderedDict([
            ("stableId", stable_id(number)),
            ("sourceRepo", SOURCE_REPO),
            ("sourceRelativePaths", list(SOURCE_PATHS)),
            ("sourceCommit", metadata["headCommit"]),
            ("sourceDirty", metadata["dirty"]),
            ("sourceYear", 2024),
            ("subjectCode", "math1"),
            ("sourceFileHashes", {
                "paper": hashes[PRIMARY_PAPER],
                "solutions": hashes[SOLUTION_COPY],
                "alternativeCombined": hashes[ALTERNATIVE_COMBINED],
                "alternativePaperOnly": hashes[ALTERNATIVE_PAPER_ONLY],
            }),
            ("transformVersion", SCHEMA_VERSION),
            ("reviewStatus", "needs_human_review"),
            ("questionNumber", number),
            ("questionType", kind),
            ("stem", item["stem"]),
            ("options", options),
            ("answerCandidate", item["answer"]),
            ("answerStatus", "candidate_from_primary_combined_paper" if item["answer"] else "missing"),
            ("explanationCandidate", None),
            ("explanationStatus", "missing"),
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
        ("task", "cc-math1-2024-multiversion"),
        ("subjectCode", "math1"),
        ("sourceYear", 2024),
        ("sourceRepo", SOURCE_REPO),
        ("sourceCommit", metadata["headCommit"]),
        ("sourceDirty", metadata["dirty"]),
        ("sourceInfo", {
            "selectionRule": "longest complete combined paper with all alternatives retained",
            "primaryPaperRelativePath": PRIMARY_PAPER,
            "solutionCopyRelativePath": SOLUTION_COPY,
            "alternativeRelativePaths": [ALTERNATIVE_COMBINED, ALTERNATIVE_PAPER_ONLY],
            "sourceFileHashes": hashes,
        }),
        ("questions", questions),
        ("validation", {
            "questionsGenerated": len(questions),
            "questionCounts": counts,
            "expectedCounts": expected,
            "countsMatch": counts == expected,
            "primarySectionCounts": section_counts,
            "totalAnomalies": len(anomalies),
            "anomaliesBySeverity": {
                severity: sum(item.get("severity") == severity for item in anomalies)
                for severity in ("error", "warning", "info")
            },
            "allQuestionsNeedsReview": all(q["reviewStatus"] == "needs_human_review" for q in questions),
        }),
    ])
    return payload, anomalies


def version_report(payload, anomalies):
    info = payload["sourceInfo"]
    conflicts = [item for item in anomalies if item["type"] == "alternative_answer_conflict"]
    lines = [
        "# Math1 2024 Version Selection Report",
        "",
        "## Decision",
        "",
        f"- Primary: `{info['primaryPaperRelativePath']}`",
        f"- Answer cross-check copy: `{info['solutionCopyRelativePath']}`",
        "- The primary was selected because it is the longest complete combined candidate with 22 answer markers.",
        "- No conflicting answer was silently corrected; every mismatch is retained as a review anomaly.",
        "",
        "## Alternatives Retained",
        "",
    ]
    lines.extend(f"- `{path}`" for path in info["alternativeRelativePaths"])
    lines.extend([
        "",
        "## Detected Answer Conflicts",
        "",
    ])
    if conflicts:
        lines.extend(
            f"- `math1-2024-q{item['questionNumber']:02d}`: {item['message']}"
            for item in conflicts
        )
    else:
        lines.append("- None after normalization.")
    lines.extend([
        "",
        "## Boundary",
        "",
        "- All 22 questions remain `needs_human_review`.",
        "- The source repository was read only and was not committed or pushed.",
        "- Detailed explanations are unavailable in these Markdown candidates.",
        "",
    ])
    return "\n".join(lines)


def write_output(output_dir, report_path, payload, anomalies):
    output_dir.mkdir(parents=True, exist_ok=True)
    report_path.parent.mkdir(parents=True, exist_ok=True)
    for name, data in (
        ("questions.json", payload),
        ("anomalies.json", {"schemaVersion": SCHEMA_VERSION, "anomalies": anomalies}),
        ("validation.json", payload["validation"]),
    ):
        (output_dir / name).write_text(
            json.dumps(data, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
    (output_dir / "summary.md").write_text(
        "\n".join([
            "# Math1 2024 Multi-Version Transformation Summary",
            "",
            f"- Questions: {len(payload['questions'])}",
            f"- Counts match: {payload['validation']['countsMatch']}",
            f"- Anomalies: {len(anomalies)}",
            "- Review status: all `needs_human_review`",
            "- Detailed explanations: unavailable",
            "",
        ]),
        encoding="utf-8",
    )
    report_path.write_text(version_report(payload, anomalies) + "\n", encoding="utf-8")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("source_root", type=Path)
    parser.add_argument("output_dir", type=Path)
    parser.add_argument("report_path", type=Path)
    args = parser.parse_args()
    payload, anomalies = transform(args.source_root.resolve())
    write_output(args.output_dir, args.report_path, payload, anomalies)
    print(f"Math1 2024: {len(payload['questions'])} questions, {len(anomalies)} anomalies")
    if payload["validation"]["anomaliesBySeverity"]["error"]:
        raise SystemExit(3)


if __name__ == "__main__":
    main()
