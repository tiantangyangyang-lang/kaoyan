# Claude Code Task: 数学一动画解析机械维护

你在 `D:\work\kaoyan` 工作。主实现已经完成；你的任务只处理低推理、可机械验收的维护工作。

## 允许修改

- `apps/api/tests/animation-seeds.test.ts`
- `content/reports/math1-animation-pilot/claude-batch-guide.md`

## 禁止修改

- 除上述两个文件外的所有文件
- 不修改现有动画种子、前端组件、数据库 Schema、依赖或 lockfile
- 不执行 git commit、push、reset、checkout

## 任务 1：动画种子一致性测试

创建 `apps/api/tests/animation-seeds.test.ts`，读取：

- `apps/api/src/animationSeeds.ts` 中的 `QUESTION_ANIMATION_SEEDS`
- `content/final/math1/question-bank.json`

测试必须验证：

1. 当前正好有 6 条种子且 `questionId` 唯一。
2. 每个 `questionId` 都存在于正式数学一题库。
3. `subjectCode` 都是 `math1`。
4. payload 的 `version` 为 1。
5. `kind` 属于：`asymptote`、`tangent-plane`、`tangent-intercept`、`cylindrical-solid`、`integral-region`、`radial-density`。
6. `title`、`summary`、`accent` 是非空字符串。
7. `steps` 正好有 3 项，每项的 `title`、`body` 是非空字符串。

测试要使用 Node 内置 `node:test` 和 `node:assert/strict`，不要添加依赖。

## 任务 2：批量维护指南

创建 `content/reports/math1-animation-pilot/claude-batch-guide.md`，用中文写一份短指南，包含：

- Claude Code 后续只负责已有 6 类动画模板的数据录入、字段校验、重复 ID 检查。
- 新动画类型、数学正确性判断、题目选择仍需主负责人处理。
- 每批建议最多 10 题。
- 固定验收命令：`npm.cmd run typecheck:api`、`npm.cmd run test:api`、`npm.cmd run build:web`。
- 明确游客不请求动画 API，登录用户展开解析后才请求，数据不存在时返回 404 且页面不显示空卡片。
- 给出一份可复制的单批任务提示词模板，要求列出允许修改文件、题号映射、禁止区域和验收命令。

## 验证

运行：

```text
npm.cmd run test:api
```

完成后只汇报：

- 修改的两个文件
- 测试结果
- 是否触碰禁止文件
