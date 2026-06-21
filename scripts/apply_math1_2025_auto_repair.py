"""Apply source-supported deterministic repairs to Math1 2025."""

import argparse
import copy
import hashlib
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))


SCHEMA_VERSION = "modern-auto-repair-v1"
REVIEWED_ON = "2026-06-15"
DOTTED_OPTION_MARKER = re.compile(r"(?m)^\s*([A-D])．\s*")
FRAGMENTED_LIM = r"\operatorname* { l i m }"


def sha256_file(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def question_by_number(questions, number):
    return next(question for question in questions if question["questionNumber"] == number)


def extract_dotted_options(text):
    matches = list(DOTTED_OPTION_MARKER.finditer(text))
    options = []
    for index, match in enumerate(matches):
        end = matches[index + 1].start() if index + 1 < len(matches) else len(text)
        options.append({"label": match.group(1), "value": text[match.end() : end].strip()})
    return options


def remove_anomaly(question, anomaly_type):
    question["anomalies"] = [
        anomaly for anomaly in question["anomalies"] if anomaly.get("type") != anomaly_type
    ]


def apply_auto_repairs(staging):
    questions = copy.deepcopy(staging["questions"])
    decisions = []

    for number in (1, 2, 3, 5, 6, 7, 8):
        question = question_by_number(questions, number)
        options = extract_dotted_options(question["stem"])
        if [option["label"] for option in options] != ["A", "B", "C", "D"]:
            raise ValueError(f"Q{number} does not contain four source-supported dotted options")
        question["options"] = options
        remove_anomaly(question, "incomplete_options")
    decisions.append({
        "issue": "unrecognized_fullwidth_dotted_options",
        "action": "Restore source-supported A-D options for Q1-Q3 and Q5-Q8.",
        "questionNumbers": [1, 2, 3, 5, 6, 7, 8],
    })

    for number in (3, 11):
        question = question_by_number(questions, number)
        question["stem"] = question["stem"].replace(FRAGMENTED_LIM, r"\lim")
        remove_anomaly(question, "ocr_risk")
    decisions.append({
        "issue": "fragmented_lim_ocr",
        "action": "Normalize the exact fragmented LaTeX operator l i m to lim in Q3 and Q11.",
        "questionNumbers": [3, 11],
    })

    q8 = question_by_number(questions, 8)
    if "故选 C" not in q8["explanationCandidate"]:
        raise ValueError("Q8 explanation does not explicitly support answer C")
    q8["answerCandidate"] = "C"
    q8["answerStatus"] = "candidate_from_combined_source_explanation"
    decisions.append({
        "issue": "empty_answer_marker_consumed_explanation_heading",
        "action": "Restore Q8 answer C from the same source explanation's explicit conclusion.",
        "questionNumbers": [8],
    })

    remaining = [
        anomaly
        for question in questions
        for anomaly in question["anomalies"]
    ]
    return {
        "schemaVersion": SCHEMA_VERSION,
        "reviewedOn": REVIEWED_ON,
        "sourceYear": 2025,
        "reviewStatus": "needs_human_review",
        "sourceStagingSha256": None,
        "statusReason": "Source-supported automatic repairs were applied; Q4, Q9, and Q10 options remain source-damaged.",
        "repairDecisions": decisions,
        "remainingAnomalies": remaining,
        "questions": questions,
        "validation": {
            "questionsGenerated": len(questions),
            "multipleChoiceWithFourOptions": sum(
                len(question["options"]) == 4
                for question in questions
                if question["questionType"] == "multiple_choice"
            ),
            "questionsWithAnswers": sum(bool(question["answerCandidate"]) for question in questions),
            "allNeedsHumanReview": all(
                question["reviewStatus"] == "needs_human_review" for question in questions
            ),
            "remainingAutomaticAnomalies": len(remaining),
        },
    }


def validate(result):
    errors = []
    questions = result["questions"]
    if len(questions) != 22:
        errors.append(f"expected 22 questions, found {len(questions)}")
    if result["validation"]["multipleChoiceWithFourOptions"] != 7:
        errors.append("expected seven source-supported complete multiple-choice option sets")
    if result["validation"]["remainingAutomaticAnomalies"] != 3:
        errors.append("expected exactly three remaining source-damaged option anomalies")
    if {item.get("questionNumber") for item in result["remainingAnomalies"]} != {4, 9, 10}:
        errors.append("remaining anomalies must be limited to Q4, Q9, and Q10")
    if question_by_number(questions, 8)["answerCandidate"] != "C":
        errors.append("Q8 answer C was not restored")
    if FRAGMENTED_LIM in question_by_number(questions, 3)["stem"] or FRAGMENTED_LIM in question_by_number(questions, 11)["stem"]:
        errors.append("fragmented lim OCR remains")
    if not result["validation"]["allNeedsHumanReview"]:
        errors.append("all questions must remain needs_human_review")
    return errors


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("staging", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()

    staging = json.loads(args.staging.read_text(encoding="utf-8-sig"))
    result = apply_auto_repairs(staging)
    result["sourceStagingSha256"] = sha256_file(args.staging)
    errors = validate(result)
    if errors:
        raise SystemExit("\n".join(errors))
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(
        f"Math1 2025 auto repair: {len(result['questions'])} questions, "
        f"{result['validation']['multipleChoiceWithFourOptions']} complete choice sets, "
        f"{result['validation']['remainingAutomaticAnomalies']} remaining anomalies"
    )


if __name__ == "__main__":
    main()
