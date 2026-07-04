"""Audit Math2 1987-2019 aggregate sources without generating staging."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import subprocess
from collections import Counter
from pathlib import Path
from typing import Any


SCHEMA_VERSION = "math2-1987-2019-aggregate-audit-v1"
SOURCE_REPO = "Kaoyan-Math2-Papers"
REQUIREMENT = "docs/requirements/REQ-015-math2-1987-2019-aggregate-split-staging.md"
REPORT_DIR = "content/reports/req-015-math2-1987-2019-aggregate-split-staging"
PAPER_RELATIVE = "papers/MinerU_markdown_math2_1987-2019_2065686324641095680.md"
SOLUTIONS_RELATIVE = "solutions/math2_1987-2019/math2_1987-2019.md"
EXPECTED_HASHES = {
    PAPER_RELATIVE: "c8cf81ea4a1b38fd483cbd5bc569a1e7d443792406f075f2fecb61f0156f23d3",
    SOLUTIONS_RELATIVE: "ef715711e094d2c30af75dee43e777c3870c781b91521da6604579d04e955e01",
}
EXPECTED_YEARS = list(range(1987, 2020))
HISTORICAL_REVIEW_YEARS = list(range(1987, 1997))
OPTION_LABELS = ["A", "B", "C", "D"]

CHINESE_DIGITS = {
    "〇": "0",
    "零": "0",
    "○": "0",
    "一": "1",
    "二": "2",
    "三": "3",
    "四": "4",
    "五": "5",
    "六": "6",
    "七": "7",
    "八": "8",
    "九": "9",
}
SUBJECT_MAP = {"一": "math1", "二": "math2", "三": "math3", "1": "math1", "2": "math2", "3": "math3"}

YEAR_HEADING_RE = re.compile(
    r"^\s*#{1,6}\s*([一二三四五六七八九〇零○]{4})年考研数学试卷([一二三123])解答"
)
SECTION_RE = re.compile(r"^\s*#{1,6}\s*[一二三四五六七八九十]+、")
QUESTION_RE = re.compile(
    r"^\s*(?:#{1,6}\s*)?(?P<number>\d{1,2})\s*[.、．）)]"
)
OPTION_RE = re.compile(r"^\s*(?:\$?\s*)?[（(]\s*([A-D])\s*[）)]\s*(.*)$")
ANSWER_MARKER_RE = re.compile(r"^解[.．：:]?|应选|应填|答案[:：]|参考答案|证明")
IMAGE_RE = re.compile(r"!\[[^\]]*\]\(([^)]+)\)")
SAME_PAPER_RE = re.compile(r"同试卷[一二三123]")


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


def source_repo_state(source_root: Path) -> dict[str, Any]:
    dirty_state = git_output(source_root, "status", "--porcelain=v1").splitlines()
    return {
        "name": SOURCE_REPO,
        "path": str(source_root),
        "branch": git_output(source_root, "branch", "--show-current"),
        "commit": git_output(source_root, "rev-parse", "HEAD"),
        "dirty": bool(dirty_state),
        "dirtyState": dirty_state,
    }


def chinese_year_to_int(value: str) -> int:
    digits = "".join(CHINESE_DIGITS[char] for char in value)
    return int(digits)


def source_file_record(source_root: Path, relative_path: str, role: str) -> dict[str, Any]:
    path = source_root / Path(relative_path)
    text = path.read_text(encoding="utf-8-sig")
    file_hash = sha256_file(path)
    return {
        "relativePath": relative_path,
        "role": role,
        "gitState": git_state(source_root, relative_path),
        "bytes": path.stat().st_size,
        "lines": len(normalize_newlines(text).splitlines()),
        "sha256": file_hash,
        "expectedSha256": EXPECTED_HASHES[relative_path],
        "hashMatchesExpected": file_hash == EXPECTED_HASHES[relative_path],
    }


def split_years(text: str) -> list[dict[str, Any]]:
    lines = normalize_newlines(text).splitlines()
    starts = []
    for index, line in enumerate(lines):
        match = YEAR_HEADING_RE.match(line)
        if not match:
            continue
        year = chinese_year_to_int(match.group(1))
        marker = match.group(2)
        starts.append({
            "year": year,
            "lineStart": index + 1,
            "title": line.strip(),
            "subjectMarker": marker,
            "detectedSubjectCode": SUBJECT_MAP.get(marker, "unknown"),
        })

    sections = []
    for position, start in enumerate(starts):
        end_index = starts[position + 1]["lineStart"] - 2 if position + 1 < len(starts) else len(lines) - 1
        body_lines = lines[start["lineStart"]: end_index + 1]
        sections.append({
            **start,
            "lineEnd": end_index + 1,
            "bodyLines": body_lines,
        })
    return sections


def scan_image_references(source_path: Path, body_lines: list[str]) -> list[dict[str, Any]]:
    references = []
    for index, line in enumerate(body_lines, start=1):
        for reference in IMAGE_RE.findall(line):
            remote = bool(re.match(r"^https?://", reference, re.I))
            references.append({
                "lineOffset": index,
                "reference": reference,
                "kind": "remote" if remote else "relative",
                "exists": None if remote else (source_path.parent / reference).is_file(),
            })
    return references


def scan_question_blocks(body_lines: list[str]) -> list[dict[str, Any]]:
    starts = []
    for index, line in enumerate(body_lines):
        match = QUESTION_RE.match(line)
        if not match:
            continue
        starts.append({
            "number": int(match.group("number")),
            "lineOffset": index + 1,
            "text": line.strip()[:160],
        })

    blocks = []
    for position, start in enumerate(starts):
        end = starts[position + 1]["lineOffset"] - 1 if position + 1 < len(starts) else len(body_lines)
        block_lines = body_lines[start["lineOffset"] - 1:end]
        blocks.append({
            **start,
            "lineEndOffset": end,
            "options": scan_options(block_lines),
        })
    return blocks


def scan_options(block_lines: list[str]) -> list[dict[str, Any]]:
    markers = []
    for index, line in enumerate(block_lines):
        match = OPTION_RE.match(line)
        if match:
            markers.append((index, match.group(1), match.group(2)))

    options = []
    for position, (index, label, first_value) in enumerate(markers):
        end = markers[position + 1][0] if position + 1 < len(markers) else len(block_lines)
        value = "\n".join([first_value, *block_lines[index + 1:end]]).strip()
        options.append({"label": label, "value": value, "lineOffset": index + 1})
    return options


def summarize_question_scan(blocks: list[dict[str, Any]]) -> dict[str, Any]:
    counts = Counter(block["number"] for block in blocks)
    option_blocks = []
    incomplete_option_blocks = []
    for block in blocks:
        if not block["options"]:
            continue
        labels = [item["label"] for item in block["options"]]
        empty = [item["label"] for item in block["options"] if not item["value"].strip()]
        complete = labels[:4] == OPTION_LABELS and not empty
        item = {
            "number": block["number"],
            "lineOffset": block["lineOffset"],
            "labels": labels,
            "emptyLabels": empty,
            "complete": complete,
        }
        option_blocks.append(item)
        if not complete:
            incomplete_option_blocks.append(item)
    return {
        "questionMarkerCount": len(blocks),
        "uniqueQuestionNumbers": sorted(counts),
        "duplicateQuestionNumbers": [number for number, count in sorted(counts.items()) if count > 1],
        "maxQuestionNumber": max(counts) if counts else None,
        "optionBlockCount": len(option_blocks),
        "completeOptionBlockCount": sum(item["complete"] for item in option_blocks),
        "incompleteOptionBlocks": incomplete_option_blocks,
    }


def scan_year(source_path: Path, year_section: dict[str, Any]) -> dict[str, Any]:
    body = year_section["bodyLines"]
    question_blocks = scan_question_blocks(body)
    answer_markers = [
        {"lineOffset": index + 1, "text": line.strip()[:160]}
        for index, line in enumerate(body)
        if ANSWER_MARKER_RE.search(line.strip())
    ]
    same_paper_refs = [
        {"lineOffset": index + 1, "text": line.strip()[:160]}
        for index, line in enumerate(body)
        if SAME_PAPER_RE.search(line)
    ]
    sections = [
        {"lineOffset": index + 1, "text": line.strip()}
        for index, line in enumerate(body)
        if SECTION_RE.match(line)
    ]
    images = scan_image_references(source_path, body)
    return {
        "year": year_section["year"],
        "title": year_section["title"],
        "lineStart": year_section["lineStart"],
        "lineEnd": year_section["lineEnd"],
        "detectedSubjectCode": year_section["detectedSubjectCode"],
        "subjectMarker": year_section["subjectMarker"],
        "sectionCount": len(sections),
        "sections": sections,
        "questionScan": summarize_question_scan(question_blocks),
        "answerExplanationMarkerCount": len(answer_markers),
        "answerExplanationMarkerSamples": answer_markers[:5],
        "samePaperReferenceCount": len(same_paper_refs),
        "samePaperReferenceSamples": same_paper_refs[:5],
        "imageReferenceCount": len(images),
        "remoteImageReferenceCount": sum(item["kind"] == "remote" for item in images),
        "missingLocalImageReferenceCount": sum(item["kind"] == "relative" and item["exists"] is False for item in images),
        "imageReferences": images,
    }


def scan_source(source_root: Path, relative_path: str, role: str) -> dict[str, Any]:
    source_path = source_root / Path(relative_path)
    text = source_path.read_text(encoding="utf-8-sig")
    years = [scan_year(source_path, item) for item in split_years(text)]
    return {
        "source": source_file_record(source_root, relative_path, role),
        "yearBoundaryScan": {
            "yearsDetected": [item["year"] for item in years],
            "missingYears": [year for year in EXPECTED_YEARS if year not in {item["year"] for item in years}],
            "extraYears": [item["year"] for item in years if item["year"] not in EXPECTED_YEARS],
            "completeExpectedSet": [item["year"] for item in years] == EXPECTED_YEARS,
        },
        "years": years,
    }


def decide_year(year: int, scans: list[dict[str, Any]]) -> dict[str, Any]:
    records = [scan for source in scans for scan in source["years"] if scan["year"] == year]
    blockers = []
    title_subjects = sorted({item["detectedSubjectCode"] for item in records})
    if len(records) != len(scans):
        blockers.append("missing_year_boundary_in_one_or_more_sources")
    if "math2" not in title_subjects:
        blockers.append("historical_subject_title_review_required")
    if year in HISTORICAL_REVIEW_YEARS:
        blockers.append("pre_1997_heading_uses_shijuan_san")
    if any(item["samePaperReferenceCount"] for item in records):
        blockers.append("contains_same-paper_cross_references")
    if any(item["remoteImageReferenceCount"] for item in records):
        blockers.append("contains_remote_image_references")
    if any(item["questionScan"]["incompleteOptionBlocks"] for item in records):
        blockers.append("contains_incomplete_option_blocks")
    if any(item["questionScan"]["questionMarkerCount"] == 0 for item in records):
        blockers.append("missing_question_markers")
    if any(item["answerExplanationMarkerCount"] for item in records):
        blockers.append("answer_explanation_interleaved_with_question_text")

    if year in HISTORICAL_REVIEW_YEARS:
        status = "blocked_historical_subject_title_review"
        next_action = "Review whether legacy `试卷三` headings map to Math2 before staging."
    elif blockers:
        status = "split_ready_staging_blocked"
        next_action = "Use the year split as evidence, then create a per-year extraction/repair PR before staging."
    else:
        status = "split_ready_candidate"
        next_action = "Eligible for a later per-year staging PR; still not DB-importable in REQ-015."

    return {
        "year": year,
        "status": status,
        "stagingReadyInReq015": False,
        "databaseImportReadyInReq015": False,
        "detectedSubjectCodes": title_subjects,
        "blockers": sorted(set(blockers)),
        "nextAction": next_action,
    }


def build_audit(source_root: Path) -> dict[str, Any]:
    scans = [
        scan_source(source_root, PAPER_RELATIVE, "aggregate_paper_path_contains_solutions"),
        scan_source(source_root, SOLUTIONS_RELATIVE, "aggregate_solutions_path"),
    ]
    decisions = [decide_year(year, scans) for year in EXPECTED_YEARS]
    math2_candidates = [
        item["year"]
        for item in decisions
        if item["status"] == "split_ready_staging_blocked"
        and "historical_subject_title_review_required" not in item["blockers"]
        and "pre_1997_heading_uses_shijuan_san" not in item["blockers"]
    ]
    return {
        "schemaVersion": SCHEMA_VERSION,
        "requirement": REQUIREMENT,
        "reportDirectory": REPORT_DIR,
        "sourceRepository": source_repo_state(source_root),
        "sources": scans,
        "decisions": decisions,
        "summary": {
            "yearsAudited": len(EXPECTED_YEARS),
            "historicalReviewYears": HISTORICAL_REVIEW_YEARS,
            "futurePerYearStagingCandidates": math2_candidates,
            "stagingGenerated": False,
            "databaseImportRun": False,
            "databaseImportBoundary": "REQ-015 does not generate staging or run live DB import.",
            "deepSeekUsed": False,
            "deepSeekReason": (
                "Deterministic local scans were sufficient for boundary, option, "
                "marker, image, and blocker reporting; avoiding the secret file "
                "reduced unnecessary credential exposure risk."
            ),
        },
    }


def markdown_table_for_years(audit: dict[str, Any]) -> list[str]:
    rows = [
        "| Year | Status | Subjects | Main blockers |",
        "|---:|---|---|---|",
    ]
    for decision in audit["decisions"]:
        blockers = ", ".join(decision["blockers"][:4])
        if len(decision["blockers"]) > 4:
            blockers += ", ..."
        rows.append(
            "| "
            + " | ".join([
                str(decision["year"]),
                f"`{decision['status']}`",
                ", ".join(decision["detectedSubjectCodes"]),
                blockers or "none",
            ])
            + " |"
        )
    return rows


def write_audit_markdown(path: Path, audit: dict[str, Any]) -> None:
    summary = audit["summary"]
    lines = [
        "# Math2 1987-2019 Aggregate Audit",
        "",
        f"- Requirement: `{REQUIREMENT}`",
        "- Scope: deterministic split/audit only; no staging, publication, or DB import.",
        f"- Source commit: `{audit['sourceRepository']['commit']}`",
        f"- Source dirty: `{str(audit['sourceRepository']['dirty']).lower()}`",
        f"- Years audited: {summary['yearsAudited']}",
        f"- Future per-year staging candidates: `{summary['futurePerYearStagingCandidates']}`",
        f"- DeepSeek used: `{str(summary['deepSeekUsed']).lower()}`",
        "",
        "## Source Inventory",
        "",
        "| Role | Path | Lines | Bytes | Hash OK |",
        "|---|---|---:|---:|---|",
    ]
    for source in audit["sources"]:
        record = source["source"]
        lines.append(
            "| "
            + " | ".join([
                record["role"],
                f"`{record['relativePath']}`",
                str(record["lines"]),
                str(record["bytes"]),
                str(record["hashMatchesExpected"]).lower(),
            ])
            + " |"
        )
    lines.extend([
        "",
        "## Year Decisions",
        "",
        *markdown_table_for_years(audit),
        "",
        "## Decision",
        "",
        "- No `content/staging/math2/<year>/` files are generated in REQ-015.",
        "- 1987-1996 are blocked pending historical title review.",
        "- 1997-2019 have stable Math2 year titles, but remain staging-blocked in this PR because the aggregate text interleaves question text and answers/explanations, contains cross-paper references and image evidence, and requires per-year extraction review.",
        "- Database import remains limited to existing staged Math2 2020/2023/2024 unless a later requirement generates schema-valid staging for more years.",
        "",
    ])
    path.write_text("\n".join(lines), encoding="utf-8")


def write_year_boundary_markdown(path: Path, audit: dict[str, Any]) -> None:
    lines = [
        "# Math2 1987-2019 Year Boundary Scan",
        "",
        "| Source | Complete 1987-2019 | Missing | First/last lines |",
        "|---|---|---|---|",
    ]
    for source in audit["sources"]:
        scan = source["yearBoundaryScan"]
        years = source["years"]
        lines.append(
            "| "
            + " | ".join([
                f"`{source['source']['relativePath']}`",
                str(scan["completeExpectedSet"]).lower(),
                str(scan["missingYears"]),
                f"{years[0]['lineStart']}-{years[-1]['lineEnd']}" if years else "none",
            ])
            + " |"
        )
    lines.append("")
    path.write_text("\n".join(lines), encoding="utf-8")


def write_blocker_report(path: Path, audit: dict[str, Any]) -> None:
    blocked = [item for item in audit["decisions"] if item["blockers"]]
    lines = [
        "# Math2 1987-2019 Blocker Report",
        "",
        "- Staging generated: `false`.",
        "- Database import run: `false`.",
        "- Minimum unblock request: approve historical 1987-1996 title mapping, then run per-year extraction PRs starting from 1997-2019 candidates.",
        "",
        "## Blockers By Year",
        "",
    ]
    for item in blocked:
        lines.extend([
            f"### {item['year']}",
            "",
            f"- Status: `{item['status']}`",
            f"- Next action: {item['nextAction']}",
            "",
        ])
        lines.extend([f"- `{blocker}`" for blocker in item["blockers"]])
        lines.append("")
    path.write_text("\n".join(lines), encoding="utf-8")


def write_outputs(report_dir: Path, audit: dict[str, Any]) -> None:
    report_dir.mkdir(parents=True, exist_ok=True)
    (report_dir / "aggregate-audit.json").write_text(
        json.dumps(audit, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    inventory = {
        "schemaVersion": "math2-1987-2019-source-inventory-v1",
        "sourceRepository": audit["sourceRepository"],
        "sources": [source["source"] for source in audit["sources"]],
    }
    (report_dir / "source-inventory.json").write_text(
        json.dumps(inventory, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    write_audit_markdown(report_dir / "aggregate-audit.md", audit)
    write_year_boundary_markdown(report_dir / "year-boundary-scan.md", audit)
    write_blocker_report(report_dir / "blocker-report.md", audit)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("source_root", type=Path)
    parser.add_argument("report_dir", type=Path, nargs="?", default=Path(REPORT_DIR))
    args = parser.parse_args()
    audit = build_audit(args.source_root.resolve())
    write_outputs(args.report_dir, audit)
    print(
        "Math2 1987-2019 aggregate audit: "
        f"{audit['summary']['yearsAudited']} years, "
        f"futureCandidates={audit['summary']['futurePerYearStagingCandidates']}"
    )


if __name__ == "__main__":
    main()
