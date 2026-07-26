import { useEffect, useMemo, useState } from "react";
import { AppShell } from "./components/AppShell";
import { QuestionWorkspace } from "./components/QuestionWorkspace";
import {
  loadAuthenticatedQuestionBank,
  loadAuthenticatedQuestionDetail,
  loadQuestionBank,
  loadSubjectCatalog,
} from "./data";
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
import type { AuthUser, SubjectCatalog } from "./types";
import { SUBJECT_LABELS } from "./constants";

export function App() {
  const [bank, setBank] = useState<QuestionBank | null>(null);
  const [subjectName, setSubjectName] = useState("数学一");
  const [subject, setSubject] = useState<SubjectCode>("math1");
  const [subjectCatalog, setSubjectCatalog] = useState<SubjectCatalog | null>(
    null,
  );
  const [view, setView] = useState<AppView>("dashboard");
  const [bankSubjectChosen, setBankSubjectChosen] = useState(false);
  const [paperSubjectChosen, setPaperSubjectChosen] = useState(false);
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
  const [authReady, setAuthReady] = useState(false);
  const [authNotice, setAuthNotice] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function loadCurrentSubject() {
      if (!authReady) return;
      try {
        setError("");
        setBank(null);
        const catalog = await loadSubjectCatalog();
        if (cancelled) return;
        setSubjectCatalog(catalog);
        const item = catalog.subjects.find((entry) => entry.code === subject);
        const nextSubjectName = item?.name ?? SUBJECT_LABELS[subject];
        setSubjectName(nextSubjectName);
        if (!item?.enabled) {
          throw new Error(`${nextSubjectName}题库暂不可用`);
        }
        if (!user && subject !== "math1") {
          throw new Error(`${nextSubjectName}题库需要登录后查看`);
        }
        const loadedBank = user
          ? await loadAuthenticatedQuestionBank(subject)
          : item.questionBankUrl
            ? await loadQuestionBank(item.questionBankUrl)
            : null;
        if (!loadedBank) {
          throw new Error(`${nextSubjectName}题库暂不可用`);
        }
        if (loadedBank.subjectCode !== subject) {
          throw new Error(`${nextSubjectName}题库科目标记不一致`);
        }
        if (cancelled) return;
        setBank(loadedBank);
      } catch (reason: unknown) {
        if (cancelled) return;
        setError(reason instanceof Error ? reason.message : "题库加载失败");
      }
    }
    void loadCurrentSubject();
    return () => {
      cancelled = true;
    };
  }, [authReady, subject, user]);

  useEffect(() => {
    void getCurrentUser()
      .then(setUser)
      .finally(() => setAuthReady(true));
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

  const loadDetails = async (targets: Question[]) => {
    const details: Question[] = [];
    for (let start = 0; start < targets.length; start += 4) {
      details.push(
        ...(await Promise.all(
          targets
            .slice(start, start + 4)
            .map((question) =>
              loadAuthenticatedQuestionDetail(subject, question.stableId),
            ),
        )),
      );
    }
    return details;
  };

  const replaceQuestionDetails = (
    currentBank: QuestionBank,
    details: Question[],
  ): QuestionBank => {
    const detailById = new Map(details.map((question) => [question.stableId, question]));
    return {
      ...currentBank,
      questions: currentBank.questions.map(
        (question) => detailById.get(question.stableId) ?? question,
      ),
    };
  };

  const openQuestion = (question: Question) => {
    const showQuestion = () => {
      setSelectedId(question.stableId);
      setView("practice");
      window.scrollTo({ top: 0, behavior: "smooth" });
    };
    if (!user || question.detailLoaded !== false || !bank) {
      showQuestion();
      return;
    }
    const currentBank = bank;
    setBank(null);
    void loadDetails([question])
      .then((details) => {
        setBank(replaceQuestionDetails(currentBank, details));
        showQuestion();
      })
      .catch(() => {
        setBank(currentBank);
        setError("登录内容加载失败，请刷新页面后重试。");
      });
  };

  const switchSubject = (nextSubject: SubjectCode) => {
    if (nextSubject === subject) return;
    if (!user && nextSubject !== "math1") {
      setAuthNotice("数学一 2018 年以前及数学二、数学三需要登录后查看。");
      setView("account");
      return;
    }
    setSubjectName(SUBJECT_LABELS[nextSubject]);
    setSubject(nextSubject);
    setStates(loadQuestionStates(nextSubject));
    setPaperSessions(loadPaperSessions(nextSubject));
    setSelectedId(null);
    setCurrentPaperYear(null);
  };

  const startPractice = () => {
    if (questions.length === 0) return;
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
    if (user && bank) {
      const missingDetails = questions.filter(
        (question) =>
          question.sourceYear === year && question.detailLoaded === false,
      );
      if (missingDetails.length > 0) {
        const currentBank = bank;
        setBank(null);
        void loadDetails(missingDetails)
          .then((details) => {
            setBank(replaceQuestionDetails(currentBank, details));
            startPaperSession(year);
          })
          .catch(() => {
            setBank(currentBank);
            setError("整卷答案与解析加载失败，请刷新页面后重试。");
          });
        return;
      }
    }
    startPaperSession(year);
  };

  const startPaperSession = (year: number) => {
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
        <p>请刷新页面或稍后重试。</p>
      </div>
    );
  }

  if (!bank) {
    return (
      <div className="loading-state">
        <div className="loading-mark">研</div>
        <p>正在加载{subjectName}题库…</p>
      </div>
    );
  }

  return (
    <AppShell
      view={view}
      onViewChange={setView}
      subject={subject}
      subjectName={subjectName}
      mobileOpen={mobileOpen}
      onMobileOpenChange={setMobileOpen}
    >
      {view === "dashboard" && (
        <DashboardView
          subjectName={subjectName}
          questions={questions}
          states={states}
          onPractice={startPractice}
          onOpenQuestion={openQuestion}
          onOpenWrong={() => setView("wrong")}
        />
      )}
      {view === "bank" && (
        <BankView
          subject={subject}
          subjectName={subjectName}
          subjectCatalog={subjectCatalog}
          subjectChosen={bankSubjectChosen}
          onSubjectChosenChange={setBankSubjectChosen}
          onSubjectChange={switchSubject}
          isAuthenticated={Boolean(user)}
          onLoginRequired={() => {
            setAuthNotice("数学一 2018 年以前及数学二、数学三需要登录后查看。");
            setView("account");
          }}
          questions={questions}
          states={states}
          onOpenQuestion={openQuestion}
        />
      )}
      {view === "practice" && selectedQuestion && (
        <div className="practice-layout">
          <QuestionWorkspace
            key={selectedQuestion.stableId}
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
            isAuthenticated={Boolean(user)}
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
          subject={subject}
          subjectName={subjectName}
          subjectCatalog={subjectCatalog}
          subjectChosen={paperSubjectChosen}
          onSubjectChosenChange={setPaperSubjectChosen}
          onSubjectChange={switchSubject}
          isAuthenticated={Boolean(user)}
          onLoginRequired={() => {
            setAuthNotice("数学一 2018 年以前及数学二、数学三需要登录后查看。");
            setView("account");
          }}
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
          onUserChange={(nextUser) => {
            setUser(nextUser);
            if (!nextUser && subject !== "math1") {
              setSubject("math1");
              setSubjectName(SUBJECT_LABELS.math1);
              setBankSubjectChosen(false);
              setPaperSubjectChosen(false);
              setSelectedId(null);
              setCurrentPaperYear(null);
            }
          }}
          onRestore={(cloudStates, cloudSessions) => {
            setStates(cloudStates);
            setPaperSessions(cloudSessions);
          }}
        />
      )}
    </AppShell>
  );
}
