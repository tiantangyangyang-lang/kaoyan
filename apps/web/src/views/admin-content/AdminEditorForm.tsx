import type { AdminQuestionSnapshot } from "../../types";
import type { EditorDraft } from "./editor-model";

export function AdminEditorForm({
  snapshot,
  draft,
  onChange,
}: {
  snapshot: AdminQuestionSnapshot;
  draft: EditorDraft;
  onChange: (draft: EditorDraft) => void;
}) {
  return (
    <div className="admin-editor-grid">
      <label className="admin-field admin-field-wide">
        题干
        <textarea
          rows={7}
          value={draft.stem}
          onChange={(event) => onChange({ ...draft, stem: event.target.value })}
        />
      </label>

      {snapshot.effective.type === "multiple_choice" &&
        draft.options.map((option, index) => (
          <label className="admin-field" key={option.label}>
            选项 {option.label}
            <textarea
              rows={3}
              value={option.value}
              onChange={(event) => {
                const options = draft.options.map((item, itemIndex) =>
                  itemIndex === index
                    ? { ...item, value: event.target.value }
                    : item,
                );
                onChange({ ...draft, options });
              }}
            />
          </label>
        ))}

      <label className="admin-field">
        答案
        <textarea
          rows={3}
          value={draft.answer}
          onChange={(event) => onChange({ ...draft, answer: event.target.value })}
        />
      </label>
      <label className="admin-field">
        答案状态
        <input
          value={draft.answerStatus}
          onChange={(event) =>
            onChange({ ...draft, answerStatus: event.target.value })
          }
        />
      </label>
      <label className="admin-field admin-field-wide">
        解析
        <textarea
          rows={12}
          value={draft.explanation}
          onChange={(event) =>
            onChange({ ...draft, explanation: event.target.value })
          }
        />
      </label>
      <label className="admin-field">
        解析状态
        <input
          value={draft.explanationStatus}
          onChange={(event) =>
            onChange({ ...draft, explanationStatus: event.target.value })
          }
        />
      </label>
    </div>
  );
}
