# 数学一 2002 Markdown-First 最终整理

> Run: `20260620-185410-cc-math1-md-finalize-year-2002`
> 日期: 2026-06-20
> 任务: cc-math1-md-finalize-year

## 分类总览

| 分类 | 数量 | 题号 |
|------|------|------|
| `ready_for_approval` | 18 | Q1-Q5, Q7-Q8, Q10-Q20 |
| `ready_with_info` | 2 | Q6, Q9 |
| `blocked` | 0 | — |
| **合计** | **20** | |

## ready_for_approval (18 题)

无 active error/warning，内容已由真题Markdown与解析Markdown证据闭合：

- **Q1-Q5** (填空): 题干来自 paper Markdown 行1-9，答案与解析来自 solution Markdown 行1-62。
- **Q7-Q8** (选择): 题干与选项来自 paper 行28-44，答案来自 solution 行77-107。
- **Q10** (选择): 题干与选项来自 paper 行59-64，答案(D)来自 solution 行115-135。
- **Q11-Q20** (解答): 题干来自 paper 行66-136，答案与解析来自 solution 行137-330。全部答案已从 explanationCandidate 提取。

## ready_with_info (2 题)

仅非阻塞 info 级备注：

| 题目 | Info 说明 |
|------|-----------|
| Q6 | 性质①②从 solution 证据恢复（①连续, ②一阶偏导数连续），数学逻辑唯一确定。精确中文措辞需 PDF 确认。 |
| Q9 | 全部四个选项为图片，答案(B)已由 solution 推理确定。图片内容精确确认需 PDF 视觉对照。 |

## blocked (0 题)

无。

## 本运行修复项

1. **Q6 stem JSON 编码修复**: 行181 `"stem"` 属性名及字符串值开头的 JSON 定界符原使用 Unicode 弯引号 `"` (U+201C) 和 `"` (U+201D)。已逐字节替换为 ASCII 双引号 (0x22)，中文文本内的弯引号保留。
2. 同一 Q6 stem 的文件级 JSON 验证：修复后全部三个解析器通过。

## 验证结果

| 检查 | 状态 | 详情 |
|------|------|------|
| Node JSON.parse | passed | 20 questions |
| Python json.load | passed | stableIds unique |
| PowerShell ConvertFrom-Json | passed | 20 questions, all needs_human_review |
| staging/review 题数相等 | passed | 20 vs 20 |
| stableId 唯一 | passed | 20 unique IDs |
| 全部 needs_human_review | passed | 20/20 |
| active anomaly 计数 | passed | 0 error, 0 warning, 1 info |
| candidateResult 不截断 | passed | 0 truncated |
| active error=0, warning=0 | passed | status=completed |

## 来源证据链

| 证据 | 路径（source-mirror 相对路径） |
|------|------|
| 真题 Markdown | papers/2002年考研数学(一)真题.md |
| 解析 Markdown | solutions/2002年解析/2002年解析.md |
| Q9 选项图片 | papers/images/2002年考研数学(一)真题/*.jpg |
| Q6 解析关系图 | solutions/2002年解析/2002年解析/images/69dd87d1...jpg |
| Q13 解析图 | solutions/2002年解析/2002年解析/images/67d82aab...jpg |
