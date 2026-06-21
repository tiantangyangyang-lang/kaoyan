"""Generate a conservative local yearly review package from staging artifacts."""

import argparse
import json
from collections import Counter, OrderedDict, defaultdict
from datetime import datetime, timezone
from pathlib import Path


SCHEMA_VERSION = "review-v1"


def load_json(path):
    return json.loads(Path(path).read_text(encoding="utf-8-sig"))


def derive_source_info(questions):
    first = questions[0]
    hashes = first.get("sourceFileHashes", {})
    paths = first.get("sourceRelativePaths", [])
    return OrderedDict([
        ("sourceRepo", first.get("sourceRepo")),
        ("sourceCommit", first.get("sourceCommit")),
        ("paperRelativePath", paths[0] if len(paths) > 0 else None),
        ("paperSha256", hashes.get("paper")),
        ("solutionsRelativePath", paths[1] if len(paths) > 1 else None),
        ("solutionsSha256", hashes.get("solutions")),
        ("stagingGeneratedAt", None),
    ])


def anomaly_lookup(anomalies):
    by_question = defaultdict(list)
    for item in anomalies:
        number = item.get("questionNumber")
        if number is not None:
            by_question[int(number)].append(item)
    return by_question


def make_uncertainties(question, question_anomalies):
    items = []
    for anomaly in question_anomalies:
        items.append(OrderedDict([
            ("item", anomaly.get("type", "anomaly")),
            ("detail", anomaly.get("message", "")),
            ("severity", anomaly.get("severity", "warning")),
        ]))

    if question.get("answerStatus") == "missing" and question.get("questionType") == "solution":
        items.append(OrderedDict([
            ("item", "missing_answer_for_solution_type"),
            ("detail", "解答题 answerCandidate 为空属于结构性预期；人工审核时决定是否补充简短答案字段。"),
            ("severity", "info"),
        ]))

    return items


def make_topics(question):
    kind = question.get("questionType")
    if kind == "multiple_choice":
        return [OrderedDict([
            ("topic", "选择题待人工标注"),
            ("confidence", "low"),
            ("evidence", "本地兜底模式未做语义判题，仅保留结构化候选内容。"),
        ])]
    if kind == "fill_in_blank":
        return [OrderedDict([
            ("topic", "填空题待人工标注"),
            ("confidence", "low"),
            ("evidence", "本地兜底模式未做语义判题，仅保留结构化候选内容。"),
        ])]
    return [OrderedDict([
        ("topic", "解答题待人工标注"),
        ("confidence", "low"),
        ("evidence", "本地兜底模式未做语义判题，仅保留结构化候选内容。"),
    ])]


def make_human_focus(question, question_anomalies):
    focus = []
    for anomaly in question_anomalies:
        focus.append(f"确认 {anomaly.get('type')}: {anomaly.get('message')}")
    if question.get("questionType") == "solution" and question.get("answerStatus") == "missing":
        focus.append("确认是否需要从解析中提取简短 answerCandidate。")
    if not focus:
        focus.append("逐题对照 PDF/原始 Markdown 确认题干、答案与解析。")
    return focus


def build_reviews(questions, anomalies_by_question):
    reviews = []
    for question in questions:
        number = int(question["questionNumber"])
        question_anomalies = anomalies_by_question.get(number, [])
        reviews.append(OrderedDict([
            ("stableId", question["stableId"]),
            ("candidateResult", OrderedDict([
                ("questionNumber", number),
                ("questionType", question["questionType"]),
                ("reviewStatus", "needs_human_review"),
                ("stem", question["stem"]),
                ("options", question["options"]),
                ("answerCandidate", question["answerCandidate"]),
                ("answerStatus", question["answerStatus"]),
                ("explanationCandidate", question["explanationCandidate"]),
                ("explanationStatus", question["explanationStatus"]),
                ("anomalies", question.get("anomalies", [])),
            ])),
            ("semanticReview", OrderedDict([
                ("modifications", []),
                ("uncertainties", make_uncertainties(question, question_anomalies)),
                ("conflicts", []),
                ("suggestedTopics", make_topics(question)),
                ("confidence", "low"),
                ("humanReviewFocus", make_human_focus(question, question_anomalies)),
            ])),
            ("reviewStatus", "needs_human_review"),
        ]))
    return reviews


def build_questions_reviewed(year, questions, anomalies):
    by_type = Counter(question["questionType"] for question in questions)
    anomalies_by_question = anomaly_lookup(anomalies)
    reviews = build_reviews(questions, anomalies_by_question)
    return OrderedDict([
        ("schemaVersion", SCHEMA_VERSION),
        ("task", f"local-math1-{year}-review-fallback"),
        ("runId", f"local-fallback-{year}-{datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')}"),
        ("generatedAt", datetime.now(timezone.utc).astimezone().isoformat()),
        ("sourceInfo", derive_source_info(questions)),
        ("summary", OrderedDict([
            ("totalQuestions", len(questions)),
            ("multipleChoice", by_type.get("multiple_choice", 0)),
            ("fillInBlank", by_type.get("fill_in_blank", 0)),
            ("solution", by_type.get("solution", 0)),
            ("anomaliesConfirmed", len(anomalies)),
            ("newAnomaliesDetected", 0),
            ("allNeedsHumanReview", True),
        ])),
        ("reviews", reviews),
    ])


def build_anomalies_reviewed(year, questions, anomalies):
    source = questions[0]
    counts = Counter(item.get("severity", "warning") for item in anomalies)
    return OrderedDict([
        ("schemaVersion", "math1-local-anomalies-v1"),
        ("batchId", f"local-fallback-{year}"),
        ("sourceYear", year),
        ("subjectCode", "math1"),
        ("sourceRepo", source.get("sourceRepo")),
        ("sourceCommit", source.get("sourceCommit")),
        ("sourceDirty", source.get("sourceDirty")),
        ("reviewTimestamp", datetime.now(timezone.utc).isoformat()),
        ("reviewStatus", "needs_human_review"),
        ("anomalies", anomalies),
        ("summary", OrderedDict([
            ("totalAnomalies", len(anomalies)),
            ("bySeverity", OrderedDict([
                ("error", counts.get("error", 0)),
                ("warning", counts.get("warning", 0)),
                ("info", counts.get("info", 0)),
            ])),
            ("blockingIssues", [
                f"{item.get('stableId', f'math1-{year}-q{int(item.get('questionNumber', 0)):02d}')}: {item.get('message')}"
                for item in anomalies if item.get("severity") == "error"
            ]),
            ("pdfVerification", "not_run"),
        ])),
    ])


def build_checklist(year, anomalies):
    grouped = defaultdict(list)
    for item in anomalies:
        grouped[item.get("severity", "warning")].append(item)
    lines = [
        f"# 数学一 {year} 人工审核清单",
        "",
        f"> 生成方式: `local fallback`",
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
            stable_id = item.get("stableId")
            if not stable_id and item.get("questionNumber") is not None:
                stable_id = f"math1-{year}-q{int(item['questionNumber']):02d}"
            lines.append(f"- `{stable_id}`: {item.get('message', '')}")
        lines.append("")
    lines.extend([
        "## 审核要求",
        "",
        "- 本地兜底模式未做深度数学语义判断，只保留结构和已知异常。",
        "- 逐题对照 PDF/原始 Markdown 确认题干、选项、答案、解析和知识点。",
        "- 在未逐页核对 PDF 前，保持 `pdfEvidence.status = not_run` 的解释口径。",
        "",
    ])
    return "\n".join(lines) + "\n"


def build_conflicts_report(year, anomalies):
    lines = [
        f"# Math1 {year} — Local Fallback Conflicts and Uncertainties",
        "",
        f"本报告由本地兜底脚本生成。当前仅基于 staging 与已知 anomalies 汇总，不包含新的 PDF 视觉核验。",
        "",
        "## 已知异常",
        "",
    ]
    if not anomalies:
        lines.append("- 无已知 anomalies。")
    else:
        for item in anomalies:
            stable_id = item.get("stableId")
            if not stable_id and item.get("questionNumber") is not None:
                stable_id = f"math1-{year}-q{int(item['questionNumber']):02d}"
            lines.append(f"- `{stable_id}` [{item.get('severity', 'warning')}]: {item.get('message', '')}")
    lines.extend([
        "",
        "## 限制",
        "",
        "- 未读取 PDF 页面。",
        "- 未新增数学正确性判断。",
        "- 未自动修复任何题干、选项或解析内容。",
        "",
    ])
    return "\n".join(lines) + "\n"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("year", type=int)
    parser.add_argument("staging_questions", type=Path)
    parser.add_argument("staging_anomalies", type=Path)
    parser.add_argument("output_review", type=Path)
    parser.add_argument("output_anomalies", type=Path)
    parser.add_argument("output_checklist", type=Path)
    parser.add_argument("output_conflicts", type=Path)
    args = parser.parse_args()

    questions_payload = load_json(args.staging_questions)
    anomalies_payload = load_json(args.staging_anomalies)
    questions = questions_payload["questions"]
    anomalies = anomalies_payload.get("anomalies", [])

    review_payload = build_questions_reviewed(args.year, questions, anomalies)
    anomalies_reviewed = build_anomalies_reviewed(args.year, questions, anomalies)
    checklist = build_checklist(args.year, anomalies)
    conflicts = build_conflicts_report(args.year, anomalies)

    args.output_review.parent.mkdir(parents=True, exist_ok=True)
    args.output_anomalies.parent.mkdir(parents=True, exist_ok=True)
    args.output_checklist.parent.mkdir(parents=True, exist_ok=True)
    args.output_conflicts.parent.mkdir(parents=True, exist_ok=True)

    args.output_review.write_text(json.dumps(review_payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    args.output_anomalies.write_text(json.dumps(anomalies_reviewed, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    args.output_checklist.write_text(checklist, encoding="utf-8")
    args.output_conflicts.write_text(conflicts, encoding="utf-8")
    print(f"Local fallback generated Math1 {args.year}: {len(questions)} questions")


if __name__ == "__main__":
    main()
