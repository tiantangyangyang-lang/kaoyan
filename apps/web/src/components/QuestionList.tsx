import { getQuestionState } from "../storage";
import type { Question, QuestionStateMap } from "../types";
import { ContentStatusBadge, TypeBadge } from "./StatusBadge";

export function QuestionList({
  questions,
  states,
  selectedId,
  onSelect,
  emptyText = "没有符合条件的题目",
}: {
  questions: Question[];
  states: QuestionStateMap;
  selectedId?: string | null;
  onSelect: (question: Question) => void;
  emptyText?: string;
}) {
  if (questions.length === 0) {
    return <div className="empty-state">{emptyText}</div>;
  }

  return (
    <div className="question-list">
      {questions.map((question) => {
        const state = getQuestionState(states, question.stableId);
        return (
          <button
            className={
              selectedId === question.stableId
                ? "question-row selected"
                : "question-row"
            }
            key={question.stableId}
            onClick={() => onSelect(question)}
          >
            <span className={`mastery-dot ${state.mastery}`} />
            <span className="question-row-main">
              <span className="question-row-title">
                {question.sourceYear} 年 · 第{" "}
                {question.questionNumber ?? question.stableId.split("-").at(-1)} 题
              </span>
              <span className="question-row-meta">
                <TypeBadge type={question.type} />
                <ContentStatusBadge status={question.finalizationStatus} />
                {state.attempts > 0 && <span>已练 {state.attempts} 次</span>}
              </span>
            </span>
            <span className="question-row-arrow">›</span>
          </button>
        );
      })}
    </div>
  );
}
