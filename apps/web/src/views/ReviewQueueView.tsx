import { QuestionList } from "../components/QuestionList";
import { getQuestionState } from "../storage";
import type { Question, QuestionStateMap } from "../types";

export function ReviewQueueView({
  questions,
  states,
  onOpenQuestion,
}: {
  questions: Question[];
  states: QuestionStateMap;
  onOpenQuestion: (question: Question) => void;
}) {
  const priority = (question: Question) => {
    const state = getQuestionState(states, question.stableId);
    if (state.inWrongBook || state.lastCorrectness === "incorrect") return 0;
    if (state.mastery === "unknown") return 1;
    return 2;
  };
  const queue = questions
    .filter((question) => {
      const state = getQuestionState(states, question.stableId);
      return (
        state.inWrongBook ||
        state.lastCorrectness === "incorrect" ||
        state.mastery === "unknown" ||
        state.mastery === "fuzzy"
      );
    })
    .sort(
      (a, b) =>
        priority(a) - priority(b) ||
        (getQuestionState(states, a.stableId).lastAttemptAt ?? "").localeCompare(
          getQuestionState(states, b.stableId).lastAttemptAt ?? "",
        ),
    );

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <h1>复习队列</h1>
          <p>先复习错题，再处理不会和不熟；同优先级下更早练过的题排在前面。</p>
        </div>
        <span className="result-count">{queue.length} 题</span>
      </div>
      <section className="review-summary">
        <div>
          <strong>
            {
              queue.filter((question) => priority(question) === 0).length
            }
          </strong>
          <span>错题优先</span>
        </div>
        <div>
          <strong>
            {
              queue.filter((question) => priority(question) === 1).length
            }
          </strong>
          <span>不会</span>
        </div>
        <div>
          <strong>
            {
              queue.filter((question) => priority(question) === 2).length
            }
          </strong>
          <span>不熟</span>
        </div>
      </section>
      <section className="panel bank-list-panel">
        <QuestionList
          questions={queue}
          states={states}
          onSelect={onOpenQuestion}
          emptyText="当前没有待复习题。先完成一组单题或一套整卷。"
        />
      </section>
    </div>
  );
}
