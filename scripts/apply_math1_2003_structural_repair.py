"""Repair deterministic Math1 2003 solution-boundary issues."""

import argparse
import copy
import hashlib
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from scripts.apply_math1_1997_structural_repair import (
    attach_solution,
    question_by_number,
    split_repeated_local_parts,
)


SCHEMA_VERSION = "legacy-structure-repair-v1"
REVIEWED_ON = "2026-06-16"
Q20_MARKER = "\uff0820\uff09\u3010\u8bc1\u660e\u3011"
Q21_MARKER = "\uff0821\uff09\u3010\u89e3\u3011"


def sha256_file(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def extract_q20_solution(solution_text):
    start = solution_text.find(Q20_MARKER)
    if start == -1:
        raise ValueError("Q20 solution marker was not found in the source solution Markdown")
    end = solution_text.find(Q21_MARKER, start)
    if end == -1:
        raise ValueError("Q21 marker was not found after the Q20 solution marker")
    return solution_text[start:end].strip()


def apply_structural_repairs(staging, solution_text):
    questions = copy.deepcopy(staging["questions"])
    decisions = []

    container = question_by_number(questions, 7)["explanationCandidate"]
    parts = split_repeated_local_parts(container, [7, 8, 9, 10, 11, 12])
    for number, block in zip(range(7, 13), parts):
        attach_solution(question_by_number(questions, number), block)
    decisions.append({
        "issue": "merged_solution_section_two",
        "action": "Split the Q7 container into sequential Q7-Q12 solution blocks.",
        "questionNumbers": list(range(7, 13)),
    })

    q20 = question_by_number(questions, 20)
    q20["answerCandidate"] = None
    q20["answerStatus"] = "missing"
    q20["explanationCandidate"] = extract_q20_solution(solution_text)
    q20["explanationStatus"] = "candidate_from_solutions"
    decisions.append({
        "issue": "unmarked_solution_block",
        "action": "Recovered Q20 from the source solution Markdown between Q20 and Q21 markers.",
        "questionNumbers": [20],
    })

    return {
        "schemaVersion": SCHEMA_VERSION,
        "reviewedOn": REVIEWED_ON,
        "sourceYear": 2003,
        "reviewStatus": "needs_human_review",
        "sourceStagingSha256": None,
        "statusReason": "Deterministic solution boundaries were repaired; mathematical correctness is not approved.",
        "repairDecisions": decisions,
        "questions": questions,
        "validation": {
            "questionsGenerated": len(questions),
            "questionsWithExplanations": sum(bool(question["explanationCandidate"]) for question in questions),
            "multipleChoiceWithFourOptions": sum(
                len(question["options"]) == 4
                for question in questions
                if question["questionType"] == "multiple_choice"
            ),
            "allNeedsHumanReview": all(
                question["reviewStatus"] == "needs_human_review" for question in questions
            ),
            "remainingAutomaticAnomalies": sum(len(question["anomalies"]) for question in questions),
        },
    }


def validate(result):
    errors = []
    questions = result["questions"]
    if len(questions) != 22:
        errors.append(f"expected 22 questions, found {len(questions)}")
    if result["validation"]["questionsWithExplanations"] != 22:
        errors.append("all 22 questions must have recovered explanations")
    if result["validation"]["multipleChoiceWithFourOptions"] != 6:
        errors.append("all six multiple-choice questions must have A-D options")
    if not result["validation"]["allNeedsHumanReview"]:
        errors.append("all questions must remain needs_human_review")
    if result["validation"]["remainingAutomaticAnomalies"] != 0:
        errors.append("resolved per-question anomalies remain")
    for number in (8, 9, 10, 11, 12, 20):
        if not question_by_number(questions, number)["explanationCandidate"]:
            errors.append(f"Q{number} explanation was not recovered")
    return errors


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("staging", type=Path)
    parser.add_argument("source_root", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()

    staging = json.loads(args.staging.read_text(encoding="utf-8-sig"))
    solution_relative = staging["sourceInfo"]["solutionsRelativePath"]
    solution_path = args.source_root / Path(solution_relative)
    solution_text = solution_path.read_text(encoding="utf-8-sig")

    result = apply_structural_repairs(staging, solution_text)
    result["sourceStagingSha256"] = sha256_file(args.staging)
    result["sourceSolutionSha256"] = sha256_file(solution_path)
    errors = validate(result)
    if errors:
        raise SystemExit("\n".join(errors))
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(
        f"Math1 2003 structural repair: {len(result['questions'])} questions, "
        f"{result['validation']['questionsWithExplanations']} explanations, "
        f"{result['validation']['remainingAutomaticAnomalies']} anomalies"
    )


if __name__ == "__main__":
    main()
