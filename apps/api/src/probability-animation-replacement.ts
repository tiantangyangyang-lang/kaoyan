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
import { animationPayloadHash } from "./animation-sample-replacement.js";

export const PROBABILITY_ANIMATION_ID = "math1-2023-q22" as const;

export const ORIGINAL_PROBABILITY_ANIMATION_PAYLOAD: MathAnimationSpec = {
  version: 1,
  kind: "radial-density",
  title: "从径向密度推到 f_Z(z)=2z",
  summary: "先看密度如何随半径增大，再累积半径 √z 内的概率，最后对 F_Z(z)=z² 求导。",
  accent: "#7c3aed",
  steps: [
    { title: "密度随半径增大", body: "写成极坐标后 f(x,y)=(2/π)r²；同一圆周密度相同，外圈更密。" },
    { title: "先求分布函数", body: "Z≤z 等价于 r≤√z。对该圆盘积分得到 F_Z(z)=z²，0≤z≤1。" },
    { title: "求导得到密度", body: "对 F_Z(z) 求导，得到 f_Z(z)=2z（0<z<1），区间外为 0。" },
  ],
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

const decodePayload = (payload: string | Record<string, unknown>): unknown =>
  typeof payload === "string" ? JSON.parse(payload) : payload;

const replacementPayload = (): MathAnimationSpec => {
  const seed = QUESTION_ANIMATION_SEEDS.find(
    (candidate) => candidate.questionId === PROBABILITY_ANIMATION_ID,
  );
  if (!seed) throw new Error(`replacement seed missing: ${PROBABILITY_ANIMATION_ID}`);
  return mathAnimationSpecSchema.parse(seed.payload);
};

export async function replaceProbabilityAnimation(
  pool: ReplacementPool,
  options: { dryRun: boolean },
): Promise<{
  questionId: typeof PROBABILITY_ANIMATION_ID;
  beforeHash: string;
  afterHash: string;
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
       WHERE question_id = ?
       FOR UPDATE`,
      [PROBABILITY_ANIMATION_ID],
    );
    if (rows.length !== 1) {
      throw new Error(
        `expected 1 animation row for ${PROBABILITY_ANIMATION_ID}, found ${rows.length}`,
      );
    }

    const row = rows[0];
    if (
      !row ||
      row.question_id !== PROBABILITY_ANIMATION_ID ||
      row.subject_code !== "math1" ||
      !Boolean(row.is_active)
    ) {
      throw new Error(`${PROBABILITY_ANIMATION_ID} must be an active Math1 animation`);
    }

    const currentPayload = decodePayload(row.payload);
    mathAnimationSpecSchema.parse(currentPayload);
    const beforeHash = animationPayloadHash(currentPayload);
    const expectedHash = animationPayloadHash(
      ORIGINAL_PROBABILITY_ANIMATION_PAYLOAD,
    );
    if (beforeHash !== expectedHash) {
      throw new Error(
        `${PROBABILITY_ANIMATION_ID} no longer matches the reviewed payload; refusing overwrite`,
      );
    }

    const nextPayload = replacementPayload();
    const afterHash = animationPayloadHash(nextPayload);
    if (afterHash === beforeHash) {
      throw new Error(`${PROBABILITY_ANIMATION_ID} replacement payload is unchanged`);
    }

    const [result] = await connection.execute<ResultSetHeader>(
      `UPDATE kaoyan_question_animations
       SET payload = ?, updated_at = CURRENT_TIMESTAMP(3)
       WHERE question_id = ? AND subject_code = ? AND is_active = TRUE`,
      [JSON.stringify(nextPayload), PROBABILITY_ANIMATION_ID, "math1"],
    );
    if (result.affectedRows !== 1) {
      throw new Error(
        `${PROBABILITY_ANIMATION_ID} update affected ${result.affectedRows} rows`,
      );
    }

    if (options.dryRun) await connection.rollback();
    else await connection.commit();
    transactionOpen = false;

    return {
      questionId: PROBABILITY_ANIMATION_ID,
      beforeHash,
      afterHash,
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
