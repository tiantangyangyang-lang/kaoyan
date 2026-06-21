"""Build a deterministic Math1 1987-2025 source-readiness manifest."""

import argparse
import hashlib
import json
import re
from pathlib import Path


YEARS = range(1987, 2026)
ROMAN_SECTION = re.compile(r"(?m)^#\s*([一二三四五六七八九十]+)、")
PAREN_QUESTION = re.compile(
    r"(?m)^\s*(?:[（(]\s*(\d{1,2})\s*[）)]|(\d{1,2})\s*[）)])"
)
PLAIN_QUESTION = re.compile(r"(?m)^\s*(\d{1,2})[．.]\s*")
ANSWER_MARKER = re.compile(r"【答案】")
EXPLANATION_MARKER = re.compile(r"【(?:解|解析|证明)】")
OCR_RISK = re.compile(r"�|operator\*\s*\{\s*l i m\s*\}|l i m|tiny Ḋ||")


def sha256(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def read_text(path):
    return path.read_text(encoding="utf-8-sig")


def unique_question_numbers(pattern, text):
    numbers = set()
    for match in pattern.finditer(text):
        raw = next(value for value in match.groups() if value)
        number = int(raw)
        if 1 <= number <= 25:
            numbers.add(number)
    return sorted(numbers)


def expected_count(year):
    if year == 2007:
        return 24
    if 2004 <= year <= 2020:
        return 23
    if 2021 <= year <= 2025:
        return 22
    return None


def structure_family(year):
    if year <= 2003:
        return "legacy_section_based"
    if year <= 2020:
        return "sequential_23"
    if year <= 2022:
        return "sequential_22_mixed_markers"
    return "modern_plain_numbered_or_embedded"


def file_info(path, root):
    return {
        "relativePath": str(path.relative_to(root)).replace("/", "\\"),
        "length": path.stat().st_size,
        "sha256": sha256(path),
    }


def inspect_year(root, year):
    paper_dir = root / "papers"
    papers = sorted(
        path for path in paper_dir.glob(f"{year}*.md")
        if path.name != "README.md"
    )
    solution_root = root / "solutions" / f"{year}年解析"
    solutions = sorted(solution_root.rglob("*.md")) if solution_root.exists() else []
    pdfs = sorted(solution_root.rglob("*.pdf")) if solution_root.exists() else []

    paper_metrics = []
    for paper in papers:
        text = read_text(paper)
        paren = unique_question_numbers(PAREN_QUESTION, text)
        plain = unique_question_numbers(PLAIN_QUESTION, text)
        paper_metrics.append({
            **file_info(paper, root),
            "romanSectionCount": len(set(ROMAN_SECTION.findall(text))),
            "parenthesizedQuestionNumbers": paren,
            "plainQuestionNumbers": plain,
            "answerMarkerCount": len(ANSWER_MARKER.findall(text)),
            "explanationMarkerCount": len(EXPLANATION_MARKER.findall(text)),
            "ocrRiskCount": len(OCR_RISK.findall(text)),
        })

    solution_metrics = []
    for solution in solutions:
        text = read_text(solution)
        solution_metrics.append({
            **file_info(solution, root),
            "romanSectionCount": len(set(ROMAN_SECTION.findall(text))),
            "parenthesizedQuestionNumbers": unique_question_numbers(PAREN_QUESTION, text),
            "answerMarkerCount": len(ANSWER_MARKER.findall(text)),
            "explanationMarkerCount": len(EXPLANATION_MARKER.findall(text)),
            "ocrRiskCount": len(OCR_RISK.findall(text)),
        })

    expected = expected_count(year)
    max_detected = max(
        [
            len(set(item["parenthesizedQuestionNumbers"] + item["plainQuestionNumbers"]))
            for item in paper_metrics
        ] or [0]
    )
    risks = []
    if not papers:
        risks.append("missing_paper")
    if not solutions:
        risks.append("missing_solution_markdown")
    if not pdfs:
        risks.append("missing_solution_pdf")
    if len(papers) > 1:
        risks.append("multiple_paper_versions")
    if expected is not None and max_detected != expected:
        risks.append("question_marker_count_mismatch")
    if any(item["ocrRiskCount"] for item in paper_metrics + solution_metrics):
        risks.append("ocr_risk_detected")
    if any(item["answerMarkerCount"] for item in paper_metrics):
        risks.append("paper_contains_answers")

    if "missing_paper" in risks:
        disposition = "blocked_missing_paper"
    elif "multiple_paper_versions" in risks:
        disposition = "blocked_version_selection"
    elif year <= 2003:
        disposition = "needs_legacy_parser"
    elif "ocr_risk_detected" in risks or "question_marker_count_mismatch" in risks:
        disposition = "needs_manual_or_special_parser"
    elif not solutions:
        disposition = "ready_questions_only"
    else:
        disposition = "ready_for_yearly_conversion"

    return {
        "year": year,
        "structureFamily": structure_family(year),
        "expectedQuestionCount": expected,
        "maxDetectedQuestionMarkers": max_detected,
        "paperCandidates": paper_metrics,
        "solutionMarkdownCandidates": solution_metrics,
        "solutionPdfs": [file_info(path, root) for path in pdfs],
        "risks": risks,
        "disposition": disposition,
    }


def build_manifest(root):
    years = [inspect_year(root, year) for year in YEARS]
    counts = {}
    for item in years:
        counts[item["disposition"]] = counts.get(item["disposition"], 0) + 1
    return {
        "schemaVersion": "math1-batch-manifest-v1",
        "sourceRoot": str(root),
        "yearRange": {"start": 1987, "end": 2025},
        "summary": {
            "calendarYears": 39,
            "paperYears": sum(bool(item["paperCandidates"]) for item in years),
            "solutionYears": sum(bool(item["solutionMarkdownCandidates"]) for item in years),
            "dispositions": counts,
        },
        "years": years,
    }


def write_markdown(manifest, output):
    lines = [
        "# Math1 1987-2025 Batch Readiness",
        "",
        "Generated deterministically from the current source working tree.",
        "",
        "| Year | Family | Papers | Solutions | Detected | Expected | Disposition | Risks |",
        "|---:|---|---:|---:|---:|---:|---|---|",
    ]
    for item in manifest["years"]:
        expected = item["expectedQuestionCount"]
        lines.append(
            f"| {item['year']} | {item['structureFamily']} | "
            f"{len(item['paperCandidates'])} | {len(item['solutionMarkdownCandidates'])} | "
            f"{item['maxDetectedQuestionMarkers']} | {expected if expected is not None else '-'} | "
            f"{item['disposition']} | {', '.join(item['risks']) or '-'} |"
        )
    lines += [
        "",
        "## Execution Rule",
        "",
        "- Process one year per batch and keep every item at `needs_human_review`.",
        "- Do not process blocked years until the named blocker is resolved.",
        "- File SHA-256 values identify dirty/uncommitted source content.",
        "- Do not commit or push the source repository.",
    ]
    output.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("source_root", type=Path)
    parser.add_argument("output_dir", type=Path)
    args = parser.parse_args()
    manifest = build_manifest(args.source_root.resolve())
    args.output_dir.mkdir(parents=True, exist_ok=True)
    json_path = args.output_dir / "batch-manifest.json"
    md_path = args.output_dir / "batch-readiness.md"
    json_path.write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    write_markdown(manifest, md_path)
    print(f"Wrote {json_path}")
    print(f"Wrote {md_path}")


if __name__ == "__main__":
    main()
