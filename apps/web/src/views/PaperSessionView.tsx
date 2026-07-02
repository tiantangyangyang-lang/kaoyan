import { MathContent } from "../components/MathContent";
import { ContentStatusBadge } from "../components/StatusBadge";
import { FEEDBACK_EMAIL, SUBJECT_LABELS, TYPE_LABELS } from "../constants";
import type {
  Correctness,
  PaperQuestionResult,
  PaperSession,
  Question,
} from "../types";

const EMPTY_RESULT: PaperQuestionResult = {
  answer: "",
  correctness: "unknown",
};

export function PaperSessionView({
  questions,
  session,
  onChange,
  onSubmit,
  onExit,
}: {
  questions: Question[];
  session: PaperSession;
  onChange: (session: PaperSession) => void;
  onSubmit: () => void;
  onExit: () => void;
}) {
  const currentIndex = Math.min(session.currentIndex, questions.length - 1);
  const question = questions[currentIndex];
  const result = session.results[question.stableId] ?? EMPTY_RESULT;
  const submitted = session.status === "submitted";
  const displayedStem =
    question.options.length > 0
      ? question.stem.split(
          /\n\s*(?=(?:A|Ａ)\s*[．.、]|(?:\(|（)A(?:\)|）)|\\mathrm\s*\{\s*\(A\)\s*\})/i,
          1,
        )[0]
      : question.stem;
  const completed = Object.values(session.results).filter(
    (item) => item.answer.trim() || item.correctness !== "unknown",
  ).length;
  const feedbackHref = FEEDBACK_EMAIL
    ? `mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent(
        `题目反馈：${question.stableId}`,
      )}&body=${encodeURIComponent(
        [
          `题目：${question.stableId}`,
          `年份：${question.sourceYear}`,
          `题号：${question.questionNumber ?? ""}`,
          "",
          "问题描述：",
        ].join("\n"),
      )}`
    : null;

  const updateResult = (patch: Partial<PaperQuestionResult>) => {
    onChange({
      ...session,
      results: {
        ...session.results,
        [question.stableId]: { ...result, ...patch },
      },
    });
  };

  const moveTo = (index: number) => {
    onChange({
      ...session,
      currentIndex: Math.max(0, Math.min(index, questions.length - 1)),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="paper-session-layout">
      <article className="workspace">
        <div className="workspace-header">
          <div>
            <span className="eyeline">
              {session.sourceYear} 年{SUBJECT_LABELS[question.subjectCode]}整卷 ·{" "}
              {TYPE_LABELS[question.type]}
            </span>
            <h2>第 {question.questionNumber ?? currentIndex + 1} 题</h2>
          </div>
          <ContentStatusBadge status={question.finalizationStatus} />
        </div>

        {question.finalizationStatus === "blocked" && (
          <div className="content-warning">
            <span>
              本题处于待复核状态。答案解析整理中，提交后可先按待核对记录。
            </span>
            {feedbackHref && (
              <a className="feedback-link" href={feedbackHref}>
                反馈：{FEEDBACK_EMAIL}
              </a>
            )}
          </div>
        )}

        <MathContent content={displayedStem} className="question-stem" />

        {question.options.length > 0 ? (
          <div className="option-list">
            {question.options.map((option) => (
              <button
                className={
                  result.answer === option.label ? "option selected" : "option"
                }
                disabled={submitted}
                key={option.label}
                onClick={() => updateResult({ answer: option.label })}
              >
                <strong>{option.label}</strong>
                <MathContent content={option.value ?? option.text ?? ""} />
              </button>
            ))}
          </div>
        ) : (
          <label className="answer-field">
            <span>记录最终答案、关键步骤或纸上作答完成情况</span>
            <textarea
              disabled={submitted}
              value={result.answer}
              onChange={(event) => updateResult({ answer: event.target.value })}
            />
          </label>
        )}

        {!submitted && (
          <section className="paper-assessment">
            <span>核对后标记本题结果</span>
            <div className="assessment-actions">
              {(
                [
                  ["correct", "做对"],
                  ["incorrect", "做错"],
                  ["unknown", "待核对"],
                ] as Array<[Correctness, string]>
              ).map(([correctness, label]) => (
                <button
                  className={
                    result.correctness === correctness
                      ? `assessment-chip active ${correctness}`
                      : "assessment-chip"
                  }
                  key={correctness}
                  onClick={() => updateResult({ correctness })}
                >
                  {label}
                </button>
              ))}
            </div>
          </section>
        )}

        {submitted && (
          <section className="solution-panel">
            <div className="solution-block">
              <span className="section-label">参考答案</span>
              <MathContent
                content={
                  question.answer ||
                  (question.answerStatus === "missing"
                    ? "答案整理中，暂未发布参考答案。"
                    : "本题无独立答案字段")
                }
              />
            </div>
            <div className="solution-block">
              <span className="section-label">解析</span>
              <MathContent
                content={
                  question.explanation ||
                  (question.explanationStatus === "missing"
                    ? "解析整理中，暂未发布。"
                    : "暂无解析")
                }
              />
            </div>
          </section>
        )}

        <div className="question-navigation">
          <button
            className="text-button"
            disabled={currentIndex === 0}
            onClick={() => moveTo(currentIndex - 1)}
          >
            ← 上一题
          </button>
          <button
            className="text-button"
            disabled={currentIndex === questions.length - 1}
            onClick={() => moveTo(currentIndex + 1)}
          >
            下一题 →
          </button>
        </div>
      </article>

      <aside className="paper-navigator">
        <div className="paper-navigator-heading">
          <span>{session.sourceYear} 年</span>
          <strong>
            {completed} / {questions.length}
          </strong>
        </div>
        <div className="question-number-grid">
          {questions.map((item, index) => {
            const itemResult = session.results[item.stableId];
            const done =
              itemResult &&
              (itemResult.answer.trim() || itemResult.correctness !== "unknown");
            return (
              <button
                className={`${index === currentIndex ? "active" : ""} ${
                  done ? "done" : ""
                }`}
                key={item.stableId}
                onClick={() => moveTo(index)}
              >
                {item.questionNumber ?? index + 1}
              </button>
            );
          })}
        </div>
        {!submitted && (
          <button className="button primary paper-submit" onClick={onSubmit}>
            提交整卷
          </button>
        )}
        <button className="button secondary paper-exit" onClick={onExit}>
          {submitted ? "返回试卷列表" : "保存并退出"}
        </button>
        {!submitted && <p>提交后才会写入累计作答、正确率和错题本。</p>}
      </aside>
    </div>
  );
}
