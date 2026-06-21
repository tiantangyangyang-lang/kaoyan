# Math1 1987 — Markdown-First Finalization: Conflicts and Uncertainties

本报告由 `cc-math1-md-finalize-year` 生成。证据来源：真题 Markdown + 解析 Markdown 全文比对。

## 已解决的冲突

### 解析截断恢复（5 题）
- **Q06**: legacy 截断了解析前半部分（极限等价无穷小推导 $b=1$），已从 solution Markdown 恢复
- **Q07**: legacy 丢失了第 (1) 小问（偏导数）的解析，已恢复
- **Q13**: legacy 截断了收敛半径计算步骤，已恢复
- **Q14**: legacy 截断了曲面方程定义，已恢复
- **Q16**: legacy 截断了初始增广矩阵和行变换步骤，已恢复

### 答案提取（7 题）
以下 solution 型题目的答案已从解析中提取：
- Q06: $a = 4, b = 1$
- Q07: 偏导数结果 + 矩阵 B
- Q08: 通解（方法二形式）
- Q13: 收敛域 + 和函数
- Q14: $I = 34\pi$
- Q16: 解的存在条件 + 通解
- Q20: 概率密度函数 $f_Z(z)$

### 类型修正（1 题）
- Q15: 从 solution 修正为 proof，answerStatus 从 missing 修正为 candidate_in_explanation

### 答案标签规范化（4 题）
- Q09-Q12: answerCandidate 从 "(C)." 等格式规范化为 "C" 等单字母

## 已知异常（info only，非阻塞）

| ID | 题号 | 严重度 | 描述 |
|----|------|--------|------|
| anom-1987-q02-sol-transcription | Q02 | info | 解析结论写 $x^{2^x}$，推导对应 $x \cdot 2^x$ |
| anom-1987-q08-ocr-y-triple-prime | Q08 | info | 题干 $y''$ 应为 $y'''$（OCR三撇→两撇） |
| anom-1987-q10-ocr-lianxushu | Q10 | info | "连续数" 疑为 "连续函数" OCR错误 |
| anom-1987-q15-proof-no-answer | Q15 | info | 证明题无独立 answerCandidate |

## 限制

- 未读取 PDF 页面
- 未新增数学正确性判断（答案正确性由解析 Markdown 承载）
- 未自动修改题干中的 OCR 错误（保留原文，仅标注 anomaly）
- 所有题目仍需人工最终确认
