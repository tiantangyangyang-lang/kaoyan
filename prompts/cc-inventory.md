执行 `真题解析首批任务.md` 中的 `PILOT-CC-00：来源盘点`。

先阅读：
- `真题内容解析与代理处理规范.md`
- `真题解析首批任务.md`

只读扫描两个来源库。实现 inventory 脚本、测试，并生成 `content/inventory/source-inventory.json` 与 `content/inventory/source-anomalies.md`。

不要修改两个来源库。不要解析全部图片内容。结束时报告读取文件数、异常数、输出路径、测试命令和结果。

正式实现必须修正以下计划审查项：

1. inventory 只基于 `source-before.json` 的路径与元数据。不能声称检测到只能通过正文发现的问题，例如数学二 2021 正文标题“数学三”、`rx²` 或拆散的 `l i m`；这些只能列为后续按年份内容扫描的已知风险。
2. 使用 Python 标准库实现并使用 `unittest` 测试，不依赖可能尚未安装的 `pytest` 或其他第三方包。
3. 确定性检查必须明确：相同输入产生相同分类、异常和文件顺序。若输出包含时间字段，使用输入快照的 `capturedAt`，不能使用当前运行时间导致重复运行结果不同。
4. `source-before.json` 是本次运行目录中的快照。输出必须引用本次输入快照，不得硬编码计划阶段的旧 Run ID。

执行优先级与实现边界：

1. 只实现 `scripts/inventory.py` 与 `tests/test_inventory.py`，禁止创建 Node/JavaScript 或其他平行实现。
2. 先完成必需输出、测试和 `agent-result.json` / `agent-report.md`，再做非必要改进。
3. 若剩余轮次不足，停止扩展功能，立即运行现有测试并按结果写入报告。
