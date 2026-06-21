"""Normalize legacy Math1 yearly semantic-review output into canonical artifacts."""

import argparse
import json
from collections import Counter, OrderedDict, defaultdict
from datetime import datetime, timezone
from pathlib import Path


def load_json(path):
    return json.loads(Path(path).read_text(encoding="utf-8-sig"))


def map_uncertainties(semantic_review):
    entries = []
    for bucket in ("ocrNoise", "formulaIssues", "structuralIssues"):
        for item in semantic_review.get(bucket, []):
            entries.append(OrderedDict([
                ("item", item.get("type", bucket)),
                ("detail", item.get("detail", "")),
                ("severity", item.get("severity", "info")),
            ]))
    return entries


def map_conflicts(semantic_review):
    conflicts = []
    for item in semantic_review.get("paperSolutionConflicts", []):
        conflicts.append(OrderedDict([
            ("type", item.get("type", "paper_solution_conflict")),
            ("description", item.get("detail", "")),
            ("severity", item.get("severity", "warning")),
        ]))
    return conflicts


def map_topics(semantic_review):
    topics = []
    for item in semantic_review.get("knowledgePointCandidates", []):
        topics.append(OrderedDict([
            ("topic", item.get("topic", "")),
            ("confidence", item.get("confidence", "medium")),
            ("evidence", item.get("evidence", "")),
        ]))
    return topics


def build_review_payload(legacy_review, anomalies_payload, year):
    source_info = legacy_review.get("sourceInfo", {})
    anomaly_summary = (anomalies_payload or {}).get("summary", {})
    reviews = []
    for item in legacy_review["reviews"]:
        candidate = item["candidateResult"]
        semantic = item["semanticReview"]
        reviews.append(OrderedDict([
            ("stableId", item["stableId"]),
            ("candidateResult", OrderedDict([
                ("questionNumber", item["questionNumber"]),
                ("questionType", item["questionType"]),
                ("reviewStatus", "needs_human_review"),
                ("stem", candidate["stem"]),
                ("options", candidate["options"]),
                ("answerCandidate", candidate["answerCandidate"]),
                ("answerStatus", candidate["answerStatus"]),
                ("explanationCandidate", candidate["explanationCandidate"]),
                ("explanationStatus", candidate["explanationStatus"]),
                ("anomalies", candidate.get("anomalies", [])),
            ])),
            ("semanticReview", OrderedDict([
                ("modifications", []),
                ("uncertainties", map_uncertainties(semantic)),
                ("conflicts", map_conflicts(semantic)),
                ("suggestedTopics", map_topics(semantic)),
                ("confidence", semantic.get("confidence", "medium")),
                ("humanReviewFocus", semantic.get("humanReviewFocus", [])),
            ])),
            ("reviewStatus", "needs_human_review"),
        ]))

    by_type = Counter(item["questionType"] for item in legacy_review["reviews"])
    summary = OrderedDict([
        ("totalQuestions", len(legacy_review["reviews"])),
        ("multipleChoice", by_type.get("multiple_choice", 0)),
        ("fillInBlank", by_type.get("fill_in_blank", 0)),
        ("solution", by_type.get("solution", 0)),
        ("anomaliesConfirmed", anomaly_summary.get("totalAnomalies", 0)),
        ("newAnomaliesDetected", 0),
        ("allNeedsHumanReview", True),
    ])

    return OrderedDict([
        ("schemaVersion", "review-v1"),
        ("task", f"ds-math1-{year}-recovery"),
        ("runId", f"{legacy_review['runId']}-recovered"),
        ("generatedAt", datetime.now(timezone.utc).astimezone().isoformat()),
        ("sourceInfo", OrderedDict([
            ("sourceRepo", source_info.get("sourceRepo") or legacy_review.get("sourceRepo")),
            ("sourceCommit", source_info.get("sourceCommit") or legacy_review.get("sourceCommit")),
            ("paperRelativePath", source_info.get("paperRelativePath")),
            ("paperSha256", source_info.get("paperSha256")),
            ("solutionsRelativePath", source_info.get("solutionsRelativePath")),
            ("solutionsSha256", source_info.get("solutionsSha256")),
            ("legacyRunId", legacy_review.get("runId")),
        ])),
        ("summary", summary),
        ("reviews", reviews),
    ])


def build_checklist(review_payload, anomalies_payload, year, conflicts_report_path):
    anomalies = (anomalies_payload or {}).get("anomalies", [])
    grouped = defaultdict(list)
    for item in anomalies:
        grouped[item.get("severity", "info")].append(item)

    lines = [
        f"# 数学一 {year} 人工审核清单",
        "",
        f"> 修复来源: `{review_payload['sourceInfo']['legacyRunId']}`",
        f"> 标准化产物: `content/review/math1/{year}/questions-reviewed.json`",
        "> 所有题目状态: `needs_human_review`",
        "",
        "## 优先级",
        "",
        f"- P0: {len(grouped['error'])} 项",
        f"- P1: {len(grouped['warning'])} 项",
        f"- P2: {len(grouped['info'])} 项",
        "",
    ]

    for title, severity in (("P0（必须先处理）", "error"), ("P1（建议本轮处理）", "warning"), ("P2（可顺手处理）", "info")):
        lines.append(f"## {title}")
        lines.append("")
        if not grouped[severity]:
            lines.append("- 无")
            lines.append("")
            continue
        for item in grouped[severity]:
            question = item.get("stableId") or f"q{item.get('questionNumber', '?')}"
            lines.append(f"- `{question}`: {item.get('message', '')}")
        lines.append("")

    lines.extend([
        "## 审核要求",
        "",
        "- 逐题保持 `candidateResult` 原文不变，只记录人工确认与修订建议。",
        "- 涉及 PDF 的项在未逐页核对前，继续保持 `pdfEvidence.status = not_run`。",
        f"- 冲突与不确定项详见 `{conflicts_report_path}`。",
        "",
    ])

    return "\n".join(lines) + "\n"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("year", type=int)
    parser.add_argument("legacy_review", type=Path)
    parser.add_argument("anomalies", type=Path)
    parser.add_argument("output_review", type=Path)
    parser.add_argument("output_checklist", type=Path)
    parser.add_argument("--conflicts-report-path", default="")
    args = parser.parse_args()

    legacy_review = load_json(args.legacy_review)
    anomalies_payload = load_json(args.anomalies)
    review_payload = build_review_payload(legacy_review, anomalies_payload, args.year)
    checklist = build_checklist(
        review_payload,
        anomalies_payload,
        args.year,
        args.conflicts_report_path or f"content/reports/math1-{args.year}/conflicts-and-uncertainties.md",
    )

    args.output_review.parent.mkdir(parents=True, exist_ok=True)
    args.output_checklist.parent.mkdir(parents=True, exist_ok=True)
    args.output_review.write_text(
        json.dumps(review_payload, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    args.output_checklist.write_text(checklist, encoding="utf-8")
    print(
        f"Recovered Math1 {args.year}: "
        f"{len(review_payload['reviews'])} reviews -> {args.output_review}"
    )


if __name__ == "__main__":
    main()
