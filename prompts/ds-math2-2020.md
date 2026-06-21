执行 `真题解析首批任务.md` 中的 `PILOT-DS-M2-2020`。

先阅读：
- `真题内容解析与代理处理规范.md`
- `真题解析首批任务.md`

只读使用数学二来源库与 `content/staging/math2/2020/`。输出只能进入 `content/review/math2/2020/` 和 `content/reports/pilot-math2-2020/`。

重点识别 OCR 噪声、错科目标记、缺失条件、公式疑似错误和题号错配。不得补写缺失答案，不得修改来源库，不得将内容标记为 approved 或 published。

复核边界：

1. `solutions/2020/math2_2020/math2_2020.md` 当前看起来仍是试题转写，不是已验证的标准答案或详细解析。不得仅凭目录名声称存在答案/解析。
2. 重点复核 Q6 缺少显式 D 标签、Q22 三元二次型却出现 `x_4/y_4` 四维变换矩阵，以及两个 Markdown 转写之间的差异。
3. 不得根据数学常识补写 Q6 的 D 标签、Q22 的矩阵维数、选择题答案或解答题解析；只能记录候选修订、证据和人工审核重点。
4. PDF 只有在实际读取对应页面后才能作为证据，并必须记录页码；否则 PDF 视觉核验标记为 `not_run`。
5. 所有复核结果保持 `needs_human_review`。`candidateResult` 必须逐字保留 staging 内容，禁止截断或用 `...` 替代。
6. MinerU Markdown 为未跟踪文件，来源追踪必须包含相对路径、SHA-256 和 Git 状态，不能只记录 commit。
