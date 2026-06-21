import { getQuestionState } from "../storage";
import { TYPE_LABELS } from "../constants";
import type { Question, QuestionStateMap } from "../types";

export function StatsView({
  questions,
  states,
}: {
  questions: Question[];
  states: QuestionStateMap;
}) {
  const attempted = questions.filter(
    (q) => getQuestionState(states, q.stableId).attempts > 0,
  );
  const correctAttempts = Object.values(states).reduce(
    (sum, state) => sum + state.correctAttempts,
    0,
  );
  const totalAttempts = Object.values(states).reduce(
    (sum, state) => sum + state.attempts,
    0,
  );
  const typeStats = Object.entries(TYPE_LABELS)
    .map(([type, label]) => {
      const group = questions.filter((q) => q.type === type);
      const groupAttempted = group.filter(
        (q) => getQuestionState(states, q.stableId).attempts > 0,
      );
      const correct = groupAttempted.filter(
        (q) => getQuestionState(states, q.stableId).lastCorrectness === "correct",
      ).length;
      return {
        type,
        label,
        attempted: groupAttempted.length,
        total: group.length,
        correctRate:
          groupAttempted.length === 0 ? 0 : correct / groupAttempted.length,
      };
    })
    .filter((item) => item.total > 0);

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <h1>学习统计</h1>
          <p>只展示由你的练习记录直接计算出的结果。</p>
        </div>
      </div>

      <section className="stat-strip">
        <div>
          <span>已练题目</span>
          <strong>{attempted.length}</strong>
        </div>
        <div>
          <span>累计作答</span>
          <strong>{totalAttempts}</strong>
        </div>
        <div>
          <span>作答正确率</span>
          <strong>
            {totalAttempts === 0
              ? "—"
              : `${Math.round((correctAttempts / totalAttempts) * 100)}%`}
          </strong>
        </div>
        <div>
          <span>错题数量</span>
          <strong>
            {questions.filter((q) => states[q.stableId]?.inWrongBook).length}
          </strong>
        </div>
      </section>

      <section className="panel stats-panel">
        <div className="panel-heading">
          <div>
            <h2>按题型表现</h2>
            <p>样本少时不做过度推断</p>
          </div>
        </div>
        <div className="type-stats">
          {typeStats.map((item) => (
            <div className="type-stat-row" key={item.type}>
              <div>
                <strong>{item.label}</strong>
                <span>
                  已练 {item.attempted} / {item.total}
                </span>
              </div>
              <div className="bar">
                <span
                  style={{
                    width: `${item.attempted === 0 ? 0 : item.correctRate * 100}%`,
                  }}
                />
              </div>
              <strong className="rate">
                {item.attempted < 3
                  ? "证据不足"
                  : `${Math.round(item.correctRate * 100)}%`}
              </strong>
            </div>
          ))}
        </div>
      </section>

      <div className="analysis-boundary">
        <strong>分析边界</strong>
        <p>
          当前题库尚未完成知识点标注，因此首版不会猜测你的具体薄弱知识点。
          后续接入标签后，这里会显示证据题号、样本量、置信度和复习顺序。
        </p>
      </div>
    </div>
  );
}
