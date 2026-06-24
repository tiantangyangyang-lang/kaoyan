# 研数 Web MVP

数学一真题学习系统的本地可用首版。

## 已实现

- 读取 `content/final/math1/question-bank.json` 的 852 道数学一真题
- 真题库和整卷练习先选择数学一 / 数学二；数学二显示建设中占位
- 按年份、题型、内容状态和关键词筛选
- 单题作答、答案解析与 KaTeX 公式渲染
- 掌握 / 不熟 / 不会状态
- 每题个人错因和复习笔记
- 做错自动加入错题本，支持手动加入或移除
- 按年份进行整卷练习，草稿自动保存，交卷后统一写入统计
- 按错题 / 不会 / 不熟生成确定性复习队列
- 按题型统计练习覆盖率和正确率
- 浏览器 `localStorage` 持久化
- 学习记录 JSON 导出与导入，兼容旧版 v1 导出
- Obsidian ZIP 导出：学习概览、7 天计划和错题卡片
- 邮箱注册、验证、登录和退出
- 登录后手动上传或恢复 MySQL 云端学习记录
- 科目目录已预留 `math2`

## 本地运行

从仓库根目录执行：

```cmd
npm install
npm run dev
```

打开：

```text
http://127.0.0.1:5173
```

生产构建：

```cmd
npm run typecheck
npm run build
```

## 题库同步

开发和构建前会自动运行：

```cmd
npm run sync:content
```

它将 canonical 数学一题库同步到：

```text
apps/web/public/data/math1.json
```

不要直接编辑该副本。题库来源始终是：

```text
content/final/math1/question-bank.json
```

## 当前边界

- 云端同步需要先部署 `apps/api` 并配置 Aiven MySQL 与 Resend
- 尚无知识点标签，因此统计不猜测具体薄弱知识点
- 整卷练习采用用户核对后的“做对 / 做错 / 待核对”，暂不自动判分
- Obsidian 导出默认不复制完整真题正文，只导出题号、年份、学习状态和个人笔记
- 题目均保持 `needs_human_review`，不代表已公开发布
- 数学二只预留科目接口，尚未导入题库

## 本地数据

```text
kaoyan:math1:question-states:v1
kaoyan:math1:paper-sessions:v1
```

JSON 备份格式为 `kaoyan-learning-export-v2`，包含上述两类数据。

## 后端化顺序

1. 增加账号与匿名数据迁移，将本地状态同步到服务端。
2. 将 `QuestionState` 和 `PaperSession` 映射为数据库表，保留当前 JSON 导入作为恢复入口。
3. 数学二题库通过分页 API 与单题详情 API 按需读取，不生成或复制 `math2.json` 静态整库。
4. 完成知识点标注后，再增加有证据题号和样本量的薄弱点分析。
