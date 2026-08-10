import type {
  AdminContentChanges,
  AdminQuestionSnapshot,
  PublishedContentOption,
} from "../../types";

const optionLabels = ["A", "B", "C", "D"] as const;

export interface EditorDraft {
  stem: string;
  options: PublishedContentOption[];
  answer: string;
  answerStatus: string;
  explanation: string;
  explanationStatus: string;
}

export interface ContentDifference {
  field: string;
  before: string;
  after: string;
}

const same = (left: unknown, right: unknown) =>
  JSON.stringify(left) === JSON.stringify(right);

export function draftFromSnapshot(
  snapshot: AdminQuestionSnapshot,
): EditorDraft {
  const optionByLabel = new Map(
    snapshot.effective.options.map((option) => [option.label, option.value]),
  );
  return {
    stem: snapshot.effective.stem,
    options: optionLabels.map((label) => ({
      label,
      value: optionByLabel.get(label) ?? "",
    })),
    answer: snapshot.effective.answer ?? "",
    answerStatus: snapshot.effective.answerStatus,
    explanation: snapshot.effective.explanation ?? "",
    explanationStatus: snapshot.effective.explanationStatus,
  };
}

export function buildChanges(
  snapshot: AdminQuestionSnapshot,
  draft: EditorDraft,
): AdminContentChanges {
  const changes: AdminContentChanges = {};
  if (draft.stem !== snapshot.effective.stem) changes.stem = draft.stem;
  if (
    snapshot.effective.type === "multiple_choice" &&
    !same(draft.options, snapshot.effective.options)
  ) {
    changes.options = draft.options;
  }
  const answer = draft.answer === "" ? null : draft.answer;
  if (answer !== snapshot.effective.answer) changes.answer = answer;
  if (draft.answerStatus !== snapshot.effective.answerStatus) {
    changes.answerStatus = draft.answerStatus;
  }
  const explanation = draft.explanation === "" ? null : draft.explanation;
  if (explanation !== snapshot.effective.explanation) {
    changes.explanation = explanation;
  }
  if (draft.explanationStatus !== snapshot.effective.explanationStatus) {
    changes.explanationStatus = draft.explanationStatus;
  }
  return changes;
}

function formatValue(value: unknown) {
  if (value === null) return "（空）";
  if (Array.isArray(value)) {
    return value.map((item) => `${item.label}. ${item.value}`).join("\n");
  }
  return String(value);
}

export function differencesFor(
  snapshot: AdminQuestionSnapshot,
  changes: AdminContentChanges,
): ContentDifference[] {
  const labels: Record<keyof AdminContentChanges, string> = {
    stem: "题干",
    options: "选项",
    answer: "答案",
    answerStatus: "答案状态",
    explanation: "解析",
    explanationStatus: "解析状态",
  };
  return Object.entries(changes).map(([key, after]) => ({
    field: labels[key as keyof AdminContentChanges],
    before: formatValue(
      snapshot.effective[key as keyof AdminContentChanges],
    ),
    after: formatValue(after),
  }));
}
