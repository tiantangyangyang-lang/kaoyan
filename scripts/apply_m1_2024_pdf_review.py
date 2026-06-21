"""Apply evidence-backed Math1 2024 corrections verified against the source PDF."""

import argparse
import copy
import hashlib
import json
from pathlib import Path


SCHEMA_VERSION = "human-review-v1"
REVIEWED_ON = "2026-06-15"
PDF_RELATIVE_PATH = "solutions/2024年解析/b1205d3f-0e4d-42a6-88bd-0868455fd13e_origin.pdf"


def load_json(path):
    return json.loads(Path(path).read_text(encoding="utf-8-sig"))


def sha256_file(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def question_by_number(questions, number):
    return next(question for question in questions if question["questionNumber"] == number)


def decision(number, page, issue, action):
    return {
        "questionNumber": number,
        "issue": issue,
        "decision": "confirmed_from_source_pdf",
        "action": action,
        "evidence": {
            "sourceRelativePath": PDF_RELATIVE_PATH,
            "pdfPage": page,
        },
        "reviewedOn": REVIEWED_ON,
    }


def user_decision(number, issue, action):
    return {
        "questionNumber": number,
        "issue": issue,
        "decision": "confirmed_by_user_and_source_pdf",
        "action": action,
        "evidence": {
            "userConfirmedOn": REVIEWED_ON,
            "sourceRelativePath": PDF_RELATIVE_PATH,
        },
        "reviewedOn": REVIEWED_ON,
    }


def set_options(question, options):
    question["options"] = [{"label": label, "value": value} for label, value in options]


def clear_resolved_anomalies(question):
    question["anomalies"] = []


def apply_pdf_corrections(staging, pdf_sha256=None):
    questions = copy.deepcopy(staging["questions"])
    decisions = []

    q2 = question_by_number(questions, 2)
    q2["stem"] = (
        r"设 $P=P(x,y,z),Q=Q(x,y,z)$ 均为连续函数，$\Sigma$ 为曲面 "
        r"$z=\sqrt{1-x^2-y^2}\ (x\geqslant0,y\geqslant0)$ 的上侧，则 "
        r"$\iint_{\Sigma}P\,dy\,dz+Q\,dz\,dx=$"
    )
    set_options(q2, [
        ("A", r"$\iint_{\Sigma}\left(\frac{x}{z}P+\frac{y}{z}Q\right)dx\,dy$"),
        ("B", r"$\iint_{\Sigma}\left(-\frac{x}{z}P+\frac{y}{z}Q\right)dx\,dy$"),
        ("C", r"$\iint_{\Sigma}\left(\frac{x}{z}P-\frac{y}{z}Q\right)dx\,dy$"),
        ("D", r"$\iint_{\Sigma}\left(-\frac{x}{z}P-\frac{y}{z}Q\right)dx\,dy$"),
    ])
    clear_resolved_anomalies(q2)
    decisions.append(decision(2, 1, "missing_option_b_and_ocr_stem", "Restore the PDF-confirmed stem and four options."))

    q3 = question_by_number(questions, 3)
    q3["stem"] = (
        r"已知幂级数 $\sum_{n=0}^{\infty}a_nx^n$ 的和函数为 $\ln(2+x)$，"
        r"则 $\sum_{n=0}^{\infty}na_{2n}=$"
    )
    set_options(q3, [
        ("A", r"$-\frac{1}{6}$"),
        ("B", r"$-\frac{1}{3}$"),
        ("C", r"$\frac{1}{6}$"),
        ("D", r"$\frac{1}{3}$"),
    ])
    clear_resolved_anomalies(q3)
    decisions.append(decision(3, 1, "damaged_options_and_formula", "Restore the PDF-confirmed formula and four options."))

    q4 = question_by_number(questions, 4)
    q4["stem"] = q4["stem"].replace(" 0x→", "")
    clear_resolved_anomalies(q4)
    decisions.append(decision(4, 1, "trailing_ocr_fragment", "Remove the trailing OCR fragment after option D."))

    q8 = question_by_number(questions, 8)
    q8["stem"] = (
        r"设随机变量 $X$ 与 $Y$ 相互独立，$X\sim N(0,2)$，$Y\sim N(-2,2)$，"
        r"若 $P\{2X+Y<a\}=P\{X>Y\}$，则 $a=$"
    )
    set_options(q8, [
        ("A", r"$-2-\sqrt{10}$"),
        ("B", r"$-2+\sqrt{10}$"),
        ("C", r"$-2-\sqrt{6}$"),
        ("D", r"$-2+\sqrt{6}$"),
    ])
    clear_resolved_anomalies(q8)
    decisions.append(decision(8, 2, "damaged_options", "Restore the PDF-confirmed stem and four options."))

    q9 = question_by_number(questions, 9)
    q9["stem"] = (
        r"设随机变量 $X$ 的概率密度为 "
        r"$f(x)=\begin{cases}2(1-x),&0<x<1,\\0,&\text{其他},\end{cases}$，"
        r"在 $X=x$ 的条件下，$Y$ 在区间 $(x,1)$ 上服从均匀分布，则 "
        r"$\operatorname{cov}(X,Y)=$"
    )
    set_options(q9, [
        ("A", r"$-\frac{1}{36}$"),
        ("B", r"$-\frac{1}{72}$"),
        ("C", r"$\frac{1}{72}$"),
        ("D", r"$\frac{1}{36}$"),
    ])
    clear_resolved_anomalies(q9)
    decisions.append(decision(9, 3, "damaged_density_and_options", "Restore the PDF-confirmed density and four options."))

    q11 = question_by_number(questions, 11)
    q11["stem"] = (
        r"若 $\lim_{x\to0}\frac{(1+ax^2)^{\sin x}-1}{x^3}=6$，则 $a=\underline{\qquad}$。"
    )
    clear_resolved_anomalies(q11)
    decisions.append(decision(11, 3, "trailing_ocr_fragment", "Restore the PDF-confirmed limit expression."))

    q13 = question_by_number(questions, 13)
    q13["stem"] = (
        r"若函数 $f(x)=x+1$，且 "
        r"$f(x)=\frac{a_0}{2}+\sum_{n=1}^{\infty}a_n\cos nx,\ x\in[0,\pi]$，"
        r"则 $\lim_{n\to\infty}n^2\sin a_{2n-1}=\underline{\qquad}$。"
    )
    q13["answerCandidate"] = r"$-\frac{1}{\pi}$"
    q13["answerStatus"] = "confirmed_from_source_pdf"
    clear_resolved_anomalies(q13)
    decisions.append(decision(13, 3, "alternative_answer_conflict_and_damaged_formula", "Confirm -1/pi and restore the PDF formula."))

    q14 = question_by_number(questions, 14)
    q14["answerCandidate"] = r"$x=\tan\left(y+\frac{\pi}{4}\right)-y$"
    q14["answerStatus"] = "confirmed_from_source_pdf"
    clear_resolved_anomalies(q14)
    decisions.append(decision(14, 3, "alternative_missing_answer", "Confirm the primary answer from the PDF."))

    q17 = question_by_number(questions, 17)
    q17["stem"] = (
        r"（17）（本题满分 10 分）已知平面区域 "
        r"$D=\{(x,y)\mid\sqrt{1-y^2}\leq x\leq1,-1\leq y\leq1\}$，"
        r"计算 $\iint_D\frac{x}{\sqrt{x^2+y^2}}\,\mathrm{d}\sigma$。"
    )
    clear_resolved_anomalies(q17)
    decisions.append(user_decision(17, "user_confirmed_stem", "Use the user-confirmed Q17 stem with normalized LaTeX."))

    q18 = question_by_number(questions, 18)
    q18["stem"] = (
        r"（18）（本题满分 12 分）设 $f(x,y)=x^3+y^3-(x+y)^2+3$，"
        r"曲面 $z=f(x,y)$ 在 $(1,1,1)$ 处的切平面为 $T$，$T$ 与三个坐标面"
        r"所围有界区域在 $xoy$ 面的投影为 $D$。"
        "\n\n"
        r"（1）求 $T$ 的方程；"
        "\n\n"
        r"（2）求 $f(x,y)$ 在 $D$ 上的最大值和最小值。"
    )
    q18["answerCandidate"] = r"切平面 $x+y+z=3$；最大值 $21$，最小值 $\frac{17}{27}$。"
    q18["answerStatus"] = "confirmed_from_source_pdf"
    clear_resolved_anomalies(q18)
    decisions.append(decision(18, 4, "damaged_minimum_value", "Replace OCR-damaged 1727 with PDF-confirmed 17/27."))
    decisions.append(user_decision(18, "user_confirmed_stem", "Use the user-confirmed Q18 stem with normalized powers and punctuation."))

    q19 = question_by_number(questions, 19)
    q19["stem"] = (
        r"设 $f(x)$ 二阶可导，$f'(0)=f'(0)$，$|f''(x)|\leq1$，证："
        "\n\n"
        r"（1）$\left|f(x)-f(0)(1-x)-f(1)x\right|\leq\frac{x(1-x)}{2}$；"
        "\n\n"
        r"（2）$\left|\int_0^1f(x)\,dx-\frac{f(0)+f(1)}{2}\right|\leq\frac{1}{12}$。"
    )
    q19["answerCandidate"] = (
        "（1）分别在 $x=0$ 及 $x=1$ 处使用泰勒公式展开；"
        "（2）对（1）的结果两边同时积分。"
    )
    q19["answerStatus"] = "confirmed_from_source_pdf"
    clear_resolved_anomalies(q19)
    q19["anomalies"] = [{
        "type": "possible_source_pdf_typo",
        "questionNumber": 19,
        "severity": "warning",
        "message": "The source PDF itself visibly repeats f'(0)=f'(0); retained without mathematical reinterpretation.",
    }]
    decisions.append(decision(19, 4, "missing_propositions_and_truncated_answer", "Restore both propositions and the complete PDF answer."))
    decisions.append(decision(19, 4, "possible_source_pdf_typo", "Retain the visibly repeated condition and flag it for later mathematical review."))
    decisions.append(user_decision(
        19,
        "user_confirmed_stem_with_pdf_normalization",
        "Use the confirmed Q19 structure; retain PDF-confirmed x(1-x)/2 and the repeated source condition.",
    ))

    q20 = question_by_number(questions, 20)
    q20["stem"] = (
        r"（20）（本题满分 12 分）已知有向曲线 $L$ 为球面 "
        r"$x^2+y^2+z^2=2x$ 与平面 $2x-z-1=0$ 的交线，从 $z$ 轴正向往 "
        r"$z$ 轴负向看去为逆时针方向，计算曲线积分"
        "\n\n"
        r"$$\int_L(6xyz-yz^2)\,\mathrm{d}x+2x^2z\,\mathrm{d}y+xyz\,\mathrm{d}z.$$"
    )
    clear_resolved_anomalies(q20)
    decisions.append(user_decision(20, "user_confirmed_stem_and_removed_q19_tail", "Use the user-confirmed Q20 stem and remove the embedded Q19 answer tail."))

    q21 = question_by_number(questions, 21)
    q21["stem"] = (
        r"已知数列 $\{x_n\},\{y_n\},\{z_n\}$ 满足 $x_0=-1,y_0=0,z_0=2$，且"
        "\n\n"
        r"$\begin{cases}x_n=-2x_{n-1}+2z_{n-1},\\"
        r"y_n=-2y_{n-1}-2z_{n-1},\\"
        r"z_n=-6x_{n-1}-3y_{n-1}+3z_{n-1},\end{cases}$"
        "\n\n"
        r"记 $\alpha_n=(x_n,y_n,z_n)^{\mathrm T}$，写出满足 "
        r"$\alpha_n=A\alpha_{n-1}$ 的矩阵 $A$，并求 $A^n$ 及 "
        r"$x_n,y_n,z_n\ (n=1,2,\cdots)$。"
    )
    q21["answerCandidate"] = (
        r"$A=\begin{pmatrix}-2&0&2\\0&-2&-2\\-6&-3&3\end{pmatrix}$，"
        "\n\n"
        r"$A^n=\begin{pmatrix}"
        r"-4+(-1)^{n+1}2^n&-2+(-1)^{n+1}2^n&2\\"
        r"4+(-1)^n2^{n+1}&2+(-1)^n2^{n+1}&-2\\"
        r"-6&-3&3"
        r"\end{pmatrix}$，"
        "\n\n"
        r"$x_n=8+(-2)^n,\ y_n=-8+(-2)^{n+1},\ z_n=12$。"
    )
    q21["answerStatus"] = "confirmed_from_source_pdf"
    clear_resolved_anomalies(q21)
    decisions.append(decision(21, 5, "damaged_answer_and_boundary", "Restore the complete PDF-confirmed matrix answer."))
    decisions.append(user_decision(
        21,
        "user_confirmed_stem_with_pdf_vector_normalization",
        "Use the confirmed Q21 structure; retain PDF-confirmed alpha_n third component z_n.",
    ))

    q22 = question_by_number(questions, 22)
    q22["stem"] = (
        r"设总体 $X\sim U(0,\theta)$，$\theta$ 未知，$X_1,X_2,\cdots,X_n$ "
        r"为简单随机样本，$X_{(n)}=\max(X_1,X_2,\cdots,X_n)$，"
        r"$T_c=cX_{(n)}$。"
        "\n\n"
        r"（1）求 $c$，使得 $T_c$ 为 $\theta$ 的无偏估计；"
        "\n\n"
        r"（2）记 $h(c)=E(T_c-\theta)^2$，求 $c$ 使得 $h(c)$ 取最小值。"
    )
    q22["answerCandidate"] = r"（1）$c=\frac{n+1}{n}$；（2）$c=\frac{n+2}{n+1}$。"
    q22["answerStatus"] = "confirmed_from_source_pdf"
    clear_resolved_anomalies(q22)
    decisions.append(decision(22, 5, "q21_content_embedded_and_duplicate_answer", "Restore the Q22 boundary and concise PDF-confirmed answer."))
    decisions.append(user_decision(
        22,
        "user_confirmed_stem_with_pdf_distribution_normalization",
        "Use the confirmed Q22 structure; retain PDF-confirmed X~U(0,theta).",
    ))

    result = {
        "schemaVersion": SCHEMA_VERSION,
        "reviewedOn": REVIEWED_ON,
        "sourceInfo": staging["sourceInfo"],
        "sourceStagingSha256": None,
        "pdfEvidence": {
            "status": "visually_verified",
            "sourceRelativePath": PDF_RELATIVE_PATH,
            "sha256": pdf_sha256,
            "pagesReviewed": [1, 2, 3, 4, 5],
        },
        "reviewStatus": "needs_human_review",
        "statusReason": "PDF-confirmed OCR and boundary issues were corrected; detailed mathematical solutions remain unavailable.",
        "humanReviewDecisions": decisions,
        "questions": questions,
    }
    return result


def validate(result):
    errors = []
    questions = result.get("questions", [])
    if len(questions) != 22:
        errors.append(f"expected 22 questions, found {len(questions)}")
    if any(question.get("reviewStatus") != "needs_human_review" for question in questions):
        errors.append("all questions must remain needs_human_review")
    for number in (2, 3, 8, 9):
        labels = [option["label"] for option in question_by_number(questions, number)["options"]]
        if labels != ["A", "B", "C", "D"]:
            errors.append(f"Q{number} does not have four ordered options")
    if question_by_number(questions, 13)["answerCandidate"] != r"$-\frac{1}{\pi}$":
        errors.append("Q13 answer is not PDF-confirmed -1/pi")
    if r"\frac{17}{27}" not in question_by_number(questions, 18)["answerCandidate"]:
        errors.append("Q18 answer is missing 17/27")
    if "【22】" in question_by_number(questions, 22)["stem"] or "A ^ {n}" in question_by_number(questions, 22)["stem"]:
        errors.append("Q22 still contains Q21 content")
    if "z_n=12" not in question_by_number(questions, 21)["answerCandidate"]:
        errors.append("Q21 answer is incomplete")
    if question_by_number(questions, 20)["stem"].startswith("（2）"):
        errors.append("Q20 still contains the Q19 answer tail")
    if r"\frac{x(1-x)}{2}" not in question_by_number(questions, 19)["stem"]:
        errors.append("Q19 does not retain the PDF-confirmed x(1-x)/2 bound")
    if r"\alpha_n=(x_n,y_n,z_n)^{\mathrm T}" not in question_by_number(questions, 21)["stem"]:
        errors.append("Q21 vector does not retain PDF-confirmed z_n component")
    if r"X\sim U(0,\theta)" not in question_by_number(questions, 22)["stem"]:
        errors.append("Q22 distribution notation is not normalized")
    serialized = json.dumps(result, ensure_ascii=False)
    if '"approved"' in serialized or '"published"' in serialized:
        errors.append("result contains a prohibited publication status")
    return errors


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("staging", type=Path)
    parser.add_argument("source_root", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()

    staging = load_json(args.staging)
    pdf_path = args.source_root / Path(PDF_RELATIVE_PATH)
    result = apply_pdf_corrections(staging, sha256_file(pdf_path))
    result["sourceStagingSha256"] = sha256_file(args.staging)
    errors = validate(result)
    if errors:
        raise SystemExit("\n".join(errors))
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Math1 2024 PDF-reviewed artifact written: {args.output}")


if __name__ == "__main__":
    main()
