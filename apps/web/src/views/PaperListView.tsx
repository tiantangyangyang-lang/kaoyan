import { SubjectSelector } from "../components/SubjectSelector";
import { getQuestionState } from "../storage";
import type {
  PaperSessionMap,
  Question,
  QuestionStateMap,
  SubjectCatalog,
  SubjectCode,
} from "../types";

export function PaperListView({
  subject,
  subjectName,
  subjectCatalog,
  subjectChosen,
  onSubjectChosenChange,
  onSubjectChange,
  questions,
  states,
  sessions,
  onStart,
}: {
  subject: SubjectCode;
  subjectName: string;
  subjectCatalog: SubjectCatalog | null;
  subjectChosen: boolean;
  onSubjectChosenChange: (selected: boolean) => void;
  onSubjectChange: (subject: SubjectCode) => void;
  questions: Question[];
  states: QuestionStateMap;
  sessions: PaperSessionMap;
  onStart: (year: number) => void;
}) {
  const years = [...new Set(questions.map((question) => question.sourceYear))].sort(
    (a, b) => b - a,
  );

  const selectSubject = (nextSubject: SubjectCode) => {
    onSubjectChange(nextSubject);
    onSubjectChosenChange(true);
  };

  if (!subjectChosen) {
    return (
      <SubjectSelector
        featureLabel="整卷练习"
        subjectCatalog={subjectCatalog}
        onSelect={selectSubject}
      />
    );
  }

  return (
    <div className="page">
      <button className="back-link" onClick={() => onSubjectChosenChange(false)}>
        ← 返回选择科目
      </button>
      <div className="page-heading">
        <div>
          <span className="page-kicker">考研数学 · {subjectName}</span>
          <h1>{subjectName}整卷练习</h1>
          <p>按年份完成一整套真题。交卷前只保存草稿，不计入正确率。</p>
        </div>
        <span className="result-count">{years.length} 套</span>
      </div>

      {subject === "math2" && (
        <div className="content-warning subject-review-warning">
          <span>
            数学二整卷为待复核预览：答案解析整理中，请提交后按“待核对”状态记录。
            反馈邮箱：tiantangyangyang@gmail.com。
          </span>
        </div>
      )}

      <div className="paper-grid">
        {years.map((year) => {
          const paperQuestions = questions.filter(
            (question) => question.sourceYear === year,
          );
          const session = sessions[String(year)];
          const attempted = paperQuestions.filter(
            (question) => getQuestionState(states, question.stableId).attempts > 0,
          ).length;
          const completed = session
            ? Object.values(session.results).filter(
                (result) => result.answer.trim() || result.correctness !== "unknown",
              ).length
            : 0;

          return (
            <article className="paper-card" key={year}>
              <div className="paper-year">
                <span>{subjectName}</span>
                <strong>{year}</strong>
              </div>
              <div className="paper-card-body">
                <div>
                  <strong>{paperQuestions.length} 道题</strong>
                  <span>历史已练 {attempted} 题</span>
                </div>
                {session && (
                  <div className={`paper-session-state ${session.status}`}>
                    {session.status === "submitted"
                      ? `已交卷 · ${new Date(session.submittedAt ?? "").toLocaleDateString()}`
                      : `草稿 ${completed}/${paperQuestions.length}`}
                  </div>
                )}
                <button
                  className="button primary"
                  onClick={() => onStart(year)}
                >
                  {session?.status === "in_progress"
                    ? "继续作答"
                    : session?.status === "submitted"
                      ? "重新练习"
                      : "开始整卷"}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
