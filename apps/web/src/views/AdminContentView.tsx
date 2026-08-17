import { AdminDiffPanel } from "./admin-content/AdminDiffPanel";
import { AdminEditorForm } from "./admin-content/AdminEditorForm";
import { AdminRevisionHistory } from "./admin-content/AdminRevisionHistory";
import { AdminRevertForm } from "./admin-content/AdminRevertForm";
import { useAdminContentEditor } from "./admin-content/useAdminContentEditor";
import type { SubjectCode } from "../types";
import "./admin-content/admin-content.css";

export function AdminContentView({
  adminKey,
  onAdminKeyChange,
  onKeyRejected,
  onQuestionSaved,
}: {
  adminKey: string;
  onAdminKeyChange: (key: string) => void;
  onKeyRejected: () => void;
  onQuestionSaved: (subject: SubjectCode, stableId: string) => Promise<void>;
}) {
  const editor = useAdminContentEditor({
    adminKey,
    onKeyRejected,
    onQuestionSaved,
  });
  const {
    stableId,
    setStableId,
    snapshot,
    draft,
    setDraft,
    reason,
    setReason,
    mode,
    setMode,
    targetRevision,
    setTargetRevision,
    previewResult,
    message,
    busy,
    differences,
    currentRevision,
    previewCurrent,
    clearPreview,
    search,
    execute,
  } = editor;

  const changeMode = (next: "edit" | "revert") => {
    setMode(next);
    if (next === "revert") setTargetRevision(0);
    clearPreview();
  };

  return (
    <section className="page admin-content-page">
      <div className="page-heading">
        <div>
          <span className="page-kicker">ADMIN · AUDITED CONTENT</span>
          <h1>内容管理</h1>
          <p>
            每次保存前必须先做回滚预览；所有修改和恢复操作都会保留编辑者、原因和版本记录。
          </p>
        </div>
      </div>

      <div className="admin-access-card">
        <label>
          管理员密钥（只保存在当前页面内存）
          <input
            type="password"
            autoComplete="new-password"
            value={adminKey}
            onChange={(event) => {
              onAdminKeyChange(event.target.value);
              clearPreview();
            }}
            placeholder="输入独立管理密钥"
          />
        </label>
        <label>
          题目 stable ID
          <input
            value={stableId}
            onChange={(event) => setStableId(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") void search();
            }}
            placeholder="math1-2025-q04"
          />
        </label>
        <button className="button primary" disabled={busy} onClick={search}>
          {busy ? "处理中…" : "查询题目"}
        </button>
      </div>

      {message && (
        <p className="admin-message" role="status">
          {message}
        </p>
      )}

      {snapshot && draft && (
        <>
          <div className="admin-question-summary">
            <div>
              <span>stable ID</span>
              <strong>{snapshot.stableId}</strong>
            </div>
            <div>
              <span>科目 / 年份 / 题号</span>
              <strong>
                {snapshot.subjectCode} · {snapshot.effective.sourceYear} · Q
                {snapshot.effective.questionNumber}
              </strong>
            </div>
            <div>
              <span>当前修订</span>
              <strong>{currentRevision}</strong>
            </div>
            <div>
              <span>覆盖状态</span>
              <strong>{snapshot.override?.active ? "生效中" : "使用原始内容"}</strong>
            </div>
          </div>

          <div className="admin-mode-tabs">
            <button
              className={mode === "edit" ? "active" : ""}
              onClick={() => changeMode("edit")}
            >
              编辑内容
            </button>
            <button
              className={mode === "revert" ? "active" : ""}
              disabled={currentRevision === 0}
              onClick={() => changeMode("revert")}
            >
              恢复历史版本
            </button>
          </div>

          {mode === "edit" ? (
            <AdminEditorForm
              snapshot={snapshot}
              draft={draft}
              onChange={(next) => {
                setDraft(next);
                clearPreview();
              }}
            />
          ) : (
            <AdminRevertForm
              snapshot={snapshot}
              currentRevision={currentRevision}
              targetRevision={targetRevision}
              onChange={(revision) => {
                setTargetRevision(revision);
                clearPreview();
              }}
            />
          )}

          <label className="admin-field admin-reason-field">
            修改原因（永久审计记录）
            <input
              value={reason}
              maxLength={500}
              onChange={(event) => {
                setReason(event.target.value);
                clearPreview();
              }}
              placeholder="例如：根据 2025 年原卷图片修复 C、D 选项"
            />
          </label>

          {mode === "edit" && <AdminDiffPanel differences={differences} />}

          <div className="admin-actions">
            <button
              className="button secondary"
              disabled={busy}
              onClick={() => void execute("preview")}
            >
              1. 预览并回滚事务
            </button>
            <button
              className="button danger"
              disabled={busy || !previewCurrent}
              onClick={() => void execute("commit")}
            >
              2. 确认保存到数据库
            </button>
            {previewCurrent && (
              <span className="admin-preview-ok">
                预览已通过：修订 {previewResult?.previousRevision} → {previewResult?.revision}
              </span>
            )}
          </div>

          <AdminRevisionHistory snapshot={snapshot} />
        </>
      )}
    </section>
  );
}
