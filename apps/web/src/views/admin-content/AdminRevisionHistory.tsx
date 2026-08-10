import type { AdminQuestionSnapshot } from "../../types";

export function AdminRevisionHistory({
  snapshot,
}: {
  snapshot: AdminQuestionSnapshot;
}) {
  return (
    <div className="admin-history-card">
      <h2>审计历史{snapshot.historyHasMore ? "（最近 50 条）" : ""}</h2>
      {snapshot.revisions.length === 0 ? (
        <p>还没有内容修订记录。</p>
      ) : (
        <div className="admin-history-list">
          {snapshot.revisions.map((revision) => (
            <article key={revision.revision}>
              <strong>修订 {revision.revision} · {revision.action}</strong>
              <span>{new Date(revision.createdAt).toLocaleString("zh-CN")}</span>
              <p>{revision.reason}</p>
              <small>编辑者：{revision.editor}</small>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
