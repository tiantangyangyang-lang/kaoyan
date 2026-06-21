import { useEffect, useMemo, useState } from "react";
import { AppShell } from "./components/AppShell";
import { QuestionWorkspace } from "./components/QuestionWorkspace";
import { loadQuestionBank, loadSubjectCatalog } from "./data";
import {
  exportLearningData,
  getQuestionState,
  loadPaperSessions,
  loadQuestionStates,
  parseLearningData,
  savePaperSessions,
  saveQuestionStates,
} from "./storage";
import { exportObsidianVault } from "./obsidian";
import type {
  AppView,
  PaperSession,
  PaperSessionMap,
  Question,
  QuestionBank,
  QuestionState,
  QuestionStateMap,
  SubjectCode,
} from "./types";
import { BankView } from "./views/BankView";
import { DashboardView } from "./views/DashboardView";
import { StatsView } from "./views/StatsView";
import { WrongBookView } from "./views/WrongBookView";
import { Icon } from "./components/Icon";
import { PaperListView } from "./views/PaperListView";
import { PaperSessionView } from "./views/PaperSessionView";
import { ReviewQueueView } from "./views/ReviewQueueView";
import { DataCenterView } from "./views/DataCenterView";
import { AccountView } from "./views/AccountView";
import { getCurrentUser, verifyAccount } from "./api";
import type { AuthUser } from "./types";

export function App() {
  const [bank, setBank] = useState<QuestionBank | null>(null);
  const [subjectName, setSubjectName] = useState("数学一");
  const [subject] = useState<SubjectCode>("math1");
  const [view, setView] = useState<AppView>("dashboard");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [states, setStates] = useState<QuestionStateMap>(() =>
    loadQuestionStates("math1"),
  );
  const [paperSessions, setPaperSessions] = useState<PaperSessionMap>(() =>
    loadPaperSessions("math1"),
  );
  const [currentPaperYear, setCurrentPaperYear] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authNotice, setAuthNotice] = useState("");

  useEffect(() => {
    Promise.all([loadSubjectCatalog(), loadQuestionBank("/data/math1.json")])
      .then(([catalog, loadedBank]) => {
        setBank(loadedBank);
        setSubjectName(
          catalog.subjects.find((item) => item.code === subject)?.name ?? "数学一",
        );
      })
      .catch((reason: unknown) => {
        setError(reason instanceof Error ? reason.message : "题库加载失败");
      });
  }, [subject]);

  useEffect(() => {
    void getCurrentUser().then(setUser);
    const url = new URL(window.location.href);
    const token = url.searchParams.get("verify");
    if (!token) return;
    url.searchParams.delete("verify");
    window.history.replaceState({}, "", url);
    setView("account");
    void verifyAccount(token)
      .then(() => {
        setAuthNotice("邮箱验证成功，现在可以登录。");
      })
      .catch(() => {
        setAuthNotice("验证链接无效或已经过期，请重新发送验证邮件。");
      });
  }, []);

  useEffect(() => {
    saveQuestionStates(subject, states);
  }, [states, subject]);

  useEffect(() => {
    savePaperSessions(subject, paperSessions);
  }, [paperSessions, subject]);

  const questions = bank?.questions ?? [];
  const selectedIndex = useMemo(
    () => questions.findIndex((question) => question.stableId === selectedId),
    [questions, selectedId],
  );
  const selectedQuestion =
    selectedIndex >= 0 ? questions[selectedIndex] : questions[0];

  const openQuestion = (question: Question) => {
    setSelectedId(question.stableId);
    setView("practice");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const startPractice = () => {
    const last = [...questions]
      .filter((question) => states[question.stableId]?.lastAttemptAt)
      .sort((a, b) =>
        (states[b.stableId]?.lastAttemptAt ?? "").localeCompare(
          states[a.stableId]?.lastAttemptAt ?? "",
        ),
      )[0];
    openQuestion(last ?? questions[0]);
  };

  const updateQuestionState = (next: QuestionState) => {
    if (!selectedQuestion) return;
    setStates((current) => ({
      ...current,
      [selectedQuestion.stableId]: next,
    }));
  };

  const startPaper = (year: number) => {
    const key = String(year);
    const existing = paperSessions[key];
    if (!existing || existing.status === "submitted") {
      const now = new Date().toISOString();
      const next: PaperSession = {
        id: `${subject}-${year}-${Date.now()}`,
        sourceYear: year,
        startedAt: now,
        submittedAt: null,
        status: "in_progress",
        currentIndex: 0,
        results: {},
      };
      setPaperSessions((current) => ({ ...current, [key]: next }));
    }
    setCurrentPaperYear(year);
    setView("paper-session");
  };

  const updatePaperSession = (next: PaperSession) => {
    setPaperSessions((current) => ({
      ...current,
      [String(next.sourceYear)]: next,
    }));
  };

  const submitPaper = () => {
    if (currentPaperYear === null) return;
    const key = String(currentPaperYear);
    const session = paperSessions[key];
    if (!session || session.status === "submitted") return;
    const paperQuestions = questions.filter(
      (question) => question.sourceYear === currentPaperYear,
    );
    const submittedAt = new Date().toISOString();

    setStates((current) => {
      const next = { ...current };
      for (const question of paperQuestions) {
        const result = session.results[question.stableId];
        if (
          !result ||
          (!result.answer.trim() && result.correctness === "unknown")
        ) {
          continue;
        }
        const previous = getQuestionState(current, question.stableId);
        next[question.stableId] = {
          ...previous,
          attempts: previous.attempts + 1,
          correctAttempts:
            previous.correctAttempts +
            (result.correctness === "correct" ? 1 : 0),
          lastCorrectness: result.correctness,
          lastAnswer: result.answer,
          lastAttemptAt: submittedAt,
          inWrongBook:
            result.correctness === "incorrect"
              ? true
              : previous.inWrongBook,
        };
      }
      return next;
    });
    updatePaperSession({
      ...session,
      status: "submitted",
      submittedAt,
    });
  };

  const importLearningBundle = (raw: string) => {
    const bundle = parseLearningData(raw, subject);
    setStates(bundle.questionStates);
    setPaperSessions(bundle.paperSessions);
  };

  if (error) {
    return (
      <div className="fatal-state">
        <h1>题库加载失败</h1>
        <p>{error}</p>
        <p>请先运行 `npm run sync:content` 后重试。</p>
      </div>
    );
  }

  if (!bank) {
    return (
      <div className="loading-state">
        <div className="loading-mark">研</div>
        <p>正在加载数学一题库…</p>
      </div>
    );
  }

  return (
    <AppShell
      view={view}
      onViewChange={setView}
      subjectName={subjectName}
      mobileOpen={mobileOpen}
      onMobileOpenChange={setMobileOpen}
    >
      {view === "dashboard" && (
        <DashboardView
          questions={questions}
          states={states}
          onPractice={startPractice}
          onOpenQuestion={openQuestion}
          onOpenWrong={() => setView("wrong")}
        />
      )}
      {view === "bank" && (
        <BankView
          questions={questions}
          states={states}
          onOpenQuestion={openQuestion}
        />
      )}
      {view === "practice" && selectedQuestion && (
        <div className="practice-layout">
          <QuestionWorkspace
            question={selectedQuestion}
            state={getQuestionState(states, selectedQuestion.stableId)}
            onStateChange={updateQuestionState}
            onPrevious={
              selectedIndex > 0
                ? () => openQuestion(questions[selectedIndex - 1])
                : undefined
            }
            onNext={
              selectedIndex < questions.length - 1
                ? () => openQuestion(questions[selectedIndex + 1])
                : undefined
            }
          />
          <aside className="practice-aside">
            <span>题库位置</span>
            <strong>
              {selectedIndex + 1} / {questions.length}
            </strong>
            <div className="aside-progress">
              <span style={{ width: `${((selectedIndex + 1) / questions.length) * 100}%` }} />
            </div>
            <button
              className="button secondary"
              onClick={() =>
                exportLearningData(subject, states, paperSessions)
              }
            >
              <Icon name="download" size={17} />
              导出学习数据
            </button>
            <p>
              记录保存在当前浏览器。导出 JSON 后可用于后续账号迁移或 Obsidian
              分析。
            </p>
          </aside>
        </div>
      )}
      {view === "wrong" && (
        <WrongBookView
          questions={questions}
          states={states}
          onOpenQuestion={openQuestion}
        />
      )}
      {view === "papers" && (
        <PaperListView
          questions={questions}
          states={states}
          sessions={paperSessions}
          onStart={startPaper}
        />
      )}
      {view === "paper-session" &&
        currentPaperYear !== null &&
        paperSessions[String(currentPaperYear)] && (
          <PaperSessionView
            questions={questions
              .filter(
                (question) => question.sourceYear === currentPaperYear,
              )
              .sort(
                (a, b) =>
                  (a.questionNumber ?? Number.MAX_SAFE_INTEGER) -
                  (b.questionNumber ?? Number.MAX_SAFE_INTEGER),
              )}
            session={paperSessions[String(currentPaperYear)]}
            onChange={updatePaperSession}
            onSubmit={submitPaper}
            onExit={() => setView("papers")}
          />
        )}
      {view === "review" && (
        <ReviewQueueView
          questions={questions}
          states={states}
          onOpenQuestion={openQuestion}
        />
      )}
      {view === "stats" && <StatsView questions={questions} states={states} />}
      {view === "data" && (
        <DataCenterView
          subject={subject}
          questions={questions}
          states={states}
          paperSessions={paperSessions}
          onExportJson={() =>
            exportLearningData(subject, states, paperSessions)
          }
          onExportObsidian={() =>
            exportObsidianVault({
              subject,
              subjectName,
              questions,
              states,
              paperSessions,
            })
          }
          onImport={importLearningBundle}
        />
      )}
      {view === "account" && (
        <AccountView
          user={user}
          notice={authNotice}
          subject={subject}
          states={states}
          paperSessions={paperSessions}
          onUserChange={setUser}
          onRestore={(cloudStates, cloudSessions) => {
            setStates(cloudStates);
            setPaperSessions(cloudSessions);
          }}
        />
      )}
    </AppShell>
  );
}
