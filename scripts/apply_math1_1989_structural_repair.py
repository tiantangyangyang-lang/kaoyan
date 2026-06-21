"""Repair deterministic Math1 1989 solution-boundary issues."""

import argparse
import copy
import hashlib
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from scripts.apply_math1_1997_structural_repair import attach_solution, question_by_number


SCHEMA_VERSION = "legacy-structure-repair-v1"
REVIEWED_ON = "2026-06-16"
THIRD_PART_MARKER = "（3）【解】"
FILL_SECTION_MARKER = "十、填空题"
FILL_PART_MARKER = re.compile(r"（([123])）【答案】")


def sha256_file(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def clear_solution(question):
    question["answerCandidate"] = None
    question["answerStatus"] = "missing"
    question["explanationCandidate"] = None
    question["explanationStatus"] = "missing"


def split_q12_q13_from_q11_container(text):
    marker = text.find(THIRD_PART_MARKER)
    if marker == -1:
        raise ValueError("expected embedded Q13 marker was not found")
    return text[:marker].strip(), text[marker:].strip()


def split_q19_and_fill_ins(text):
    marker = text.find(FILL_SECTION_MARKER)
    if marker == -1:
        raise ValueError("expected fill-in section marker was not found in the Q19 container")
    q19_block = text[:marker].strip()
    fill_text = text[marker + len(FILL_SECTION_MARKER) :].strip()
    matches = list(FILL_PART_MARKER.finditer(fill_text))
    found = [int(match.group(1)) for match in matches]
    if found != [1, 2, 3]:
        raise ValueError(f"expected fill-in markers [1, 2, 3], found {found}")
    fill_blocks = [
        fill_text[
            match.start() : matches[index + 1].start() if index + 1 < len(matches) else len(fill_text)
        ].strip()
        for index, match in enumerate(matches)
    ]
    return q19_block, fill_blocks


def apply_structural_repairs(staging):
    questions = copy.deepcopy(staging["questions"])
    decisions = []

    q12_block, q13_block = split_q12_q13_from_q11_container(
        question_by_number(questions, 11)["explanationCandidate"]
    )
    clear_solution(question_by_number(questions, 11))
    attach_solution(question_by_number(questions, 12), q12_block)
    attach_solution(question_by_number(questions, 13), q13_block)
    decisions.append({
        "issue": "misaligned_solution_section_three",
        "action": "Clear the misplaced Q11 explanation and split its container into the Q12 and Q13 solution blocks.",
        "questionNumbers": [11, 12, 13],
    })

    q19_block, fill_blocks = split_q19_and_fill_ins(question_by_number(questions, 19)["explanationCandidate"])
    attach_solution(question_by_number(questions, 19), q19_block)
    for number, block in zip((20, 21, 22), fill_blocks):
        attach_solution(question_by_number(questions, number), block)
    decisions.append({
        "issue": "merged_fill_in_section_after_q19",
        "action": "Split the Q19 container from the embedded Q20-Q22 fill-in answer blocks.",
        "questionNumbers": [19, 20, 21, 22],
    })

    return {
        "schemaVersion": SCHEMA_VERSION,
        "reviewedOn": REVIEWED_ON,
        "sourceYear": 1989,
        "reviewStatus": "needs_human_review",
        "sourceStagingSha256": None,
        "statusReason": "Deterministic solution boundaries were repaired; Q11 still has no source-backed explanation and mathematical correctness is not approved.",
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
    if len(questions) != 23:
        errors.append(f"expected 23 questions, found {len(questions)}")
    if result["validation"]["questionsWithExplanations"] != 22:
        errors.append("exactly 22 questions should have explanations after repair")
    if result["validation"]["multipleChoiceWithFourOptions"] != 5:
        errors.append("all five multiple-choice questions must have A-D options")
    if not result["validation"]["allNeedsHumanReview"]:
        errors.append("all questions must remain needs_human_review")
    if result["validation"]["remainingAutomaticAnomalies"] != 0:
        errors.append("resolved per-question anomalies remain")
    if question_by_number(questions, 11)["explanationCandidate"] is not None:
        errors.append("Q11 should remain without a source-backed explanation")
    for number in (12, 13, 19, 20, 21, 22):
        if not question_by_number(questions, number)["explanationCandidate"]:
            errors.append(f"Q{number} explanation was not recovered")
    if question_by_number(questions, 19)["answerCandidate"] is not None:
        errors.append("Q19 should not inherit the embedded fill-in answer")
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
        f"Math1 1989 structural repair: {len(result['questions'])} questions, "
        f"{result['validation']['questionsWithExplanations']} explanations, "
        f"{result['validation']['remainingAutomaticAnomalies']} anomalies"
    )


if __name__ == "__main__":
    main()
