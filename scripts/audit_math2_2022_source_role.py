"""Audit Math2 2022 source-role staging safety without generating staging."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from scripts.audit_math2_2021_2022 import (
    CHOICE_NUMBERS,
    YEAR_SPECS,
    source_record,
    source_repo_state,
)


SCHEMA_VERSION = "math2-2022-source-role-staging-decision-v1"
REQUIREMENT = "docs/requirements/REQ-014-math2-2022-source-role-staging.md"
REPORT_DIR = "content/reports/req-014-math2-2022-source-role-staging"
SOURCE_YEAR = 2022
EXPECTED_COUNTS = {
    "multiple_choice": 10,
    "fill_in_blank": 6,
    "solution": 6,
}
HARD_BLOCKED_QUESTIONS = [5, 7, 10]


def source_by_role(records: list[dict[str, Any]]) -> dict[str, dict[str, Any]]:
    return {item["role"]: item for item in records}


def incomplete_by_question(source: dict[str, Any]) -> dict[int, dict[str, Any]]:
    return {
        item["questionNumber"]: item
        for item in source["choiceOptionScan"]["incompleteChoiceQuestions"]
    }


def complete_choice_numbers(source: dict[str, Any]) -> set[int]:
    return set(source["choiceOptionScan"]["completeChoiceQuestions"])


def build_choice_matrix(records: list[dict[str, Any]]) -> list[dict[str, Any]]:
    rows = []
    complete_by_role = {
        item["role"]: complete_choice_numbers(item)
        for item in records
    }
    incomplete_by_role = {
        item["role"]: incomplete_by_question(item)
        for item in records
    }
    for number in CHOICE_NUMBERS:
        source_states = []
        complete_roles = []
        for source in records:
            role = source["role"]
            if number in complete_by_role[role]:
                status = "complete"
                missing_labels: list[str] = []
                empty_labels: list[str] = []
                complete_roles.append(role)
            else:
                item = incomplete_by_role[role].get(number, {})
                status = item.get("status", "not_scanned")
                missing_labels = item.get("missingLabels", [])
                empty_labels = item.get("emptyLabels", [])
            source_states.append({
                "role": role,
                "status": status,
                "missingLabels": missing_labels,
                "emptyLabels": empty_labels,
            })
        rows.append({
            "questionNumber": number,
            "completeRoles": complete_roles,
            "safeWithoutInvention": bool(complete_roles),
            "sourceStates": source_states,
        })
    return rows


def hard_blockers(choice_matrix: list[dict[str, Any]]) -> list[dict[str, Any]]:
    blockers = []
    for row in choice_matrix:
        number = row["questionNumber"]
        if number not in HARD_BLOCKED_QUESTIONS:
            continue
        states = []
        for state in row["sourceStates"]:
            details = []
            if state["missingLabels"]:
                details.append("missing " + ",".join(state["missingLabels"]))
            if state["emptyLabels"]:
                details.append("empty " + ",".join(state["emptyLabels"]))
            if not details:
                details.append(state["status"])
            states.append(f"{state['role']}: {', '.join(details)}")
        blockers.append({
            "questionNumber": number,
            "type": "choice_options_not_recoverable_without_invention",
            "severity": "critical",
            "message": (
                f"Q{number} has no candidate with complete A-D option values; "
                + "; ".join(states)
            ),
        })
    return blockers


def build_report(source_root: Path) -> dict[str, Any]:
    spec = YEAR_SPECS[SOURCE_YEAR]
    records = [
        source_record(source_root, source_spec, spec["expectedSubjectCode"])
        for source_spec in spec["sources"]
    ]
    matrix = build_choice_matrix(records)
    blockers = hard_blockers(matrix)
    roles = source_by_role(records)
    paper = roles["paper_candidate"]
    solutions = roles["solutions_candidate"]

    return {
        "schemaVersion": SCHEMA_VERSION,
        "requirement": REQUIREMENT,
        "reportDirectory": REPORT_DIR,
        "sourceRepository": source_repo_state(source_root),
        "year": SOURCE_YEAR,
        "expectedQuestionCounts": EXPECTED_COUNTS,
        "sources": records,
        "choiceMatrix": matrix,
        "sourceRoleDecision": {
            "status": "blocked_no_invention_staging_not_safe",
            "stagingReady": False,
            "decision": "do_not_generate_2022_staging_in_req_014",
            "reason": (
                "No source-role combination can provide schema-valid Q1-Q10 "
                "multiple-choice options without inventing missing option values."
            ),
            "candidateUseIfUnblocked": {
                "primaryQuestionEvidence": paper["relativePath"],
                "comparisonQuestionEvidence": solutions["relativePath"],
                "answerExplanationEvidence": "not_promoted_in_req_014",
            },
        },
        "hardBlockers": blockers,
        "minimumUnblockRequest": [
            "Provide approved source-visible A-D option text for Q5 and Q10.",
            "Approve a Q7 boundary-repair rule or provide cleaner source/PDF evidence for Q7.",
            "Keep any supplied answers/explanations as explicit source evidence in a later promotion task.",
        ],
        "nonStagingDecision": {
            "questionsJsonWritten": False,
            "reason": (
                "Writing content/staging/math2/2022/questions.json would require "
                "empty or invented option values for at least Q5, Q7, and Q10."
            ),
        },
    }


def source_table(records: list[dict[str, Any]]) -> list[str]:
    rows = [
        "| Role | Path | Git state | Bytes | Lines | SHA-256 | Boundaries missing | Incomplete choice Qs | Answers | Explanations |",
        "|---|---|---|---:|---:|---|---|---|---:|---:|",
    ]
    for source in records:
        missing = source["boundaryScans"]["fallbackNumeric"]["missingExpectedNumbers"]
        incomplete = [
            item["questionNumber"]
            for item in source["choiceOptionScan"]["incompleteChoiceQuestions"]
        ]
        rows.append(
            "| "
            + " | ".join([
                source["role"],
                f"`{source['relativePath']}`",
                source["gitState"],
                str(source["bytes"]),
                str(source["lines"]),
                f"`{source['sha256']}`",
                str(missing),
                str(incomplete),
                str(source["answerMarkers"]),
                str(source["explanationMarkers"]),
            ])
            + " |"
        )
    return rows


def choice_table(matrix: list[dict[str, Any]]) -> list[str]:
    rows = [
        "| Q | Safe without invention | Complete roles | Source states |",
        "|---:|---|---|---|",
    ]
    for row in matrix:
        states = []
        for state in row["sourceStates"]:
            details = []
            if state["missingLabels"]:
                details.append("missing " + ",".join(state["missingLabels"]))
            if state["emptyLabels"]:
                details.append("empty " + ",".join(state["emptyLabels"]))
            if not details:
                details.append(state["status"])
            states.append(f"{state['role']} ({', '.join(details)})")
        rows.append(
            "| "
            + " | ".join([
                str(row["questionNumber"]),
                str(row["safeWithoutInvention"]).lower(),
                ", ".join(row["completeRoles"]) or "-",
                "; ".join(states),
            ])
            + " |"
        )
    return rows


def write_outputs(report_dir: Path, report: dict[str, Any]) -> None:
    report_dir.mkdir(parents=True, exist_ok=True)
    (report_dir / "source-scan.json").write_text(
        json.dumps(report, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    blockers = report["hardBlockers"]
    blocker_rows = [
        f"- Q{item['questionNumber']}: {item['message']}"
        for item in blockers
    ]
    lines = [
        "# Math2 2022 Source-Role Staging Blocker Report",
        "",
        f"- Requirement: `{REQUIREMENT}`",
        "- Status: `blocked_no_invention_staging_not_safe`",
        "- Staging generated: false",
        "- Decision: do not write `content/staging/math2/2022/questions.json` in REQ-014.",
        "",
        "## Source Repository",
        "",
        f"- Branch: `{report['sourceRepository']['branch']}`",
        f"- Commit: `{report['sourceRepository']['commit']}`",
        f"- Dirty: `{str(report['sourceRepository']['dirty']).lower()}`",
        "- Dirty state:",
        *[f"  - `{item}`" for item in report["sourceRepository"]["dirtyState"]],
        "",
        "## Source Files",
        "",
        *source_table(report["sources"]),
        "",
        "## Choice Option Matrix",
        "",
        *choice_table(report["choiceMatrix"]),
        "",
        "## Hard Blockers",
        "",
        *blocker_rows,
        "",
        "## Minimum Unblock Request",
        "",
        *[f"- {item}" for item in report["minimumUnblockRequest"]],
        "",
        "## Boundary",
        "",
        "- No live database dry-run or import was run.",
        "- No source file under `D:\\work\\Kaoyan-Math2-Papers` was edited.",
        "- No answers, explanations, options, formulas, or OCR repairs were invented.",
        "",
    ]
    (report_dir / "blocker-report.md").write_text("\n".join(lines), encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("source_root", type=Path)
    parser.add_argument("report_dir", type=Path)
    args = parser.parse_args()
    report = build_report(args.source_root.resolve())
    write_outputs(args.report_dir.resolve(), report)
    print(
        "Math2 2022 source-role staging: "
        f"{report['sourceRoleDecision']['status']}; "
        f"hardBlockers={len(report['hardBlockers'])}"
    )
    if report["sourceRoleDecision"]["stagingReady"]:
        raise SystemExit(3)


if __name__ == "__main__":
    main()
