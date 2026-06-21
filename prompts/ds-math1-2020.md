执行 `真题解析首批任务.md` 中的 `PILOT-DS-M1-2020：数学一 2020 语义复核`。

先阅读：
- `真题内容解析与代理处理规范.md`
- `真题解析首批任务.md`

只读使用数学一来源库与 `content/staging/math1/2020/`。输出只能进入 `content/review/math1/2020/` 和 `content/reports/pilot-math1-2020/`。

不得补写缺失答案，不得修改来源库，不得将内容标记为 approved 或 published。逐题保留来源、修改说明、不确定项、冲突项、知识点候选和置信度。

执行边界：

1. 禁止修改 `content/staging/math1/2020/`、`task_plan.md`、`notes.md`、脚本、测试和来源副本；仅写入 `content/review/math1/2020/`、`content/reports/pilot-math1-2020/` 以及本次运行目录中的结果日志。
2. 所有复核结果仍必须保持 `needs_human_review`，不得创建或建议自动创建 `approved` / `published` 内容。
3. 必须重点复核三项已知警告：解析首节标题错误、Q3 缺少显式 D 选项标签、Q22 解析题号与 Q21 文本粘连。
4. 不得根据数学常识补写 Q3 选项标签或改写 Q22 来源文本；只能记录候选判断、证据和置信度。
5. `agent-result.json` 必须如实列出所有实际变更、执行命令和测试结果；禁止修改 `task_plan.md`。
6. 本次输入是 Codex 从失败的 `20260614-165832-cc-math1-2020` 运行中恢复并验证的 staging；不得声称原 CC 代理运行成功。可引用对应 `recovery-report.md`，但不得修改它。
7. `candidateResult` 必须逐字保留 staging 候选内容。任何规范化、修复或知识点判断只能写入修改建议、冲突、不确定项和证据字段，不得直接改写候选题干、选项、答案或解析。
8. 真题 Markdown 不包含标准答案，不得声称完成“真题答案与解析答案比较”。只能检查解析答案是否与候选结构一致，并明确其仍需人工核对。
9. 只有实际读取并检查 PDF 页面后才能声称 PDF 证据；若无法进行视觉核验，必须记录为 `not_run` / `needs_human_review`，不得根据 Markdown 推测 PDF 内容。
10. 只有实际执行 KaTeX 渲染器后才能把 KaTeX 检查标为 `passed`。若环境没有 KaTeX，只能报告基础 LaTeX 结构检查结果，并将真实 KaTeX 渲染检查标为 `not_run`。
11. 计划中新增的 Q4-Q6 题号格式、Q8/Q14 章节标题混入、Q8 逗号小数等只能作为待证实候选异常；输出时必须附来源证据，不能静默修复或直接认定数学含义。
12. 使用 staging 的 `generatedAt`、source commit 和来源哈希作为复核元数据，禁止写入伪造占位值。结果状态应为 `completed_with_warnings`，因为所有内容仍需人工审核。
13. `candidateResult` 中的题干、选项、答案候选、解析候选、状态和异常必须与 staging 对应字段完全一致，禁止用 `...`、摘要或截断文本代替。每条 review 顶层必须显式写入 `reviewStatus: needs_human_review`。
