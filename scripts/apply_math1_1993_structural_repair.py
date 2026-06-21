"""Repair deterministic Math1 1993 option and solution-boundary issues."""

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
Q12_MARKER = "（2）【解】"
Q13_MARKER = "(3)【解】"
Q17_MARKER = "\n\n(2) $a^b > b^a$ 等价于 $b \\ln a - a \\ln b > 0$ ."
EMBEDDED_Q9_D = re.compile(r"^(?P<c>.+?)\n\n\$\\mathrm\{\(D\)\}(?P<d>.+?)\$$", re.DOTALL)
EMBEDDED_Q10_B = re.compile(r"^(?P<a>.+?)\n\n\$\((?:\\mathrm\{)?B(?:\})?\)(?P<b>.+)$", re.DOTALL)
EMBEDDED_Q10_D = re.compile(r"^(?P<c>.+?)\n\n\$\((?:\\mathrm\{)?D(?:\})?\)(?P<d>.+)$", re.DOTALL)


def sha256_file(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def split_q11_container(text):
    q12_at = text.find(Q12_MARKER)
    q13_at = text.find(Q13_MARKER)
    if q12_at == -1 or q13_at == -1 or q12_at >= q13_at:
        raise ValueError("expected embedded Q12/Q13 markers were not found in order")
    return text[:q12_at].strip(), text[q12_at:q13_at].strip(), text[q13_at:].strip()


def split_q16_q17(text):
    marker = text.find(Q17_MARKER)
    if marker == -1:
        raise ValueError("expected embedded Q17 marker was not found")
    return text[:marker].strip(), text[marker + 2 :].strip()


def restore_q9_d_option(question):
    if [option["label"] for option in question["options"]] != ["A", "B", "C"]:
        raise ValueError(f"Q{question['questionNumber']} does not have the expected A-C option shape")
    match = EMBEDDED_Q9_D.match(question["options"][-1]["value"])
    if not match:
        raise ValueError("Q9 embedded D option was not found")
    question["options"][-1]["value"] = match.group("c").strip()
    question["options"].append({"label": "D", "value": match.group("d").strip()})
    question["anomalies"] = [
        anomaly for anomaly in question["anomalies"] if anomaly.get("type") != "incomplete_options"
    ]


def restore_q10_b_and_d_options(question):
    labels = [option["label"] for option in question["options"]]
    if labels != ["A", "C"]:
        raise ValueError(f"Q{question['questionNumber']} does not have the expected A/C option shape")

    a_match = EMBEDDED_Q10_B.match(question["options"][0]["value"])
    c_match = EMBEDDED_Q10_D.match(question["options"][1]["value"])
    if not a_match or not c_match:
        raise ValueError("Q10 embedded B/D options were not found")

    question["options"] = [
        {"label": "A", "value": a_match.group("a").strip()},
        {"label": "B", "value": a_match.group("b").strip()},
        {"label": "C", "value": c_match.group("c").strip()},
        {"label": "D", "value": c_match.group("d").strip()},
    ]
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

    q16_block, q17_block = split_q16_q17(question_by_number(questions, 16)["explanationCandidate"])
    attach_solution(question_by_number(questions, 16), q16_block)
    attach_solution(question_by_number(questions, 17), q17_block)
    decisions.append({
        "issue": "merged_proof_section_six",
        "action": "Split the Q16 container into the Q16 and Q17 proof blocks.",
        "questionNumbers": [16, 17],
    })

    restore_q9_d_option(question_by_number(questions, 9))
    restore_q10_b_and_d_options(question_by_number(questions, 10))
    decisions.append({
        "issue": "embedded_choice_options",
        "action": "Restore the embedded D option for Q9 and the embedded B/D options for Q10.",
        "questionNumbers": [9, 10],
    })

    return {
        "schemaVersion": SCHEMA_VERSION,
        "reviewedOn": REVIEWED_ON,
        "sourceYear": 1993,
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
    if len(questions) != 23:
        errors.append(f"expected 23 questions, found {len(questions)}")
    if result["validation"]["questionsWithExplanations"] != 23:
        errors.append("all 23 questions must have recovered explanations")
    if result["validation"]["multipleChoiceWithFourOptions"] != 5:
        errors.append("all five multiple-choice questions must have A-D options")
    if not result["validation"]["allNeedsHumanReview"]:
        errors.append("all questions must remain needs_human_review")
    if result["validation"]["remainingAutomaticAnomalies"] != 0:
        errors.append("resolved per-question anomalies remain")
    for number in (11, 12, 13, 16, 17):
        if not question_by_number(questions, number)["explanationCandidate"]:
            errors.append(f"Q{number} explanation was not recovered")
    for number in (9, 10):
        labels = [option["label"] for option in question_by_number(questions, number)["options"]]
        if labels != ["A", "B", "C", "D"]:
            errors.append(f"Q{number} options were not fully restored")
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
        f"Math1 1993 structural repair: {len(result['questions'])} questions, "
        f"{result['validation']['questionsWithExplanations']} explanations, "
        f"{result['validation']['remainingAutomaticAnomalies']} anomalies"
    )


if __name__ == "__main__":
    main()
