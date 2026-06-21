# 研数 API

Express + MySQL 后端，提供：

- 邮箱注册与 Resend 验证邮件
- Argon2id 密码哈希
- MySQL 会话和 HttpOnly Cookie
- 数学一 / 数学二学习记录云端保存
- `/health` 部署健康检查

数据库表统一使用 `kaoyan_` 前缀，避免与同一 MySQL 服务中的其他应用冲突。

## 初始化

1. 将 `.env.example` 复制为 `.env` 并填写数据库。
2. 启动：

```cmd
npm run dev:api
```

API 启动时会自动连接 MySQL，并使用 `CREATE TABLE IF NOT EXISTS` 创建所需表。
`schema.sql` 仍保留为手动初始化和审计参考。

完整部署步骤见仓库根目录 `DEPLOYMENT.md`。
