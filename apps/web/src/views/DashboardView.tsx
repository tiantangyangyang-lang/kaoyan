import { getQuestionState } from "../storage";
import type { Question, QuestionStateMap } from "../types";
import { Icon } from "../components/Icon";
import { QuestionList } from "../components/QuestionList";

export function DashboardView({
  questions,
  states,
  onPractice,
  onOpenQuestion,
  onOpenWrong,
}: {
  questions: Question[];
  states: QuestionStateMap;
  onPractice: () => void;
  onOpenQuestion: (question: Question) => void;
  onOpenWrong: () => void;
}) {
  const attempted = questions.filter(
    (q) => getQuestionState(states, q.stableId).attempts > 0,
  );
  const mastered = questions.filter(
    (q) => getQuestionState(states, q.stableId).mastery === "mastered",
  );
  const wrong = questions.filter(
    (q) => getQuestionState(states, q.stableId).inWrongBook,
  );
  const recent = [...attempted]
    .sort((a, b) => {
      const aDate = getQuestionState(states, a.stableId).lastAttemptAt ?? "";
      const bDate = getQuestionState(states, b.stableId).lastAttemptAt ?? "";
      return bDate.localeCompare(aDate);
    })
    .slice(0, 5);

  return (
    <div className="page dashboard-page">
      <div className="page-heading">
        <div>
          <h1>今天从一道真题开始</h1>
          <p>数学一真题已覆盖 1987–2025 年，共 {questions.length} 题。</p>
        </div>
        <button className="button primary" onClick={onPractice}>
          继续练习 <Icon name="arrow" size={18} />
        </button>
      </div>

      <section className="overview-band">
        <div className="overview-copy">
          <span>当前进度</span>
          <strong>
            {attempted.length}
            <small> / {questions.length} 题</small>
          </strong>
          <p>
            已掌握 {mastered.length} 题，错题本中有 {wrong.length} 题。
          </p>
          <div className="progress-track">
            <span
              style={{
                width: `${Math.max(2, (attempted.length / questions.length) * 100)}%`,
              }}
            />
          </div>
        </div>
        <div className="overview-numbers">
          <div>
            <strong>{mastered.length}</strong>
            <span>掌握</span>
          </div>
          <button onClick={onOpenWrong}>
            <strong>{wrong.length}</strong>
            <span>错题</span>
          </button>
          <div>
            <strong>{questions.length - attempted.length}</strong>
            <span>未练</span>
          </div>
        </div>
      </section>

      <div className="dashboard-grid">
        <section className="panel recent-panel">
          <div className="panel-heading">
            <div>
              <h2>最近练习</h2>
              <p>继续上次的节奏</p>
            </div>
          </div>
          <QuestionList
            questions={recent}
            states={states}
            onSelect={onOpenQuestion}
            emptyText="还没有练习记录，先完成第一道题。"
          />
        </section>

        <section className="panel guide-panel">
          <h2>推荐路径</h2>
          <div className="guide-step">
            <span>01</span>
            <div>
              <strong>选择一个年份</strong>
              <p>先按整年熟悉题型结构。</p>
            </div>
          </div>
          <div className="guide-step">
            <span>02</span>
            <div>
              <strong>记录掌握状态</strong>
              <p>用掌握、不熟、不会建立复习依据。</p>
            </div>
          </div>
          <div className="guide-step">
            <span>03</span>
            <div>
              <strong>集中重做错题</strong>
              <p>做对一次不会自动移出，避免虚假掌握。</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
