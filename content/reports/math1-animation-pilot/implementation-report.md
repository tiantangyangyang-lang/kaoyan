# 数学一动画解析试点实施报告

## 结论

已完成 6 道数学一真题的动画解析试点。方案沿用现有免费基础设施，不把动画数据合并进前端题库；游客保留完整题目和文字解析，登录用户展开解析后才按需取得动画数据并下载 Motion 分包。

## 首批题目

- `math1-2023-q01`：斜渐近线
- `math1-2023-q12`：切平面
- `math1-2023-q17`：切线截距
- `math1-2023-q19`：柱面有界区域
- `math1-2025-q04`：二重积分换序区域
- `math1-2023-q22`：径向概率密度

## 数据与权限

- 数据表：`kaoyan_question_animations`
- 登录接口：`GET /api/question-animations/:questionId`
- 游客元数据接口：`GET /api/question-animations/:questionId/availability`
- payload 使用 Zod 校验。
- 登录接口响应禁止缓存。
- 种子不会覆盖数据库中已存在的人工版本。

## 前端加载边界

- `QuestionAnimationGate` 只在解析展开后挂载。
- 登录用户取得有效 payload 后，才动态 import `MathAnimation`。
- 生产构建产生独立动画 chunk：134.89 kB，gzip 44.65 kB。
- 游客实测展开解析前后，页面脚本列表没有新增 Motion 模块。

## 验证

- `mingw32-make verify NPM=npm.cmd`：通过。
- Web/API typecheck：通过。
- API test：2/2 通过。
- Web/API build：通过。
- 自包含 Web smoke test：通过，Vite 由测试 runner 自动启动和关闭。
- 浏览器游客流程：通过。

## 工程流程

- 需求：`docs/requirements/REQ-001-math1-animation-analysis.md`
- 分支：`codex/math1-animation-workflow`
- 命令入口：根目录 `Makefile`
- 协作规则：`AGENTS.md` 与 `docs/engineering-workflow.md`
- PR 模板：`.github/PULL_REQUEST_TEMPLATE.md`

## Claude Code 边界

机械维护提示词已写入 `prompts/cc-math1-animation-maintenance.md`。外部 Claude Code 在用户知情批准后仍被租户策略拒绝，因此本次没有向外部服务发送工作区代码；种子一致性测试和批量指南由当前受信任环境完成。
