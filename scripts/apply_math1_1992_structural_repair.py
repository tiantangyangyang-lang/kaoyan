"""Repair deterministic Math1 1992 solution-boundary issues."""

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
Q19_EMBEDDED_SECTION_MARKER = "\u4e5d\u3001\u3010\u89e3\u3011"


def sha256_file(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def split_q18_q19_solution(text):
    index = text.find(Q19_EMBEDDED_SECTION_MARKER)
    if index == -1:
        raise ValueError("expected embedded Q19 section marker was not found")
    return text[:index].strip(), text[index + len("\u4e5d\u3001") :].strip()


def apply_structural_repairs(staging):
    questions = copy.deepcopy(staging["questions"])
    decisions = []

    choice_and_solution_container = question_by_number(questions, 6)["explanationCandidate"]
    parts = split_repeated_local_parts(choice_and_solution_container, [1, 2, 3, 4, 5, 1, 2, 3])
    for number, block in zip(range(6, 14), parts):
        attach_solution(question_by_number(questions, number), block)
    decisions.append({
        "issue": "merged_solution_sections_two_and_three",
        "action": "Split the Q6 container into sequential Q6-Q13 solution blocks.",
        "questionNumbers": list(range(6, 14)),
    })

    first, second = split_q18_q19_solution(question_by_number(questions, 18)["explanationCandidate"])
    attach_solution(question_by_number(questions, 18), first)
    attach_solution(question_by_number(questions, 19), second)
    decisions.append({
        "issue": "merged_two_part_solution_section",
        "action": "Split the Q18 container into Q18 and Q19.",
        "questionNumbers": [18, 19],
    })

    return {
        "schemaVersion": SCHEMA_VERSION,
        "reviewedOn": REVIEWED_ON,
        "sourceYear": 1992,
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
    if result["validation"]["multipleChoiceWithFourOptions"] != 5:
        errors.append("all five multiple-choice questions must have A-D options")
    if not result["validation"]["allNeedsHumanReview"]:
        errors.append("all questions must remain needs_human_review")
    if result["validation"]["remainingAutomaticAnomalies"] != 0:
        errors.append("resolved per-question anomalies remain")
    for number in (7, 8, 9, 10, 11, 12, 13, 19):
        if not question_by_number(questions, number)["explanationCandidate"]:
            errors.append(f"Q{number} explanation was not recovered")
    return errors


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("staging", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()

    staging = json.loads(args.staging.read_text(encoding="utf-8-sig"))
    result = apply_structural_repairs(staging)
    result["sourceStagingSha256"] = sha256_file(args.staging)
    errors = validate(result)
    if errors:
        raise SystemExit("\n".join(errors))
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(
        f"Math1 1992 structural repair: {len(result['questions'])} questions, "
        f"{result['validation']['questionsWithExplanations']} explanations, "
        f"{result['validation']['remainingAutomaticAnomalies']} anomalies"
    )


if __name__ == "__main__":
    main()
