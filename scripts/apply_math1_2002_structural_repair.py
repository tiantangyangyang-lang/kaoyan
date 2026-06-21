"""Repair deterministic Math1 2002 option and solution-boundary issues."""

import argparse
import copy
import hashlib
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from scripts.apply_math1_1997_structural_repair import (
    attach_solution,
    question_by_number,
    split_repeated_local_parts,
)


SCHEMA_VERSION = "legacy-structure-repair-v1"
REVIEWED_ON = "2026-06-15"
MIXED_OPTION_MARKER = re.compile(
    r"(?m)^\s*(?:[（(]([A-D])[）)]|\$\(\\mathrm\{([A-D])\}\))\s*"
)


def sha256_file(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def extract_mixed_options(text):
    matches = list(MIXED_OPTION_MARKER.finditer(text))
    options = []
    for index, match in enumerate(matches):
        end = matches[index + 1].start() if index + 1 < len(matches) else len(text)
        options.append({
            "label": match.group(1) or match.group(2),
            "value": text[match.end() : end].strip(),
        })
    return options


def apply_structural_repairs(staging):
    questions = copy.deepcopy(staging["questions"])
    decisions = []

    for container_number, targets, expected_markers in (
        (1, range(1, 6), [1, 2, 3, 4, 5]),
        (6, range(6, 11), [6, 7, 8, 9, 10]),
    ):
        container = question_by_number(questions, container_number)["explanationCandidate"]
        parts = split_repeated_local_parts(container, expected_markers)
        for number, block in zip(targets, parts):
            attach_solution(question_by_number(questions, number), block)
        decisions.append({
            "issue": "merged_solution_section",
            "action": f"Split the Q{container_number} container into Q{targets.start}-Q{targets.stop - 1}.",
            "questionNumbers": list(targets),
        })

    q10 = question_by_number(questions, 10)
    q10["options"] = extract_mixed_options(q10["stem"])
    q10["anomalies"] = [
        anomaly for anomaly in q10["anomalies"] if anomaly.get("type") != "incomplete_options"
    ]
    decisions.append({
        "issue": "unrecognized_mathrm_options",
        "action": "Restore the mixed-format A-D options for Q10.",
        "questionNumbers": [10],
    })

    return {
        "schemaVersion": SCHEMA_VERSION,
        "reviewedOn": REVIEWED_ON,
        "sourceYear": 2002,
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
    if len(questions) != 20:
        errors.append(f"expected 20 questions, found {len(questions)}")
    if result["validation"]["questionsWithExplanations"] != 20:
        errors.append("all 20 questions must have recovered explanations")
    if result["validation"]["multipleChoiceWithFourOptions"] != 5:
        errors.append("all five multiple-choice questions must have A-D options")
    if not result["validation"]["allNeedsHumanReview"]:
        errors.append("all questions must remain needs_human_review")
    if result["validation"]["remainingAutomaticAnomalies"] != 0:
        errors.append("resolved per-question anomalies remain")
    if [option["label"] for option in question_by_number(questions, 10)["options"]] != ["A", "B", "C", "D"]:
        errors.append("Q10 options were not restored in A-D order")
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
        f"Math1 2002 structural repair: {len(result['questions'])} questions, "
        f"{result['validation']['questionsWithExplanations']} explanations, "
        f"{result['validation']['remainingAutomaticAnomalies']} anomalies"
    )


if __name__ == "__main__":
    main()
