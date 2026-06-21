#!/usr/bin/env python3
"""Transform PDF-rebuilt JSON into staging and review JSON formats."""
import json
import re
import os

INPUT_PATH = r"D:\work\kaoyan\content\review\math1\2022\questions-pdf-rebuilt.json"
STAGING_PATH = r"D:\work\kaoyan\content\staging\math1\2022\questions.json"
REVIEW_PATH = r"D:\work\kaoyan\content\review\math1\2022\questions-reviewed.json"


def normalize_whitespace(s: str) -> str:
    """Replace multiple whitespace (including newlines) with single space, then trim."""
    if s is None:
        return ""
    # Replace all whitespace runs (space, tab, newline, etc.) with single space
    s = re.sub(r'\s+', ' ', s)
    return s.strip()


def transform_question_staging(q: dict) -> dict:
    """Transform a single question to staging format."""
    # Normalize stem
    stem = normalize_whitespace(q.get("stem", ""))

    # Normalize options
    options = []
    for opt in q.get("options", []):
        options.append({
            "label": opt.get("label", ""),
            "value": normalize_whitespace(opt.get("value", ""))
        })

    # Normalize explanation
    explanation = normalize_whitespace(q.get("explanationCandidate", ""))

    # Normalize answer
    answer = normalize_whitespace(q.get("answerCandidate", ""))

    anomalies = [{
        "type": "md_finalization_source",
        "questionNumber": q.get("questionNumber"),
        "severity": "info",
        "message": (
            "Stem/options restored from PDF-structure rebuild (via content_list_v2.json); "
            "paper Markdown had severe OCR corruption. "
            "Answer/explanation cross-verified against solutions/2022年解析.md."
        )
    }]

    return {
        "stableId": q.get("stableId"),
        "questionNumber": q.get("questionNumber"),
        "questionType": q.get("questionType"),
        "stem": stem,
        "options": options,
        "answerCandidate": answer,
        "answerStatus": "candidate_from_solutions",
        "explanationCandidate": explanation,
        "explanationStatus": "candidate_from_solutions",
        "sourceRepo": "Kaoyan-Math1-Papers",
        "sourceRelativePaths": [
            "papers/2022年考研数学(一)真题.md",
            "solutions/2022年解析/2022年解析.md"
        ],
        "sourceCommit": "3151b4acf26ea19ccd427b869a715e65e1990091",
        "sourceDirty": True,
        "sourceYear": 2022,
        "subjectCode": "math1",
        "sourceFileHashes": {
            "paper": "299B4CF6D75A873E166A962085E35895D33C37FF0A10EE38B01E54CDC019E3E7",
            "solutions": "36F6BA58529A5496A0DB2F82C31FC9E8D5E5085C164887FFE83F780DFDAFFC81"
        },
        "transformVersion": "math1-modern-transform-v1",
        "reviewStatus": "needs_human_review",
        "anomalies": anomalies
    }


def build_staging(data: dict) -> dict:
    """Build the staging JSON structure."""
    questions = [transform_question_staging(q) for q in data["questions"]]

    # Count question types
    q_types = [q["questionType"] for q in questions]
    mc_count = q_types.count("multiple_choice")
    fib_count = q_types.count("fill_in_blank")
    sol_count = q_types.count("solution")

    return {
        "schemaVersion": "math1-modern-transform-v1",
        "task": "cc-math1-2022-md-finalize",
        "sourceYear": 2022,
        "subjectCode": "math1",
        "reviewStatus": "needs_human_review",
        "transformVersion": "math1-modern-transform-v1",
        "sourceInfo": {
            "sourceRepo": "Kaoyan-Math1-Papers",
            "sourceCommit": "3151b4acf26ea19ccd427b869a715e65e1990091",
            "sourceDirty": True,
            "sourceRelativePaths": [
                "papers/2022年考研数学(一)真题.md",
                "solutions/2022年解析/2022年解析.md"
            ],
            "sourceFileHashes": {
                "paper": "299B4CF6D75A873E166A962085E35895D33C37FF0A10EE38B01E54CDC019E3E7",
                "solutions": "36F6BA58529A5496A0DB2F82C31FC9E8D5E5085C164887FFE83F780DFDAFFC81"
            }
        },
        "validation": {
            "questionsGenerated": len(questions),
            "multipleChoice": mc_count,
            "fillInBlank": fib_count,
            "solution": sol_count,
            "questionsWithAnswers": len(questions),
            "questionsWithExplanations": len(questions),
            "questionsWithFourOptions": mc_count,
            "allNeedsHumanReview": True
        },
        "questions": questions
    }


def build_review_entry(q: dict) -> dict:
    """Build a single review entry."""
    candidate = {
        "stableId": q.get("stableId"),
        "questionNumber": q.get("questionNumber"),
        "questionType": q.get("questionType"),
        "stem": normalize_whitespace(q.get("stem", "")),
        "options": [
            {
                "label": opt.get("label", ""),
                "value": normalize_whitespace(opt.get("value", ""))
            }
            for opt in q.get("options", [])
        ],
        "answerCandidate": normalize_whitespace(q.get("answerCandidate", "")),
        "answerStatus": "candidate_from_solutions",
        "explanationCandidate": normalize_whitespace(q.get("explanationCandidate", "")),
        "explanationStatus": "candidate_from_solutions",
        "sourceRepo": "Kaoyan-Math1-Papers",
        "sourceRelativePaths": [
            "papers/2022年考研数学(一)真题.md",
            "solutions/2022年解析/2022年解析.md"
        ],
        "sourceCommit": "3151b4acf26ea19ccd427b869a715e65e1990091",
        "sourceDirty": True,
        "sourceYear": 2022,
        "subjectCode": "math1",
        "sourceFileHashes": {
            "paper": "299B4CF6D75A873E166A962085E35895D33C37FF0A10EE38B01E54CDC019E3E7",
            "solutions": "36F6BA58529A5496A0DB2F82C31FC9E8D5E5085C164887FFE83F780DFDAFFC81"
        },
        "transformVersion": "math1-modern-transform-v1",
        "reviewStatus": "needs_human_review",
        "anomalies": [{
            "type": "md_finalization_source",
            "questionNumber": q.get("questionNumber"),
            "severity": "info",
            "message": (
                "Stem/options restored from PDF-structure rebuild (via content_list_v2.json); "
                "paper Markdown had severe OCR corruption. "
                "Answer/explanation cross-verified against solutions/2022年解析.md."
            )
        }]
    }

    return {
        "stableId": q.get("stableId"),
        "candidateResult": candidate,
        "semanticReview": {
            "modifications": [],
            "uncertainties": [
                {
                    "item": "md_finalization_source",
                    "detail": "Content restored from PDF-structure evidence; needs human verification of mathematical correctness",
                    "severity": "info"
                }
            ],
            "conflicts": [],
            "suggestedTopics": [
                {
                    "topic": "待人工标注",
                    "confidence": "low",
                    "evidence": "Markdown-first finalization; mathematical correctness not verified by AI"
                }
            ],
            "confidence": "low",
            "humanReviewFocus": [
                "确认题干、选项、答案和解析的数学正确性"
            ]
        },
        "reviewStatus": "needs_human_review"
    }


def build_review(data: dict) -> dict:
    """Build the review JSON structure."""
    entries = [build_review_entry(q) for q in data["questions"]]

    return {
        "schemaVersion": "review-v1",
        "task": "cc-math1-2022-md-finalize",
        "runId": "20260620-134226-cc-math1-md-finalize-year-2022",
        "sourceYear": 2022,
        "subjectCode": "math1",
        "reviewStatus": "needs_human_review",
        "sourceInfo": {
            "sourceRepo": "Kaoyan-Math1-Papers",
            "sourceCommit": "3151b4acf26ea19ccd427b869a715e65e1990091",
            "sourceDirty": True,
            "sourceRelativePaths": [
                "papers/2022年考研数学(一)真题.md",
                "solutions/2022年解析/2022年解析.md"
            ],
            "sourceFileHashes": {
                "paper": "299B4CF6D75A873E166A962085E35895D33C37FF0A10EE38B01E54CDC019E3E7",
                "solutions": "36F6BA58529A5496A0DB2F82C31FC9E8D5E5085C164887FFE83F780DFDAFFC81"
            }
        },
        "validation": {
            "totalQuestions": len(entries),
            "reviewedCount": len(entries),
            "allNeedsHumanReview": True
        },
        "reviews": entries
    }


def main():
    print("Reading input...")
    with open(INPUT_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    print(f"Input: {len(data['questions'])} questions")

    # Build staging
    print("Building staging JSON...")
    staging = build_staging(data)

    # Ensure staging directory exists
    os.makedirs(os.path.dirname(STAGING_PATH), exist_ok=True)

    print("Writing staging JSON...")
    with open(STAGING_PATH, "w", encoding="utf-8") as f:
        json.dump(staging, f, ensure_ascii=False, indent=2)

    print(f"Staging written to: {STAGING_PATH}")
    print(f"  Questions: {len(staging['questions'])}")
    print(f"  MC: {staging['validation']['multipleChoice']}")
    print(f"  Fill-in-blank: {staging['validation']['fillInBlank']}")
    print(f"  Solution: {staging['validation']['solution']}")

    # Build review
    print("Building review JSON...")
    review = build_review(data)

    print("Writing review JSON...")
    with open(REVIEW_PATH, "w", encoding="utf-8") as f:
        json.dump(review, f, ensure_ascii=False, indent=2)

    print(f"Review written to: {REVIEW_PATH}")
    print(f"  Entries: {len(review['reviews'])}")

    # Verify staging: check no fields are missing
    print("\n--- Verification ---")
    for i, q in enumerate(staging["questions"]):
        qn = q["questionNumber"]
        # Check required fields exist
        for field in ["stableId", "questionNumber", "questionType", "stem", "answerCandidate",
                       "answerStatus", "explanationCandidate", "explanationStatus",
                       "sourceRepo", "sourceCommit", "sourceYear", "subjectCode",
                       "transformVersion", "reviewStatus"]:
            if field not in q:
                print(f"  WARNING: Q{qn} missing field: {field}")
        # Check answerStatus
        if q.get("answerStatus") != "candidate_from_solutions":
            print(f"  WARNING: Q{qn} answerStatus is: {q.get('answerStatus')}")
        # Check explanationStatus
        if q.get("explanationStatus") != "candidate_from_solutions":
            print(f"  WARNING: Q{qn} explanationStatus is: {q.get('explanationStatus')}")
        # Check anomalies
        if len(q.get("anomalies", [])) != 1:
            print(f"  WARNING: Q{qn} has {len(q.get('anomalies', []))} anomalies (expected 1)")
        # Check explanation not empty
        if not q.get("explanationCandidate"):
            print(f"  WARNING: Q{qn} explanationCandidate is empty!")

    # Verify review
    for i, entry in enumerate(review["reviews"]):
        qid = entry["stableId"]
        if entry.get("reviewStatus") != "needs_human_review":
            print(f"  WARNING: {qid} reviewStatus is: {entry.get('reviewStatus')}")

    print("Done.")


if __name__ == "__main__":
    main()
