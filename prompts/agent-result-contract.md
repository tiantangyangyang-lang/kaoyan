# 本次运行结果提交契约

你必须在本次运行结束前创建以下两个文件：

- `{{RUN_DIR}}\agent-result.json`
- `{{RUN_DIR}}\agent-report.md`

`agent-result.json` 必须是合法 JSON，结构如下：

```json
{
  "schemaVersion": "agent-result-v1",
  "runId": "{{RUN_ID}}",
  "task": "{{TASK}}",
  "status": "completed|completed_with_warnings|blocked|failed",
  "summary": "一句话结果",
  "counts": {
    "inputFilesRead": 0,
    "itemsGenerated": 0,
    "itemsSkipped": 0,
    "warnings": 0,
    "errors": 0
  },
  "changedFiles": [],
  "createdFiles": [],
  "sourceFilesModified": [],
  "commandsRun": [],
  "checks": [
    {
      "name": "检查名称",
      "status": "passed|failed|not_run",
      "details": "结果"
    }
  ],
  "warnings": [],
  "errors": [],
  "humanReviewRequired": [],
  "nextRecommendedTask": null
}
```

`agent-report.md` 必须包含：

```text
结论：
读取了什么：
生成了什么：
修改了什么：
没有修改什么：
运行了哪些检查：
失败与警告：
需要人工确认：
下一批是否可以开始：
```

强制规则：

- `runId` 必须严格为 `{{RUN_ID}}`。
- `task` 必须严格为 `{{TASK}}`。
- 必须如实列出所有创建和修改文件。
- `commandsRun` 必须如实列出本次实际执行过的命令；每一项都必须是非空字符串。
- 当 `status` 为 `completed` 或 `completed_with_warnings` 时，`commandsRun` 不能为空。
- 如果本次没有执行任何 shell 命令，也必须显式写成 `["(none)"]`，不要写空数组。
- 两个来源库中的任何变化都必须列入 `sourceFilesModified`，并将状态设为 `failed`。
- 不得将任何题目标记为 `approved` 或 `published`。
- 无法完成时使用 `blocked` 或 `failed`，不得伪装成功。
