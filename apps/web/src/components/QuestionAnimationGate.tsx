import { lazy, Suspense, useEffect, useState } from "react";
import {
  ApiError,
  getQuestionAnimationAvailability,
  loadQuestionAnimation,
} from "../api";
import type { MathAnimationSpec } from "../types";

const MathAnimation = lazy(() =>
  import("./math-animation/MathAnimation").then((module) => ({
    default: module.MathAnimation,
  })),
);

export function QuestionAnimationGate({
  questionId,
  isAuthenticated,
}: {
  questionId: string;
  isAuthenticated: boolean;
}) {
  const [spec, setSpec] = useState<MathAnimationSpec | null>(null);
  const [status, setStatus] = useState<
    "checking" | "locked" | "loading" | "ready" | "missing" | "error"
  >("checking");

  useEffect(() => {
    setSpec(null);
    const controller = new AbortController();
    if (isAuthenticated) {
      setStatus("loading");
      void loadQuestionAnimation(questionId, controller.signal)
        .then((animation) => {
          setSpec(animation.payload);
          setStatus("ready");
        })
        .catch((error: unknown) => {
          if (controller.signal.aborted) return;
          setStatus(
            error instanceof ApiError && error.code === "animation_not_found"
              ? "missing"
              : "error",
          );
        });
    } else {
      setStatus("checking");
      void getQuestionAnimationAvailability(questionId, controller.signal)
        .then(({ available }) => setStatus(available ? "locked" : "missing"))
        .catch(() => {
          if (!controller.signal.aborted) setStatus("error");
        });
    }
    return () => controller.abort();
  }, [isAuthenticated, questionId]);

  if (status === "locked") {
    return (
      <div className="animation-locked">
        <span aria-hidden="true">✦</span>
        <div>
          <strong>这道题支持动态讲解</strong>
          <p>登录后按需加载；游客模式不会下载动画数据和运行代码。</p>
        </div>
      </div>
    );
  }

  if (status === "checking" || status === "loading") {
    return (
      <div className="animation-loading" role="status">
        正在准备动态讲解…
      </div>
    );
  }
  if (status === "error") {
    return (
      <div className="animation-error" role="alert">
        动态讲解暂时无法加载，请稍后重试。
      </div>
    );
  }
  if (status !== "ready" || !spec) return null;

  return (
    <Suspense
      fallback={
        <div className="animation-loading" role="status">
          正在加载动画组件…
        </div>
      }
    >
      <MathAnimation spec={spec} />
    </Suspense>
  );
}
