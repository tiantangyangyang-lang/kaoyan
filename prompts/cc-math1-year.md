执行数学一 {{YEAR}} 年确定性转换任务。

先阅读：
- `真题内容解析与代理处理规范.md`
- `content/reports/math1-1987-2025/batch-manifest.json`
- `content/reports/math1-1987-2025/batch-readiness.md`

只读使用本次运行目录中的 source-mirror。输出只能进入：
- `content/staging/math1/{{YEAR}}/`
- `content/reports/math1-{{YEAR}}/`
- 与本任务直接相关的 `scripts/` 和 `tests/`

要求：
1. 先读取 batch manifest 中 {{YEAR}} 的 structureFamily、risks 和 disposition；blocked 年份不得强行转换。
2. 每个稳定 ID 使用 `math1-{{YEAR}}-qNN`。旧制年份若存在大题与小题层级，必须设计稳定的层级 ID，不得把不同章节中的 `(1)` 合并。
3. 保留来源相对路径、文件 SHA-256、HEAD commit、dirty 状态和转换版本。
4. 不判断数学正确性，不静默修复 OCR 或公式，不补写缺失答案/解析。
5. 所有题目保持 `needs_human_review`。
6. 正常年份题数必须与 manifest/试卷结构一致；不一致必须标记错误。
7. 输出必须确定性运行，并提供真实测试、命令和完整 changedFiles/createdFiles。
8. 不得修改来源库、其他年份 staging、review、approved、task_plan.md 或 notes.md。

若该年份的 staging 已存在，先验证现有产物；只有发现可复现问题时才能修改，并在报告中逐项说明。
