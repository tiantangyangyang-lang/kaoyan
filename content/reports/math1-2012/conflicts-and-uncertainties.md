# Math1 2012 — MD-Finalization Conflicts and Uncertainties

> 运行ID: `20260620-170802-cc-math1-md-finalize-year-2012`
> 生成时间: 2026-06-20T09:10:36.559Z

## 确定性修复（已由Markdown证据闭合）

- **math1-2012-q02**: split_option_d_from_c
  - 证据: Paper Markdown line 21-23 shows (D) on separate line; solutions answer (A) confirms 4 options exist.
  - 修改前: {"optionC_included_D":"$(-1)^{n - 1} n!$ .\n\n$(\\mathrm{D})(-1)^n n!$"}
  - 修改后: {"options":["A","B","C","D"]}
- **math1-2012-q08**: remove_section_header_leak
  - 证据: Paper Markdown line 82 shows # 二、填空题 as separate section, not part of q08.
  - 修改前: {"stemEnd":"{1}{2}$ .\n\n(C) $-\\frac{1}{2}$ .\n\n(D) -1.\n\n# 二、填空题(本题共6小题，每小题4分，共24分，把答案填在题中横线上.)","optionD":"-1.\n\n# 二、填空题(本题共6小题，每小题4分，共24分，把答案填在题中横线上.)"}
  - 修改后: {"stemEnd":"{1}{2}$ .\n\n(C) $-\\frac{1}{2}$ .\n\n(D) -1.","optionD":"-1."}
- **math1-2012-q14**: remove_section_header_leak
  - 证据: Paper Markdown line 92 shows # 三、解答题 as separate section, not part of q14.
  - 修改前: {"stemEnd":"，则 $P(AB \\mid \\overline{C}) =$ ______.\n\n# 三、解答题（本题共9小题，共94分，解答应写出文字说明、证明过程或演算步骤）"}
  - 修改后: {"stemEnd":"$ ，则 $P(AB \\mid \\overline{C}) =$ ______."}

## 当前活跃异常

- 无 active error
- 无 active warning
- 3 个 info 级别记录（修复透明度记录）

## 限制

- 未读取PDF页面（Markdown-first策略，确定性修复无需PDF证据）。
- 未新增数学正确性判断。
- 修复基于真题Markdown与解析Markdown的结构对比。
- 解答题答案字段为空属于结构性预期。
- 所有题目仍需人工审核。
