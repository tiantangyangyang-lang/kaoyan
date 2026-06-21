import { useEffect, useState } from "react";
import {
  ApiError,
  loadCloudLearningState,
  loginAccount,
  logoutAccount,
  registerAccount,
  resendVerification,
  saveCloudLearningState,
} from "../api";
import type {
  AuthUser,
  PaperSessionMap,
  QuestionStateMap,
  SubjectCode,
} from "../types";

const ERROR_MESSAGES: Record<string, string> = {
  email_already_registered: "该邮箱已注册，请直接登录。",
  invalid_credentials: "邮箱或密码不正确。",
  email_not_verified: "请先点击验证邮件中的链接。",
  verification_token_invalid: "验证链接无效或已过期。",
  invalid_request: "请检查邮箱和密码格式，密码至少 8 位。",
  request_failed: "请求失败，请稍后重试。",
};

export function AccountView({
  user,
  notice,
  subject,
  states,
  paperSessions,
  onUserChange,
  onRestore,
}: {
  user: AuthUser | null;
  notice: string;
  subject: SubjectCode;
  states: QuestionStateMap;
  paperSessions: PaperSessionMap;
  onUserChange: (user: AuthUser | null) => void;
  onRestore: (
    states: QuestionStateMap,
    sessions: PaperSessionMap,
  ) => void;
}) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState(notice);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (notice) setMessage(notice);
  }, [notice]);

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setMessage("");
    try {
      await action();
    } catch (error) {
      setMessage(
        error instanceof ApiError
          ? ERROR_MESSAGES[error.code] ?? `操作失败：${error.code}`
          : "无法连接服务器，请稍后重试。",
      );
    } finally {
      setBusy(false);
    }
  };

  if (user) {
    return (
      <div className="page">
        <div className="page-heading">
          <div>
            <span className="page-kicker">账号与云端同步</span>
            <h1>我的账号</h1>
            <p>当前登录：{user.email}</p>
          </div>
        </div>
        <div className="account-grid">
          <section className="account-card">
            <span className="subject-status ready">邮箱已验证</span>
            <h2>云端学习记录</h2>
            <p>
              同步操作由你手动决定。上传会覆盖当前云端记录，恢复会覆盖当前浏览器记录。
            </p>
            <button
              className="button primary"
              disabled={busy}
              onClick={() =>
                void run(async () => {
                  await saveCloudLearningState(
                    subject,
                    states,
                    paperSessions,
                  );
                  setMessage("本机学习记录已上传到云端。");
                })
              }
            >
              上传本机记录
            </button>
            <button
              className="button secondary"
              disabled={busy}
              onClick={() =>
                void run(async () => {
                  const cloud = await loadCloudLearningState(subject);
                  if (!cloud) {
                    setMessage("云端还没有学习记录。");
                    return;
                  }
                  onRestore(cloud.questionStates, cloud.paperSessions);
                  setMessage(
                    `已恢复云端记录，云端更新时间：${new Date(
                      cloud.updatedAt,
                    ).toLocaleString()}`,
                  );
                })
              }
            >
              从云端恢复
            </button>
          </section>

          <section className="account-card quiet">
            <h2>登录状态</h2>
            <p>会话保存在安全 Cookie 中，退出后本机学习记录仍然保留。</p>
            <button
              className="button secondary"
              disabled={busy}
              onClick={() =>
                void run(async () => {
                  await logoutAccount();
                  onUserChange(null);
                  setMessage("已退出登录。");
                })
              }
            >
              退出登录
            </button>
          </section>
        </div>
        {message && <div className="account-message">{message}</div>}
      </div>
    );
  }

  return (
    <div className="page auth-page">
      <div className="auth-shell">
        <section className="auth-copy">
          <span className="page-kicker">研数账号</span>
          <h1>让学习记录跨设备保存</h1>
          <p>
            注册需要邮箱验证。验证完成后才能登录和使用云端同步，本机离线练习仍然可以继续使用。
          </p>
          <ul>
            <li>密码使用 Argon2 加密存储</li>
            <li>验证链接 60 分钟后失效</li>
            <li>不会自动覆盖本机或云端记录</li>
          </ul>
        </section>

        <section className="auth-form-card">
          <div className="auth-tabs">
            <button
              className={mode === "login" ? "active" : ""}
              onClick={() => setMode("login")}
            >
              登录
            </button>
            <button
              className={mode === "register" ? "active" : ""}
              onClick={() => setMode("register")}
            >
              注册
            </button>
          </div>
          <label>
            <span>邮箱</span>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@example.com"
            />
          </label>
          <label>
            <span>密码</span>
            <input
              type="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={mode === "register" ? "至少 8 位" : "输入密码"}
            />
          </label>
          <button
            className="button primary auth-submit"
            disabled={busy || !email || !password}
            onClick={() =>
              void run(async () => {
                if (mode === "register") {
                  await registerAccount(email, password);
                  setMessage("验证邮件已发送，请打开邮箱点击验证链接。");
                } else {
                  const result = await loginAccount(email, password);
                  onUserChange(result.user);
                  setMessage("登录成功。");
                }
              })
            }
          >
            {busy ? "处理中…" : mode === "register" ? "注册并发送验证邮件" : "登录"}
          </button>
          {mode === "login" && (
            <button
              className="text-button auth-resend"
              disabled={!email || busy}
              onClick={() =>
                void run(async () => {
                  await resendVerification(email);
                  setMessage("如果该邮箱存在且尚未验证，验证邮件已经重新发送。");
                })
              }
            >
              重新发送验证邮件
            </button>
          )}
          {message && <div className="account-message">{message}</div>}
        </section>
      </div>
    </div>
  );
}
