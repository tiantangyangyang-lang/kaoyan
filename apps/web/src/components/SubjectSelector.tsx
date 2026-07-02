import type { SubjectCatalog, SubjectCode } from "../types";

export function SubjectSelector({
  featureLabel,
  subjectCatalog,
  onSelect,
}: {
  featureLabel: string;
  subjectCatalog: SubjectCatalog | null;
  onSelect: (subject: SubjectCode) => void;
}) {
  const math1 = subjectCatalog?.subjects.find((item) => item.code === "math1");
  const math2 = subjectCatalog?.subjects.find((item) => item.code === "math2");
  const math1Count = math1?.questionCount ?? 852;
  const math2Count = math2?.questionCount ?? 67;

  return (
    <div className="page subject-selection-page">
      <div className="page-heading">
        <div>
          <span className="page-kicker">考研数学</span>
          <h1>选择考试科目</h1>
          <p>选择科目后进入对应的{featureLabel}。数学二为待复核预览。</p>
        </div>
      </div>

      <div className="subject-card-grid">
        <button className="subject-card available" onClick={() => onSelect("math1")}>
          <span className="subject-index">01</span>
          <div>
            <span className="subject-status ready">已接入</span>
            <h2>数学一</h2>
            <p>1987—2025 年，当前收录 {math1Count} 道真题。</p>
          </div>
          <strong>进入{featureLabel} →</strong>
        </button>

        <button className="subject-card review" onClick={() => onSelect("math2")}>
          <span className="subject-index">02</span>
          <div>
            <span className="subject-status pending">待复核</span>
            <h2>数学二</h2>
            <p>
              {math2?.reviewNote ??
                `2020、2023、2024 年，当前收录 ${math2Count} 道题；答案解析整理中。`}
            </p>
          </div>
          <strong>进入{featureLabel} →</strong>
        </button>
      </div>
    </div>
  );
}
