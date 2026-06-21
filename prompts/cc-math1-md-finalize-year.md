执行数学一 {{YEAR}} 年 Markdown-first 最终整理任务。

目标：用真题 Markdown 与解析 Markdown 一次完成题目匹配、确定性修复、最终复核产物同步。不要默认要求 PDF 或人工逐题复核。

先读取：
- `真题内容解析与代理处理规范.md`
- `content/staging/math1/{{YEAR}}/`
- `content/review/math1/{{YEAR}}/`
- `content/reports/math1-{{YEAR}}/`
- 本次 `source-mirror/` 中该年份 paper Markdown、solution Markdown 与 Markdown 引用的图片

证据优先级：
1. 真题 Markdown 决定题干、题号和选项。
2. 解析 Markdown 决定答案、解析和题号对应关系。
3. 当真题 Markdown 与解析结论冲突时，若解析中的完整推导与数学逻辑能唯一确定原文是 OCR 错误，允许修复并记录证据。
4. 已有 `questions-structure-repaired.json`、`questions-auto-repaired.json`、`questions-human-reviewed.json` 或 Codex evidence 时，优先吸收其中已有证据支持的修复。
5. 只有字段缺失、乱码无法唯一恢复、图片承载关键文字或 paper/solution 仍不可判定时，才保留 active anomaly；不要笼统要求全卷 PDF 复核。

必须完成：
1. 逐题核对现有 staging，保证题数、稳定 ID、题型、题干、选项、答案和解析对应。
2. 修复可由 Markdown、已有修复产物或严格数学逻辑唯一确定的 OCR、切分、归属和格式错误。
3. 同步更新：
   - `content/staging/math1/{{YEAR}}/questions.json`
   - `content/staging/math1/{{YEAR}}/anomalies.json`
   - `content/staging/math1/{{YEAR}}/validation.json`
   - `content/staging/math1/{{YEAR}}/summary.md`
   - `content/review/math1/{{YEAR}}/questions-reviewed.json`
   - `content/review/math1/{{YEAR}}/anomalies-reviewed.json`
   - `content/reports/math1-{{YEAR}}/human-review-checklist.md`
   - `content/reports/math1-{{YEAR}}/conflicts-and-uncertainties.md`
   - `content/reports/math1-{{YEAR}}/md-finalization.md`
4. 所有问题仍使用 `needs_human_review`，但在 `md-finalization.md` 明确给出：
   - `ready_for_approval`：无 active error/warning，内容已由 Markdown/既有证据闭合；
   - `ready_with_info`：只有非阻塞 info；
   - `blocked`：仍有无法唯一恢复的内容问题。
5. 不得修改来源库、其他年份、`content/approved/`、`task_plan.md` 或 `notes.md`。
6. `ready_with_info` 只是题目分类，不等于 agent warning。若 active error=0、active warning=0 且所有强制检查通过，`agent-result.json.status` 必须为 `completed`；只有确有 active warning、failed/not_run check 或其他具体风险时才使用 `completed_with_warnings`。

验证要求：
- Node `JSON.parse`
- Python `json.load`
- Windows PowerShell `Get-Content -Raw -Encoding utf8 | ConvertFrom-Json`
- staging/review 题数相等
- stableId 唯一
- 所有题目 `needs_human_review`
- active anomaly 计数与 severity 汇总一致
- `candidateResult` 不截断
- 上述 Node、Python、PowerShell 验证命令已由任务级 `allowedTools` 授权；必须实际执行，不得再次请求批准，也不得以权限为由标记 `not_run`。
- Execute every helper/fix script immediately inside this task. Never stop after preparing a script and never ask for another approval.
- JSON keys and string delimiters must use ASCII double quotes only; never emit curly quotes.
- After every JSON overwrite, immediately run all three required parsers. Fix any parse failure before writing the final report.

必须生成 `{{RUN_DIR}}\agent-result.json` 和 `{{RUN_DIR}}\agent-report.md`，如实记录命令、修改文件、未解决问题和最终状态。
