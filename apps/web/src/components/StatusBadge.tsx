import { STATUS_LABELS, TYPE_LABELS } from "../constants";
import type { FinalizationStatus, QuestionType } from "../types";

export function TypeBadge({ type }: { type: QuestionType }) {
  return <span className="badge neutral">{TYPE_LABELS[type] ?? type}</span>;
}

export function ContentStatusBadge({
  status,
}: {
  status: FinalizationStatus;
}) {
  return (
    <span className={`badge content-status ${status}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}
