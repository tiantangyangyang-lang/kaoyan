import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import {
  animationKindSchema,
  QUESTION_ANIMATION_SEEDS,
  questionAnimationSeedSchema,
} from "../src/animationSeeds.js";

const here = dirname(fileURLToPath(import.meta.url));
const questionBankPath = resolve(
  here,
  "../../../content/final/math1/question-bank.json",
);

test("animation seeds match the canonical Math1 question bank", async () => {
  const questionBank = JSON.parse(await readFile(questionBankPath, "utf8")) as {
    questions: Array<{ stableId: string }>;
  };
  const canonicalIds = new Set(
    questionBank.questions.map((question) => question.stableId),
  );
  const questionIds = QUESTION_ANIMATION_SEEDS.map((seed) => seed.questionId);

  assert.equal(QUESTION_ANIMATION_SEEDS.length, 6);
  assert.equal(new Set(questionIds).size, questionIds.length);

  for (const seed of QUESTION_ANIMATION_SEEDS) {
    const parsed = questionAnimationSeedSchema.parse(seed);
    assert.equal(canonicalIds.has(parsed.questionId), true);
    assert.equal(parsed.subjectCode, "math1");
    assert.equal(parsed.payload.version, 1);
    assert.equal(
      animationKindSchema.safeParse(parsed.payload.kind).success,
      true,
    );
    assert.equal(parsed.payload.title.trim().length > 0, true);
    assert.equal(parsed.payload.summary.trim().length > 0, true);
    assert.match(parsed.payload.accent, /^#[0-9a-fA-F]{6}$/);
    assert.equal(parsed.payload.steps.length, 3);
    for (const step of parsed.payload.steps) {
      assert.equal(step.title.trim().length > 0, true);
      assert.equal(step.body.trim().length > 0, true);
    }
  }
});

test("the three redesigned samples state the intended mathematical progression", () => {
  const seeds = new Map(
    QUESTION_ANIMATION_SEEDS.map((seed) => [seed.questionId, seed.payload]),
  );

  assert.deepEqual(
    seeds.get("math1-2023-q01")?.steps.map((step) => step.title),
    ["斜率趋于 1", "截距趋于 1/e", "锁定选项 B"],
  );
  assert.deepEqual(
    seeds.get("math1-2025-q04")?.steps.map((step) => step.title),
    ["竖切读原积分", "横切断成两段", "两段对应选项 A"],
  );
  assert.deepEqual(
    seeds.get("math1-2023-q22")?.steps.map((step) => step.title),
    ["密度随半径增大", "先求分布函数", "求导得到密度"],
  );
});

test("the other three reviewed samples remain byte-for-byte unchanged", () => {
  const untouched = QUESTION_ANIMATION_SEEDS.filter((seed) =>
    ["math1-2023-q12", "math1-2023-q17", "math1-2023-q19"].includes(
      seed.questionId,
    ),
  );

  assert.deepEqual(untouched, [
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
  ]);
});
