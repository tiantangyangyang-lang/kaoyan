# 数学一 2005 年冲突与不确定项报告（Markdown-first 最终整理版）

> 最终整理时间: 2026-06-20T16:33:19+08:00
> Run ID: 20260620-163319-cc-math1-md-finalize-year-2005

## 1. 已解决的冲突（全部通过 Markdown 证据修复）

| 题号 | 原冲突 | 原严重度 | 修复方式 | 修复依据 |
|------|--------|---------|---------|---------|
| Q6 | stem 尾部混入节标题 | warning | 删除污染文本 | 真题 Markdown 第17行 |
| Q7 | \|x\|^3n 缺花括号 | warning | 修复为 \|x\|^{3n} | 真题 Markdown 第21行 |
| Q7 | \|x\|^{3n/2} 指数错误 | warning | 修复为 \|x\|^{3n} | 夹逼定理推导逻辑 |
| Q7 | x→-1^+（应为 x→1^+） | warning | 修复极限方向 | 右导数定义唯一确定 |
| Q11 | 选项仅提取 B | error | 四选项从 Markdown 重建 | 真题 Markdown 第57-63行 |
| Q14 | 选项仅提取 A/B/C | error | 四选项从 Markdown 重建 | 真题 Markdown 第88-94行 |
| Q14 | stem 混入节标题 | warning | 删除污染文本 | 真题 Markdown |
| Q15 | 4√2 vs √[4]{2} | error | 修复为 √[4]{2} | 极坐标 r²≤√2 → r≤2^{1/4} |
| Q16 | arctan 缺 c | warning | 修复为 arctan | 反正切函数标准写法 |
| Q17 | f'' vs f''' | warning | 修复为 f''' | 真题 Markdown 明确三阶 |
| Q17 | 数字多余空格 | warning | 修复为 16, 20 | OCR 分割噪声 |
| Q18 | c vs ξ 符号不一致 | info | 统一为 ξ | 第(I)部分结果 |
| Q20 | 向量缺分量 | error | 补全三维向量 | 上下文特征向量 |
| Q20 | LaTeX 断裂 | warning | 修复表达式 | 换元标注格式 |
| Q21 | b^* 星号噪声 | warning | 修复为 b | OCR 残留 |

**全部 15 处 paper/solution/extraction 冲突已解决。**

## 2. 剩余不确定项

无。所有可通过 Markdown 或数学逻辑唯一确定的问题均已修复。

## 3. 已知非阻塞问题

| 编号 | 范围 | 描述 | 严重度 |
|------|------|------|--------|
| KN-01 | global | \\pmb 宏是非标准 LaTeX，建议后续替换 | info |
| KN-02 | global | 来源仓库 dirty=true，不影响 2005 内容 | info |
| KN-03 | Q13 | 概率分布表使用 HTML table 标签 | info |

## 4. 不再需要 PDF 对照的项目

以下项目原标记为需要 PDF 对照，现已被 Markdown/数学逻辑覆盖：
- U-01 (Q15 积分上限): math logic 唯一确定 ✓
- U-02 (Q7 极限方向): math logic 唯一确定 ✓
- U-03/U-04 (Q20 向量): 上下文推断 ✓
- U-05 (Q17 导数阶数): 真题 Markdown 明确 ✓
- U-06 (Q21 b^*): 明确为 OCR 噪声 ✓

## 5. 统计

| 类别 | 数量 |
|------|------|
| 已解决冲突 | 15 |
| 剩余 info | 3 |
| PDF 对照需求 | 0（全部被 Markdown/数学覆盖） |
| 阻塞问题 | 0 |
