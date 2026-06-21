"""
Source inventory generator for Kaoyan math exam paper repositories.

Reads source-before.json (a snapshot of two source repositories) and produces:
- source-inventory.json: structured inventory with metadata
- source-anomalies.md: human-readable anomaly report

Deterministic: same input produces identical output. Uses capturedAt from
the input snapshot for all time fields. Sorted output ensures repeatable
file ordering.

Usage:
    python scripts/inventory.py <source-before.json> <output-dir>

Requirements: Python 3.8+ standard library only.
"""

import hashlib
import json
import os
import re
import sys
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple


# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

CONTAMINATION_MARKERS = [
    "英语一", "英语二", "英语三", "政治", "math3",
]

KNOWN_RISK_PATTERNS = {
    "math1_2022_ocr": {
        "description": "数学一 2022 正文可能存在拆散的 l i m、随机乱码等 OCR 噪声",
        "source": "规范预登记 (section 2 / section 9)",
        "detected_in_inventory": False,
        "requires_content_scan": True,
    },
    "math2_2021_wrong_subject": {
        "description": "数学二 2021 文件标题可能写成'数学三'",
        "source": "规范预登记 (section 2)",
        "detected_in_inventory": False,
        "requires_content_scan": True,
    },
    "math2_ocr_noise": {
        "description": "数学二可能存在 rx²、拆散的 l i m 等 OCR 噪声",
        "source": "规范预登记 (section 2 / section 9)",
        "detected_in_inventory": False,
        "requires_content_scan": True,
    },
    "math2_no_license": {
        "description": "数学二仓库根目录未发现 LICENSE 文件",
        "source": "规范预登记 (section 2)",
        "detected_in_inventory": False,
        "requires_content_scan": False,
    },
}

EXPECTED_MATH1_YEARS = set(range(1987, 2026)) - {1994}  # 40 papers, 1994 missing
EXPECTED_MATH2_YEARS = set(range(1987, 2025))

SUBJECT_MAP = {
    "Kaoyan-Math1-Papers": "math1",
    "Kaoyan-Math2-Papers": "math2",
}

# ---------------------------------------------------------------------------
# Path pattern detection
# ---------------------------------------------------------------------------

YEAR_PATTERNS = [
    # Math1 papers: papers/2020年考研数学(一)真题.md
    re.compile(r"papers[/\\](\d{4})年考研数学"),
    # Math1 solutions: solutions/2020年解析/...
    re.compile(r"solutions[/\\](\d{4})年解析"),
    # Math2 papers: papers/math2_2020.pdf or papers/math2_1987-2019.pdf
    re.compile(r"papers[/\\]math2_(\d{4})"),
    # Math2 MinerU: papers/MinerU_markdown_math2_2020_...
    re.compile(r"MinerU_markdown_math2_(\d{4})"),
    # Math2 solutions by year: solutions/2020/...
    re.compile(r"solutions[/\\](\d{4})[/\\]"),
    # Math2 merged solution: solutions/math2_1987-2019/...
    re.compile(r"solutions[/\\]math2_(\d{4})"),
]


def _extract_year(path: str) -> Optional[int]:
    """Extract year from a relative path. Returns None if no year found."""
    # Try each pattern
    for pat in YEAR_PATTERNS:
        m = pat.search(path)
        if m:
            return int(m.group(1))
    # Try simple 4-digit year anywhere in path
    simple = re.search(r"(?:^|[\\/_])(\d{4})(?:年|[^\d]|$)", path)
    if simple:
        return int(simple.group(1))
    return None


def _extract_years_from_range(path: str) -> Tuple[Optional[int], Optional[int]]:
    """Extract start and end year from a path like math2_1987-2019."""
    m = re.search(r"math2[_-](\d{4})-(\d{4})", path)
    if m:
        return int(m.group(1)), int(m.group(2))
    return None, None


def _classify_file(path: str) -> str:
    """Classify a file by its content role.

    Returns one of:
        paper_markdown, paper_pdf, solution_markdown, solution_pdf,
        content_list_json, model_json, layout_json, image,
        license_file, readme_file, gitignore, contamination, unknown
    """
    p = path.replace('\\', '/').lower()

    # Check contamination first
    for marker in CONTAMINATION_MARKERS:
        if marker.lower() in p.split('/'):
            # Actually check path components
            parts = path.replace('\\', '/').split('/')
            if any(marker.lower() == part.lower() for part in parts):
                return "contamination"

    # Root-level meta files
    filename = p.split('/')[-1]
    if filename in ('license', 'license.md', 'license.txt'):
        return "license_file"
    if filename in ('readme.md', 'readme.txt', 'readme'):
        return "readme_file"
    if filename == '.gitignore':
        return "gitignore"

    # Papers
    if p.startswith('papers/'):
        if p.endswith('.md'):
            return "paper_markdown"
        if p.endswith('.pdf'):
            return "paper_pdf"

    # Solutions
    if 'solution' in p:
        if p.endswith('.md'):
            return "solution_markdown"
        if p.endswith('.pdf') and ('origin' in filename or '原' in filename):
            return "solution_pdf"
        if '_content_list.json' in filename or 'content_list_v2.json' in filename:
            return "content_list_json"
        if '_model.json' in filename:
            return "model_json"
        if 'layout.json' in filename:
            return "layout_json"
        if filename.endswith(('.jpg', '.jpeg', '.png', '.gif', '.webp')):
            return "image"

    return "unknown"


def _repo_name_from_root(root: str) -> str:
    """Extract repository short name from root path."""
    return os.path.basename(root.rstrip('/').rstrip('\\'))


# ---------------------------------------------------------------------------
# Core inventory generation
# ---------------------------------------------------------------------------

def _parse_git_status(status_lines: List[str]) -> List[Dict]:
    """Parse git status lines into structured entries."""
    result = []
    for line in status_lines:
        if not line.strip():
            continue
        entry = {"raw": line}
        if line.startswith("??"):
            entry["status"] = "untracked"
            entry["path"] = line[3:].strip()
        elif line.startswith(" M"):
            entry["status"] = "modified"
            entry["path"] = line[3:].strip()
        elif line.startswith("M "):
            entry["status"] = "staged_modified"
            entry["path"] = line[3:].strip()
        elif line.startswith("D "):
            entry["status"] = "staged_deleted"
            entry["path"] = line[3:].strip()
        elif line.startswith("A "):
            entry["status"] = "staged_added"
            entry["path"] = line[3:].strip()
        else:
            entry["status"] = "other"
            entry["path"] = line.strip()
        result.append(entry)
    return result


def _identify_untracked_files(repo: Dict, git_status_parsed: List[Dict]) -> List[str]:
    """Identify files that are untracked (not in git)."""
    untracked_paths = set()
    for entry in git_status_parsed:
        if entry["status"] == "untracked":
            untracked_paths.add(entry["path"].replace('/', '\\'))
    # Also check if any file in repo['files'] has path matching untracked
    result = []
    all_file_paths = {f["relativePath"] for f in repo["files"]}
    for up in untracked_paths:
        if up in all_file_paths:
            result.append(up)
    return sorted(result)


def build_inventory(source_before_path: str) -> Dict:
    """Read source-before.json and produce an inventory dict.

    Returns a dict ready for serialization to source-inventory.json.
    """
    # PowerShell 5 writes UTF-8 JSON with a BOM, while other producers may
    # omit it. utf-8-sig accepts both forms.
    with open(source_before_path, 'r', encoding='utf-8-sig') as f:
        source_before = json.load(f)

    captured_at = source_before.get("capturedAt", "unknown")
    repositories = source_before.get("repositories", [])

    if not repositories:
        raise ValueError("source-before.json has no repositories array")

    inventory_repos = []
    anomalies: List[Dict[str, Any]] = []
    total_files = 0

    for repo in repositories:
        repo_name = _repo_name_from_root(repo["root"])
        subject_code = SUBJECT_MAP.get(repo_name, "unknown")
        head_commit = repo.get("headCommit", "unknown")
        dirty = repo.get("dirty", False)
        git_status_raw = repo.get("gitStatus", [])
        git_status_parsed = _parse_git_status(git_status_raw)
        files = repo.get("files", [])
        total_files += len(files)

        # Identify untracked files
        untracked_paths = _identify_untracked_files(repo, git_status_parsed)

        # Process files with classification
        classified_files = []
        year_files: Dict[int, Dict[str, list]] = defaultdict(
            lambda: defaultdict(list)
        )
        contamination_files = []
        unknown_files = []
        year_range_files = []

        # Track years found
        paper_years: Dict[int, list] = defaultdict(list)
        solution_years: Dict[int, list] = defaultdict(list)

        for finfo in files:
            path = finfo["relativePath"]
            classification = _classify_file(path)
            year = _extract_year(path)
            start_year, end_year = _extract_years_from_range(path)

            entry = {
                "relativePath": path,
                "length": finfo.get("length", 0),
                "sha256": finfo.get("sha256", ""),
                "lastWriteTimeUtc": finfo.get("lastWriteTimeUtc", ""),
                "classification": classification,
                "inferredYear": year,
                "isUntracked": path in untracked_paths,
            }
            if start_year is not None and end_year is not None:
                entry["yearRange"] = {"start": start_year, "end": end_year}
                year_range_files.append(entry)

            classified_files.append(entry)

            # Group by year. Anomaly classifications are collected
            # independently because contaminated paths may also contain years.
            if year is not None:
                year_files[year][classification].append(entry)
                if classification in ("paper_markdown", "paper_pdf"):
                    paper_years[year].append(path)
                if classification in ("solution_markdown", "solution_pdf"):
                    solution_years[year].append(path)

            if classification == "contamination":
                contamination_files.append(entry)
            elif classification == "unknown" and year is None:
                unknown_files.append(entry)

        # --- Anomaly detection for this repo ---

        # 1. Dirty repo
        if dirty:
            anomalies.append({
                "type": "dirty_repository",
                "severity": "warning",
                "subject": subject_code,
                "repository": repo_name,
                "detail": f"Repository has uncommitted changes or untracked files",
                "untrackedFiles": untracked_paths,
            })

        # 2. Untracked files (beyond git status)
        if untracked_paths:
            anomalies.append({
                "type": "untracked_files",
                "severity": "warning",
                "subject": subject_code,
                "repository": repo_name,
                "detail": f"{len(untracked_paths)} untracked file(s) not tracked by git",
                "files": untracked_paths,
            })

        # 3. Contamination directories
        if contamination_files:
            anomalies.append({
                "type": "contamination",
                "severity": "error",
                "subject": subject_code,
                "repository": repo_name,
                "detail": f"{len(contamination_files)} file(s) in contamination directory",
                "paths": [f["relativePath"] for f in contamination_files],
                "action": "isolate — do not include in question pipeline",
            })

        # 4. Missing years in expected range
        all_paper_years = set(paper_years.keys())
        if subject_code == "math1":
            missing_paper_years = EXPECTED_MATH1_YEARS - all_paper_years
            if missing_paper_years:
                anomalies.append({
                    "type": "missing_paper_years",
                    "severity": "warning",
                    "subject": subject_code,
                    "repository": repo_name,
                    "detail": f"Expected {len(EXPECTED_MATH1_YEARS)} paper years, "
                              f"found {len(all_paper_years)}, "
                              f"missing {len(missing_paper_years)}: "
                              f"{sorted(missing_paper_years)}",
                })
        elif subject_code == "math2":
            # Math2 has both individual years and merged 1987-2019
            missing_paper_years = EXPECTED_MATH2_YEARS - all_paper_years
            # Adjust for merged range
            has_merged = bool(year_range_files)
            if has_merged and missing_paper_years:
                anomalies.append({
                    "type": "missing_paper_years",
                    "severity": "info",
                    "subject": subject_code,
                    "repository": repo_name,
                    "detail": f"Individual paper years found: {sorted(all_paper_years)}. "
                              f"Years {sorted(missing_paper_years)} may be covered by "
                              f"merged file(s).",
                    "note": "math2_1987-2019 merged file requires year splitting",
                })

        # 5. Solutions without corresponding papers
        sol_only = set(solution_years.keys()) - set(paper_years.keys())
        sol_only.discard(0)  # Skip if year=0
        if sol_only:
            anomalies.append({
                "type": "solution_without_paper",
                "severity": "warning",
                "subject": subject_code,
                "repository": repo_name,
                "detail": f"Solutions exist for years with no papers: {sorted(sol_only)}",
                "action": "mark as missing_paper — do not synthesize questions",
            })

        # 6. Papers without solutions
        paper_only = set(paper_years.keys()) - set(solution_years.keys())
        paper_only.discard(0)
        if paper_only:
            anomalies.append({
                "type": "paper_without_solution",
                "severity": "warning",
                "subject": subject_code,
                "repository": repo_name,
                "detail": f"Papers exist for years with no solutions: {sorted(paper_only)}",
                "action": "questions can be staged but answer/solution status is missing",
            })

        # 7. Multiple versions for same year
        multi_version = {}
        for year, paths in paper_years.items():
            if len(paths) > 1:
                multi_version[year] = paths
        if multi_version:
            anomalies.append({
                "type": "multiple_paper_versions",
                "severity": "warning",
                "subject": subject_code,
                "repository": repo_name,
                "detail": f"Years with multiple paper versions: "
                          f"{dict(sorted(multi_version.items()))}",
                "action": "keep all candidates, generate diff, do not auto-select",
            })

        # 8. License check
        if subject_code == "math2":
            has_license = any(
                f["classification"] == "license_file"
                for f in classified_files
            )
            if not has_license:
                anomalies.append({
                    "type": "no_license",
                    "severity": "error",
                    "subject": subject_code,
                    "repository": repo_name,
                    "detail": "No LICENSE file found in repository root",
                    "action": "confirm authorization before public use",
                })
                KNOWN_RISK_PATTERNS["math2_no_license"]["detected_in_inventory"] = True
        else:
            has_license = any(
                f["classification"] == "license_file"
                for f in classified_files
            )
            if has_license:
                has_nc = False
                for f in classified_files:
                    if f["classification"] == "license_file":
                        # We could read content, but we don't access source directly
                        pass
                # The spec tells us math1 is CC BY-NC-SA 4.0
                anomalies.append({
                    "type": "license_note",
                    "severity": "info",
                    "subject": subject_code,
                    "repository": repo_name,
                    "detail": "LICENSE exists; spec states CC BY-NC-SA 4.0. "
                              "No default commercial use.",
                })

        # 9. Year range files (need splitting)
        if year_range_files:
            ranges = sorted({
                (
                    f["yearRange"]["start"],
                    f["yearRange"]["end"],
                )
                for f in year_range_files
            })
            anomalies.append({
                "type": "merged_year_range",
                "severity": "info",
                "subject": subject_code,
                "repository": repo_name,
                "detail": f"{len(year_range_files)} file(s) belong to merged "
                          f"year range(s): {ranges}",
                "paths": sorted(
                    f["relativePath"] for f in year_range_files
                )[:20],
                "totalFiles": len(year_range_files),
                "action": "must split by year before single-year processing",
            })

        # 10. Unknown files (can't classify)
        if unknown_files:
            anomalies.append({
                "type": "unclassified_files",
                "severity": "warning",
                "subject": subject_code,
                "repository": repo_name,
                "detail": f"{len(unknown_files)} file(s) could not be classified",
                "paths": [f["relativePath"] for f in unknown_files],
            })

        # Statistics
        classification_counts = Counter(
            f["classification"] for f in classified_files
        )
        ext_counts = Counter(
            f["relativePath"].rsplit('.', 1)[-1].lower()
            if '.' in f["relativePath"]
            else 'no_ext'
            for f in classified_files
        )

        repo_entry = {
            "sourceRepo": repo_name,
            "subjectCode": subject_code,
            "headCommit": head_commit,
            "dirty": dirty,
            "totalFiles": len(files),
            "capturedAt": captured_at,
            "paperYears": sorted(all_paper_years),
            "solutionYears": sorted(solution_years.keys()),
            "yearRangeFiles": [
                {
                    "relativePath": f["relativePath"],
                    "yearRange": f.get("yearRange"),
                }
                for f in year_range_files
            ],
            "untrackedFileCount": len(untracked_paths),
            "untrackedFiles": sorted(untracked_paths),
            "classificationBreakdown": dict(sorted(classification_counts.items())),
            "extensionBreakdown": dict(ext_counts.most_common()),
            "contaminationFileCount": len(contamination_files),
            "contaminationSamplePaths": sorted(
                f["relativePath"] for f in contamination_files
            )[:20],
            "files": sorted(classified_files, key=lambda x: x["relativePath"]),
        }
        inventory_repos.append(repo_entry)

    # Build known risks section
    known_risks = {}
    for key, info in KNOWN_RISK_PATTERNS.items():
        if info["detected_in_inventory"] or info.get("requires_content_scan", True):
            known_risks[key] = info

    source_snapshot_run_id = os.path.basename(
        os.path.dirname(os.path.abspath(source_before_path))
    )

    inventory = {
        "schemaVersion": "source-inventory-v1",
        "capturedAt": captured_at,
        "generatedAt": captured_at,  # Deterministic: use snapshot time
        "sourceSnapshot": {
            "runId": source_snapshot_run_id,
            "sourceBeforePath": os.path.basename(source_before_path),
        },
        "summary": {
            "totalRepositories": len(inventory_repos),
            "totalFiles": total_files,
            "totalAnomalies": len(anomalies),
            "subjects": list(dict.fromkeys(
                r["subjectCode"] for r in inventory_repos
            )),
        },
        "repositories": inventory_repos,
        "anomalies": sorted(anomalies, key=lambda a: (
            a.get("severity", "info"),
            a.get("type", ""),
        )),
        "knownRisksForContentScan": known_risks,
    }
    return inventory


# ---------------------------------------------------------------------------
# Anomaly report generation (Markdown)
# ---------------------------------------------------------------------------

def generate_anomaly_report(inventory: Dict) -> str:
    """Generate a human-readable Markdown anomaly report."""
    lines = []
    lines.append("# Source Inventory Anomaly Report\n")
    lines.append(f"**Generated**: {inventory['capturedAt']}")
    lines.append(f"**Source Snapshot Run ID**: "
                 f"{inventory['sourceSnapshot']['runId']}")
    lines.append(f"**Total Files**: {inventory['summary']['totalFiles']}")
    lines.append(f"**Total Anomalies**: {inventory['summary']['totalAnomalies']}")
    lines.append("")

    anomalies = inventory.get("anomalies", [])

    # Group by severity
    by_severity = defaultdict(list)
    for a in anomalies:
        sev = a.get("severity", "info")
        by_severity[sev].append(a)

    severity_order = ["error", "warning", "info"]

    for severity in severity_order:
        items = by_severity.get(severity, [])
        if not items:
            continue

        sev_label = {"error": "❌ Errors", "warning": "⚠️ Warnings", "info": "ℹ️ Info"}[severity]
        lines.append(f"## {sev_label}\n")

        for i, a in enumerate(items, 1):
            lines.append(f"### {i}. [{a['type']}] {a.get('subject', '')} — {a.get('repository', '')}")
            lines.append(f"- **Detail**: {a.get('detail', '')}")
            if a.get("action"):
                lines.append(f"- **Action Required**: {a['action']}")

            if a.get("files"):
                lines.append(f"- **Files**:")
                for f in a["files"]:
                    lines.append(f"  - `{f}`")
            if a.get("paths"):
                lines.append(f"- **Paths**:")
                for p in a["paths"]:
                    lines.append(f"  - `{p}`")
            if a.get("untrackedFiles"):
                lines.append(f"- **Untracked**:")
                for uf in a["untrackedFiles"]:
                    lines.append(f"  - `{uf}`")
            if a.get("note"):
                lines.append(f"- **Note**: {a['note']}")
            lines.append("")

    # Known risks for content scan
    known_risks = inventory.get("knownRisksForContentScan", {})
    if known_risks:
        lines.append("## 🔮 Known Risks Requiring Content Scan\n")
        lines.append("These issues cannot be detected from file metadata alone "
                     "— they require reading file content. "
                     "Listed as known risks for subsequent per-year processing.\n")
        for key, info in sorted(known_risks.items()):
            lines.append(f"- **{key}**: {info['description']}")
            lines.append(f"  - Detected in inventory: {info.get('detected_in_inventory', False)}")
            lines.append(f"  - Source: {info['source']}")
            lines.append(f"  - Requires content scan: {info.get('requires_content_scan', True)}")
            lines.append("")

    # Summary table
    lines.append("## Summary\n")
    lines.append("| Severity | Count |")
    lines.append("|----------|-------|")
    for severity in severity_order:
        lines.append(f"| {severity} | {len(by_severity.get(severity, []))} |")
    lines.append(f"| **Total** | **{len(anomalies)}** |")
    lines.append("")

    return "\n".join(lines)


# ---------------------------------------------------------------------------
# File size utilities
# ---------------------------------------------------------------------------

def _format_size(size_bytes: int) -> str:
    """Format bytes to human-readable string."""
    if size_bytes >= 1024 * 1024:
        return f"{size_bytes / (1024 * 1024):.1f} MB"
    if size_bytes >= 1024:
        return f"{size_bytes / 1024:.1f} KB"
    return f"{size_bytes} B"


# ---------------------------------------------------------------------------
# Main entry point
# ---------------------------------------------------------------------------

def main():
    if len(sys.argv) < 3:
        print(f"Usage: python {sys.argv[0]} <source-before.json> <output-dir>")
        sys.exit(1)

    source_before_path = sys.argv[1]
    output_dir = sys.argv[2]

    if not os.path.exists(source_before_path):
        print(f"Error: source-before.json not found at {source_before_path}")
        sys.exit(1)

    os.makedirs(output_dir, exist_ok=True)

    # Build inventory
    print(f"Reading {source_before_path} ...")
    inventory = build_inventory(source_before_path)

    # Write source-inventory.json
    inventory_path = os.path.join(output_dir, "source-inventory.json")
    with open(inventory_path, 'w', encoding='utf-8') as f:
        json.dump(inventory, f, ensure_ascii=False, indent=2, sort_keys=True)
    print(f"Wrote {inventory_path}")

    # Write anomaly report
    anomaly_path = os.path.join(output_dir, "source-anomalies.md")
    anomaly_report = generate_anomaly_report(inventory)
    with open(anomaly_path, 'w', encoding='utf-8') as f:
        f.write(anomaly_report)
    print(f"Wrote {anomaly_path}")

    # Summary
    summary = inventory["summary"]
    print(f"\nInventory complete:")
    print(f"  Repos: {summary['totalRepositories']}")
    print(f"  Files: {summary['totalFiles']}")
    print(f"  Anomalies: {summary['totalAnomalies']}")

    return inventory


if __name__ == "__main__":
    main()
