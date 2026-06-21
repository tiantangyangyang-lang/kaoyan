"""Validate or mechanically repair the Math1 2020 semantic review artifact."""

import argparse
import json
from pathlib import Path


CANDIDATE_FIELDS = (
    "questionNumber",
    "questionType",
    "reviewStatus",
    "stem",
    "options",
    "answerCandidate",
    "answerStatus",
    "explanationCandidate",
    "explanationStatus",
    "anomalies",
)


def load_json(path: Path):
    with open(path, "r", encoding="utf-8") as source:
        return json.load(source)


def validate(staging, reviewed):
    errors = []
    source_questions = staging.get("questions", [])
    reviews = reviewed.get("reviews", [])
    if len(source_questions) != 23:
        errors.append(f"staging question count is {len(source_questions)}, expected 23")
    if len(reviews) != 23:
        errors.append(f"review count is {len(reviews)}, expected 23")

    review_by_id = {review.get("stableId"): review for review in reviews}
    if len(review_by_id) != len(reviews):
        errors.append("review stable IDs are not unique")

    for question in source_questions:
        stable_id = question["stableId"]
        review = review_by_id.get(stable_id)
        if not review:
            errors.append(f"{stable_id}: missing review")
            continue
        if review.get("reviewStatus") != "needs_human_review":
            errors.append(f"{stable_id}: reviewStatus is not needs_human_review")
        candidate = review.get("candidateResult", {})
        for field in CANDIDATE_FIELDS:
            if candidate.get(field) != question.get(field):
                errors.append(f"{stable_id}: candidateResult.{field} differs from staging")

    serialized = json.dumps(reviewed, ensure_ascii=False)
    for prohibited in ('"approved"', '"published"', "TO_BE_FILLED"):
        if prohibited in serialized:
            errors.append(f"review contains prohibited marker: {prohibited}")
    return errors


def repair(staging, reviewed):
    source_by_id = {
        question["stableId"]: question for question in staging["questions"]
    }
    for review in reviewed["reviews"]:
        source = source_by_id[review["stableId"]]
        review["reviewStatus"] = "needs_human_review"
        review["candidateResult"] = {
            field: source.get(field) for field in CANDIDATE_FIELDS
        }
    return reviewed


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("staging", type=Path)
    parser.add_argument("reviewed", type=Path)
    parser.add_argument("--repair", action="store_true")
    args = parser.parse_args()

    staging = load_json(args.staging)
    reviewed = load_json(args.reviewed)
    if args.repair:
        reviewed = repair(staging, reviewed)
        with open(args.reviewed, "w", encoding="utf-8") as target:
            json.dump(reviewed, target, ensure_ascii=False, indent=2)

    errors = validate(staging, reviewed)
    if errors:
        for error in errors:
            print(error)
        raise SystemExit(1)
    print("Math1 2020 review validation: OK")


if __name__ == "__main__":
    main()
