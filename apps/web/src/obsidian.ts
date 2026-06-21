import { MASTERY_LABELS } from "./constants";
import { getQuestionState } from "./storage";
import type {
  PaperSessionMap,
  Question,
  QuestionStateMap,
  SubjectCode,
} from "./types";

const escapeYaml = (value: string) => JSON.stringify(value);

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export async function exportObsidianVault({
  subject,
  subjectName,
  questions,
  states,
  paperSessions,
}: {
  subject: SubjectCode;
  subjectName: string;
  questions: Question[];
  states: QuestionStateMap;
  paperSessions: PaperSessionMap;
}) {
  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();
  const wrong = questions.filter((question) => {
    const state = getQuestionState(states, question.stableId);
    return state.inWrongBook || state.mastery === "unknown" || state.mastery === "fuzzy";
  });
  const attempted = questions.filter(
    (question) => getQuestionState(states, question.stableId).attempts > 0,
  );
  const submittedPapers = Object.values(paperSessions).filter(
    (session) => session.status === "submitted",
  );
  const generatedAt = new Date().toISOString();

  zip.file(
    "00-开始这里.md",
    `# ${subjectName}学习包

生成时间：${generatedAt}

## 内容

- [[Reports/当前学习概览]]
- [[Plans/未来7天复习计划]]
- \`Mistakes/\`：错题、不熟题和不会题的个人学习卡片

> 本学习包默认不复制完整真题原文，只保留稳定题号、年份、状态和个人记录。
`,
  );

  zip.file(
    "Reports/当前学习概览.md",
    `# 当前学习概览

| 指标 | 数量 |
| --- | ---: |
| 题库总题数 | ${questions.length} |
| 已练题数 | ${attempted.length} |
| 待复习题数 | ${wrong.length} |
| 已交卷年份数 | ${submittedPapers.length} |

## 掌握情况

${(["mastered", "fuzzy", "unknown", "unmarked"] as const)
  .map(
    (mastery) =>
      `- ${MASTERY_LABELS[mastery]}：${
        questions.filter(
          (question) => getQuestionState(states, question.stableId).mastery === mastery,
        ).length
      } 题`,
  )
  .join("\n")}
`,
  );

  const reviewItems = wrong
    .slice()
    .sort((a, b) => {
      const aState = getQuestionState(states, a.stableId);
      const bState = getQuestionState(states, b.stableId);
      return (
        Number(bState.inWrongBook) - Number(aState.inWrongBook) ||
        (aState.lastAttemptAt ?? "").localeCompare(bState.lastAttemptAt ?? "")
      );
    });

  zip.file(
    "Plans/未来7天复习计划.md",
    `# 未来 7 天复习计划

${reviewItems.length === 0
  ? "- 当前没有待复习题。先完成一套整卷或一组单题练习。"
  : reviewItems
      .slice(0, 35)
      .map(
        (question, index) =>
          `- [ ] Day ${Math.floor(index / 5) + 1} · [[Mistakes/${question.stableId}]]`,
      )
      .join("\n")}
`,
  );

  for (const question of reviewItems) {
    const state = getQuestionState(states, question.stableId);
    zip.file(
      `Mistakes/${question.stableId}.md`,
      `---
stable_id: ${escapeYaml(question.stableId)}
subject: ${escapeYaml(subject)}
year: ${question.sourceYear}
question_number: ${question.questionNumber ?? "null"}
mastery: ${escapeYaml(state.mastery)}
last_correctness: ${escapeYaml(state.lastCorrectness)}
attempts: ${state.attempts}
in_wrong_book: ${state.inWrongBook}
---

# ${question.sourceYear} 年第 ${question.questionNumber ?? question.stableId} 题

## 当前状态

- 掌握程度：${MASTERY_LABELS[state.mastery]}
- 最近结果：${state.lastCorrectness}
- 累计作答：${state.attempts}

## 我的记录

${state.note || "尚未填写个人笔记。"}

## 来源

- 稳定 ID：\`${question.stableId}\`
- 内容状态：\`${question.finalizationStatus}\`
`,
    );
  }

  zip.file(
    "manifest.json",
    JSON.stringify(
      {
        schemaVersion: "kaoyan-obsidian-export-v1",
        generatedAt,
        subjectCode: subject,
        questionCount: questions.length,
        reviewItemCount: wrong.length,
      },
      null,
      2,
    ),
  );

  const blob = await zip.generateAsync({ type: "blob" });
  triggerDownload(
    blob,
    `${subject}-obsidian-${new Date().toISOString().slice(0, 10)}.zip`,
  );
}
