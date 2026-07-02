import type { AppView, SubjectCode } from "../types";
import { Icon } from "./Icon";

const navItems: Array<{
  view: AppView;
  label: string;
  icon: Parameters<typeof Icon>[0]["name"];
}> = [
  { view: "dashboard", label: "学习首页", icon: "home" },
  { view: "bank", label: "真题库", icon: "book" },
  { view: "practice", label: "开始练习", icon: "practice" },
  { view: "papers", label: "整卷练习", icon: "paper" },
  { view: "review", label: "复习队列", icon: "review" },
  { view: "wrong", label: "错题本", icon: "wrong" },
  { view: "stats", label: "学习统计", icon: "stats" },
  { view: "data", label: "数据中心", icon: "download" },
  { view: "account", label: "账号", icon: "user" },
];

export function AppShell({
  view,
  onViewChange,
  subject,
  subjectName,
  children,
  mobileOpen,
  onMobileOpenChange,
}: {
  view: AppView;
  onViewChange: (view: AppView) => void;
  subject: SubjectCode;
  subjectName: string;
  children: React.ReactNode;
  mobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
}) {
  const navigate = (next: AppView) => {
    onViewChange(next);
    onMobileOpenChange(false);
  };

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark">研</div>
          <div>
            <strong>研数</strong>
            <span>真题学习系统</span>
          </div>
          <button
            className="icon-button sidebar-close"
            onClick={() => onMobileOpenChange(false)}
            aria-label="关闭菜单"
          >
            <Icon name="close" />
          </button>
        </div>

        <nav className="nav-list" aria-label="主导航">
          {navItems.map((item) => (
            <button
              className={view === item.view ? "nav-item active" : "nav-item"}
              key={item.view}
              onClick={() => navigate(item.view)}
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="subject-switcher">
          <span>当前科目</span>
          <strong>{subjectName}</strong>
          <small>
            {subject === "math2"
              ? "待复核预览，答案解析整理中"
              : "数学二待复核预览已开放"}
          </small>
        </div>
      </aside>

      {mobileOpen && (
        <button
          className="sidebar-backdrop"
          onClick={() => onMobileOpenChange(false)}
          aria-label="关闭菜单"
        />
      )}

      <main className="main">
        <header className="mobile-header">
          <button
            className="icon-button"
            onClick={() => onMobileOpenChange(true)}
            aria-label="打开菜单"
          >
            <Icon name="menu" />
          </button>
          <strong>研数 · {subjectName}</strong>
        </header>
        {children}
      </main>
    </div>
  );
}
