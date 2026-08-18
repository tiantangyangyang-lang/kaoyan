import { z } from "zod";

export const animationKindSchema = z.enum([
  "asymptote",
  "tangent-plane",
  "tangent-intercept",
  "cylindrical-solid",
  "integral-region",
  "radial-density",
]);

export const animationVariantSchema = z.enum([
  "probability-three-results-v1",
]);

export const mathAnimationSpecSchema = z.object({
  version: z.literal(1),
  kind: animationKindSchema,
  variant: animationVariantSchema.optional(),
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
}).superRefine((spec, context) => {
  if (spec.variant && spec.kind !== "radial-density") {
    context.addIssue({
      code: "custom",
      path: ["variant"],
      message: "animation variant is incompatible with this kind",
    });
  }
});

export const questionAnimationSeedSchema = z.object({
  questionId: z.string().regex(/^math1-\d{4}-q\d{2}$/),
  subjectCode: z.literal("math1"),
  payload: mathAnimationSpecSchema,
});

export type QuestionAnimationSeed = z.infer<typeof questionAnimationSeedSchema>;
export type MathAnimationSpec = z.infer<typeof mathAnimationSpecSchema>;

export const QUESTION_ANIMATION_SEEDS: QuestionAnimationSeed[] = [
  {
    questionId: "math1-2023-q01",
    subjectCode: "math1",
    payload: {
      version: 1,
      kind: "asymptote",
      title: "两次极限锁定斜渐近线",
      summary: "先由 y/x 的极限确定斜率，再由 y-x 的极限确定截距；两个条件共同锁定选项 B。",
      accent: "#4f46e5",
      steps: [
        { title: "斜率趋于 1", body: "k=lim(y/x)=1，曲线远端方向与直线 y=x 平行。" },
        { title: "截距趋于 1/e", body: "继续计算 lim(y-x)=1/e，竖直偏移量不是 0、e 或 -1/e。" },
        { title: "锁定选项 B", body: "斜率与截距合并得到唯一斜渐近线 y=x+1/e，因此选择 B。" },
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
      title: "换序关键：横切片会断成两段",
      summary: "原积分按竖线覆盖区域；换成固定 y 后，中间部分被抛物线排除，必须写成左右两个 x 区间。",
      accent: "#e11d48",
      steps: [
        { title: "竖切读原积分", body: "-2≤x≤2，每条竖线从 y=4-x² 向上积到 y=4。" },
        { title: "横切断成两段", body: "固定 0≤y≤4 后，条件变为 x²≥4-y；中间区间不属于积分区域。" },
        { title: "两段对应选项 A", body: "左段为 [-2,-√(4-y)]，右段为 [√(4-y),2]，所以选择 A。" },
      ],
    },
  },
  {
    questionId: "math1-2023-q22",
    subjectCode: "math1",
    payload: {
      version: 1,
      kind: "radial-density",
      variant: "probability-three-results-v1",
      title: "零协方差、不独立，再到 f_Z(z)=2z",
      summary: "先用圆盘对称性解释协方差为 0，再用圆盘外小邻域反证独立性，最后把 Z 看成半径平方求出密度。",
      accent: "#7c3aed",
      steps: [
        { title: "对称配对，协方差为 0", body: "圆盘和密度关于两坐标轴对称：x、y、xy 的正负贡献成对抵消，所以 E(X)=E(Y)=E(XY)=0，Cov(X,Y)=0。" },
        { title: "圆外小邻域，证明不独立", body: "取 P=(3/4,3/4)，因 x²+y²=9/8>1，可在 P 周围取仍落在圆外的小矩形 A×B。该矩形的联合概率为 0，但两个边缘区间的概率乘积大于 0，故不独立。" },
        { title: "半径平方给出 Z 的密度", body: "Z=r²，故 Z≤z 等价于 r≤√z。极坐标积分得 F_Z(z)=z²（0≤z≤1），求导得 f_Z(z)=2z（0<z<1）。" },
      ],
    },
  },
];

questionAnimationSeedSchema.array().parse(QUESTION_ANIMATION_SEEDS);
