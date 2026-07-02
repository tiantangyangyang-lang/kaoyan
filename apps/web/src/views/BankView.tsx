import { useMemo, useState } from "react";
import { Icon } from "../components/Icon";
import { QuestionList } from "../components/QuestionList";
import { SubjectSelector } from "../components/SubjectSelector";
import { TYPE_LABELS } from "../constants";
import type {
  Question,
  QuestionStateMap,
  SubjectCatalog,
  SubjectCode,
} from "../types";

export function BankView({
  subject,
  subjectName,
  subjectCatalog,
  subjectChosen,
  onSubjectChosenChange,
  onSubjectChange,
  questions,
  states,
  onOpenQuestion,
}: {
  subject: SubjectCode;
  subjectName: string;
  subjectCatalog: SubjectCatalog | null;
  subjectChosen: boolean;
  onSubjectChosenChange: (selected: boolean) => void;
  onSubjectChange: (subject: SubjectCode) => void;
  questions: Question[];
  states: QuestionStateMap;
  onOpenQuestion: (question: Question) => void;
}) {
  const years = useMemo(
    () => [...new Set(questions.map((q) => q.sourceYear))].sort((a, b) => b - a),
    [questions],
  );
  const [year, setYear] = useState("all");
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return questions.filter((question) => {
      if (year !== "all" && question.sourceYear !== Number(year)) return false;
      if (type !== "all" && question.type !== type) return false;
      if (status !== "all" && question.finalizationStatus !== status) return false;
      if (
        normalized &&
        !`${question.stableId} ${question.stem}`.toLowerCase().includes(normalized)
      ) {
        return false;
      }
      return true;
    });
  }, [questions, query, status, type, year]);

  const selectSubject = (nextSubject: SubjectCode) => {
    onSubjectChange(nextSubject);
    onSubjectChosenChange(true);
    setYear("all");
    setType("all");
    setStatus("all");
    setQuery("");
  };

  if (!subjectChosen) {
    return (
      <SubjectSelector
        featureLabel="真题库"
        subjectCatalog={subjectCatalog}
        onSelect={selectSubject}
      />
    );
  }

  return (
    <div className="page bank-page">
      <button className="back-link" onClick={() => onSubjectChosenChange(false)}>
        ← 返回选择科目
      </button>
      <div className="page-heading">
        <div>
          <span className="page-kicker">考研数学 · {subjectName}</span>
          <h1>{subjectName}真题库</h1>
          <p>按年份、题型与内容状态筛选，点击题目进入练习。</p>
        </div>
        <span className="result-count">{filtered.length} 题</span>
      </div>

      {subject === "math2" && (
        <div className="content-warning subject-review-warning">
          <span>
            数学二当前为待复核预览：题干可先练，答案和解析整理中。发现问题请反馈至
            tiantangyangyang@gmail.com。
          </span>
        </div>
      )}

      <div className="filter-bar">
        <label className="search-box">
          <Icon name="search" size={18} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索题干或 stableId"
          />
        </label>
        <select value={year} onChange={(event) => setYear(event.target.value)}>
          <option value="all">全部年份</option>
          {years.map((item) => (
            <option key={item} value={item}>
              {item} 年
            </option>
          ))}
        </select>
        <select value={type} onChange={(event) => setType(event.target.value)}>
          <option value="all">全部题型</option>
          {Object.entries(TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="all">全部内容状态</option>
          <option value="ready_for_approval">内容完整</option>
          <option value="ready_with_info">有提示项</option>
          <option value="blocked">待核对</option>
        </select>
      </div>

      <section className="panel bank-list-panel">
        <QuestionList
          questions={filtered.slice(0, 200)}
          states={states}
          onSelect={onOpenQuestion}
        />
        {filtered.length > 200 && (
          <p className="list-limit">
            当前显示前 200 题，请使用筛选快速定位。
          </p>
        )}
      </section>
    </div>
  );
}
