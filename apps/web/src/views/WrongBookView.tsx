import { QuestionList } from "../components/QuestionList";
import type { Question, QuestionStateMap } from "../types";

export function WrongBookView({
  questions,
  states,
  onOpenQuestion,
}: {
  questions: Question[];
  states: QuestionStateMap;
  onOpenQuestion: (question: Question) => void;
}) {
  const wrong = questions.filter((q) => states[q.stableId]?.inWrongBook);

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <h1>错题本</h1>
          <p>做错后自动收录；确认掌握前不会自动移除。</p>
        </div>
        <span className="result-count">{wrong.length} 题</span>
      </div>
      <section className="panel bank-list-panel">
        <QuestionList
          questions={wrong}
          states={states}
          onSelect={onOpenQuestion}
          emptyText="错题本还是空的。做错的题会自动出现在这里。"
        />
      </section>
    </div>
  );
}
