"""Repair deterministic Math1 1999 option-extraction issues."""

import argparse
import copy
import hashlib
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from scripts.apply_math1_1997_structural_repair import question_by_number


SCHEMA_VERSION = "legacy-structure-repair-v1"
REVIEWED_ON = "2026-06-16"
A_MARKERS = ["\n\n$(\\mathrm{A})", "\n\n$\\left(\\mathrm{A}\\right)"]
B_MARKER = "\n\n(B)"


def sha256_file(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def extract_a_option_from_stem(stem):
    b_at = stem.find(B_MARKER)
    if b_at == -1:
        raise ValueError("expected B option marker was not found in the stem")
    prefix = stem[:b_at]
    for marker in A_MARKERS:
        a_at = prefix.rfind(marker)
        if a_at != -1:
            return prefix[a_at + len(marker) :].strip().rstrip("$").strip()
    raise ValueError("expected A option marker was not found in the stem")


def apply_structural_repairs(staging):
    questions = copy.deepcopy(staging["questions"])
    q10 = question_by_number(questions, 10)
    if [option["label"] for option in q10["options"]] != ["B", "C", "D"]:
        raise ValueError("Q10 does not have the expected B-D option shape")
    q10["options"].insert(0, {"label": "A", "value": extract_a_option_from_stem(q10["stem"])})
    q10["anomalies"] = [
        anomaly for anomaly in q10["anomalies"] if anomaly.get("type") != "incomplete_options"
    ]

    return {
        "schemaVersion": SCHEMA_VERSION,
        "reviewedOn": REVIEWED_ON,
        "sourceYear": 1999,
        "reviewStatus": "needs_human_review",
        "sourceStagingSha256": None,
        "statusReason": "Deterministic option boundaries were repaired; mathematical correctness is not approved.",
        "repairDecisions": [{
            "issue": "missing_leading_choice_option",
            "action": "Restore the missing A option for Q10 from the source-backed stem text.",
            "questionNumbers": [10],
        }],
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
    if len(questions) != 21:
        errors.append(f"expected 21 questions, found {len(questions)}")
    if result["validation"]["questionsWithExplanations"] != 21:
        errors.append("all 21 questions must retain explanations")
    if result["validation"]["multipleChoiceWithFourOptions"] != 5:
        errors.append("all five multiple-choice questions must have A-D options")
    if not result["validation"]["allNeedsHumanReview"]:
        errors.append("all questions must remain needs_human_review")
    if result["validation"]["remainingAutomaticAnomalies"] != 0:
        errors.append("resolved per-question anomalies remain")
    labels = [option["label"] for option in question_by_number(questions, 10)["options"]]
    if labels != ["A", "B", "C", "D"]:
        errors.append("Q10 options were not fully restored")
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
        f"Math1 1999 structural repair: {len(result['questions'])} questions, "
        f"{result['validation']['questionsWithExplanations']} explanations, "
        f"{result['validation']['remainingAutomaticAnomalies']} anomalies"
    )


if __name__ == "__main__":
    main()
