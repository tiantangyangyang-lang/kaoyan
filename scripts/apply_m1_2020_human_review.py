"""Apply confirmed human corrections to the Math1 2020 staging candidates."""

import argparse
import copy
import hashlib
import json
from pathlib import Path


SCHEMA_VERSION = "human-review-v1"
REVIEWED_ON = "2026-06-14"
Q3_C = (
    r"$\lim_{(x,y)\to (0,0)}\frac{|\pmb{\alpha}\cdot(x,y,f(x,y))|}"
    r"{\sqrt{x^2 + y^2}}$ 存在"
)
Q3_D = (
    r"$\lim_{(x,y)\to (0,0)}\frac{|\pmb{\alpha}\times(x,y,f(x,y))|}"
    r"{\sqrt{x^2 + y^2}}$ 存在"
)
Q12_EXPLANATION = r"""(12)【答案】 4e.

【解】由于 $f(x,y)$ 具有二阶连续偏导数，故 $\dfrac{\partial^2 f}{\partial x\partial y}=\dfrac{\partial^2 f}{\partial y\partial x}$。

$$
\frac{\partial f}{\partial y}
=\mathrm{e}^{x(xy)^2}\frac{\partial(xy)}{\partial y}
=x\mathrm{e}^{x^3y^2},
\quad
\frac{\partial^2 f}{\partial x\partial y}
=\frac{\partial}{\partial x}\left(x\mathrm{e}^{x^3y^2}\right)
=\mathrm{e}^{x^3y^2}+3x^3y^2\mathrm{e}^{x^3y^2}.
$$

故 $\left.\dfrac{\partial^2 f}{\partial x\partial y}\right|_{(1,1)}=4\mathrm{e}$。"""


def load_json(path):
    with open(path, "r", encoding="utf-8") as source:
        return json.load(source)


def sha256_file(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def question_by_number(questions, number):
    return next(question for question in questions if question["questionNumber"] == number)


def replace_once(text, old, new, label):
    if text.count(old) != 1:
        raise ValueError(f"{label}: expected exactly one occurrence, found {text.count(old)}")
    return text.replace(old, new, 1)


def decision(question_number, issue, action, evidence):
    return {
        "questionNumber": question_number,
        "issue": issue,
        "decision": "confirmed_by_user",
        "action": action,
        "evidence": evidence,
        "reviewedOn": REVIEWED_ON,
    }


def apply_confirmed_corrections(staging):
    questions = copy.deepcopy(staging["questions"])
    decisions = []

    q3 = question_by_number(questions, 3)
    combined = Q3_C + "  \n" + Q3_D
    q3["stem"] = replace_once(q3["stem"], combined, Q3_C + "  \n(D) " + Q3_D, "Q3 stem")
    q3["options"] = [
        option for option in q3["options"] if option["label"] not in {"C", "D"}
    ] + [
        {"label": "C", "value": Q3_C},
        {"label": "D", "value": Q3_D},
    ]
    q3["anomalies"] = [
        anomaly for anomaly in q3["anomalies"]
        if anomaly.get("type") != "incomplete_options"
    ]
    decisions.append(decision(
        3,
        "missing_option_d_label",
        "Split the merged C/D text and add the confirmed D option label.",
        "User supplied the complete C and D option text.",
    ))

    q8 = question_by_number(questions, 8)
    q8["stem"] = q8["stem"].replace(r"\Phi (0,2)", r"\Phi (0.2)")
    q8["stem"] = q8["stem"].split("\n\n# 二、填空题", 1)[0].rstrip()
    q8["options"][2]["value"] = q8["options"][2]["value"].replace(
        r"\Phi (0,2)", r"\Phi (0.2)"
    )
    q8["options"][3]["value"] = q8["options"][3]["value"].split(
        "\n\n# 二、填空题", 1
    )[0].rstrip()
    q8["explanationCandidate"] = q8["explanationCandidate"].split(
        "\n\n# 二、填空题", 1
    )[0].rstrip()
    decisions.extend([
        decision(
            8,
            "decimal_separator_comma",
            "Normalize Phi(0,2) to Phi(0.2).",
            "User confirmed 0.2 is the intended standard-normal argument.",
        ),
        decision(
            8,
            "embedded_section_heading",
            "Remove the fill-in-blank section heading from the single-question content.",
            "The heading is valid paper structure but is not part of Q8.",
        ),
    ])

    q12 = question_by_number(questions, 12)
    q12["explanationCandidate"] = Q12_EXPLANATION
    decisions.append(decision(
        12,
        "unclear_parameterized_integral_substitution",
        "Replace the explanation with the confirmed mixed-partial derivation.",
        "User supplied a corrected derivation and confirmed the answer is 4e.",
    ))

    q14 = question_by_number(questions, 14)
    q14["stem"] = q14["stem"].split("\n\n# 三、解答题", 1)[0].rstrip()
    q14["explanationCandidate"] = q14["explanationCandidate"].split(
        "\n\n# 三、解答题", 1
    )[0].rstrip()
    decisions.append(decision(
        14,
        "embedded_section_heading",
        "Remove the solution-section heading from the single-question content.",
        "The heading is valid paper structure but is not part of Q14.",
    ))

    q23 = question_by_number(questions, 23)
    q23["explanationCandidate"] = q23["explanationCandidate"].split(
        "\n\n$$\n\\begin{array}{l} F _ {Y} (y)", 1
    )[0].rstrip()
    decisions.append(decision(
        23,
        "duplicated_trailing_content",
        "Remove the trailing Q22 content from the Q23 explanation.",
        "User confirmed the trailing block was accidentally copied from Q22.",
    ))

    decisions.extend([
        decision(
            22,
            "embedded_solution_marker",
            "No content change; retain the existing correctly separated Q22 candidate.",
            "User confirmed the Q22 marker-fusion issue is resolved.",
        ),
        decision(
            "4-8",
            "question_number_format_inconsistency",
            "Record the numbering-format issue as resolved.",
            "User confirmed Q4-Q8 were normalized to the '(n)' format.",
        ),
    ])

    return {
        "schemaVersion": SCHEMA_VERSION,
        "reviewedOn": REVIEWED_ON,
        "sourceInfo": staging["sourceInfo"],
        "sourceStagingSha256": None,
        "reviewStatus": "needs_human_review",
        "statusReason": "Confirmed issues were corrected, but the full 23-question paper has not been reviewed.",
        "humanReviewDecisions": decisions,
        "questions": questions,
    }


def validate(result):
    errors = []
    questions = result.get("questions", [])
    if len(questions) != 23:
        errors.append(f"expected 23 questions, found {len(questions)}")
    if any(question.get("reviewStatus") != "needs_human_review" for question in questions):
        errors.append("all questions must remain needs_human_review")

    q3 = question_by_number(questions, 3)
    if [option["label"] for option in q3["options"]] != ["A", "B", "C", "D"]:
        errors.append("Q3 does not have four ordered options")
    if q3["options"][2]["value"] != Q3_C or q3["options"][3]["value"] != Q3_D:
        errors.append("Q3 C/D options do not match the confirmed text")

    q8 = question_by_number(questions, 8)
    if "0,2" in q8["stem"] or any("0,2" in option["value"] for option in q8["options"]):
        errors.append("Q8 still contains the comma decimal")

    q12 = question_by_number(questions, 12)
    if q12["explanationCandidate"] != Q12_EXPLANATION:
        errors.append("Q12 explanation does not match the confirmed derivation")

    q23 = question_by_number(questions, 23)
    if "F _ {Y} (y)" in q23["explanationCandidate"]:
        errors.append("Q23 still contains trailing Q22 content")

    serialized = json.dumps(result, ensure_ascii=False)
    if "# 二、填空题" in serialized or "# 三、解答题" in serialized:
        errors.append("embedded section headings remain in single-question content")
    if '"approved"' in serialized or '"published"' in serialized:
        errors.append("result contains a prohibited publication status")
    return errors


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("staging", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()

    staging = load_json(args.staging)
    result = apply_confirmed_corrections(staging)
    result["sourceStagingSha256"] = sha256_file(args.staging)
    errors = validate(result)
    if errors:
        for error in errors:
            print(error)
        raise SystemExit(1)

    args.output.parent.mkdir(parents=True, exist_ok=True)
    with open(args.output, "w", encoding="utf-8", newline="\n") as target:
        json.dump(result, target, ensure_ascii=False, indent=2)
        target.write("\n")
    print(f"Math1 2020 human review artifact written: {args.output}")


if __name__ == "__main__":
    main()
