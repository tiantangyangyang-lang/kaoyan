import type { ContentDifference } from "./editor-model";

export function AdminDiffPanel({
  differences,
}: {
  differences: ContentDifference[];
}) {
  return (
    <div className="admin-diff-card">
      <h2>待提交差异（{differences.length} 项）</h2>
      {differences.length === 0 ? (
        <p>尚未修改内容。</p>
      ) : (
        differences.map((difference) => (
          <article key={difference.field}>
            <h3>{difference.field}</h3>
            <div>
              <section>
                <span>当前</span>
                <pre>{difference.before}</pre>
              </section>
              <section>
                <span>修改后</span>
                <pre>{difference.after}</pre>
              </section>
            </div>
          </article>
        ))
      )}
    </div>
  );
}
