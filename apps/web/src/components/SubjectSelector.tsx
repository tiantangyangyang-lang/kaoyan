import type { SubjectCode } from "../types";

export function SubjectSelector({
  featureLabel,
  onSelect,
}: {
  featureLabel: string;
  onSelect: (subject: SubjectCode) => void;
}) {
  return (
    <div className="page subject-selection-page">
      <div className="page-heading">
        <div>
          <span className="page-kicker">考研数学</span>
          <h1>选择考试科目</h1>
          <p>选择科目后进入对应的{featureLabel}。数学二的位置已经预留。</p>
        </div>
      </div>

      <div className="subject-card-grid">
        <button className="subject-card available" onClick={() => onSelect("math1")}>
          <span className="subject-index">01</span>
          <div>
            <span className="subject-status ready">已接入</span>
            <h2>数学一</h2>
            <p>1987—2025 年，当前收录 852 道真题。</p>
          </div>
          <strong>进入{featureLabel} →</strong>
        </button>

        <button className="subject-card upcoming" onClick={() => onSelect("math2")}>
          <span className="subject-index">02</span>
          <div>
            <span className="subject-status pending">建设中</span>
            <h2>数学二</h2>
            <p>入口与数据结构已保留，题库尚未完成。</p>
          </div>
          <strong>查看状态 →</strong>
        </button>
      </div>
    </div>
  );
}

export function SubjectUnavailable({
  featureLabel,
  onBack,
}: {
  featureLabel: string;
  onBack: () => void;
}) {
  return (
    <div className="page">
      <button className="back-link" onClick={onBack}>
        ← 返回选择科目
      </button>
      <section className="subject-unavailable">
        <span className="subject-status pending">数学二 · 建设中</span>
        <h1>数学二{featureLabel}尚未完成</h1>
        <p>
          页面入口、学习状态和题库适配位置已经预留。数学二数据完成后会直接接入，
          不需要重做当前数学一功能。
        </p>
        <button className="button primary" onClick={onBack}>
          返回选择数学一
        </button>
      </section>
    </div>
  );
}
