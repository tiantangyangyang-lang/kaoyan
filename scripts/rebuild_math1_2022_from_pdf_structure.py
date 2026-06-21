"""Rebuild Math1 2022 candidates from the clean structured PDF extraction."""

import argparse
import copy
import hashlib
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from scripts.inspect_math1_2022_pdf_structure import render_node


SCHEMA_VERSION = "pdf-structure-rebuild-v1"
CONTENT_LIST_RELATIVE = "solutions/2022年解析/content_list_v2.json"
PDF_RELATIVE = "solutions/2022年解析/db938df1-9376-4a28-b484-c7514390ead3_origin.pdf"
QUESTION_ANCHORS = [
    r"(?m)^1\s+",
    r"(?m)^2\s+",
    r"(?m)^设数列\s+",
    r"(?m)^若\s+\$I_\{1\}",
    r"(?m)^下列4个条件中",
    r"(?m)^6\s+",
    r"(?m)^7\s+",
    r"(?m)^8\s+",
    r"(?m)^9\s+",
    r"(?m)^10\s+",
    r"(?m)^11\s+",
    r"(?m)^12\s+",
    r"(?m)^13\s+",
    r"(?m)^14\s+",
    r"(?m)^15\s+",
    r"(?m)^16\s+",
    r"(?m)^17\s+",
    r"(?m)^18\s+",
    r"(?m)^19\s+",
    r"(?m)^20\s+",
    r"(?m)^21\s+",
    r"(?m)^22\s+",
]
ANSWER_RE = re.compile(r"(?m)^答案\s*(.*)$")
ANALYSIS_RE = re.compile(r"(?m)^分析\b")


def sha256_file(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def load_structured_text(content_list_path):
    pages = json.loads(Path(content_list_path).read_text(encoding="utf-8-sig"))
    page_texts = ["\n".join(render_node(block) for block in page) for page in pages]
    return "\n" + "\n".join(page_texts)


def split_question_blocks(text):
    starts = []
    cursor = 0
    for number, pattern in enumerate(QUESTION_ANCHORS, 1):
        match = re.compile(pattern).search(text, cursor)
        if not match:
            raise ValueError(f"Q{number} anchor not found: {pattern!r}")
        starts.append(match.start())
        cursor = match.end()
    blocks = {}
    for index, start in enumerate(starts):
        end = starts[index + 1] if index + 1 < len(starts) else text.find("\n# 2022年全国硕士研究生招生考试数学（一）答案速查", start)
        if end < 0:
            end = len(text)
        blocks[index + 1] = text[start:end].strip()
    return blocks


def strip_number_prefix(text, number):
    if number in {3, 4, 5}:
        return text.strip()
    return re.sub(rf"^{number}\s+", "", text, count=1).strip()


def option_label(line):
    line = line.strip()
    match = re.match(r"^\(([A-D])\)", line)
    if match:
        return match.group(1), line[match.end():].strip()
    match = re.match(r"^\$\\mathrm\{\(([A-D])\)\}([^$]*)\$(.*)$", line)
    if match:
        return match.group(1), (match.group(2) + match.group(3)).strip()
    match = re.match(r"^\$\(\\mathrm\{([A-D])\}\)\$(.*)$", line)
    if match:
        return match.group(1), match.group(2).strip()
    match = re.match(r"^\$\(\\mathrm\{([A-D])\}\)(.*)$", line)
    if match:
        return match.group(1), match.group(2).strip()
    match = re.match(r"^\$\\left\(\\mathrm\{([A-D])\}\\right\)(.*)$", line)
    if match:
        return match.group(1), match.group(2).strip()
    return None


def repair_known_option_boundaries(number, options):
    if number == 6 and [item["label"] for item in options] == ["A", "B", "C"]:
        marker = "$\\left( \\begin{array}{ll}AB & B"
        value = options[-1]["value"]
        if marker in value:
            c_value, d_value = value.split(marker, 1)
            options[-1]["value"] = c_value.strip()
            options.append({"label": "D", "value": marker + d_value})
    if number == 9 and [item["label"] for item in options] == ["A", "B", "C"]:
        lines = options[-1]["value"].splitlines()
        if len(lines) >= 2 and lines[-1].startswith("$\\frac"):
            d_value = lines.pop()
            options[-1]["value"] = "\n".join(lines).strip()
            options.append({"label": "D", "value": d_value})
    return options


def split_stem_options(text, question_type):
    if question_type != "multiple_choice":
        return text.strip(), []
    stem_lines = []
    options = []
    current = None
    for line in text.splitlines():
        found = option_label(line)
        if found:
            current = {"label": found[0], "value": found[1]}
            options.append(current)
        elif current is not None:
            current["value"] = (current["value"] + "\n" + line).strip()
        else:
            stem_lines.append(line)
    return "\n".join(stem_lines).strip(), options


def parse_block(block, number, fallback_answer):
    analysis_match = ANALYSIS_RE.search(block)
    analysis_start = analysis_match.start() if analysis_match else len(block)
    answer_match = ANSWER_RE.search(block)
    if answer_match and answer_match.start() < analysis_start:
        before_answer = block[:answer_match.start()].strip()
        answer = block[answer_match.end():analysis_start].strip() or fallback_answer
        after_answer = block[analysis_start:].strip() if analysis_match else ""
    else:
        before_answer = block[:analysis_match.start()].strip() if analysis_match else block.strip()
        answer = fallback_answer
        after_answer = block[analysis_match.start():].strip() if analysis_match else ""
    before_answer = strip_number_prefix(before_answer, number)
    kind = "multiple_choice" if number <= 10 else "fill_in_blank" if number <= 16 else "solution"
    if kind == "multiple_choice" and not re.match(r"^\s*[A-D](?:\.|\s|$)", answer or ""):
        answer = fallback_answer
    stem, options = split_stem_options(before_answer, kind)
    options = repair_known_option_boundaries(number, options)
    anomalies = []
    if kind == "multiple_choice" and [option["label"] for option in options] != ["A", "B", "C", "D"]:
        anomalies.append({
            "type": "pdf_structure_option_extraction_incomplete",
            "questionNumber": number,
            "severity": "warning",
            "message": f"Extracted option labels: {[option['label'] for option in options]}",
        })
    return {
        "questionType": kind,
        "stem": stem,
        "options": options,
        "answerCandidate": answer,
        "explanationCandidate": after_answer or None,
        "anomalies": anomalies,
    }


def rebuild(staging, content_list_path, pdf_path):
    text = load_structured_text(content_list_path)
    blocks = split_question_blocks(text)
    questions = []
    anomalies = []
    for old in staging["questions"]:
        number = old["questionNumber"]
        parsed = parse_block(blocks[number], number, old["answerCandidate"])
        question = copy.deepcopy(old)
        question["sourceRelativePaths"] = list(dict.fromkeys(
            question["sourceRelativePaths"] + [CONTENT_LIST_RELATIVE, PDF_RELATIVE]
        ))
        question["sourceFileHashes"]["pdfStructure"] = sha256_file(content_list_path)
        question["sourceFileHashes"]["pdf"] = sha256_file(pdf_path)
        question["transformVersion"] = SCHEMA_VERSION
        question["stem"] = parsed["stem"]
        question["options"] = parsed["options"]
        question["answerCandidate"] = parsed["answerCandidate"]
        question["answerStatus"] = "candidate_from_pdf_structure"
        question["explanationCandidate"] = parsed["explanationCandidate"]
        question["explanationStatus"] = (
            "candidate_from_pdf_structure" if parsed["explanationCandidate"] else "missing"
        )
        question["anomalies"] = parsed["anomalies"]
        questions.append(question)
        anomalies.extend(parsed["anomalies"])

    return {
        "schemaVersion": SCHEMA_VERSION,
        "task": "rebuild-math1-2022-from-pdf-structure",
        "sourceYear": 2022,
        "reviewStatus": "needs_human_review",
        "sourceStagingSha256": None,
        "pdfEvidence": {
            "status": "structured_extraction_used",
            "contentListRelativePath": CONTENT_LIST_RELATIVE,
            "contentListSha256": sha256_file(content_list_path),
            "pdfRelativePath": PDF_RELATIVE,
            "pdfSha256": sha256_file(pdf_path),
            "pages": 26,
        },
        "questions": questions,
        "anomalies": anomalies,
        "validation": {
            "questionsGenerated": len(questions),
            "multipleChoice": sum(q["questionType"] == "multiple_choice" for q in questions),
            "fillInBlank": sum(q["questionType"] == "fill_in_blank" for q in questions),
            "solution": sum(q["questionType"] == "solution" for q in questions),
            "questionsWithAnswers": sum(bool(q["answerCandidate"]) for q in questions),
            "questionsWithExplanations": sum(bool(q["explanationCandidate"]) for q in questions),
            "questionsWithFourOptions": sum(len(q["options"]) == 4 for q in questions[:10]),
            "allNeedsHumanReview": all(q["reviewStatus"] == "needs_human_review" for q in questions),
            "totalAnomalies": len(anomalies),
        },
    }


def validate(result):
    errors = []
    questions = result["questions"]
    if len(questions) != 22:
        errors.append(f"expected 22 questions, found {len(questions)}")
    if [q["questionNumber"] for q in questions] != list(range(1, 23)):
        errors.append("question numbering is not sequential")
    if not all(q["stem"] for q in questions):
        errors.append("one or more stems are empty")
    if not result["validation"]["allNeedsHumanReview"]:
        errors.append("all questions must remain needs_human_review")
    if result["validation"]["questionsWithAnswers"] != 22:
        errors.append("all 22 questions must retain candidate answers")
    return errors


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("staging", type=Path)
    parser.add_argument("content_list", type=Path)
    parser.add_argument("pdf", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    staging = json.loads(args.staging.read_text(encoding="utf-8-sig"))
    result = rebuild(staging, args.content_list, args.pdf)
    result["sourceStagingSha256"] = sha256_file(args.staging)
    errors = validate(result)
    if errors:
        raise SystemExit("\n".join(errors))
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(
        f"Math1 2022 PDF rebuild: {len(result['questions'])} questions, "
        f"{result['validation']['questionsWithExplanations']} explanations, "
        f"{result['validation']['totalAnomalies']} anomalies"
    )


if __name__ == "__main__":
    main()
