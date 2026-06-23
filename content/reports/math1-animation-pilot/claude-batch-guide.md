# Claude Code 动画数据批量维护指南

## 可委派范围

Claude Code 只处理已经冻结的 6 类动画模板：

- `asymptote`
- `tangent-plane`
- `tangent-intercept`
- `cylindrical-solid`
- `integral-region`
- `radial-density`

可执行任务仅限：

- 按主负责人给定的题号和模板录入 payload；
- 检查字段完整性、题号是否存在和 ID 是否重复；
- 运行固定验收命令并报告结果。

新动画类型、题目选择、数学正确性判断和认证边界由主负责人处理。

## 批次限制

- 每批最多 10 题。
- 每批使用一个独立需求编号、上下文、分支和 Pull Request。
- 不修改正式题库的题干、答案或文字解析。
- 不把动画 payload 写入前端静态题库。

## 固定验收

```text
npm.cmd run typecheck:api
npm.cmd run test:api
npm.cmd run build:web
```

仓库完整门禁仍使用：

```text
make verify NPM=npm.cmd
```

## 权限与加载边界

- 游客只请求 availability 布尔接口，不请求动画详情接口。
- 登录用户展开解析后才请求动画 payload。
- 取得有效 payload 后才加载 Motion 动画分包。
- 数据不存在或已停用时 API 返回 404，页面不显示空动画卡片。

## 单批提示词模板

```text
目标：
为下列不超过 10 道数学一题目补充已批准类型的动画 payload。

需求文档：
docs/requirements/REQ-NNN-<name>.md

题号与模板映射：
- math1-YYYY-qNN -> <approved-kind>

允许修改：
- apps/api/src/animationSeeds.ts
- apps/api/tests/animation-seeds.test.ts
- content/reports/<batch-id>/**

禁止修改：
- content/final/**
- apps/web/**
- apps/api/src/app.ts
- apps/api/src/db.ts
- apps/api/schema.sql
- package.json
- package-lock.json
- 认证、会话和缓存逻辑

规则：
- 不选择题目，不判断或改写数学结论。
- 不发明新的 animation kind。
- 每个 payload 必须含 version、kind、title、summary、accent 和 3 个 steps。
- 题号必须存在于 canonical 数学一题库。
- 不覆盖不在本批次中的已有种子。

验收命令：
- npm.cmd run typecheck:api
- npm.cmd run test:api
- npm.cmd run build:web

输出：
- 修改文件
- 新增题号
- 重复或缺失 ID
- 命令结果
- 是否触碰禁止区域
```
