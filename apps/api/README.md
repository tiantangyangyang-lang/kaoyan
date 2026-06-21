# 研数 API

Express + MySQL 后端，提供：

- 邮箱注册与 Resend 验证邮件
- Argon2id 密码哈希
- MySQL 会话和 HttpOnly Cookie
- 数学一 / 数学二学习记录云端保存
- `/health` 部署健康检查

## 初始化

1. 将 `.env.example` 复制为 `.env` 并填写数据库。
2. 在目标 MySQL 执行 `schema.sql`。
3. 启动：

```cmd
npm run dev:api
```

完整部署步骤见仓库根目录 `DEPLOYMENT.md`。
