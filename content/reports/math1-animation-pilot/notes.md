# Notes: 数学一动画解析试点

## Constraints
- 现有数学一题目和文字解析继续支持游客学习。
- 动画仅向已登录用户提供。
- 游客不应下载动画数据，最好也不下载动画运行时代码。
- 优先使用免费方案。
- 首轮由 Codex 完成 5–6 道高质量样例；后续机械录入交给 Claude Code。

## Findings

### Repository
- Monorepo：`apps/web` 为 Vite 前端，`apps/api` 为 API。
- 根目录使用 npm workspaces。
- 现有 `scripts/run-agent-task.*` 与队列文件可用于 Claude Code 批量任务。

## Sources

### Motion
- URL: https://github.com/motiondivision/motion
- 核实日期：2026-06-21。
- 当前官方包：`motion@12.40.0`。
- React 入口：`motion/react`。
- React 18/19 均受 peer dependency 支持。
- MIT License。
- 官方包声明 `sideEffects: false`；本项目额外使用动态 import 隔离动画 chunk。

## Technical Decision

- 继续使用现有 Aiven Free MySQL，不新增数据库服务。
- 新表：`kaoyan_question_animations`。
- 登录专属接口：`GET /api/question-animations/:questionId`。
- 游客只访问不含动画内容的 availability 布尔接口，避免对所有题误显示登录提示。
- 动画 payload 经 Zod 运行时校验。
- 初始种子仅 `INSERT IGNORE`，不会覆盖人工修订或重新启用已停用记录。
- Motion 代码由 `React.lazy` 动态加载；只有登录用户成功取得动画数据后才加载。

## Pilot Questions

1. `math1-2023-q01`：斜渐近线。
2. `math1-2023-q12`：曲面切平面。
3. `math1-2023-q17`：切线截距与微分方程。
4. `math1-2023-q19`：柱面有界区域与高斯公式。
5. `math1-2025-q04`：二重积分换序区域。
6. `math1-2023-q22`：径向概率密度。

## Verification Evidence

- `npm.cmd run typecheck:web`：通过。
- `npm.cmd run typecheck:api`：通过。
- `npm.cmd run test:api`：通过，1/1。
- `npm.cmd run build:web`：通过；Motion 单独 chunk 134.89 kB，gzip 44.65 kB。
- `npm.cmd run build:api`：通过。
- `npm.cmd run test:smoke --workspace @kaoyan/web`：通过。
- 浏览器实测游客打开 2023 年第 1 题并展开解析：页面不白屏，脚本列表未新增 Motion 模块。
- 实测发现并修复正式题库 options 使用 `text`、旧前端类型使用 `value` 导致的选择题白屏。

## Delegation Status

- Claude Code 提示词已准备：`prompts/cc-math1-animation-maintenance.md`。
- 外部执行因需要发送私有工作区代码而被安全审查拦截；需用户在知情后明确批准才能再次执行。
