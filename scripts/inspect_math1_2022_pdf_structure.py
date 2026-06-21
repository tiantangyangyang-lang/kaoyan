"""Inspect the clean structured extraction bundled with the Math1 2022 solution PDF."""

import argparse
import json
import re
from pathlib import Path


QUESTION_START = re.compile(r"(?m)^(\d{1,2})\s")


def render_node(node):
    if isinstance(node, list):
        return "\n".join(filter(None, (render_node(item) for item in node)))
    if not isinstance(node, dict):
        return ""
    kind = node.get("type")
    content = node.get("content")
    if kind == "text":
        return content or ""
    if kind == "equation_inline":
        return f"${content}$"
    if kind == "equation_interline":
        math = content.get("math_content", "") if isinstance(content, dict) else str(content or "")
        return f"$$\n{math}\n$$"
    if isinstance(content, str):
        return content
    if content is not None:
        return render_node(content)
    return render_node([value for key, value in node.items() if key not in {"bbox", "type"}])


def inspect(content_list_path):
    pages = json.loads(Path(content_list_path).read_text(encoding="utf-8-sig"))
    results = []
    for page_number, page in enumerate(pages, 1):
        text = "\n".join(render_node(block) for block in page)
        question_starts = [int(value) for value in QUESTION_START.findall(text) if 1 <= int(value) <= 22]
        results.append({
            "pageNumber": page_number,
            "characterCount": len(text),
            "questionStarts": question_starts,
            "answerMarkerCount": text.count("答案"),
            "analysisMarkerCount": text.count("分析"),
            "textPreview": text[:300].replace("\n", " "),
        })
    return results


def build_report(results, source_relative_path):
    detected = {
        number: item["pageNumber"]
        for item in results
        for number in item["questionStarts"]
    }
    missing = [number for number in range(1, 23) if number not in detected]
    lines = [
        "# Math1 2022 PDF Structure Inspection",
        "",
        f"- Structured source: `{source_relative_path}`",
        f"- Pages: {len(results)}",
        f"- Explicit question starts detected: {len(detected)}/22",
        f"- Missing explicit starts: {missing}",
        "",
        "## Page Map",
        "",
        "| Page | Question starts | Answer markers | Analysis markers |",
        "|---:|---|---:|---:|",
    ]
    for item in results:
        starts = ", ".join(str(value) for value in item["questionStarts"]) or "-"
        lines.append(
            f"| {item['pageNumber']} | {starts} | {item['answerMarkerCount']} | "
            f"{item['analysisMarkerCount']} |"
        )
    lines.extend([
        "",
        "## Rebuild Decision",
        "",
        "- Do not patch the OCR-heavy 2022 paper transcription in place.",
        "- Rebuild a separate candidate set from this clean PDF structured extraction.",
        "- Use explicit starts for Q1-Q2 and Q6-Q22.",
        "- Recover Q3-Q5 from the answer-delimited blocks on pages 2-5 and verify them visually.",
        "- Keep all rebuilt questions at `needs_human_review` and retain the old staging artifact.",
        "",
    ])
    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("content_list", type=Path)
    parser.add_argument("output_json", type=Path)
    parser.add_argument("output_report", type=Path)
    args = parser.parse_args()
    results = inspect(args.content_list)
    args.output_json.parent.mkdir(parents=True, exist_ok=True)
    args.output_report.parent.mkdir(parents=True, exist_ok=True)
    args.output_json.write_text(json.dumps({"pages": results}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    args.output_report.write_text(
        build_report(results, "solutions/2022年解析/content_list_v2.json") + "\n",
        encoding="utf-8",
    )
    print(f"Math1 2022 PDF structure: {len(results)} pages")


if __name__ == "__main__":
    main()
