# Task Plan: 考研学习系统产品与技术规划

## Active Math1 2024 Completion Pass
- [x] Inspect all 2024 paper and answer candidates without modifying the source repository.
- [x] Implement deterministic 2024 multi-version transformer.
- [x] Generate 2024 staging and local review artifacts.
- [x] Update 1987-2025 coverage reports and verify the complete batch.

Decision: use `papers/2024年数学(一)真题及参考答案.md` as the primary complete
candidate, retain all alternative versions as provenance, and report answer conflicts instead
of silently selecting corrections.

## Active Math1 2024 Human Review Pass
- [x] Identify 2024 high-risk questions and locate the original five-page PDF.
- [x] Visually verify Q13/Q14/Q18/Q19/Q21/Q22 and incomplete choice options against PDF pages.
- [x] Write a separate 2024 human-reviewed artifact with evidence-backed corrections only.
- [x] Validate the artifact and update the batch review status.

Boundary: do not modify the source repository, staging artifact, or canonical local fallback
review. Preserve unresolved mathematical/content conflicts as `needs_human_review`.

User confirmation: Q17-Q22 stems were supplied on 2026-06-15 and incorporated into the separate
human-reviewed artifact. Apparent pasted-text formatting artifacts were normalized against the
visually reviewed PDF.

## Active Math1 2022 PDF Review Pass
- [x] Inspect current 2022 anomalies and locate the source PDF/pages.
- [x] Identify deterministic OCR and question-boundary corrections.
- [x] Write a separate PDF-reviewed artifact without modifying staging.
- [x] Validate and report remaining risks.

## Active Math1 1997 Legacy Repair Pass
- [x] Inspect the 14 carried-forward anomalies and identify deterministic parser corrections.
- [x] Write a separate corrected artifact without modifying staging or the source repository.
- [x] Validate the corrected artifact and update the batch report.

## Active Math1 2002 Legacy Repair Pass
- [x] Inspect the 11 carried-forward anomalies and identify deterministic parser corrections.
- [x] Write a separate corrected artifact without modifying staging or the source repository.
- [x] Validate the corrected artifact and update the batch report.

## Active Math1 1992 Legacy Repair Pass
- [x] Inspect the 9 carried-forward anomalies and identify deterministic parser corrections.
- [x] Write a separate corrected artifact without modifying staging or the source repository.
- [x] Validate the corrected artifact and update the batch report.

## Active Math1 1993 Legacy Repair Pass
- [x] Inspect the 7 carried-forward anomalies and identify deterministic parser corrections.
- [x] Write a separate corrected artifact without modifying staging or the source repository.
- [x] Validate the corrected artifact and update the batch report.

## Active Math1 1990 Legacy Repair Pass
- [x] Inspect the 8 carried-forward anomalies and identify deterministic parser corrections.
- [x] Write a separate corrected artifact without modifying staging or the source repository.
- [x] Validate the corrected artifact and update the batch report.

## Active Math1 1991 Legacy Repair Pass
- [x] Inspect the 5 carried-forward anomalies and identify deterministic parser corrections.
- [x] Write a separate corrected artifact without modifying staging or the source repository.
- [x] Validate the corrected artifact and update the batch report.

## Active Math1 2003 Legacy Repair Pass
- [x] Inspect the 7 carried-forward anomalies and identify deterministic parser corrections.
- [x] Write a separate corrected artifact without modifying staging or the source repository.
- [x] Validate the corrected artifact and update the batch report.

## Active Math1 1988 Legacy Repair Pass
- [x] Inspect the 3 carried-forward anomalies and identify deterministic parser corrections.
- [x] Write a separate corrected artifact without modifying staging or the source repository.
- [x] Validate the corrected artifact and update the batch report.

## Active Math1 1989 Legacy Repair Pass
- [x] Inspect the 6 carried-forward anomalies and identify deterministic parser corrections.
- [x] Write a separate corrected artifact without modifying staging or the source repository.
- [x] Validate the corrected artifact and update the batch report.

## Active Math1 1995 Legacy Repair Pass
- [x] Inspect the 4 carried-forward anomalies and identify deterministic parser corrections.
- [x] Write a separate corrected artifact without modifying staging or the source repository.
- [x] Validate the corrected artifact and update the batch report.

## Active Math1 1996 Legacy Repair Pass
- [x] Inspect the 4 carried-forward anomalies and identify deterministic parser corrections.
- [x] Write a separate corrected artifact without modifying staging or the source repository.
- [x] Validate the corrected artifact and update the batch report.

## Active Math1 1998 Legacy Repair Pass
- [x] Inspect the 1 carried-forward anomaly and identify deterministic parser corrections.
- [x] Write a separate corrected artifact without modifying staging or the source repository.
- [x] Validate the corrected artifact and update the batch report.

## Active Math1 1999 Legacy Repair Pass
- [x] Inspect the 1 carried-forward anomaly and identify deterministic parser corrections.
- [x] Write a separate corrected artifact without modifying staging or the source repository.
- [x] Validate the corrected artifact and update the batch report.

## Active Math1 2025 Review Pass
- [x] Inspect the 12 carried-forward anomalies and separate deterministic issues from missing-source limits.
- [x] Apply only source-supported corrections in a separate artifact if available.
- [x] Validate and report the remaining human-review items.

## Active Math1 2000 External Claude Handoff
- [x] Inspect the current 2000 anomalies and identify the likely deterministic repair shape.
- [x] Prepare an external Claude Code handoff bundle for the 2000 task.
- [ ] Run the prepared bundle in a user-controlled Claude Code session.
- [ ] Review the returned 2000 repair result inside this repository.

Boundary: tenant policy blocks Codex from exporting the 2000 workspace task data to Claude Code
directly, even with user approval. Codex may prepare the handoff bundle and review results, but
the actual external Claude execution must be launched outside this session.

## Active Claude Queue Automation
- [x] Design a local queue runner so Claude Code can execute repetitive yearly tasks outside Codex.
- [x] Add a reusable queue script and CMD wrapper under `scripts/`.
- [x] Seed the remaining legacy Math1 queue for 2000 and 2001.
- [x] Verify the queue runner in `-PrepareOnly` mode without triggering external Claude execution.
- [x] Add an explicit guard that blocks real queue execution inside Codex and provide an external-launch CMD helper.
- [ ] Use the queue runner in a user-controlled local shell for the real Claude execution.

## Active Math1 2000-2001 Post-Repair Audit
- [x] Audit the completed Claude staging runs for 2000 and 2001.
- [x] Confirm both queue entries finished as `completed_with_warnings` with source/output integrity preserved.
- [x] Identify the main follow-up gap: review artifacts still reflect older local fallback state and are now stale relative to staging.
- [x] Prepare the next external Claude queue for semantic review sync of 2000 and 2001.
- [x] Run the semantic-review queue in a user-controlled local shell and re-audit the refreshed review artifacts.

## Active DS Review Contract Tightening
- [x] Audit the refreshed 2000/2001 semantic review outputs for structural consistency.
- [x] Confirm the remaining issue is output-contract drift, not source integrity or queue execution.
- [x] Rewrite `prompts/ds-math1-year.md` with an explicit review artifact schema and count-consistency rules.
- [x] Prepare a rerun queue for 2000 and 2001 under the tightened prompt contract.
- [x] Run the semantic-review rerun queue in a user-controlled local shell and verify the new artifacts are structurally consistent.

## Active Math1 2002-2003 Semantic Review Sync
- [x] Audit the current 2002/2003 review artifacts and confirm they still reflect stale local-fallback output.
- [x] Confirm the next highest-value external rerun scope is the 2002/2003 pair, not another local repair pass.
- [x] Prepare a DS semantic-review queue and launcher for 2002 and 2003 under the tightened prompt contract.
- [x] Run the 2002/2003 semantic-review queue in a user-controlled local shell and verify the refreshed artifacts.

## Active Math1 2002-2003 Legacy Repair Sync
- [x] Audit the refreshed 2002/2003 review outputs and separate review-contract success from staging-content failure.
- [x] Confirm the dominant remaining issues are deterministic legacy structure errors in staging, not DS review schema drift.
- [x] Prepare a `cc-math1-year` queue and launcher for 2002 and 2003 staging repair.
- [x] Run the 2002/2003 legacy-repair queue in a user-controlled local shell.
- [x] Audit the result and confirm `cc-math1-year` only verified existing staging instead of repairing known P0 issues.
- [x] Add strict repair task routing so validation-only runs are not acceptable for known legacy defects.
- [x] Re-check current staging and confirm 2002 is already repaired while 2003 still needs strict repair.
- [x] Run the strict 2003 legacy-repair queue in a user-controlled local shell.
- [x] Audit the strict repair output and confirm the staging repair succeeded despite wrapper failure caused by an omitted reported path.
- [x] Re-run 2003 semantic review after strict staging repair and verify the refreshed review artifacts.
- [x] Identify that the remaining Q7 error is a false missing-source result caused by the runner omitting the paper image directory.
- [x] Add Math1 paper-image mirroring and prepare a dedicated 2003 PDF/image evidence repair queue.
- [x] Chain PDF evidence repair and semantic review into one queue, stopping automatically if repair is blocked.
- [x] Run the combined 2003 PDF repair and semantic-review queue in a user-controlled local shell.
- [x] Audit the result and identify that the agent skipped visual review solely because `pdftoppm` was absent.
- [x] Verify the bundled runtime can extract all 11 scanned PDF page images without Poppler.
- [x] Add a reusable PDF page-image extractor and make visual PNG inspection mandatory.
- [x] Complete Codex-only visual review for Q10/Q18/Q19/Q22.
- [x] Write machine-readable visual evidence and prepare a text-only Claude application queue.
- [x] Run the 2003 visual-evidence application and semantic-review queue externally.
- [x] Verify all four visual corrections were applied and staging active anomalies reached zero.
- [x] Identify semantic-review drift: DeepSeek re-opened verified Codex corrections and violated the fixed top-level contract.
- [x] Tighten the semantic-review prompt and prepare a 2003-only rerun.
- [x] Run the tightened 2003 semantic-review rerun externally and verify no visual-confirmation warnings remain.
- [x] Audit the new Q17 truncation finding against PDF page 6 and confirm two method-review identities are missing.
- [x] Add Q17 as the fifth Codex visual-evidence correction and prepare an application/review queue.
- [x] Run the Q17 evidence application and final semantic-review queue externally.
- [x] Detect that the Q17 application corrupted staging JSON escaping despite false validation claims.
- [x] Confirm Q19 method-review is also truncated and add it as the sixth Codex evidence correction.
- [x] Prepare a strict JSON recovery/Q19 application/final-review queue with three-parser validation.
- [x] Audit the generated recovery script and identify duplicate-append, Python quoting, and missing PowerShell validation defects.
- [x] Tighten the recovery prompt to require script correction and immediate execution without another approval pause.
- [x] Run the strict recovery queue externally and verify the recovered staging package with Node, Python, and Windows PowerShell.
- [x] Repair the recovery run bookkeeping omitted by Claude and prepare a semantic-review-only queue.
- [x] Run and audit the final Math1 2003 semantic review.
- [x] Audit all 22 Math1 2003 questions against the solution Markdown and existing Codex evidence.
- [x] Correct the deterministic Q8 option OCR conflict and synchronize staging/review reports.
- [ ] Obtain the explicit approval decision for promoting the 22 reviewed questions.

## Active Math1 Markdown-First Finalization
- [x] Define one Markdown-first yearly task: paper MD for stems/options, solution MD for answers/explanations, existing evidence for known repairs.
- [x] Create a 37-year queue excluding completed 2003 and source-blocked 1994.
- [x] Verify task routing, source mirroring, per-year write boundaries, and a two-entry prepare-only pilot.
- [x] Run the formal 1991 + 2022 pilot and audit both outputs.
- [x] Run entries 3-37 after the pilot passes.
- [x] Audit all seven wrapper failures and accept five completed years without rerunning them.
- [x] Run the minimal 2002/2010 retry queue and audit both outputs.
- [x] Prepare and validate the all-years final aggregation queue.
- [x] Audit the first aggregation and identify stale retry evidence plus per-question status identity corruption.
- [x] Prepare a corrected v2 aggregation with explicit stableId/question-number mapping and regression checks.
- [x] Run and independently verify the corrected aggregation.
- [x] Run the all-years final aggregation and independently verify the final question bank.
- [x] Aggregate `ready_for_approval`, `ready_with_info`, and `blocked` years into the final batch report.

Decision: visual/PDF work is exception-only. A year is closed from Markdown when paper/solution
content, mathematical logic, and existing evidence uniquely determine all fields.

## Active Math1 Simplified Full Completion
- [x] Inventory all 1987-2025 non-blocked years from current staging/review JSON and source Markdown.
- [x] Add a Markdown-first finalization task: match paper and solution by question, repair only deterministic conflicts, and avoid default PDF review.
- [x] Run the repetitive yearly finalization through Claude Code / DeepSeek, excluding completed 2003 and blocked 1994.
- [x] Handle only the residual image, missing-source, or irreducible conflicts with Codex judgment.
- [x] Produce and verify the final usable Math1 question bank plus a complete batch report.

Decision: paper Markdown and solution Markdown are the default evidence. Images/PDF are consulted only when a field is missing, garbled, or logically inconsistent after Markdown comparison.

## Active Math1 Web MVP
- [x] Create a React + Vite + TypeScript web application under `apps/web`.
- [x] Add canonical Math1 content synchronization for all 852 questions.
- [x] Implement dashboard, question bank filters, practice workspace, KaTeX rendering, mastery states, wrong book, and evidence-based statistics.
- [x] Persist learning state in subject-scoped localStorage and add JSON export.
- [x] Reserve the subject catalog and data adapter for future Math2 support.
- [x] Pass TypeScript typecheck and production build.
- [x] Run browser QA for desktop dashboard, practice, answer reveal, and wrong-book persistence; fix the revealed-answer state bug.
- [ ] Re-run the final mobile smoke screenshot after the local execution quota resets.

Decision: the first usable release is local-first and account-free. Authentication, MySQL,
cross-device sync, knowledge-point analysis, and Obsidian ZIP export remain the next backend phase.

## Active Math1 Web Learning Loop
- [x] Review the existing MVP and define additive learning-state contracts.
- [x] Add year-based full-paper sessions with persisted drafts and explicit submission.
- [x] Add a prioritized review queue from wrong, fuzzy, and unknown questions.
- [x] Add learning JSON import and Obsidian-compatible ZIP export.
- [x] Pass typecheck, production build, and focused interaction checks.
- [x] Update the web README and backend migration boundary.

Decision: paper answers remain drafts until submission. Only submitted correctness judgments update
attempt counts, wrong-book state, and study statistics.

## Active Web Deployment And Email Auth
- [x] Audit the supplied Cloudflare DNS export and preserve existing SpaceMail records.
- [x] Add a deployable API with MySQL-backed users, sessions, and email-verification tokens.
- [x] Add registration, verification, login, logout, and explicit cloud-sync UI to the web app.
- [x] Add Render/Cloudflare environment templates, health checks, and a non-destructive DNS change plan.
- [x] Pass API/Web builds and authentication-flow tests.

Boundary: do not change live Cloudflare DNS, Aiven, or mail-provider settings without exact target
hostnames and credentials. Existing MX, SPF, and autodiscover records must remain untouched.

## Goal
输出一份可用于启动开发、任务分工和上线部署的考研学习系统实施方案，并纳入纸上作答、网站录入、AI 薄弱点分析和 Obsidian 导出闭环。

## Phases
- [x] Phase 1: 明确目标、边界与规划结构
- [x] Phase 2: 核验外部部署条件与关键技术风险
- [x] Phase 3: 设计产品范围、架构、数据模型和实施路线
- [x] Phase 4: 拆分 Codex 与 Claude Code / DeepSeek 任务并复核方案
- [x] Phase 5: 设计纸上作答录入、AI 分析与 Obsidian 导出
- [x] Phase 6: 盘点数学一/数学二来源库并定义代理解析规范
- [x] Phase 7: 提供 Claude Code / DeepSeek 4 Pro 可执行命令与统一启动脚本
- [x] Phase 8: 增加代理运行日志、来源完整性快照和自动失败判定

## Key Questions
1. 如何让数学 MVP 能自然扩展到政治、英语和专业课？
2. 真题、答案、解析和公式内容如何建模与稳定渲染？
3. 当前域名、Cloudflare 与 Aiven MySQL 应如何接入？
4. 哪些任务需要主工程判断，哪些适合批量交给其他编码代理？
5. 如何在不依赖不准确手写 OCR 的情况下分析纸上作答，并生成可复用的 Obsidian 学习包？
6. 如何让代理批量解析现有真题资料，同时保持来源可追踪、原始库不被修改且错误不被自动发布？

## Decisions Made
- 首版只交付考研数学核心闭环：筛题、做题、查看解析、掌握状态、错题复盘。
- 采用学科通用数据模型，数学专属内容通过题型和内容块扩展。
- 本轮只输出规划文档，不初始化项目、不修改 DNS、不创建外部资源。
- 推荐采用 Vue 3 + NestJS 的 TypeScript 全栈单仓库，保持前后端独立部署。
- Aiven 免费 MySQL 仅作为 MVP 数据库，图片使用对象存储。
- 用户默认在纸上答题，网站负责结构化录入结果；手写照片仅作可选凭证，不作为 MVP 自动判分依据。
- 薄弱点先由确定性统计规则计算，AI 只生成解释和复习建议，并标记结论置信度。
- MVP 通过 ZIP 导出独立 Obsidian Vault，不直接写用户本地 Vault，也不要求安装插件。
- 数学一、数学二来源库均为只读；代理按单学科、单年份、最多 25 道题处理，所有候选内容必须人工审核后才能发布。
- 使用 Claude Code 作为执行器、当前已配置的 DeepSeek V4 Pro 作为模型；`cc-*` 与 `ds-*` 仅代表工程处理和语义复核两种任务角色。
- 每次代理运行必须生成独立日志目录；来源库前后快照不一致、缺少结构化结果或退出码异常时自动判定失败。

## Errors Encountered
- The first web chunk split appeared ineffective because a stale generated `apps/web/vite.config.js`
  took precedence over `vite.config.ts`. The generated JS/declaration files were removed and are now
  ignored, so Vite reads the maintained TypeScript config.
- After removing the stale config, Vite exposed a Codex sandbox/real-drive path mismatch for
  `index.html`. `vite.config.ts` now pins `root` to its own directory, which is stable in local,
  sandbox, and Cloudflare Pages builds.
- The first API dependency command used `&&`, which this Windows PowerShell version does not accept
  as a command separator. No packages were changed; installation was split into independent calls.
- Deployment research bootstrap could not run `agent-reach` because the command is not installed.
  The `mcporter` PowerShell JSON invocation also failed argument parsing. Official web
  documentation is used as the fallback; no DNS changes depend on unverified guessed values.
- Math1 web phase 2 first typecheck rejected the v1 import branch because the parsed object inherited
  the v2-only schema literal from `LearningDataBundle`. The external JSON parse shape is now typed
  independently and narrowed only after runtime validation.
- The first extractor-enabled prepare-only run failed because `run-agent-task.ps1` replaced
  `{{RUN_DIR}}` before loading the prompt. The replacement now occurs after `Get-Content`.
- Direct execution of `scripts/apply_math1_1997_structural_repair.py` initially failed because the
  project root was not on `sys.path`; the script now initializes the same import path used by the
  existing transformers.
- The first 2002 regression test used guessed Q7/Q9 answers and failed against the explicit source
  solution blocks; the test now preserves the source-confirmed A/C/B/B/D sequence.
- `ds-math1-2020` 正式运行被判失败的直接原因是包装器错误地禁止 `completed_with_warnings` 包含 `not_run` 检查；内容复核同时发现 23 道题的 `candidateResult.explanationCandidate` 被截断且 review 缺少显式状态。已修正包装器状态规则，并增加复核产物验证/机械恢复工具。
- `ds-math1-2020 -PlanOnly` 于 `20260614-173606` 通过来源和输出边界检查；计划审查发现其拟进行不存在的“真题答案比较”、可能把未运行的 KaTeX/PDF 检查标为通过，以及可能把候选异常直接认定为事实。已在正式提示词中要求证据化、`not_run` 如实报告、保留 staging 原文并固定 `completed_with_warnings`。
- `cc-math1-2020` 正式运行虽然代理自称完成，但包装器因越界修改 `task_plan.md` 正确判定失败；复核进一步发现原测试 39 项中 5 项失败、真实脚本仅生成 14 题、staging 使用伪造哈希占位值且输出时间不确定。已重建转换器并恢复为 23 题、3 条警告、真实 commit/哈希和跨进程确定性输出。
- 真实快照重复生成哈希不一致；跨进程差异定位到 `untrackedFiles` 从 `set` 转为列表时未排序。已改为显式排序并增加回归测试。
- 真实 `source-before.json` 由 Windows PowerShell 写入 UTF-8 BOM，首轮真实生成触发 `JSONDecodeError: Unexpected UTF-8 BOM`；已改为使用 `utf-8-sig` 兼容带 BOM 与无 BOM 输入，并增加回归测试。
- `cc-inventory` 正式运行达到 Claude Code 最大轮次 40 后失败；来源完整性与输出边界检查均通过。恢复处理中发现代理重复创建 Python/Node 两套实现，且 Python 整体测试因带年份的污染路径未进入污染收集分支而失败；已决定保留 Python 单一实现、修复分支并将默认最大轮次提高到 60。
- `cc-math1-2020 -PlanOnly` 于 `20260614-165036` 成功通过；正式执行前已补充单一 Python 实现、动态输入路径、优先结果日志和 23 题结构异常门槛，降低超轮次与静默凑数风险。
- 指令中的 `~/.codex/skills/expression-skill/SKILL.md` 不存在；已改读实际安装路径 `C:\Users\60549\.agents\skills\expression-skill\SKILL.md`。
- 当前目录不是 Git 仓库；本轮不需要处理。
- `agent-reach` 所需的 `mcporter` 命令不可用；已改用 Aiven 与 Cloudflare 官方页面核验。
- 首次 PowerShell 文档统计命令存在空管道语法错误；已改写后成功检查。
- 首次示例 Vault 打包使用 `Compress-Archive -LiteralPath` 配合通配符，未生成 ZIP；已改用 `-Path` 重新打包。
- 第二次文档统计命令再次出现 PowerShell 空管道语法错误；该错误不影响规范文件，已改写验证命令。
- 直接运行 `.ps1` 被本机 PowerShell Execution Policy 拦截；已增加单次 Bypass 的 `scripts/run-agent-task.cmd`，不永久修改系统策略。
- Windows PowerShell 5 解析无 BOM UTF-8 脚本中的中文路径失败；已将启动脚本规范化为带 BOM 的 UTF-8。
- 使用假 Claude 命令完成失败与 PlanOnly 模拟：缺少结果文件时正确判定失败，PlanOnly 正确返回，数学一 2020 来源副本隔离与前后完整性检查通过。
- 真实 Claude Code PlanOnly 首次被 `.claude/logs/session-*.md` 工具日志误判为越界写入；已仅排除该日志目录，其他 `.claude` 文件仍受保护。
- 真实 `cc-inventory -PlanOnly` 已通过；审阅发现正文异常不能由元数据检测、标准库与 pytest 冲突、动态时间破坏确定性三项问题，已写入正式任务提示进行纠正。
- 本机未安装 `claude`、`deepseek`、`aider` 或 `opencode`；已提供安装和执行手册，但未擅自安装外部软件。
- 由于 Codex 当前 shell 仍无 `claude`，`scripts/run-agent-task.ps1` 现已增加 `-PrepareOnly` 外部交接模式，可在本地先生成 `prompt.md`、`source-mirror\`、`run-external-claude.cmd` 与 `external-handoff.md`，再由用户自己的 Claude Code CMD 会话实际执行。
- 首次统一启动脚本语法检查发现 DeepSeek Key 提示字符串引号错误；已改为无插值提示并重新验证。

## Status
**Complete with warnings** - `20260614-165832-cc-math1-2020` 原代理运行保持失败状态，恢复后的 staging 已通过 41 项转换测试、44 项 inventory 测试和确定性验证，可进入 DS 语义复核，但仍禁止批准或发布。
