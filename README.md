# 研数

一个面向考研数学真题练习、错题复盘和学习记录管理的全栈 Web 应用。

当前版本以数学一为基础，收录 1987—2025 年（不含缺失来源的 1994 年）
共 852 道真题；数学二入口和数据接口已经预留。

## 功能

- 数学一 / 数学二科目入口
- 按年份、题型、内容状态和关键词筛选真题
- KaTeX 数学公式渲染
- 单题练习、答案解析和个人笔记
- 掌握 / 不熟 / 不会状态
- 错题本与确定性复习队列
- 按年份完成整卷练习和保存草稿
- 学习统计和正确率
- JSON 学习数据导入与导出
- Obsidian ZIP 学习包
- 邮箱注册、验证、登录和退出
- MySQL 云端学习记录上传与恢复

## 技术栈

| 部分 | 技术 |
| --- | --- |
| Web | React 19、TypeScript、Vite、KaTeX |
| API | Express 5、TypeScript、Zod |
| 数据库 | MySQL |
| 认证 | Argon2id、HttpOnly Cookie、邮箱验证 |
| 邮件 | Resend HTTP API |
| 部署 | Cloudflare Pages、Render、Aiven MySQL |

## 项目结构

```text
apps/
  web/                 React Web 应用
  api/                 Express API
content/
  final/math1/         最终数学一题库
  staging/             年度转换结果
  review/              复核结果
  reports/             处理与验证报告
scripts/               真题转换、验证和代理队列脚本
tests/                 内容处理测试
DEPLOYMENT.md           公网部署和 DNS 配置说明
```

## 本地运行

要求：

- Node.js 20 或更高版本
- npm
- MySQL 8（仅账号和云端同步需要）

安装依赖：

```cmd
npm install
```

启动前端：

```cmd
npm run dev
```

浏览器打开：

```text
http://127.0.0.1:5173
```

离线题库、练习、错题本和导出功能不需要启动 API。

## 启动账号系统

1. 将 `apps/api/.env.example` 复制为 `apps/api/.env`。
2. 将 `apps/web/.env.example` 复制为 `apps/web/.env`。
3. 在 MySQL 执行：

```text
apps/api/schema.sql
```

4. 启动 API：

```cmd
npm run dev:api
```

开发环境未配置 `RESEND_API_KEY` 时，验证链接会打印在 API 终端中。

## 构建与测试

```cmd
npm run typecheck
npm run build
npm run test:api
npm run test:smoke --workspace @kaoyan/web
```

当前自动测试覆盖：

- 注册
- 邮箱验证
- 未验证账号禁止登录
- 登录和退出
- 云端学习记录保存与恢复
- 真题库、整卷练习、错题本和复习队列
- JSON 与 Obsidian ZIP 导出
- 桌面端和移动端基本流程

## 题库同步

Canonical 数学一题库位于：

```text
content/final/math1/question-bank.json
```

开发和构建前会自动同步到 Web 静态目录，也可以手动运行：

```cmd
npm run sync:content
```

不要直接修改 `apps/web/public/data/math1.json`。

## 部署

推荐的 MVP 免费组合：

- Cloudflare Pages：Web
- Render Free Web Service：API
- Aiven Free MySQL：数据库
- Resend Free：验证邮件

完整环境变量、Cloudflare DNS 和部署步骤见 [DEPLOYMENT.md](DEPLOYMENT.md)。

正式 Web 地址使用 `https://gongren.xyz`，API 使用
`https://api.gongren.xyz`。

## 当前边界

- 数学二题库尚未导入。
- 整卷主观题由用户核对后标记做对、做错或待核对。
- 题库保留内容复核状态，不代表所有题目均已公开发布。
- 免费 Render 服务闲置后会休眠，首次 API 请求可能较慢。

## 安全说明

- 真实 `.env` 文件不会提交到 Git。
- 密码只保存 Argon2id 哈希。
- 邮箱验证令牌和会话令牌只保存 SHA-256 哈希。
- 登录会话使用 HttpOnly Cookie。
- 本机和云端学习记录仅在用户明确操作时互相覆盖。
