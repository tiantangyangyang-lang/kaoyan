# 研数部署说明

## 推荐免费组合

| 部分 | 提供商 | 免费层用途 |
| --- | --- | --- |
| Web | Cloudflare Pages | 部署 `apps/web/dist`，绑定 `gongren.xyz` |
| API | Render Free Web Service | 部署 `apps/api`；闲置后会休眠 |
| MySQL | Aiven Free MySQL | 用户、会话和学习记录；只适合 MVP |
| 验证邮件 | Resend Free | 使用 HTTP API 发送，避免免费 Render 的 SMTP 限制 |

## 当前 DNS 审计

输入文件：`C:\Users\60549\Downloads\gongren.xyz (1).txt`

以下现有记录保持不变：

- 根域名 `gongren.xyz` 的两个 A 记录
- `www.gongren.xyz -> gongren.xyz`
- SpaceMail 的两个 MX 记录
- `_autodiscover._tcp` SRV
- 根域名 SPF：`v=spf1 include:spf.spacemail.com ~all`

不要在根域名再添加第二条 SPF。Resend 建议使用独立发送子域
`mail.gongren.xyz`，按 Resend 控制台给出的 DKIM/SPF 记录添加。

## 建议新增的 DNS

在外部服务创建完成、拿到真实主机名后再添加：

| 类型 | 名称 | 目标 | 初始代理状态 |
| --- | --- | --- | --- |
| Pages custom domain | `gongren.xyz` | Cloudflare Pages 项目 | 由 Pages 自定义域流程管理 |
| CNAME | `api` | Render 提供的 `*.onrender.com` | DNS only，证书签发后再决定是否代理 |
| Resend records | `mail` 子域 | 以 Resend 控制台显示为准 | DNS only |

当前正式 Web 地址使用 `https://gongren.xyz`。`www` 是否重定向到根域可在
Cloudflare Pages 的自定义域设置中单独处理。

## Aiven MySQL

1. 创建免费 MySQL 服务。
2. 将 Aiven 页面显示的完整 Service URI 原样写入 Render 的 `DATABASE_URL`。
3. 将 CA 证书做 Base64 后写入 `DATABASE_CA_BASE64`。
4. Render 启动 API 时会自动创建所需表，不需要 MySQL Workbench。

PowerShell 转换 CA：

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("ca.pem"))
```

不要把 Workbench 的 Host 留为 `localhost`。本项目正常部署不要求安装或使用
Workbench；如果 `DATABASE_URL` 的 Aiven 主机名错误，API 会在启动阶段直接失败并在
Render 日志显示 `ENOTFOUND`。

## Resend

1. 在 Resend 添加 `mail.gongren.xyz`。
2. 将其要求的 DNS 记录添加到 Cloudflare。
3. 验证成功后创建 API Key。
4. 在 Render 设置 `RESEND_API_KEY`。

## Cloudflare Pages

- Root directory: 仓库根目录
- Build command: `npm ci && npm run build:web`
- Output directory: `apps/web/dist`
- Environment variable:

```text
VITE_API_BASE_URL=https://api.gongren.xyz/api
```

## Render 构建

Blueprint 已固定：

```text
Node.js: 20.x
Build: npm ci --include=dev && npm run build:api
Start: npm run start --workspace @kaoyan/api
```

`--include=dev` 是必要的：Render 在生产环境会默认跳过 TypeScript 和类型声明，
但它们在构建阶段仍然需要；运行阶段仍只执行编译后的 `apps/api/dist/server.js`。

## 本地启动

复制两个环境模板并填写 MySQL：

```text
apps/api/.env.example -> apps/api/.env
apps/web/.env.example -> apps/web/.env
```

分别运行：

```cmd
npm run dev:api
npm run dev
```

## 上线检查

```cmd
npm run typecheck
npm run build
npm run test:api
npm run test:smoke --workspace @kaoyan/web
```
