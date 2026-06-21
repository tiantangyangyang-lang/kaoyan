# Obsidian 学习分析导出设计

> 版本：v0.1，2026-06-14  
> 目标：把网站中的整卷作答记录、薄弱点分析和复习建议导出为可直接打开的 Obsidian Vault。

## 1. 核心判断

用户主要在纸上解题，网站负责收集结构化结果。系统可以可靠分析“哪些知识点经常错、不会、耗时或信心低”，但在没有完整解题过程时，不能可靠判断具体步骤错误。

因此分析输出必须分为：

- **事实**：答案、正误、完成情况、用时、自评。
- **推断**：薄弱模块、优先级、重复错误模式。
- **建议**：AI 生成的复习解释和练习计划。

## 2. 用户流程

1. 用户在网站选择一套试卷，并在纸上完成。
2. 用户进入整卷录入页，按题号填写答案与自评。
3. 系统自动判定可自动判分的题目。
4. 用户确认无法自动判定的填空、计算和证明题结果。
5. 统计引擎生成知识点快照和证据清单。
6. AI 将结构化统计转为易读解释和复习建议。
7. 用户预览报告并下载 Obsidian ZIP。

## 3. 录入契约

每道题至少收集：

```json
{
  "questionId": "math1-2025-q17",
  "submittedAnswer": "最终答案或选项",
  "completion": "solved",
  "correctness": "incorrect",
  "evaluationSource": "user_self_assessment",
  "confidenceLevel": "low",
  "errorTags": ["concept_unclear"],
  "durationSeconds": 1080,
  "note": "可选的简短自评"
}
```

录入界面应支持键盘快速操作。证明题默认选项是“做出 / 部分做出 / 空白”，不是简单的对错，以减少用户随意自评带来的误差。

用户查看解析后可补充一键错误原因：概念不清、公式忘记、思路中断、计算失误、时间不足或其他。只有用户明确选择的错误原因才能作为报告事实；AI 不得从最终答案反推错误步骤。

## 4. 分析契约

### 4.1 确定性统计输出

```json
{
  "knowledgePointId": "kp-limit",
  "evidenceQuestionCount": 4,
  "correctRate": 0.25,
  "completionRate": 0.5,
  "lowConfidenceRate": 0.75,
  "weaknessScore": 82,
  "confidence": "high",
  "evidenceQuestionIds": [
    "math1-2025-q2",
    "math1-2025-q9",
    "math1-2025-q17",
    "math1-2025-q18"
  ]
}
```

### 4.2 置信度约束

| 条件 | 报告标记 |
|---|---|
| 仅 1-2 道关联题 | 证据不足 |
| 至少 3 道，且多数可自动判定 | 中或高置信度 |
| 主要依赖用户自评 | 降低一个置信等级 |
| 多次试卷重复出现同类错误 | 提升置信度并标为重复问题 |

### 4.3 AI 输出约束

AI 输入不包含无关个人信息，只包含结构化统计、知识点说明、证据题号和允许引用的解析摘要。

AI 输出使用固定 JSON Schema：

```json
{
  "summary": "本次表现摘要",
  "priorityKnowledgePoints": [
    {
      "knowledgePointId": "kp-limit",
      "reason": "为什么优先",
      "evidenceQuestionIds": ["math1-2025-q17"],
      "confidence": "high",
      "actions": ["复习动作 1", "复习动作 2"]
    }
  ],
  "warnings": ["证据边界说明"]
}
```

服务端必须拒绝没有证据题号、虚构解题步骤或超出允许知识点范围的输出。

## 5. Obsidian Vault 结构

```text
00-开始这里.md
Reports/
Knowledge/
Mistakes/
Plans/
Maps/
Assets/
manifest.json
```

### 文件职责

| 路径 | 职责 |
|---|---|
| `00-开始这里.md` | 导航、生成时间、报告边界 |
| `Reports/*.md` | 一次试卷分析的不可变快照 |
| `Knowledge/*.md` | 某知识点跨试卷的累计表现 |
| `Mistakes/*.md` | 单道错题的证据和复习记录 |
| `Plans/*.md` | 有日期和验收条件的复习任务 |
| `Maps/*.canvas` | 从 Markdown 笔记生成的导航图 |
| `Assets/` | 用户明确选择导出的手写图片等附件 |
| `manifest.json` | 导出版本、用户数据范围和文件校验 |

### Obsidian 格式规则

- Markdown 笔记顶部使用小型 YAML frontmatter。
- Vault 内部链接使用 `[[wikilinks]]`。
- 公式使用 Obsidian 支持的 `$...$` 和 `$$...$$`。
- 不依赖 Dataview、Templater 等社区插件，保证默认 Obsidian 可打开。
- Canvas 中只放已存在 Markdown 文件节点。
- 知识结论写在 Markdown，Canvas 不作为事实来源。

## 6. 隐私、版权与导出范围

- 默认不导出手写照片；用户明确勾选后才将附件加入 ZIP。
- 默认不导出未经授权的完整题干，只保存题目标识、用户答案、分析结果和网站链接。
- ZIP 下载使用短期签名地址，过期后删除对象存储中的导出文件。
- `manifest.json` 记录生成时间、报告 ID、导出 Schema 版本和包含的文件，不包含密码、令牌或数据库内部信息。

## 7. MVP 与后续版本

### MVP

- 每次生成独立 Vault ZIP。
- 统计规则计算薄弱点。
- AI 生成受约束的解释和计划。
- 生成 Markdown、wikilinks、Canvas 和 manifest。

### 后续

- 增量导出，仅输出自上次导出后的变化。
- Obsidian 插件拉取网站报告并解决冲突。
- 用户选择合并到已有 Vault 的目录映射。
- 用户上传步骤照片并确认 OCR 后，辅助分析解题过程。

## 8. 验收标准

- ZIP 解压后，Obsidian 可直接打开且无需社区插件。
- 所有内部 wikilink 和 Canvas 文件节点有效。
- 同一结构化输入产生相同统计结论。
- 无 AI 服务时仍可生成完整统计报告。
- 报告中的每个薄弱点结论都有题号证据、样本量和置信度。
- 没有过程证据时，报告不声称用户在某个具体步骤出错。
