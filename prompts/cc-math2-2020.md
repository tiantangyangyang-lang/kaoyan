执行 `真题解析首批任务.md` 中的 `PILOT-CC-M2-2020`。

先阅读：
- `真题内容解析与代理处理规范.md`
- `真题解析首批任务.md`

只读使用数学二 2020 PDF、MinerU Markdown 和解析目录。输出只能进入 `content/staging/math2/2020/`、`content/reports/pilot-math2-2020/` 以及完成任务所需的转换脚本和测试。

PDF 是人工审核依据。任何 Markdown/PDF 差异进入冲突清单。不要修改来源库，不要将内容标记为 approved 或 published。

执行边界与已知风险：

1. 2020 年应切分为 23 题：8 道选择题、6 道填空题、9 道解答题。数量不符必须失败或标记异常，不得静默补题。
2. `solutions/2020/math2_2020/math2_2020.md` 当前内容看起来仍是试题文本，没有显式标准答案或详细解析。必须先基于内容角色判断验证，不能仅凭目录名把它当解析，也不得自行生成答案。
3. Q6 在解析目录 Markdown 中疑似缺少显式 `(D)` 选项标签；只能保留原文并标记 `incomplete_options`，不得根据四选一格式自行补写。
4. Q22 题干是三元二次型，但 Markdown 中可逆变换矩阵疑似出现 `x_4/y_4` 四维变量；必须标记为高优先级 `formula_needs_review` / PDF 人工核验项，不得静默修正。
5. MinerU Markdown、解析目录 Markdown 和 PDF 的角色与 SHA-256 必须分别记录。数学二 2020 的来源 commit 为 `fd42c56eed412cce0cb97d6bd688f314c78e542e`，MinerU Markdown 是未跟踪文件，不能只用 commit 表示来源。
6. 输入文件预期 SHA-256：
   - PDF: `13d15c42540080692e3c6073376aebcf6911b7bc2ac38dbe833a4eac1986e1f6`
   - MinerU Markdown: `12b4c86d1e5ad865f2354e62d1d64ea6d8472f6d07f2cf457127d77d94b7091d`
   - 解析目录 Markdown: `539e2ecb995ce03ad1c2207c1855321732eec3b7c0211c9011477fcb0cd611e7`
7. PDF 只能作为人工视觉核验依据。除非实际提取或查看了对应 PDF 页面并记录页码，否则不得声称完成 PDF 对照。
8. 所有题目必须保持 `needs_human_review`。答案或解析不存在时使用明确的 missing 状态，不得生成占位答案。
9. 转换脚本必须确定性运行，输入路径通过 CLI 参数传入；不得硬编码某次 agent run 目录或动态当前时间。
10. 必须生成并如实填写 `agent-result.json` 与 `agent-report.md`，列出实际命令、测试结果、创建和修改的每个文件。
