# REQ-001：数学一登录专属动画解析

## Status

Implemented, pending Pull Request review.

## Problem

数学一真题和文字解析已经进入前端静态题库。继续把动画内容放入同一题库会增加静态资源体积，使游客首次打开和浏览题目变慢。

学生仍需要以游客身份学习题目和文字解析；动画是增强理解的附加能力，应在登录后按需加载。

## User Value

- 游客无需注册即可继续学习 852 道数学一真题和文字解析。
- 登录学生在适合可视化的题目中获得分步动态讲解。
- 动画内容可以独立维护和扩展，不增加题库 JSON 体积。

## Scope

### In Scope

- 使用 Motion for React 实现通用动画解析组件。
- 首批支持 6 道数学一真题。
- 动画 payload 存入现有 Aiven MySQL。
- 动画详情接口必须要求有效登录会话。
- 游客只可取得“该题是否有动画”的布尔值。
- 只有登录用户展开解析并成功取得 payload 后才下载 Motion 分包。
- 支持 `prefers-reduced-motion`。

### Out of Scope

- 不改变现有题目、答案和文字解析的游客访问权限。
- 不把动画 payload 写入 `content/final/math1/question-bank.json`。
- 不新增收费数据库、对象存储或认证服务。
- 不在本需求中批量覆盖全部数学一真题。
- 不允许低推理代理判断数学正确性或设计新的动画类型。

## Pilot Questions

| Stable ID | Topic | Animation Kind |
| --- | --- | --- |
| `math1-2023-q01` | 斜渐近线 | `asymptote` |
| `math1-2023-q12` | 曲面切平面 | `tangent-plane` |
| `math1-2023-q17` | 切线截距与微分方程 | `tangent-intercept` |
| `math1-2023-q19` | 柱面区域与高斯公式 | `cylindrical-solid` |
| `math1-2025-q04` | 二重积分换序 | `integral-region` |
| `math1-2023-q22` | 径向概率密度 | `radial-density` |

## Data Requirements

- Database engine: MySQL.
- Table: `kaoyan_question_animations`.
- Primary key: `question_id`.
- JSON field: `payload`.
- Deactivation: `is_active`.
- Startup seeds use transactional `INSERT IGNORE`; they must not overwrite or reactivate existing records.
- Payloads must pass a Zod runtime schema before API delivery.

## API Requirements

### Public Availability

`GET /api/question-animations/:questionId/availability`

- Returns only `{ "available": boolean }`.
- Must not return titles, steps, animation types, or other protected content.

### Authenticated Animation

`GET /api/question-animations/:questionId`

- Requires the existing HttpOnly session cookie.
- Returns `401` without a valid session.
- Returns `404` for absent or inactive content.
- Uses `Cache-Control: private, no-store`.

### Preview Deployment

- The production origin remains `https://gongren.xyz`.
- HTTPS Cloudflare Pages deployments under `.kaoyan-ddg.pages.dev` are allowed for PR verification.
- Similar domains that do not contain the dot-delimited project suffix are rejected.
- Production session cookies use `SameSite=None; Secure` so authenticated preview requests can carry the session cookie.
- Non-GET preview requests remain protected by the same strict Origin allowlist.

## Performance Requirements

- Motion must not be part of the primary application chunk.
- Guest expansion of a solution must not load the Motion chunk.
- The animation module may load only after authenticated payload retrieval succeeds.
- Missing animation content must not render an empty card.

## Accessibility Requirements

- Respect reduced-motion preferences.
- Loading messages use status semantics.
- Errors use alert semantics.
- Step controls use a labelled group without incomplete ARIA tab semantics.

## Acceptance Criteria

- [x] Six pilot payloads exist and map to canonical question IDs.
- [x] Guest users can read questions and text explanations.
- [x] Guest users cannot retrieve animation payloads.
- [x] Logged-in users can retrieve active animation payloads.
- [x] Invalid payloads are rejected at runtime.
- [x] Existing database rows are not overwritten on API restart.
- [x] Motion builds into a separate chunk.
- [x] The legacy `option.text` question format does not crash practice pages.
- [x] Web/API type checks, tests, builds, and smoke tests pass.
- [x] The smoke-test Make target starts and stops its own Vite server.

## Verification

```bash
make verify
```

Windows fallback:

```powershell
make verify NPM=npm.cmd
```

## Follow-up Work

Batch expansion may use Claude Code only for:

- adding payloads using the six approved animation kinds;
- checking required fields and duplicate IDs;
- running the fixed verification gate.

Question selection, mathematical correctness, and new animation kinds require human or primary-agent review.
