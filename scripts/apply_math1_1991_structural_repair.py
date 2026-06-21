"""Repair deterministic Math1 1991 option and solution-boundary issues."""

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
PART_MARKER = re.compile(r"\([23]\)【解】|（3）【解】")
EMBEDDED_CD_OPTIONS = re.compile(
    r"^(?P<b>.+?)\n\n\$\s*\\mathrm\{\(C\)\}(?P<c>.+?)\$\n\n\$\s*\\mathrm\{\(D\)\}(?P<d>.+?)\$",
    re.DOTALL,
)


def sha256_file(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def split_q11_container(text):
    matches = list(PART_MARKER.finditer(text))
    found = [match.group(0) for match in matches]
    if found != ["(2)【解】", "(3)【解】"]:
        raise ValueError(f"expected embedded Q12/Q13 markers, found {found}")
    return (
        text[: matches[0].start()].strip(),
        text[matches[0].start() : matches[1].start()].strip(),
        text[matches[1].start() :].strip(),
    )


def split_q14_q15(text):
    marker = text.find("五、【解】")
    if marker == -1:
        raise ValueError("expected embedded Q15 section marker was not found")
    return text[:marker].strip(), text[marker:].strip()


def restore_embedded_c_d_options(question):
    if [option["label"] for option in question["options"]] != ["A", "B"]:
        raise ValueError(f"Q{question['questionNumber']} does not have the expected A-B option shape")
    match = EMBEDDED_CD_OPTIONS.match(question["options"][1]["value"])
    if not match:
        raise ValueError(f"Q{question['questionNumber']} embedded C/D options were not found")
    question["options"][1]["value"] = match.group("b").strip()
    question["options"].append({"label": "C", "value": match.group("c").strip()})
    question["options"].append({"label": "D", "value": match.group("d").strip()})
    question["anomalies"] = [
        anomaly for anomaly in question["anomalies"] if anomaly.get("type") != "incomplete_options"
    ]


def apply_structural_repairs(staging):
    questions = copy.deepcopy(staging["questions"])
    decisions = []

    q11_block, q12_block, q13_block = split_q11_container(question_by_number(questions, 11)["explanationCandidate"])
    attach_solution(question_by_number(questions, 11), q11_block)
    attach_solution(question_by_number(questions, 12), q12_block)
    attach_solution(question_by_number(questions, 13), q13_block)
    decisions.append({
        "issue": "merged_solution_section_three",
        "action": "Split the Q11 container into the sequential Q11-Q13 solution blocks.",
        "questionNumbers": [11, 12, 13],
    })

    q14_block, q15_block = split_q14_q15(question_by_number(questions, 14)["explanationCandidate"])
    attach_solution(question_by_number(questions, 14), q14_block)
    attach_solution(question_by_number(questions, 15), q15_block)
    decisions.append({
        "issue": "merged_solution_sections_four_and_five",
        "action": "Split the Q14 container into the Q14 and Q15 solution blocks.",
        "questionNumbers": [14, 15],
    })

    restore_embedded_c_d_options(question_by_number(questions, 7))
    decisions.append({
        "issue": "embedded_choice_options",
        "action": "Restore the embedded C and D options for Q7.",
        "questionNumbers": [7],
    })

    return {
        "schemaVersion": SCHEMA_VERSION,
        "reviewedOn": REVIEWED_ON,
        "sourceYear": 1991,
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
    for number in (11, 12, 13, 14, 15):
        if not question_by_number(questions, number)["explanationCandidate"]:
            errors.append(f"Q{number} explanation was not recovered")
    if [option["label"] for option in question_by_number(questions, 7)["options"]] != ["A", "B", "C", "D"]:
        errors.append("Q7 options were not fully restored")
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
        f"Math1 1991 structural repair: {len(result['questions'])} questions, "
        f"{result['validation']['questionsWithExplanations']} explanations, "
        f"{result['validation']['remainingAutomaticAnomalies']} anomalies"
    )


if __name__ == "__main__":
    main()
