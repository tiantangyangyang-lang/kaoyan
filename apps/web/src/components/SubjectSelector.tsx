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
  const subjects =
    subjectCatalog?.subjects.filter((item) => item.enabled) ?? [
      {
        code: "math1" as const,
        name: "数学一",
        enabled: true,
        questionCount: 852,
        statusLabel: "已接入",
      },
      {
        code: "math2" as const,
        name: "数学二",
        enabled: true,
        questionCount: 67,
        statusLabel: "待复核",
        reviewNote: "2020、2023、2024 年题干已开放预览，答案解析整理中。",
      },
    ];

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
        {subjects.map((item, index) => {
          const isReady = item.statusLabel === "已接入";
          return (
            <button
              className={isReady ? "subject-card available" : "subject-card review"}
              key={item.code}
              onClick={() => onSelect(item.code)}
            >
              <span className="subject-index">{String(index + 1).padStart(2, "0")}</span>
              <div>
                <span className={isReady ? "subject-status ready" : "subject-status pending"}>
                  {item.statusLabel ?? "待复核"}
                </span>
                <h2>{item.name}</h2>
                <p>
                  {item.reviewNote ??
                    `当前收录 ${item.questionCount} 道真题。`}
                </p>
              </div>
              <strong>进入{featureLabel} →</strong>
            </button>
          );
        })}
      </div>
    </div>
  );
}
