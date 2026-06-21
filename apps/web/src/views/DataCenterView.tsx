import { useState } from "react";
import { Icon } from "../components/Icon";
import type {
  PaperSessionMap,
  Question,
  QuestionStateMap,
  SubjectCode,
} from "../types";

export function DataCenterView({
  subject,
  questions,
  states,
  paperSessions,
  onExportJson,
  onExportObsidian,
  onImport,
}: {
  subject: SubjectCode;
  questions: Question[];
  states: QuestionStateMap;
  paperSessions: PaperSessionMap;
  onExportJson: () => void;
  onExportObsidian: () => Promise<void>;
  onImport: (raw: string) => void;
}) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const importFile = async (file?: File) => {
    if (!file) return;
    try {
      onImport(await file.text());
      setMessage(`已导入 ${file.name}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "导入失败");
    }
  };

  const exportVault = async () => {
    setBusy(true);
    setMessage("");
    try {
      await onExportObsidian();
      setMessage("Obsidian ZIP 已生成。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "导出失败");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <h1>数据中心</h1>
          <p>备份浏览器学习记录，或导出一个可直接解压为 Obsidian Vault 的学习包。</p>
        </div>
      </div>

      <div className="data-grid">
        <section className="data-card">
          <span className="data-card-kicker">完整备份</span>
          <h2>学习数据 JSON</h2>
          <p>包含题目状态和整卷草稿，适合迁移浏览器或未来导入账号系统。</p>
          <button className="button primary" onClick={onExportJson}>
            <Icon name="download" size={17} />
            导出 JSON
          </button>
          <label className="button secondary file-button">
            <Icon name="upload" size={17} />
            导入 JSON
            <input
              accept="application/json,.json"
              type="file"
              onChange={(event) => void importFile(event.target.files?.[0])}
            />
          </label>
        </section>

        <section className="data-card featured">
          <span className="data-card-kicker">复习资料</span>
          <h2>Obsidian 学习包</h2>
          <p>
            生成概览、7 天复习计划和错题卡片。默认不复制完整真题文本。
          </p>
          <button
            className="button primary"
            disabled={busy}
            onClick={() => void exportVault()}
          >
            <Icon name="download" size={17} />
            {busy ? "正在生成…" : "导出 ZIP"}
          </button>
        </section>
      </div>

      <section className="data-footnote">
        <strong>当前本地数据</strong>
        <p>
          科目 {subject} · 题库 {questions.length} 题 · 已记录{" "}
          {Object.keys(states).length} 题 · 试卷会话{" "}
          {Object.keys(paperSessions).length} 个
        </p>
        {message && <div className="data-message">{message}</div>}
      </section>
    </div>
  );
}
