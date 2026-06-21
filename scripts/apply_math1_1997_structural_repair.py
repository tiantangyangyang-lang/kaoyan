"""Repair deterministic Math1 1997 option and solution-boundary issues."""

import argparse
import copy
import hashlib
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from scripts.transform_m1_2020 import ANSWER_MARKER


SCHEMA_VERSION = "legacy-structure-repair-v1"
REVIEWED_ON = "2026-06-15"
PART_MARKER = re.compile(r"(?m)^\s*[（(](\d{1,2})[）)]\s*(?=【(?:答案|解)】)")
EMBEDDED_D_OPTION = re.compile(r"\n+\$\(\\mathrm\{D\}\)(.*)$", re.DOTALL)


def sha256_file(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def question_by_number(questions, number):
    return next(question for question in questions if question["questionNumber"] == number)


def split_repeated_local_parts(text, expected_markers):
    matches = list(PART_MARKER.finditer(text))
    found = [int(match.group(1)) for match in matches]
    if found != expected_markers:
        raise ValueError(f"expected local markers {expected_markers}, found {found}")
    return [
        text[match.start() : matches[index + 1].start() if index + 1 < len(matches) else len(text)].strip()
        for index, match in enumerate(matches)
    ]


def split_prefix_and_second_part(text):
    matches = list(PART_MARKER.finditer(text))
    found = [int(match.group(1)) for match in matches]
    if found != [2]:
        raise ValueError(f"expected one local marker [2], found {found}")
    return text[: matches[0].start()].strip(), text[matches[0].start() :].strip()


def attach_solution(question, block):
    answer_match = ANSWER_MARKER.search(block)
    question["answerCandidate"] = answer_match.group(1).strip() if answer_match else None
    question["answerStatus"] = "candidate_from_solutions" if answer_match else "missing"
    question["explanationCandidate"] = block
    question["explanationStatus"] = "candidate_from_solutions"


def restore_embedded_d_option(question):
    if [option["label"] for option in question["options"]] != ["A", "B", "C"]:
        raise ValueError(f"Q{question['questionNumber']} does not have the expected A-C option shape")
    match = EMBEDDED_D_OPTION.search(question["options"][-1]["value"])
    if not match:
        raise ValueError(f"Q{question['questionNumber']} embedded D option was not found")
    question["options"][-1]["value"] = question["options"][-1]["value"][: match.start()].strip()
    question["options"].append({"label": "D", "value": match.group(1).strip()})
    question["anomalies"] = [
        anomaly for anomaly in question["anomalies"] if anomaly.get("type") != "incomplete_options"
    ]


def apply_structural_repairs(staging):
    questions = copy.deepcopy(staging["questions"])
    decisions = []

    choice_container = question_by_number(questions, 6)["explanationCandidate"]
    choice_parts = split_repeated_local_parts(choice_container, [1, 2, 3, 4, 5, 1, 2, 3])
    for number, block in zip(range(6, 14), choice_parts):
        attach_solution(question_by_number(questions, number), block)
    decisions.append({
        "issue": "merged_solution_sections_two_and_three",
        "action": "Split the Q6 container into sequential Q6-Q13 solution blocks.",
        "questionNumbers": list(range(6, 14)),
    })

    for container_number, next_number in ((14, 15), (18, 19)):
        first, second = split_prefix_and_second_part(
            question_by_number(questions, container_number)["explanationCandidate"]
        )
        attach_solution(question_by_number(questions, container_number), first)
        attach_solution(question_by_number(questions, next_number), second)
        decisions.append({
            "issue": "merged_two_part_solution_section",
            "action": f"Split the Q{container_number} container into Q{container_number} and Q{next_number}.",
            "questionNumbers": [container_number, next_number],
        })

    for number in (7, 9):
        restore_embedded_d_option(question_by_number(questions, number))
    decisions.append({
        "issue": "unrecognized_mathrm_d_options",
        "action": "Restore the embedded D options for Q7 and Q9.",
        "questionNumbers": [7, 9],
    })

    return {
        "schemaVersion": SCHEMA_VERSION,
        "reviewedOn": REVIEWED_ON,
        "sourceYear": 1997,
        "reviewStatus": "needs_human_review",
        "sourceStagingSha256": None,
        "statusReason": "Deterministic option and solution boundaries were repaired; mathematical correctness is not approved.",
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
    for number in (7, 8, 9, 10, 11, 12, 13, 15, 19):
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
        f"Math1 1997 structural repair: {len(result['questions'])} questions, "
        f"{result['validation']['questionsWithExplanations']} explanations, "
        f"{result['validation']['remainingAutomaticAnomalies']} anomalies"
    )


if __name__ == "__main__":
    main()
