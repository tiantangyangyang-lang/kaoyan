# Task Plan: 数学一动画解析试点

## Goal
为 5–6 道数学一真题加入登录后按需加载的动画解析，并形成可交给 Claude Code 批量扩展的低推理工作流。

## Phases
- [x] P0：盘点前端、API、认证、题目结构和现有代理执行方式
- [x] P0：调研 Motion 官方仓库并确定免费技术方案
- [x] P0：实现动画数据接口、登录门控和 5–6 道样例
- [x] P1：验证构建、类型、测试和游客行为
- [x] P1：建立需求文档、独立分支、Makefile 和 PR 工作流
- [x] P1：整理 Claude Code 批量任务、种子测试和维护指南
- [x] P1：提交、推送并创建 Pull Request

## Key Questions
1. 现有登录态如何从前端传到 API？
2. 动画数据应存 PostgreSQL、静态对象存储，还是仓库外 JSON？
3. Motion 是否会进入首屏 bundle，如何确保游客不下载动画代码和数据？
4. 哪 5–6 道题最适合覆盖函数图像、极限、积分、空间几何等动画类型？

## Decisions Made
- 不把后续动画数据合并进现有前端题库文件；动画元数据由 API 按题目 ID 返回。
- 动画渲染模块使用动态 import，游客不加载动画模块。
- 先做小规模试点，稳定 schema 后才交给 Claude Code 批量录入。
- 动画存在性使用公开布尔接口；游客不会取得动画 payload。
- 初始数据采用事务内 `INSERT IGNORE`，避免 API 重启覆盖人工修订或重新启用停用内容。
- 登录动画响应使用 `private, no-store`。
- 本需求编号为 `REQ-001`，分支为 `codex/math1-animation-workflow`。
- 后续任务遵循“一项需求、一个线程、一个分支、一个 PR”。

## Errors Encountered
- `agent-reach doctor --json` 首次运行 24 秒超时；GitHub 调研改走 skill 指定的 `gh` 路径。
- PowerShell 执行策略阻止 `npm.ps1`；后续验证统一使用 `npm.cmd`。
- Claude Code 首次非交互调用未正确接收尾部 prompt；改为通过 stdin 传入固定提示词。
- 首次 code-reviewer 创建时同时使用了完整上下文分叉和显式角色，工具拒绝；改为独立审查上下文。
- 本地前端首次后台启动触发 Windows 环境变量 `Path/PATH` 重复错误；改用隔离环境启动。
- 首次 `make verify` 发现 smoke 测试依赖手工启动 Vite；新增自包含 runner 后重跑。
- Claude Code 外部执行在用户知情批准后仍被租户策略拒绝；未绕过，改由当前受信任环境完成同一限定任务。
- Cloudflare PR 预览登录失败：API CORS 仅返回正式站 Origin，且生产 Cookie 为 SameSite=Lax；增加严格预览后缀白名单和 SameSite=None。

## Status
**Complete** — REQ-001 已通过 `make verify`，提交并创建 PR #1。
