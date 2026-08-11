import { createHash } from "node:crypto";
import type {
  Pool,
  PoolConnection,
  ResultSetHeader,
  RowDataPacket,
} from "mysql2/promise";
import {
  mathAnimationSpecSchema,
  QUESTION_ANIMATION_SEEDS,
  type MathAnimationSpec,
} from "./animationSeeds.js";

export const ANIMATION_SAMPLE_REPLACEMENT_IDS = [
  "math1-2023-q01",
  "math1-2025-q04",
  "math1-2023-q22",
] as const;

type ReplacementId = (typeof ANIMATION_SAMPLE_REPLACEMENT_IDS)[number];

export const ORIGINAL_ANIMATION_SAMPLE_PAYLOADS: Record<
  ReplacementId,
  MathAnimationSpec
> = {
  "math1-2023-q01": {
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
  "math1-2025-q04": {
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
  "math1-2023-q22": {
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
};

interface AnimationRow extends RowDataPacket {
  question_id: string;
  subject_code: string;
  payload: string | Record<string, unknown>;
  is_active: number | boolean;
}

type ReplacementPool = Pick<Pool, "getConnection">;
type ReplacementConnection = Pick<
  PoolConnection,
  "beginTransaction" | "commit" | "rollback" | "execute" | "query" | "release"
>;

const normalize = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(normalize);
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => [key, normalize(item)]),
    );
  }
  return value;
};

export const animationPayloadHash = (payload: unknown): string =>
  createHash("sha256")
    .update(JSON.stringify(normalize(payload)))
    .digest("hex");

const decodePayload = (payload: string | Record<string, unknown>): unknown =>
  typeof payload === "string" ? JSON.parse(payload) : payload;

const replacementPayloads = (): Record<ReplacementId, MathAnimationSpec> => {
  const result = {} as Record<ReplacementId, MathAnimationSpec>;
  for (const questionId of ANIMATION_SAMPLE_REPLACEMENT_IDS) {
    const seed = QUESTION_ANIMATION_SEEDS.find(
      (candidate) => candidate.questionId === questionId,
    );
    if (!seed) throw new Error(`replacement seed missing: ${questionId}`);
    result[questionId] = mathAnimationSpecSchema.parse(seed.payload);
  }
  return result;
};

export async function replaceAnimationSamples(
  pool: ReplacementPool,
  options: { dryRun: boolean },
): Promise<{
  questionIds: ReplacementId[];
  beforeHashes: Record<ReplacementId, string>;
  afterHashes: Record<ReplacementId, string>;
  dryRun: boolean;
  transaction: "rolled_back" | "committed";
}> {
  const connection = (await pool.getConnection()) as ReplacementConnection;
  let transactionOpen = false;
  try {
    await connection.beginTransaction();
    transactionOpen = true;

    const [rows] = await connection.query<AnimationRow[]>(
      `SELECT question_id, subject_code, payload, is_active
       FROM kaoyan_question_animations
       WHERE question_id IN (?, ?, ?)
       ORDER BY question_id
       FOR UPDATE`,
      [...ANIMATION_SAMPLE_REPLACEMENT_IDS],
    );
    if (rows.length !== ANIMATION_SAMPLE_REPLACEMENT_IDS.length) {
      throw new Error(
        `expected 3 animation rows, found ${rows.length}; refusing partial replacement`,
      );
    }

    const rowsById = new Map(rows.map((row) => [row.question_id, row]));
    const nextPayloads = replacementPayloads();
    const beforeHashes = {} as Record<ReplacementId, string>;
    const afterHashes = {} as Record<ReplacementId, string>;

    for (const questionId of ANIMATION_SAMPLE_REPLACEMENT_IDS) {
      const row = rowsById.get(questionId);
      if (!row || row.subject_code !== "math1" || !Boolean(row.is_active)) {
        throw new Error(`${questionId} must be an active Math1 animation`);
      }
      const currentPayload = decodePayload(row.payload);
      mathAnimationSpecSchema.parse(currentPayload);
      const expectedOldHash = animationPayloadHash(
        ORIGINAL_ANIMATION_SAMPLE_PAYLOADS[questionId],
      );
      const currentHash = animationPayloadHash(currentPayload);
      if (currentHash !== expectedOldHash) {
        throw new Error(
          `${questionId} no longer matches the reviewed original payload; refusing overwrite`,
        );
      }
      beforeHashes[questionId] = currentHash;
      afterHashes[questionId] = animationPayloadHash(nextPayloads[questionId]);
    }

    for (const questionId of ANIMATION_SAMPLE_REPLACEMENT_IDS) {
      const [result] = await connection.execute<ResultSetHeader>(
        `UPDATE kaoyan_question_animations
         SET payload = ?, updated_at = CURRENT_TIMESTAMP(3)
         WHERE question_id = ? AND subject_code = 'math1' AND is_active = TRUE`,
        [JSON.stringify(nextPayloads[questionId]), questionId],
      );
      if (result.affectedRows !== 1) {
        throw new Error(`${questionId} update affected ${result.affectedRows} rows`);
      }
    }

    if (options.dryRun) await connection.rollback();
    else await connection.commit();
    transactionOpen = false;
    return {
      questionIds: [...ANIMATION_SAMPLE_REPLACEMENT_IDS],
      beforeHashes,
      afterHashes,
      dryRun: options.dryRun,
      transaction: options.dryRun ? "rolled_back" : "committed",
    };
  } catch (error) {
    if (transactionOpen) await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
