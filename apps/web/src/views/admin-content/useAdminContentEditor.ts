import { useMemo, useState } from "react";
import {
  ApiError,
  executeAdminContentAction,
  loadAdminQuestion,
} from "../../api";
import type { AdminOverrideResult, AdminQuestionSnapshot } from "../../types";
import {
  buildChanges,
  differencesFor,
  draftFromSnapshot,
  type EditorDraft,
} from "./editor-model";

export type AdminEditorMode = "edit" | "revert";

export function useAdminContentEditor({
  adminKey,
  onKeyRejected,
}: {
  adminKey: string;
  onKeyRejected: () => void;
}) {
  const [stableId, setStableId] = useState("");
  const [snapshot, setSnapshot] = useState<AdminQuestionSnapshot | null>(null);
  const [draft, setDraft] = useState<EditorDraft | null>(null);
  const [reason, setReason] = useState("");
  const [mode, setMode] = useState<AdminEditorMode>("edit");
  const [targetRevision, setTargetRevision] = useState(0);
  const [previewFingerprint, setPreviewFingerprint] = useState("");
  const [previewResult, setPreviewResult] =
    useState<AdminOverrideResult | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const changes = useMemo(
    () => (snapshot && draft ? buildChanges(snapshot, draft) : {}),
    [snapshot, draft],
  );
  const differences = useMemo(
    () => (snapshot ? differencesFor(snapshot, changes) : []),
    [snapshot, changes],
  );
  const currentRevision = snapshot?.override?.revision ?? 0;
  const actionInput = useMemo(() => {
    if (!snapshot) return null;
    const common = {
      expectedRevision: currentRevision,
      reason: reason.trim(),
    };
    return mode === "edit"
      ? { ...common, action: "upsert" as const, changes }
      : {
          ...common,
          action: "revert" as const,
          targetRevision,
        };
  }, [snapshot, currentRevision, reason, mode, changes, targetRevision]);
  const actionFingerprint = actionInput ? JSON.stringify(actionInput) : "";
  const previewCurrent =
    previewResult?.transaction === "rolled_back" &&
    previewFingerprint === actionFingerprint;

  const clearPreview = () => {
    setPreviewFingerprint("");
    setPreviewResult(null);
  };

  const handleAdminError = (error: unknown, fallback: string) => {
    if (error instanceof ApiError && error.code === "admin_access_denied") {
      onKeyRejected();
      setMessage("管理员密钥不正确，已从当前页面内存中清除。");
      return;
    }
    if (error instanceof ApiError && error.code === "authentication_required") {
      onKeyRejected();
      setMessage("登录状态已失效，管理员密钥已从当前页面内存中清除。");
      return;
    }
    const descriptions: Record<string, string> = {
      not_found: "没有找到这个 stable ID 对应的已发布题目。",
      question_not_found: "没有找到这个 stable ID 对应的已发布题目。",
      conflict: "内容已被其他修改更新，请重新查询后再操作。",
      content_override_conflict: "内容已被其他修改更新，请重新查询后再操作。",
      invalid_request: "提交内容不符合要求，请检查题干、选项和原因。",
      invalid_content_override: "提交内容不符合要求，请检查题干、选项和原因。",
    };
    setMessage(
      error instanceof ApiError
        ? (descriptions[error.code] ?? fallback)
        : fallback,
    );
  };

  const search = async () => {
    const query = stableId.trim();
    if (!query) {
      setMessage("请输入 stable ID，例如 math1-2025-q04。");
      return;
    }
    if (adminKey.length < 16) {
      setMessage("请先输入至少 16 个字符的管理员密钥。");
      return;
    }
    setBusy(true);
    setMessage("");
    clearPreview();
    try {
      const next = await loadAdminQuestion(query, adminKey);
      setSnapshot(next);
      setDraft(draftFromSnapshot(next));
      setReason("");
      setMode("edit");
      setTargetRevision(0);
      setStableId(next.stableId);
    } catch (error) {
      setSnapshot(null);
      setDraft(null);
      handleAdminError(error, "题目查询失败，请稍后重试。");
    } finally {
      setBusy(false);
    }
  };

  const execute = async (executionMode: "preview" | "commit") => {
    if (!snapshot || !actionInput) return;
    if (reason.trim().length < 3) {
      setMessage("请填写至少 3 个字符的修改原因，原因会永久写入审计记录。");
      return;
    }
    if (mode === "edit" && differences.length === 0) {
      setMessage("当前没有任何内容变化，无需预览或保存。");
      return;
    }
    if (
      mode === "revert" &&
      (!Number.isInteger(targetRevision) ||
        targetRevision < 0 ||
        targetRevision >= currentRevision)
    ) {
      setMessage(`目标修订号必须是 0 到 ${currentRevision - 1} 之间的整数。`);
      return;
    }
    if (executionMode === "commit" && !previewCurrent) {
      setMessage("内容在预览后发生了变化，请重新预览再保存。");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const result = await executeAdminContentAction(
        snapshot.stableId,
        adminKey,
        { ...actionInput, mode: executionMode },
      );
      if (executionMode === "preview") {
        setPreviewResult(result);
        setPreviewFingerprint(actionFingerprint);
        setMessage("预览成功：数据库事务已回滚，没有写入生产内容。");
      } else {
        const refreshed = await loadAdminQuestion(snapshot.stableId, adminKey);
        setSnapshot(refreshed);
        setDraft(draftFromSnapshot(refreshed));
        setReason("");
        setTargetRevision(0);
        clearPreview();
        setMessage(`保存成功，当前修订号为 ${result.revision}。`);
      }
    } catch (error) {
      clearPreview();
      handleAdminError(error, "内容操作失败，请稍后重试。");
    } finally {
      setBusy(false);
    }
  };

  return {
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
  };
}
