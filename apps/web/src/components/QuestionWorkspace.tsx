import { useEffect, useState } from "react";
import {
  MASTERY_LABELS,
  TYPE_LABELS,
} from "../constants";
import type {
  Correctness,
  Mastery,
  Question,
  QuestionState,
} from "../types";
import { MathContent } from "./MathContent";
import { ContentStatusBadge } from "./StatusBadge";

export function QuestionWorkspace({
  question,
  state,
  onStateChange,
  onPrevious,
  onNext,
}: {
  question: Question;
  state: QuestionState;
  onStateChange: (state: QuestionState) => void;
  onPrevious?: () => void;
  onNext?: () => void;
}) {
  const [answer, setAnswer] = useState(state.lastAnswer);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    setAnswer(state.lastAnswer);
    setRevealed(false);
  }, [question.stableId]);

  const chooseAnswer = (value: string) => setAnswer(value);

  const record = (correctness: Correctness) => {
    onStateChange({
      ...state,
      attempts: state.attempts + 1,
      correctAttempts:
        state.correctAttempts + (correctness === "correct" ? 1 : 0),
      lastCorrectness: correctness,
      lastAnswer: answer,
      lastAttemptAt: new Date().toISOString(),
      inWrongBook:
        correctness === "incorrect" ? true : state.inWrongBook,
    });
    setRevealed(true);
  };

  const updateMastery = (mastery: Mastery) => {
    onStateChange({ ...state, mastery });
  };

  const displayedStem =
    question.options.length > 0
      ? question.stem.split(
          /\n\s*(?=(?:A|Ａ)\s*[．.、]|(?:\(|（)A(?:\)|）)|\\mathrm\s*\{\s*\(A\)\s*\})/i,
          1,
        )[0]
      : question.stem;

  return (
    <article className="workspace">
      <div className="workspace-header">
        <div>
          <span className="eyeline">
            {question.sourceYear} 年数学一 ·{" "}
            {TYPE_LABELS[question.type] ?? question.type}
          </span>
          <h2>
            第 {question.questionNumber ?? question.stableId.split("-").at(-1)} 题
          </h2>
        </div>
        <ContentStatusBadge status={question.finalizationStatus} />
      </div>

      {question.finalizationStatus === "blocked" && (
        <div className="content-warning">
          这道题存在待核对的源内容问题，可练习，但请谨慎使用答案。
        </div>
      )}

      <MathContent content={displayedStem} className="question-stem" />

      {question.options.length > 0 && (
        <div className="option-list">
          {question.options.map((option) => (
            <button
              className={answer === option.label ? "option selected" : "option"}
              key={option.label}
              onClick={() => chooseAnswer(option.label)}
            >
              <strong>{option.label}</strong>
              <MathContent content={option.value} />
            </button>
          ))}
        </div>
      )}

      {question.options.length === 0 && (
        <label className="answer-field">
          <span>记录你的最终答案或思路</span>
          <textarea
            value={answer}
            onChange={(event) => setAnswer(event.target.value)}
            placeholder="可简要记录最终答案；证明题也可记录完成情况"
          />
        </label>
      )}

      <div className="workspace-actions">
        <button className="button secondary" onClick={() => setRevealed(true)}>
          查看答案解析
        </button>
        <div className="assessment-actions">
          <button className="button success" onClick={() => record("correct")}>
            我做对了
          </button>
          <button className="button danger" onClick={() => record("incorrect")}>
            我做错了
          </button>
        </div>
      </div>

      {revealed && (
        <section className="solution-panel">
          <div className="solution-block">
            <span className="section-label">参考答案</span>
            {question.answer ? (
              <MathContent content={question.answer} />
            ) : (
              <p className="muted">本题没有独立答案字段，请结合解析核对。</p>
            )}
          </div>
          <div className="solution-block">
            <span className="section-label">解析</span>
            <MathContent content={question.explanation || "暂无解析"} />
          </div>
        </section>
      )}

      <section className="mastery-panel">
        <span>这道题现在属于</span>
        <div className="segmented">
          {(["mastered", "fuzzy", "unknown"] as Mastery[]).map((mastery) => (
            <button
              className={state.mastery === mastery ? `active ${mastery}` : ""}
              key={mastery}
              onClick={() => updateMastery(mastery)}
            >
              {MASTERY_LABELS[mastery]}
            </button>
          ))}
        </div>
        <button
          className={state.inWrongBook ? "wrong-toggle active" : "wrong-toggle"}
          onClick={() =>
            onStateChange({ ...state, inWrongBook: !state.inWrongBook })
          }
        >
          {state.inWrongBook ? "已加入错题本" : "加入错题本"}
        </button>
      </section>

      <label className="personal-note">
        <span>个人笔记</span>
        <textarea
          value={state.note}
          onChange={(event) =>
            onStateChange({ ...state, note: event.target.value })
          }
          placeholder="记录错因、关键步骤或下次复习提醒；会随 JSON 和 Obsidian 学习包导出。"
        />
      </label>

      <div className="question-navigation">
        <button className="text-button" disabled={!onPrevious} onClick={onPrevious}>
          ← 上一题
        </button>
        <button className="text-button" disabled={!onNext} onClick={onNext}>
          下一题 →
        </button>
      </div>
    </article>
  );
}
