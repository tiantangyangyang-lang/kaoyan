# 研数 API

Express + MySQL 后端，提供：

- 邮箱注册与 Resend 验证邮件
- Argon2id 密码哈希
- MySQL 会话和 HttpOnly Cookie
- 数学一 / 数学二 / 数学三学习记录云端保存
- 数学一 / 数学二 / 数学三 published-only 内容查询
- 年度题库 staging 导入和带审核门槛的 promotion
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

## 内容生命周期

`import:*` 命令默认 dry-run，`--commit` 只会写入 `staging`。Math1 canonical
题库按年份导入：

```cmd
npm run import:math1 -- --input ../../content/final/math1/question-bank.json
npm run import:math1 -- --input ../../content/final/math1/question-bank.json --commit
```

中断后可用 `--from-year 2016` 从指定年份恢复。Math2/Math3 schema payload
可通过 `import:questions` 导入。

批次经过人工审核后使用：

```cmd
npm run content:publish -- --batch-id <batch-id>
npm run content:publish -- --batch-id <batch-id> --commit
```

该命令要求批次仍为 `staging`、所有题目 `review_status=approved` 且没有
`finalization_status=blocked`；同科目同年份的旧 published 批次会在同一事务中
转为 `superseded`。
