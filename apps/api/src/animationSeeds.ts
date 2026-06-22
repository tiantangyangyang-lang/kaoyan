import { z } from "zod";

export const animationKindSchema = z.enum([
  "asymptote",
  "tangent-plane",
  "tangent-intercept",
  "cylindrical-solid",
  "integral-region",
  "radial-density",
]);

export const mathAnimationSpecSchema = z.object({
  version: z.literal(1),
  kind: animationKindSchema,
  title: z.string().trim().min(1).max(120),
  summary: z.string().trim().min(1).max(300),
  accent: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  steps: z
    .array(
      z.object({
        title: z.string().trim().min(1).max(80),
        body: z.string().trim().min(1).max(300),
      }),
    )
    .length(3),
});

export const questionAnimationSeedSchema = z.object({
  questionId: z.string().regex(/^math1-\d{4}-q\d{2}$/),
  subjectCode: z.literal("math1"),
  payload: mathAnimationSpecSchema,
});

export type QuestionAnimationSeed = z.infer<typeof questionAnimationSeedSchema>;

export const QUESTION_ANIMATION_SEEDS: QuestionAnimationSeed[] = [
  {
    questionId: "math1-2023-q01",
    subjectCode: "math1",
    payload: {
      version: 1,
      kind: "asymptote",
      title: "曲线如何贴近斜渐近线",
      summary: "把“先求斜率、再求截距”变成一条逐渐贴近直线的曲线。",
      accent: "#4f46e5",
      steps: [
        { title: "观察远端", body: "让 x 向右增大，曲线的整体方向逐渐稳定。" },
        { title: "锁定斜率", body: "y/x 的极限为 1，所以候选渐近线与 y=x 平行。" },
        { title: "读出截距", body: "y-x 的极限为 1/e，曲线最终贴近 y=x+1/e。" },
      ],
    },
  },
  {
    questionId: "math1-2023-q12",
    subjectCode: "math1",
    payload: {
      version: 1,
      kind: "tangent-plane",
      title: "从曲面局部放大到切平面",
      summary: "切平面保留曲面在原点沿 x、y 两个方向的一阶变化率。",
      accent: "#0891b2",
      steps: [
        { title: "定位切点", body: "曲面经过 O(0,0,0)，先固定局部观察中心。" },
        { title: "读取两个斜率", body: "在原点有 z_x=1、z_y=2。" },
        { title: "铺开切平面", body: "局部线性近似为 z=x+2y，即 x+2y-z=0。" },
      ],
    },
  },
  {
    questionId: "math1-2023-q17",
    subjectCode: "math1",
    payload: {
      version: 1,
      kind: "tangent-intercept",
      title: "切线截距为何变成微分方程",
      summary: "拖动切点，比较横向距离 x 与切线在 y 轴上的截距。",
      accent: "#d97706",
      steps: [
        { title: "画出切线", body: "点 P(x,y) 处切线的 y 轴截距是 y-xy′。" },
        { title: "翻译几何条件", body: "P 到 y 轴的距离是 x，因此 x=y-xy′。" },
        { title: "得到曲线", body: "整理并结合 y(1)=2，可得到题目的特解曲线。" },
      ],
    },
  },
  {
    questionId: "math1-2023-q19",
    subjectCode: "math1",
    payload: {
      version: 1,
      kind: "cylindrical-solid",
      title: "柱面中的高度随 x 改变",
      summary: "底面是单位圆盘，上盖 z=1-x 使每根竖直小柱高度不同。",
      accent: "#059669",
      steps: [
        { title: "确定底面", body: "x²+y²≤1 给出单位圆盘。" },
        { title: "确定上下界", body: "下界 z=0，上界 z=1-x。" },
        { title: "用高斯公式", body: "封闭曲面积分转为区域 Ω 上的三重积分。" },
      ],
    },
  },
  {
    questionId: "math1-2025-q04",
    subjectCode: "math1",
    payload: {
      version: 1,
      kind: "integral-region",
      title: "二重积分换序：先看区域再写上下限",
      summary: "原积分描述抛物线 y=4-x² 与直线 y=4 之间的帽形区域。",
      accent: "#e11d48",
      steps: [
        { title: "按 x 扫描", body: "-2≤x≤2，每条竖线从 4-x² 积到 4。" },
        { title: "固定 y", body: "换序时 0≤y≤4，并由 x²≥4-y 分成左右两块。" },
        { title: "写成两段", body: "x≤-√(4-y) 或 x≥√(4-y)，不能误写成中间区域。" },
      ],
    },
  },
  {
    questionId: "math1-2023-q22",
    subjectCode: "math1",
    payload: {
      version: 1,
      kind: "radial-density",
      title: "从单位圆盘压缩成半径分布",
      summary: "密度只依赖 r²，角度积分后，二维问题变成半径变量 Z=r²。",
      accent: "#7c3aed",
      steps: [
        { title: "识别径向对称", body: "同一圆周上的点具有相同密度。" },
        { title: "积掉角度", body: "极坐标面积元 r dr dθ 带来额外的 r。" },
        { title: "改变量 Z=r²", body: "圆盘由内向外累积，得到 Z 在 [0,1] 上的密度。" },
      ],
    },
  },
];

questionAnimationSeedSchema.array().parse(QUESTION_ANIMATION_SEEDS);
