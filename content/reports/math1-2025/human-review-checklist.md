# 数学一 2025 人工审核清单

> 生成方式: Markdown-first finalization (2026-06-20)
> 产物: content/review/math1/2025/questions-reviewed.json
> 所有题目状态: needs_human_review

## 优先级

- P0: 0 项
- P1: 4 项
- P2: 8 项

## P0（必须先处理 — 阻塞项）

- 无

## P1（建议本轮处理 — 需确认）

- `math1-2025-q04` [partial_options_ocr_damaged]: Options C and D are OCR-damaged in source; labels A/B reconstructed from source formulas. Answer A confirmed by solution.
- `math1-2025-q09` [reconstructed_options_from_damaged_ocr]: Options B, C, D reconstructed from OCR-damaged source text. Answer C confirmed by solution. Human must verify against PDF.
- `math1-2025-q10` [options_missing_from_source]: Source markdown lacks A/B/C/D option labels and content. Only the correct rejection region formula is present in the stem. Answer D confirmed by solution. Human must verify all options against PDF.
- `math1-2025-q17` [ocr_risk_solution_coefficient]: Source solution has B=-1/3 x+3/5 (OCR suspect) and final result \frac{3}{0}\ln 2. Correct partial fractions: A=1/5, B=-1/5, C=3/5. Final result should be \frac{3}{10}\ln 2 + \frac{1}{10}\pi. Human must verify.

## P2（可顺手处理 — 信息项）

- `math1-2025-q11` [garbled_answer_character_repaired]: Answer '1' repaired to '$-1$' — the garbled '' is the Unicode private-use character for minus sign. Solution confirms answer is -1.
- `math1-2025-q15` [garbled_answer_character_repaired]: Answer '4' repaired to '$-4$' — the garbled '' is the Unicode private-use character for minus sign. Solution confirms answer is -4.
- `math1-2025-q17` [stem_solution_separated]: Stem and solution were combined in source; separated in finalization. Source has OCR error: \frac{3}{0} in final result, corrected to \frac{3}{10} based on partial fraction coefficients (A=1/5, B=-1/5, C=3/5).
- `math1-2025-q18` [stem_solution_separated]: Stem and solution were combined in source; separated in finalization. Answer extracted from end of solution.
- `math1-2025-q19` [stem_solution_separated]: Stem and solution were combined in source; separated in finalization. Proof question — no explicit answer field.
- `math1-2025-q20` [stem_solution_separated]: Stem and solution were combined in source; separated in finalization. Answer extracted from end of solution.
- `math1-2025-q21` [stem_solution_separated]: Stem and solution were combined in source; separated in finalization. Answer extracted from end of solution.
- `math1-2025-q22` [stem_solution_separated]: Stem and solution were combined in source; separated in finalization. Answer extracted from end of solution.

## 审核要求

- Q4: Options C/D 为 OCR 损坏，需对照 PDF 确认。
- Q9: Options B/C/D 从损坏 OCR 重建，需对照 PDF 验证公式。
- Q10: Options A/B/C 在源 Markdown 中缺失，需对照 PDF 获取完整选项。
- Q11/Q15: 答案乱码字符已修复为 $-1$ / $-4$，解析确认答案正确。
- Q17: 源文件中有 OCR 错误（\frac{3}{0} 应为 \frac{3}{10}），已按数学逻辑修复，需人工确认。
- Q17-Q22: 题目与解答在源文件中合并，已分离；answerCandidate 从嵌入解答中提取。
- 所有题目仍需逐题对照 PDF 做最终确认。
