"""Create a deterministic read-only inventory of Math2 Markdown sources."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import subprocess
from collections import Counter
from pathlib import Path
from typing import Any


ANSWER_RE = re.compile(r"【答案】|答案[:：]|参考答案")
EXPLANATION_RE = re.compile(r"【解】|【解析】|解答[:：]")
IMAGE_RE = re.compile(r"!\[[^\]]*\]\(([^)]+)\)")
QUESTION_RE = re.compile(r"^\s*(?:#{1,6}\s*)?[（(]?\s*(\d{1,2})\s*[）).、]", re.M)


def git(root: Path, *args: str) -> str:
    result = subprocess.run(
        ["git", "-C", str(root), *args],
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        check=False,
    )
    return result.stdout.strip()


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(65536), b""):
            digest.update(chunk)
    return digest.hexdigest()


def git_state(root: Path, relative: str, tracked: set[str]) -> str:
    normalized = relative.replace("\\", "/")
    if normalized not in tracked:
        return "untracked"
    status = git(root, "status", "--porcelain=v1", "--", normalized)
    return "modified" if status else "tracked"


def markdown_record(root: Path, path: Path, tracked: set[str]) -> dict[str, Any]:
    relative = path.relative_to(root).as_posix()
    text = path.read_text(encoding="utf-8-sig")
    image_refs = IMAGE_RE.findall(text)
    image_details = []
    for reference in image_refs:
        remote = bool(re.match(r"^https?://", reference, re.I))
        image_details.append({
            "reference": reference,
            "kind": "remote" if remote else "relative",
            "exists": None if remote else (path.parent / reference).is_file(),
        })
    numbers = sorted({
        int(match.group(1))
        for match in QUESTION_RE.finditer(text)
        if 1 <= int(match.group(1)) <= 24
    })
    return {
        "relativePath": relative,
        "gitState": git_state(root, relative, tracked),
        "bytes": path.stat().st_size,
        "lines": len(text.splitlines()),
        "sha256": sha256(path),
        "answerMarkers": len(ANSWER_RE.findall(text)),
        "explanationMarkers": len(EXPLANATION_RE.findall(text)),
        "questionNumbers": numbers,
        "imageReferences": image_details,
    }


def build_inventory(root: Path) -> dict[str, Any]:
    tracked = {
        line.replace("\\", "/")
        for line in git(root, "ls-files").splitlines()
        if line
    }
    all_files = sorted(path for path in root.rglob("*") if path.is_file() and ".git" not in path.parts)
    extensions = Counter(path.suffix.lower() or "[none]" for path in all_files)
    markdown_paths = [
        path for path in all_files
        if path.suffix.lower() == ".md" and path.name.lower() != "readme.md"
    ]
    markdown = [markdown_record(root, path, tracked) for path in markdown_paths]
    by_path = {item["relativePath"]: item for item in markdown}

    pair_specs = [
        (
            "1987-2019",
            ["papers/MinerU_markdown_math2_1987-2019_2065686324641095680.md"],
            ["solutions/math2_1987-2019/math2_1987-2019.md"],
        ),
        *[
            (
                str(year),
                [f"papers/MinerU_markdown_math2_{year}_"
                 + {
                     2020: "2065687152877731840.md",
                     2021: "2065687851346780160.md",
                     2022: "2065687890395758592.md",
                     2023: "2065687933685170176.md",
                 }[year]],
                [f"solutions/{year}/math2_{year}/math2_{year}.md"],
            )
            for year in range(2020, 2024)
        ],
        ("2024", [], ["solutions/2024/math2_2024.md"]),
    ]
    pairings = []
    for years, papers, solutions in pair_specs:
        pairings.append({
            "years": years,
            "paperCandidates": [path for path in papers if path in by_path],
            "solutionPathCandidates": [path for path in solutions if path in by_path],
        })

    missing_relative_images = sum(
        image["kind"] == "relative" and image["exists"] is False
        for item in markdown
        for image in item["imageReferences"]
    )
    remote_images = sum(
        image["kind"] == "remote"
        for item in markdown
        for image in item["imageReferences"]
    )
    anomalies = [
        {
            "type": "untracked_primary_markdown",
            "severity": "warning",
            "count": sum(item["gitState"] == "untracked" for item in markdown),
            "message": "MinerU paper Markdown is not represented by the source commit alone.",
        },
        {
            "type": "solution_path_contains_paper_transcription",
            "severity": "error",
            "years": [2020, 2023, 2024],
            "message": "Files under solutions/ have question boundaries but no explicit answer or explanation markers.",
        },
        {
            "type": "wrong_subject_title",
            "severity": "error",
            "years": [2021],
            "message": "Both 2021 Markdown candidates identify the exam as Math3.",
        },
        {
            "type": "severe_ocr_boundary_risk",
            "severity": "error",
            "years": [2022],
            "message": "Ordinary question-marker scans do not recover all expected Q1-Q22 boundaries.",
        },
        {
            "type": "missing_paper_candidate",
            "severity": "error",
            "years": [2024],
            "message": "2024 has a paper-like Markdown only under solutions/.",
        },
        {
            "type": "historical_subject_mapping_required",
            "severity": "warning",
            "years": ["1987-1996"],
            "message": "Combined historical headings identify early exams as 试卷三; do not assume modern Math2 mapping.",
        },
    ]
    return {
        "schemaVersion": "math2-source-inventory-v1",
        "sourceRepository": {
            "path": str(root),
            "commit": git(root, "rev-parse", "HEAD"),
            "branch": git(root, "branch", "--show-current"),
            "dirty": bool(git(root, "status", "--porcelain=v1")),
        },
        "counts": {
            "totalFiles": len(all_files),
            "trackedFiles": len(tracked),
            "untrackedFiles": len(all_files) - len(tracked),
            "byExtension": dict(sorted(extensions.items())),
            "markdownFilesAudited": len(markdown),
            "remoteImageReferences": remote_images,
            "missingRelativeImageReferences": missing_relative_images,
        },
        "markdown": markdown,
        "pairings": pairings,
        "anomalies": anomalies,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("source_root", type=Path)
    parser.add_argument("output_path", type=Path)
    args = parser.parse_args()
    inventory = build_inventory(args.source_root.resolve())
    args.output_path.parent.mkdir(parents=True, exist_ok=True)
    args.output_path.write_text(
        json.dumps(inventory, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(
        f"Math2 inventory: {inventory['counts']['totalFiles']} files, "
        f"{inventory['counts']['markdownFilesAudited']} Markdown sources"
    )


if __name__ == "__main__":
    main()
