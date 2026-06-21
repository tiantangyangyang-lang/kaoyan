执行数学一 {{YEAR}} 年语义复核任务。

先阅读：
- `真题内容解析与代理处理规范.md`
- `content/reports/math1-1987-2025/batch-manifest.json`
- `content/staging/math1/{{YEAR}}/`
- 如果存在：`content/reports/math1-{{YEAR}}/codex-visual-evidence.json`

只读使用 `source-mirror/` 与该年份 `staging/`。
输出只能写入：
- `content/review/math1/{{YEAR}}/`
- `content/reports/math1-{{YEAR}}/`
- `{{RUN_DIR}}\agent-result.json`
- `{{RUN_DIR}}\agent-report.md`

必须创建或更新以下文件：
- `content/review/math1/{{YEAR}}/questions-reviewed.json`
- `content/review/math1/{{YEAR}}/anomalies-reviewed.json`
- `content/reports/math1-{{YEAR}}/human-review-checklist.md`
- `content/reports/math1-{{YEAR}}/conflicts-and-uncertainties.md`
- `{{RUN_DIR}}\agent-result.json`
- `{{RUN_DIR}}\agent-report.md`

核心要求：
1. 逐题保留 `candidateResult` 原文，禁止截断、摘要或使用 `...` 代替。
2. 识别缺失选项、缺失解析、OCR 噪声、公式疑似错误、题号/章节错配、图片依赖和 paper/solution 冲突。
3. 不得根据数学常识补写答案、选项标签或含义不明确的公式。
4. 所有结果保持 `needs_human_review`，不得创建 `approved` 或 `published` 内容。
5. PDF 只有在实际读取并记录页码后才能作为证据，否则统一标记 `not_run`。
6. 如果发现 `error` 级问题，仍可使用 `completed_with_warnings`，但不得隐藏失败检查项、人工复核项或真实命令。
7. `agent-result.json` 中：
   - `createdFiles` 只列真实新建文件
   - `changedFiles` 只列真实修改文件
   - 如果覆盖已有 review 产物，不得再把它列入 `createdFiles`
8. 你必须执行并如实记录至少 1 条真实验证命令到 `commandsRun`。
9. 如果同时满足以下条件：
   - `content/reports/math1-{{YEAR}}/codex-visual-evidence.json` 存在；
   - staging `validation.json` 中 `codexVisualEvidenceApplied == true`；
   - evidence 文件的年份、PDF SHA-256 与 staging 记录一致；
   则该 evidence 文件代表已完成的 Codex 视觉人工复核。你没有视觉能力，不得声称自己查看了 PDF，
   但必须将其中已应用的修正视为 `verified_by_codex_visual_review`，不得再次创建
   `needs_human_pdf_confirm` warning，也不得要求用户重复确认相同页码。
10. `anomalies` 只记录当前仍然存在的问题：
   - 已解决的问题不得重新作为 active anomaly；
   - 已存在且路径有效的必要图片属于题目资产，不是 anomaly；
   - 来源仓库整体 dirty 但该年份来源哈希匹配，属于 provenance 信息，不是题目 anomaly；
   - 解答题/证明题已有完整 `explanationCandidate` 时，`answerCandidate=null` 不自动视为 anomaly；
   - 纯排版偏好不得升级为 warning/error。

questions-reviewed.json 固定契约：
- 顶层必须是单个 JSON 对象，不得写成数组。
- 顶层必须包含且只包含这些键：
  - `schemaVersion`
  - `runId`
  - `task`
  - `subjectCode`
  - `sourceYear`
  - `sourceRepo`
  - `sourceCommit`
  - `sourceDirty`
  - `reviewedAt`
  - `reviewStatus`
  - `totalQuestions`
  - `questions`
  - `reviewSummary`
- `questions` 必须是数组。顶层数组名只能叫 `questions`，不得使用 `reviews`。
- 每个 question 对象必须包含：
  - `stableId`
  - `questionNumber`
  - `questionType`
  - `reviewStatus`
  - `candidateResult`
  - `semanticReview`
- `candidateResult` 必须包含：
  - `stem`
  - `options`
  - `answerCandidate`
  - `answerStatus`
  - `explanationCandidate`
  - `explanationStatus`
  - `anomalies`
- `semanticReview` 必须包含：
  - `confidence`
  - `suggestedKnowledgePoints`
  - `paperSolutionConflicts`
  - `ocrNoise`
  - `formulaIssues`
  - `structuralIssues`
  - `humanReviewFocus`
  - `pdfEvidence`

anomalies-reviewed.json 固定契约：
- 顶层必须是单个 JSON 对象，不得写成数组。
- 顶层必须包含且只包含这些键：
  - `schemaVersion`
  - `runId`
  - `task`
  - `subjectCode`
  - `sourceYear`
  - `sourceRepo`
  - `sourceCommit`
  - `sourceDirty`
  - `reviewedAt`
  - `reviewStatus`
  - `totalAnomalies`
  - `anomaliesBySeverity`
  - `anomalies`
  - `pdfEvidence`
  - `summary`
- `anomalies` 必须是平铺数组。
- 顶层不得增加 `resolvedFromPreviousRuns` 或任何其他键。已解决历史只能写入 `summary`、
  `human-review-checklist.md` 或 `conflicts-and-uncertainties.md`。
- 每个 anomaly 对象必须包含：
  - `anomalyId`
  - `severity`
  - `type`
  - `message`
  - `questionNumbers`
  - `sourceEvidence`
  - `humanAction`

计数一致性要求：
1. `totalQuestions == len(questions)`
2. `totalAnomalies == len(anomalies)`
3. `anomaliesBySeverity.error + anomaliesBySeverity.warning + anomaliesBySeverity.info == totalAnomalies`
4. `agent-result.json` 中的计数必须与 review 产物一致
5. `agent-result.json` 的 `counts.errors` 必须等于 `anomaliesBySeverity.error`，
   `counts.warnings` 必须等于 `anomaliesBySeverity.warning`

建议在完成前运行真实校验命令，至少验证：
- 两个 JSON 文件都能成功解析
- `totalQuestions` 与数组长度一致
- `totalAnomalies` 与数组长度一致
- `anomaliesBySeverity` 三类计数求和正确

human-review-checklist.md 必须：
- 用 P0 / P1 / P2 列出人工复核优先级
- 明确指出哪些问题是 `error`、哪些是 `warning`
- 明确说明 PDF 证据是否 `not_run`
- 如果使用 Codex 视觉证据，明确写成“本代理未运行 PDF；已采用 Codex 视觉复核证据”，
  不得把已确认项重新列为 P0

conflicts-and-uncertainties.md 必须：
- 汇总 paper / solution 冲突数
- 汇总 OCR 噪声类型
- 汇总缺失答案、图片依赖、格式归一化等问题
- 明确说明哪些项需要人工从 PDF 最终确认
