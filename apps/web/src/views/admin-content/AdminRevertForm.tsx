import type { AdminQuestionSnapshot } from "../../types";

export function AdminRevertForm({
  snapshot,
  currentRevision,
  targetRevision,
  onChange,
}: {
  snapshot: AdminQuestionSnapshot;
  currentRevision: number;
  targetRevision: number;
  onChange: (revision: number) => void;
}) {
  return (
    <div className="admin-revert-card">
      <label>
        目标修订号（0 表示原始发布内容）
        <input
          type="number"
          min={0}
          max={currentRevision - 1}
          step={1}
          list="admin-revision-targets"
          value={targetRevision}
          onChange={(event) => onChange(Number(event.target.value))}
        />
        <datalist id="admin-revision-targets">
          <option value={0}>原始发布内容</option>
          {snapshot.revisions
            .filter((revision) => revision.revision < currentRevision)
            .map((revision) => (
              <option key={revision.revision} value={revision.revision} />
            ))}
        </datalist>
      </label>
      <p>
        可以输入下方未显示的更早修订号；恢复不会删除历史，而是创建一个新的修订记录。
      </p>
    </div>
  );
}
