# 多代理开发任务清单

> 用途：在核心架构和契约确定后，把明确、批量、可验收的任务交给 Claude Code 或 DeepSeek 4 Pro。任何任务执行前都要把“允许修改文件”和“禁止修改文件”替换成真实路径。

真题内容处理必须遵循 `真题内容解析与代理处理规范.md`。两个来源库 `D:\work\Kaoyan-Math1-Papers` 和 `D:\work\Kaoyan-Math2-Papers` 始终只读，代理输出只能写入 `D:\work\kaoyan`。

首批可直接执行的提示词和顺序见 `真题解析首批任务.md`。

## 执行顺序

1. 主负责人先完成题目 Schema、数据库 Schema、API 契约和目录结构。
2. Claude Code 实现工程骨架与独立功能模块。
3. DeepSeek 4 Pro 转换样题和生成批量校验材料。
4. 主负责人进行代码审查、集成、安全检查和上线验证。

## CC-00：来源库盘点与异常清单

```text
目标：只读扫描数学一、数学二来源库，生成可重复的 inventory 和异常报告。
只读输入：D:\work\Kaoyan-Math1-Papers；D:\work\Kaoyan-Math2-Papers
允许修改的文件：content/inventory/**、内容盘点脚本与测试
禁止修改的文件：两个来源库中的全部文件、生产数据库、approved 内容
输入与接口契约：真题内容解析与代理处理规范.md
验收标准：记录来源 commit、文件相对路径、大小、哈希、年份候选、类型候选；识别重复版本、错科目目录和缺失配对
必须运行的命令：inventory 单测；两库 dry-run；重复运行结果一致性检查
输出格式：读取文件数、年份覆盖、异常数、inventory 路径、报告路径
```

## CC-01：工程骨架

```text
目标：创建 pnpm workspace，包含 Vue 3/Vite 前端、NestJS 后端和共享 contracts 包。
允许修改的文件：根目录工程配置、apps/web/**、apps/api/**、packages/contracts/**
禁止修改的文件：prisma/schema.prisma、部署密钥、DNS 配置
输入与接口契约：以仓库 README 和已确定目录结构为准
验收标准：前后端可分别启动；根目录可运行 lint、typecheck、test；API 提供 /health
必须运行的命令：pnpm lint；pnpm typecheck；pnpm test；pnpm build
输出格式：变更文件列表、命令结果、剩余问题
```

## CC-02：真题列表与筛选

```text
目标：实现真题列表 API 和前端筛选页。
允许修改的文件：catalog 模块、对应前端页面与测试
禁止修改的文件：认证模块、Prisma Schema、共享内容 Schema
输入与接口契约：使用已发布 OpenAPI；支持 subject/year/paper/questionType/knowledgePoint/mastery 分页筛选
验收标准：筛选条件可组合；URL 保存筛选状态；空状态和加载错误可见
必须运行的命令：模块单测、API 集成测试、前端组件测试
输出格式：变更文件列表、接口样例、测试结果
```

## CC-03：掌握状态与错题本

```text
目标：实现 question_attempts 和 user_question_states 的服务、接口与页面交互。
允许修改的文件：learning 模块、错题本页面、对应测试
禁止修改的文件：认证核心、内容发布模块、Prisma Schema
输入与接口契约：作答记录不可变；当前状态更新必须事务化
验收标准：做错自动入错题本；做对不自动移除；并发重复提交不会破坏状态
必须运行的命令：服务单测、事务集成测试、错题本 E2E
输出格式：状态转换说明、变更文件列表、测试结果
```

## CC-04：内容导入与校验

```text
目标：实现 JSON/CSV 导入、Schema 校验、重复题检测和失败报告。
允许修改的文件：内容导入脚本、content-schema 包、测试 fixtures
禁止修改的文件：生产数据库配置、已发布题目数据
输入与接口契约：使用固定 question-import.schema.json
验收标准：整批导入前先 dry-run；错误精确到文件、题号和字段；失败时不写入部分数据
必须运行的命令：导入脚本测试、dry-run 示例、事务回滚测试
输出格式：成功数、失败数、失败报告路径、测试结果
```

## CC-05：整卷录入与确定性薄弱点分析

```text
目标：实现 paper_attempts、question_attempts 和 knowledge_point_snapshots 的服务、接口与测试。
允许修改的文件：analysis 模块、整卷录入页面、对应测试
禁止修改的文件：AI 提示词、Obsidian 导出模板、认证核心、内容 Schema
输入与接口契约：使用已冻结的题型录入与 weakness-score 契约
验收标准：自动判分与用户自评来源可区分；少于 3 道证据时标记证据不足；同一输入重复分析结果一致
必须运行的命令：评分单测、API 集成测试、整卷录入 E2E
输出格式：评分规则说明、变更文件列表、测试结果
```

## CC-06：Obsidian ZIP 导出

```text
目标：根据固定导出契约生成可直接打开的 Obsidian Vault ZIP。
允许修改的文件：export 模块、Obsidian 模板、导出测试
禁止修改的文件：薄弱点评分、AI 提示词、认证核心
输入与接口契约：以 Obsidian学习分析导出设计.md 和 obsidian-export-example/ 为准
验收标准：生成 Markdown、wikilinks、Canvas、manifest；所有 Canvas 文件节点存在；默认不含手写附件和完整题干
必须运行的命令：导出快照测试、链接完整性检查、ZIP 解压冒烟测试
输出格式：导出文件清单、无效链接数、测试结果
```

## DS-01：20 道样题格式化

```text
目标：从指定只读来源批次中，把人工指定的 20 道样题转换为 question-import.schema.json 候选格式。
允许修改的文件：content/imports/sample/**
禁止修改的文件：D:\work\Kaoyan-Math1-Papers\**、D:\work\Kaoyan-Math2-Papers\**、Schema、应用代码
输入与接口契约：严格使用给定 Schema、LaTeX 约定和真题内容解析与代理处理规范.md
验收标准：不补写未知答案；不静默改变题意；每题保留来源路径、commit、原文和修改说明；通过 JSON Schema 和 KaTeX 检查
必须运行的命令：项目提供的 content validate 命令
输出格式：读取文件数、转换清单、无法确定字段列表、冲突清单、校验结果
```

## DS-04：单年份真题与解析语义复核

```text
目标：复核一个学科、一个年份、最多 25 道题的候选结构化结果。
只读输入：指定来源库中的该年份真题、解析、PDF、JSON 和图片；content/staging/{subject}/{year}/**
允许修改的文件：content/review/{subject}/{year}/**、content/reports/{batch-id}/**
禁止修改的文件：两个来源库、content/approved/**、生产数据库、Schema
输入与接口契约：真题内容解析与代理处理规范.md
验收标准：逐题输出来源、候选结果、修改说明、不确定项、冲突项、知识点候选和置信度；不补写缺失答案
必须运行的命令：content validate；KaTeX 检查；来源追踪检查
输出格式：处理题数、冲突数、需人工确认数、报告路径
```

## DS-02：公式回归样例

```text
目标：基于已有样题整理至少 30 个公式渲染回归样例。
允许修改的文件：content/fixtures/formulas/**
禁止修改的文件：渲染器实现、Schema、生产内容
输入与接口契约：覆盖行内、块级、矩阵、积分、分段函数、对齐和中文混排
验收标准：每个样例包含名称、输入、期望无错误标志和来源题号
必须运行的命令：项目提供的 formula fixture test
输出格式：覆盖类型统计、失败样例、测试结果
```

## DS-03：AI 分析越界测试集

```text
目标：根据脱敏结构化作答记录生成 AI 分析回归样例，重点识别无证据推断。
允许修改的文件：content/fixtures/analysis/**
禁止修改的文件：生产提示词、用户数据、评分代码
输入与接口契约：只使用给定统计、知识点和证据题号；输出遵循固定 JSON Schema
验收标准：覆盖证据不足、自评题、最终答案错误、重复错误和 AI 虚构步骤错误场景
必须运行的命令：项目提供的 analysis fixture test
输出格式：样例清单、预期拒绝原因、测试结果
```

## 主负责人审查清单

- 代理是否修改了禁止修改区域。
- 数据库迁移是否可回滚且未丢数据。
- API 是否与 OpenAPI 契约一致。
- 内容是否经过 Schema、KaTeX、XSS 和来源检查。
- 测试是否真正覆盖验收标准，而不只是通过空断言。
- AI 分析是否引用证据题号，并避免推断不存在的解题步骤。
- Obsidian 导出是否可以无插件打开，且内部链接和 Canvas 节点有效。
- 两个来源库是否保持未修改状态，所有题目是否可追踪到来源 commit 和相对路径。
- 内容许可是否允许当前发布方式；授权未明确的内容不得发布。
