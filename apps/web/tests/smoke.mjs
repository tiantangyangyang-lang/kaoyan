import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium } from "playwright-core";

const baseUrl = process.env.BASE_URL ?? "http://127.0.0.1:5173";
const chromePath =
  process.env.CHROME_PATH ??
  "C:/Program Files/Google/Chrome/Application/chrome.exe";
const outputDir = resolve("temp", "web-qa");

const fulfillJson = (route, status, body) =>
  route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });

const publishedQuestion = (subject) => ({
  stableId: `${subject}-2020-q01`,
  sourceYear: 2020,
  type: "multiple_choice",
  questionNumber: 1,
  stem: `${subject} authenticated smoke question`,
  options: [
    { label: "A", value: "选项一" },
    { label: "B", value: "选项二" },
  ],
  finalizationStatus: "published",
});

const authTransitionQuestion = {
  ...publishedQuestion("math1"),
  stableId: "math1-2025-q01",
  sourceYear: 2025,
};

const reducedMotionAnimationQuestion = {
  ...publishedQuestion("math1"),
  stableId: "math1-2025-q04",
  sourceYear: 2025,
  questionNumber: 4,
};

const raceQuestion = {
  ...authTransitionQuestion,
  stem: "详情请求竞态测试题",
  answer: null,
  answerStatus: "not_loaded",
  explanation: "",
  explanationStatus: "not_loaded",
  reviewStatus: "published",
  knowledgePoints: [],
  anomalies: [],
  detailLoaded: false,
};

const detailResponse = (explanation) => ({
  data: {
    ...raceQuestion,
    answer: "A",
    answerStatus: "reviewed",
    explanation,
    explanationStatus: "reviewed",
    reviewStatus: "reviewed",
    detailLoaded: true,
  },
});

const raceQuestionList = {
  data: {
    items: [raceQuestion],
    page: 1,
    pageSize: 50,
    totalItems: 1,
    totalPages: 1,
  },
};

const publicRaceBank = {
  schemaVersion: "math-question-bank-v1",
  subjectCode: "math1",
  totalYears: 1,
  totalQuestions: 1,
  questions: [
    {
      ...raceQuestion,
      answer: "A",
      answerStatus: "reviewed",
      explanation: "公开题库解析",
      explanationStatus: "reviewed",
      detailLoaded: true,
    },
  ],
};

const reducedMotionAnimationPayload = {
  version: 1,
  kind: "integral-region",
  title: "换序关键：横切片会断成两段",
  summary:
    "原积分按竖线覆盖区域；换成固定 y 后，中间部分被抛物线排除，必须写成左右两个 x 区间。",
  accent: "#e11d48",
  steps: [
    { title: "竖切读原积分", body: "-2≤x≤2，每条竖线从 y=4-x² 向上积到 y=4。" },
    { title: "横切断成两段", body: "固定 0≤y≤4 后，条件变为 x²≥4-y；中间区间不属于积分区域。" },
    { title: "两段对应选项 A", body: "左段为 [-2,-√(4-y)]，右段为 [√(4-y),2]，所以选择 A。" },
  ],
};

const probabilityAnimationQuestion = {
  ...publishedQuestion("math1"),
  stableId: "math1-2023-q22",
  sourceYear: 2023,
  questionNumber: 22,
  stem: "二维随机变量协方差、独立性与半径平方分布",
};

const probabilityAnimationPayload = {
  version: 1,
  kind: "radial-density",
  variant: "probability-three-results-v1",
  title: "零协方差、不独立，再到 f_Z(z)=2z",
  summary:
    "先用圆盘对称性解释协方差为 0，再用圆盘外小邻域反证独立性，最后把 Z 看成半径平方求出密度。",
  accent: "#7c3aed",
  steps: [
    {
      title: "对称配对，协方差为 0",
      body: "圆盘和密度关于两坐标轴对称：x、y、xy 的正负贡献成对抵消，所以 E(X)=E(Y)=E(XY)=0，Cov(X,Y)=0。",
    },
    {
      title: "圆外小邻域，证明不独立",
      body: "取 P=(3/4,3/4)，因 x²+y²=9/8>1，可在 P 周围取仍落在圆外的小矩形 A×B。该矩形的联合概率为 0，但两个边缘区间的概率乘积大于 0，故不独立。",
    },
    {
      title: "半径平方给出 Z 的密度",
      body: "Z=r²，故 Z≤z 等价于 r≤√z。极坐标积分得 F_Z(z)=z²（0≤z≤1），求导得 f_Z(z)=2z（0<z<1）。",
    },
  ],
};

const legacyProbabilityAnimationPayload = {
  version: 1,
  kind: "radial-density",
  title: "从径向密度推到 f_Z(z)=2z",
  summary: "先看密度如何随半径增大，再累积半径 √z 内的概率，最后对 F_Z(z)=z² 求导。",
  accent: "#7c3aed",
  steps: [
    { title: "密度随半径增大", body: "写成极坐标后 f(x,y)=(2/π)r²；同一圆周密度相同，外圈更密。" },
    { title: "先求分布函数", body: "Z≤z 等价于 r≤√z。对该圆盘积分得到 F_Z(z)=z²，0≤z≤1。" },
    { title: "求导得到密度", body: "对 F_Z(z) 求导，得到 f_Z(z)=2z（0<z<1），区间外为 0。" },
  ],
};

const captureBrowserIssues = (page) => {
  const issues = [];
  page.on("console", (message) => {
    if (["error", "warning"].includes(message.type())) {
      issues.push(`console ${message.type()}: ${message.text()}`);
    }
  });
  page.on("pageerror", (error) => issues.push(`pageerror: ${error.message}`));
  return issues;
};

const routeProbabilityAnimationApi = (page, animationPayload) =>
  page.route("**/api/**", (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith("/api/auth/me")) {
      return fulfillJson(route, 200, {
        user: {
          id: "probability-animation-user",
          email: "probability-animation@example.com",
          emailVerified: true,
        },
      });
    }
    if (url.pathname.endsWith("/api/admin/content/access")) {
      return fulfillJson(route, 200, { eligible: false });
    }
    if (url.pathname.endsWith("/api/content/math1/public-overrides")) {
      return fulfillJson(route, 200, { data: [] });
    }
    if (url.pathname === "/api/content/math1/questions") {
      return fulfillJson(route, 200, {
        data: {
          items: [probabilityAnimationQuestion],
          page: 1,
          pageSize: 50,
          totalItems: 1,
          totalPages: 1,
        },
      });
    }
    if (url.pathname === "/api/content/math1/questions/math1-2023-q22") {
      return fulfillJson(route, 200, {
        data: {
          ...probabilityAnimationQuestion,
          answer: null,
          answerStatus: "missing",
          explanation: "概率题静态解析",
          explanationStatus: "reviewed",
          reviewStatus: "approved",
          knowledgePoints: [],
        },
      });
    }
    if (url.pathname === "/api/question-animations/math1-2023-q22") {
      return fulfillJson(route, 200, {
        animation: {
          questionId: "math1-2023-q22",
          subjectCode: "math1",
          payload: animationPayload,
          updatedAt: new Date(0).toISOString(),
        },
      });
    }
    return fulfillJson(route, 404, { error: "not_found" });
  });

const routeAnonymousApi = (page) =>
  page.route("**/api/**", (route) => {
    const pathname = new URL(route.request().url()).pathname;
    if (pathname.endsWith("/api/auth/me")) {
      return fulfillJson(route, 200, { user: null });
    }
    if (pathname.endsWith("/availability")) {
      return fulfillJson(route, 200, { available: false });
    }
    if (pathname.endsWith("/api/content/math1/public-overrides")) {
      return fulfillJson(route, 200, { data: [] });
    }
    if (pathname.includes("/api/content/")) {
      return fulfillJson(route, 401, { error: "authentication_required" });
    }
    return fulfillJson(route, 200, {});
  });

await mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({
  executablePath: chromePath,
  headless: true,
});

try {
  const parallelPage = await browser.newPage({
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 1,
  });
  const parallelIssues = captureBrowserIssues(parallelPage);
  const parallelRequests = new Set();
  let authPending = true;
  let releaseAuth = () => {};
  let releaseAuthenticatedBank = () => {};
  let releaseAuthenticatedDetail = () => {};
  let authenticatedDetailRequests = 0;
  const authGate = new Promise((resolveGate) => {
    releaseAuth = resolveGate;
  });
  const authenticatedBankGate = new Promise((resolveGate) => {
    releaseAuthenticatedBank = resolveGate;
  });
  const authenticatedDetailGate = new Promise((resolveGate) => {
    releaseAuthenticatedDetail = resolveGate;
  });
  parallelPage.on("request", (request) => {
    parallelRequests.add(new URL(request.url()).pathname);
  });
  await parallelPage.route("**/api/**", async (route) => {
    const pathname = new URL(route.request().url()).pathname;
    if (pathname.endsWith("/api/auth/me")) {
      await authGate;
      authPending = false;
      return fulfillJson(route, 200, {
        user: {
          id: "parallel-user",
          email: "parallel@example.com",
          emailVerified: true,
        },
      });
    }
    if (pathname.endsWith("/api/admin/content/access")) {
      return fulfillJson(route, 200, { eligible: false });
    }
    if (pathname.endsWith("/api/content/math1/public-overrides")) {
      return fulfillJson(route, 200, { data: [] });
    }
    if (pathname.endsWith("/availability")) {
      return fulfillJson(route, 200, { available: false });
    }
    if (pathname.includes("/api/question-animations/")) {
      return fulfillJson(route, 200, {
        animation: {
          questionId: authTransitionQuestion.stableId,
          subjectCode: "math1",
          payload: reducedMotionAnimationPayload,
          updatedAt: new Date(0).toISOString(),
        },
      });
    }
    if (
      pathname.endsWith(
        `/api/content/math1/questions/${authTransitionQuestion.stableId}`,
      )
    ) {
      authenticatedDetailRequests += 1;
      await authenticatedDetailGate;
      return fulfillJson(route, 200, {
        data: {
          ...authTransitionQuestion,
          answer: "A",
          answerStatus: "reviewed",
          explanation: "登录后自动刷新解析",
          explanationStatus: "reviewed",
          reviewStatus: "reviewed",
          knowledgePoints: [],
        },
      });
    }
    const listMatch = /\/api\/content\/(math[123])\/questions$/.exec(pathname);
    if (listMatch) {
      await authenticatedBankGate;
      return fulfillJson(route, 200, {
        data: {
          items:
            listMatch[1] === "math1"
              ? [authTransitionQuestion]
              : [publishedQuestion(listMatch[1])],
          page: 1,
          pageSize: 50,
          totalItems: 1,
          totalPages: 1,
        },
      });
    }
    return fulfillJson(route, 404, { error: "not_found" });
  });

  await parallelPage.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await parallelPage
    .getByText("数学一真题当前收录 179 题。", { exact: true })
    .waitFor();
  if (!authPending) {
    throw new Error("Public Math1 waited for authentication to settle");
  }
  if (!parallelRequests.has("/data/math1.json")) {
    throw new Error("Public Math1 request did not start while authentication was pending");
  }
  await parallelPage.getByRole("button", { name: "真题库" }).click();
  await parallelPage.getByRole("button", { name: /数学一/ }).click();
  await parallelPage.locator("select").nth(0).selectOption("2025");
  await parallelPage.locator(".question-row").first().click();
  await parallelPage.locator(".workspace").waitFor();
  await parallelPage.getByRole("button", { name: "查看答案解析" }).click();

  releaseAuth();
  for (let attempt = 0; attempt < 50; attempt += 1) {
    if (parallelRequests.has("/api/content/math1/questions")) break;
    await parallelPage.waitForTimeout(20);
  }
  await parallelPage.locator(".workspace").waitFor();
  if ((await parallelPage.locator(".loading-state").count()) !== 0) {
    throw new Error("Public Math1 disappeared during authenticated bank loading");
  }
  releaseAuthenticatedBank();
  await parallelPage.getByText("正在加载参考答案…", { exact: true }).waitFor();
  await parallelPage.getByText("正在加载解析…", { exact: true }).waitFor();
  if (!parallelRequests.has("/api/content/math1/questions")) {
    throw new Error("Authenticated Math1 did not replace the public bank");
  }
  if (authenticatedDetailRequests !== 1) {
    throw new Error("Selected question detail was not loaded after authentication");
  }
  releaseAuthenticatedDetail();
  await parallelPage
    .getByText("登录后自动刷新解析", { exact: true })
    .waitFor();
  await parallelPage.close();

  const generationRacePage = await browser.newPage({
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 1,
  });
  const generationRaceIssues = captureBrowserIssues(generationRacePage);
  const pendingGenerationDetails = [];
  await generationRacePage.route("**/api/**", (route) => {
    const pathname = new URL(route.request().url()).pathname;
    if (pathname.endsWith("/api/auth/me")) {
      return fulfillJson(route, 200, {
        user: {
          id: "generation-user",
          email: "generation@example.com",
          emailVerified: true,
        },
      });
    }
    if (pathname.endsWith("/api/admin/content/access")) {
      return fulfillJson(route, 200, { eligible: false });
    }
    if (pathname.endsWith("/api/content/math1/questions")) {
      return fulfillJson(route, 200, raceQuestionList);
    }
    if (pathname.endsWith(`/api/content/math1/questions/${raceQuestion.stableId}`)) {
      pendingGenerationDetails.push(route);
      return;
    }
    if (pathname.endsWith("/api/content/math1/public-overrides")) {
      return fulfillJson(route, 200, { data: [] });
    }
    if (pathname.endsWith("/availability")) {
      return fulfillJson(route, 200, { available: false });
    }
    return fulfillJson(route, 200, {});
  });
  await generationRacePage.goto(baseUrl, { waitUntil: "networkidle" });
  await generationRacePage.getByRole("button", { name: "真题库" }).click();
  await generationRacePage.getByRole("button", { name: /数学一/ }).click();
  await generationRacePage.locator(".question-row").first().click();
  for (let attempt = 0; attempt < 50 && pendingGenerationDetails.length < 1; attempt += 1) {
    await generationRacePage.waitForTimeout(20);
  }
  await generationRacePage.getByRole("button", { name: "学习首页" }).click();
  await generationRacePage.getByRole("button", { name: "开始练习" }).click();
  for (let attempt = 0; attempt < 50 && pendingGenerationDetails.length < 2; attempt += 1) {
    await generationRacePage.waitForTimeout(20);
  }
  if (pendingGenerationDetails.length !== 2) {
    throw new Error("Reopening the unloaded question did not start a newer detail request");
  }
  await generationRacePage.getByRole("button", { name: "查看答案解析" }).click();
  await generationRacePage.getByText("正在加载解析…", { exact: true }).waitFor();
  await fulfillJson(pendingGenerationDetails[1], 200, detailResponse("较新的详情响应"));
  await generationRacePage.getByText("较新的详情响应", { exact: true }).waitFor();
  await fulfillJson(pendingGenerationDetails[0], 200, detailResponse("过期的详情响应"));
  await generationRacePage.waitForTimeout(100);
  if ((await generationRacePage.getByText("过期的详情响应", { exact: true }).count()) !== 0) {
    throw new Error("An older detail response overwrote the newer response");
  }
  await generationRacePage.close();

  const logoutRacePage = await browser.newPage({
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 1,
  });
  const logoutRaceIssues = captureBrowserIssues(logoutRacePage);
  let pendingLogoutDetail = null;
  let logoutPublicLoads = 0;
  await logoutRacePage.route("**/data/math1.json", (route) => {
    logoutPublicLoads += 1;
    return fulfillJson(route, 200, publicRaceBank);
  });
  await logoutRacePage.route("**/api/**", (route) => {
    const pathname = new URL(route.request().url()).pathname;
    if (pathname.endsWith("/api/auth/me")) {
      return fulfillJson(route, 200, {
        user: { id: "logout-user", email: "logout@example.com", emailVerified: true },
      });
    }
    if (pathname.endsWith("/api/auth/logout")) {
      return route.fulfill({ status: 204, body: "" });
    }
    if (pathname.endsWith("/api/admin/content/access")) {
      return fulfillJson(route, 200, { eligible: false });
    }
    if (pathname.endsWith("/api/content/math1/questions")) {
      return fulfillJson(route, 200, raceQuestionList);
    }
    if (pathname.endsWith(`/api/content/math1/questions/${raceQuestion.stableId}`)) {
      pendingLogoutDetail = route;
      return;
    }
    if (pathname.endsWith("/api/content/math1/public-overrides")) {
      return fulfillJson(route, 200, { data: [] });
    }
    if (pathname.endsWith("/availability")) {
      return fulfillJson(route, 200, { available: false });
    }
    return fulfillJson(route, 200, {});
  });
  await logoutRacePage.goto(baseUrl, { waitUntil: "networkidle" });
  await logoutRacePage.getByRole("button", { name: "真题库" }).click();
  await logoutRacePage.getByRole("button", { name: /数学一/ }).click();
  await logoutRacePage.locator(".question-row").first().click();
  for (let attempt = 0; attempt < 50 && !pendingLogoutDetail; attempt += 1) {
    await logoutRacePage.waitForTimeout(20);
  }
  const publicLoadsBeforeLogout = logoutPublicLoads;
  await logoutRacePage.getByRole("button", { name: "账号" }).click();
  await logoutRacePage.getByRole("button", { name: "退出登录" }).click();
  await logoutRacePage.getByRole("heading", { name: "让学习记录跨设备保存" }).waitFor();
  for (
    let attempt = 0;
    attempt < 50 && logoutPublicLoads <= publicLoadsBeforeLogout;
    attempt += 1
  ) {
    await logoutRacePage.waitForTimeout(20);
  }
  if (!pendingLogoutDetail || logoutPublicLoads <= publicLoadsBeforeLogout) {
    throw new Error("Logout race prerequisites were not reached");
  }
  await fulfillJson(pendingLogoutDetail, 200, detailResponse("登出后泄漏的登录解析"));
  await logoutRacePage.waitForTimeout(100);
  await logoutRacePage.getByRole("button", { name: "开始练习" }).click();
  await logoutRacePage.getByRole("button", { name: "查看答案解析" }).click();
  await logoutRacePage.getByText("公开题库解析", { exact: true }).waitFor();
  if ((await logoutRacePage.getByText("登出后泄漏的登录解析", { exact: true }).count()) !== 0) {
    throw new Error("A detail response completed after logout and changed the public bank");
  }
  await logoutRacePage.close();

  const accountSwitchPage = await browser.newPage({
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 1,
  });
  const accountSwitchIssues = captureBrowserIssues(accountSwitchPage);
  let accountSwitchUser = "account-a";
  let accountSwitchLists = 0;
  let accountADetail = null;
  await accountSwitchPage.route("**/api/**", (route) => {
    const pathname = new URL(route.request().url()).pathname;
    if (pathname.endsWith("/api/auth/me")) {
      return fulfillJson(route, 200, {
        user: { id: accountSwitchUser, email: "a@example.com", emailVerified: true },
      });
    }
    if (pathname.endsWith("/api/auth/logout")) {
      accountSwitchUser = "";
      return route.fulfill({ status: 204, body: "" });
    }
    if (pathname.endsWith("/api/auth/login")) {
      accountSwitchUser = "account-b";
      return fulfillJson(route, 200, {
        user: { id: "account-b", email: "b@example.com", emailVerified: true },
      });
    }
    if (pathname.endsWith("/api/admin/content/access")) {
      return fulfillJson(route, 200, { eligible: false });
    }
    if (pathname.endsWith("/api/content/math1/questions")) {
      accountSwitchLists += 1;
      return fulfillJson(route, 200, raceQuestionList);
    }
    if (pathname.endsWith(`/api/content/math1/questions/${raceQuestion.stableId}`)) {
      if (!accountADetail) {
        accountADetail = route;
        return;
      }
      return fulfillJson(route, 200, detailResponse("账号 B 的解析"));
    }
    if (pathname.endsWith("/api/content/math1/public-overrides")) {
      return fulfillJson(route, 200, { data: [] });
    }
    if (pathname.endsWith("/availability")) {
      return fulfillJson(route, 200, { available: false });
    }
    return fulfillJson(route, 200, {});
  });
  await accountSwitchPage.goto(baseUrl, { waitUntil: "networkidle" });
  await accountSwitchPage.getByRole("button", { name: "真题库" }).click();
  await accountSwitchPage.getByRole("button", { name: /数学一/ }).click();
  await accountSwitchPage.locator(".question-row").first().click();
  for (let attempt = 0; attempt < 50 && !accountADetail; attempt += 1) {
    await accountSwitchPage.waitForTimeout(20);
  }
  await accountSwitchPage.getByRole("button", { name: "账号" }).click();
  await accountSwitchPage.getByRole("button", { name: "退出登录" }).click();
  await accountSwitchPage.getByPlaceholder("name@example.com").fill("b@example.com");
  await accountSwitchPage.getByPlaceholder("输入密码").fill("password123");
  await accountSwitchPage.getByRole("button", { name: "登录", exact: true }).last().click();
  await accountSwitchPage.getByText("当前登录：b@example.com").waitFor();
  for (let attempt = 0; attempt < 50 && accountSwitchLists < 2; attempt += 1) {
    await accountSwitchPage.waitForTimeout(20);
  }
  if (!accountADetail || accountSwitchLists < 2) {
    throw new Error("Account-switch race prerequisites were not reached");
  }
  await fulfillJson(accountADetail, 200, detailResponse("账号 A 的过期解析"));
  await accountSwitchPage.waitForTimeout(100);
  await accountSwitchPage.getByRole("button", { name: "开始练习" }).click();
  await accountSwitchPage.getByRole("button", { name: "查看答案解析" }).click();
  await accountSwitchPage.getByText("账号 B 的解析", { exact: true }).waitFor();
  if ((await accountSwitchPage.getByText("账号 A 的过期解析", { exact: true }).count()) !== 0) {
    throw new Error("Account A detail was applied after switching to account B");
  }
  await accountSwitchPage.close();

  const overridePage = await browser.newPage({
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 1,
  });
  const overrideIssues = captureBrowserIssues(overridePage);
  let overridePending = true;
  let releaseOverride = () => {};
  const overrideGate = new Promise((resolveGate) => {
    releaseOverride = resolveGate;
  });
  await overridePage.route("**/api/**", async (route) => {
    const pathname = new URL(route.request().url()).pathname;
    if (pathname.endsWith("/api/auth/me")) {
      return fulfillJson(route, 200, { user: null });
    }
    if (pathname.endsWith("/api/content/math1/public-overrides")) {
      await overrideGate;
      overridePending = false;
      return fulfillJson(route, 200, {
        data: [
          {
            stableId: "math1-2025-q01",
            revision: 1,
            changes: { stem: "公开覆盖测试题干" },
          },
        ],
      });
    }
    if (pathname.endsWith("/availability")) {
      return fulfillJson(route, 200, { available: false });
    }
    return fulfillJson(route, 404, { error: "not_found" });
  });
  await overridePage.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await overridePage
    .getByText("数学一真题当前收录 179 题。", { exact: true })
    .waitFor();
  if (!overridePending) {
    throw new Error("Public Math1 waited for the override request");
  }
  releaseOverride();
  await overridePage.waitForTimeout(200);
  await overridePage.getByRole("button", { name: "真题库" }).click();
  await overridePage.getByRole("button", { name: /数学一/ }).click();
  await overridePage.locator("select").nth(0).selectOption("2025");
  await overridePage.locator(".question-row").first().click();
  await overridePage.getByText("公开覆盖测试题干").waitFor();
  if (overrideIssues.length) {
    throw new Error(`Public override browser issues:\n${overrideIssues.join("\n")}`);
  }
  await overridePage.close();

  const authRacePage = await browser.newPage({
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 1,
  });
  const authRaceIssues = captureBrowserIssues(authRacePage);
  let releaseStaleAuth = () => {};
  const staleAuthGate = new Promise((resolveGate) => {
    releaseStaleAuth = resolveGate;
  });
  await authRacePage.route("**/api/**", async (route) => {
    const pathname = new URL(route.request().url()).pathname;
    if (pathname.endsWith("/api/auth/me")) {
      await staleAuthGate;
      return fulfillJson(route, 200, { user: null });
    }
    if (pathname.endsWith("/api/auth/login")) {
      return fulfillJson(route, 200, {
        user: {
          id: "manual-login-user",
          email: "manual@example.com",
          emailVerified: true,
        },
      });
    }
    if (pathname.endsWith("/api/admin/content/access")) {
      return fulfillJson(route, 200, { eligible: false });
    }
    if (pathname.endsWith("/api/content/math1/public-overrides")) {
      return fulfillJson(route, 200, { data: [] });
    }
    const listMatch = /\/api\/content\/(math[123])\/questions$/.exec(pathname);
    if (listMatch) {
      return fulfillJson(route, 200, {
        data: {
          items: [publishedQuestion(listMatch[1])],
          page: 1,
          pageSize: 50,
          totalItems: 1,
          totalPages: 1,
        },
      });
    }
    return fulfillJson(route, 404, { error: "not_found" });
  });
  await authRacePage.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await authRacePage
    .getByText("数学一真题当前收录 179 题。", { exact: true })
    .waitFor();
  await authRacePage.getByRole("button", { name: "账号" }).click();
  await authRacePage.getByPlaceholder("name@example.com").fill("manual@example.com");
  await authRacePage.getByPlaceholder("输入密码").fill("password123");
  await authRacePage.getByRole("button", { name: "登录", exact: true }).last().click();
  await authRacePage.getByRole("heading", { name: "我的账号" }).waitFor();
  await authRacePage.getByText("当前登录：manual@example.com").waitFor();
  releaseStaleAuth();
  await authRacePage.waitForTimeout(100);
  await authRacePage.getByRole("heading", { name: "我的账号" }).waitFor();
  await authRacePage.getByText("当前登录：manual@example.com").waitFor();
  await authRacePage.close();

  const unauthorizedPage = await browser.newPage({
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 1,
  });
  let sawUnauthorizedAuth = false;
  await unauthorizedPage.route("**/api/**", (route) => {
    const pathname = new URL(route.request().url()).pathname;
    if (pathname.endsWith("/api/auth/me")) {
      sawUnauthorizedAuth = true;
      return fulfillJson(route, 401, { error: "authentication_required" });
    }
    if (pathname.endsWith("/availability")) {
      return fulfillJson(route, 200, { available: false });
    }
    if (pathname.endsWith("/api/content/math1/public-overrides")) {
      return fulfillJson(route, 200, { data: [] });
    }
    if (pathname.includes("/api/content/")) {
      return fulfillJson(route, 401, { error: "authentication_required" });
    }
    return fulfillJson(route, 200, {});
  });
  await unauthorizedPage.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await unauthorizedPage
    .getByText("数学一真题当前收录 179 题。", { exact: true })
    .waitFor();
  if (!sawUnauthorizedAuth) {
    throw new Error("Anonymous fallback did not exercise an auth 401 response");
  }
  await unauthorizedPage.close();

  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 1,
  });
  const pageIssues = captureBrowserIssues(page);
  await routeAnonymousApi(page);

  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "networkidle" });

  await page.getByRole("heading", { name: "今天从一道真题开始" }).waitFor();
  const bodyText = await page.locator("body").innerText();
  if (!bodyText.includes("179 题")) throw new Error("Public question count missing");

  await page.screenshot({
    path: resolve(outputDir, "dashboard-desktop.png"),
    fullPage: true,
  });

  await page.getByRole("button", { name: "账号" }).click();
  await page.getByRole("heading", { name: "让学习记录跨设备保存" }).waitFor();
  await page.getByRole("button", { name: "注册", exact: true }).click();
  await page
    .getByRole("button", { name: "注册并发送验证邮件" })
    .waitFor();
  await page.getByRole("button", { name: "学习首页" }).click();

  await page.getByRole("button", { name: "真题库" }).click();
  await page.getByRole("heading", { name: "选择考试科目" }).waitFor();
  await page.getByRole("button", { name: /数学二/ }).click();
  await page.getByRole("heading", { name: "让学习记录跨设备保存" }).waitFor();
  await page.getByText(/数学一 2018 年以前及数学二、数学三需要登录/).waitFor();
  await page.getByRole("button", { name: "真题库" }).click();
  await page.getByRole("button", { name: /数学一/ }).click();
  await page.getByRole("heading", { name: "数学一真题库" }).waitFor();
  await page.locator("select").nth(0).selectOption("2025");
  await page.getByText("22 题", { exact: true }).waitFor();
  await page.locator(".question-row").first().click();
  await page.locator(".workspace").waitFor();

  const firstOption = page.locator(".option").first();
  if (await firstOption.count()) await firstOption.click();
  await page.getByRole("button", { name: "我做错了" }).click();
  await page.getByText("已加入错题本", { exact: true }).waitFor();
  await page.getByText("参考答案", { exact: true }).waitFor();
  await page
    .getByPlaceholder(/记录错因/)
    .fill("测试笔记：复查二阶导数与拐点判定。");

  await page.screenshot({
    path: resolve(outputDir, "practice-desktop.png"),
    fullPage: true,
  });

  await page.getByRole("button", { name: "错题本", exact: true }).click();
  await page.getByRole("heading", { name: "错题本" }).waitFor();
  if ((await page.locator(".question-row").count()) < 1) {
    throw new Error("Wrong-book persistence failed");
  }

  const stored = await page.evaluate(() =>
    localStorage.getItem("kaoyan:math1:question-states:v1"),
  );
  if (
    !stored ||
    !stored.includes('"inWrongBook":true') ||
    !stored.includes("测试笔记")
  ) {
    throw new Error("Learning state was not persisted");
  }

  await page.getByRole("button", { name: "复习队列" }).click();
  await page.getByRole("heading", { name: "复习队列" }).waitFor();
  if ((await page.locator(".question-row").count()) < 1) {
    throw new Error("Review queue did not include the wrong question");
  }

  await page.getByRole("button", { name: "整卷练习" }).click();
  await page.getByRole("heading", { name: "选择考试科目" }).waitFor();
  await page.getByRole("button", { name: /数学二/ }).click();
  await page.getByRole("heading", { name: "让学习记录跨设备保存" }).waitFor();
  await page.getByRole("button", { name: "整卷练习" }).click();
  await page.getByRole("button", { name: /数学一/ }).click();
  await page.getByRole("heading", { name: "数学一整卷练习" }).waitFor();
  await page.locator(".paper-card").first().getByRole("button").click();
  await page.locator(".paper-session-layout").waitFor();

  const paperOption = page.locator(".paper-session-layout .option").first();
  if (await paperOption.count()) await paperOption.click();
  await page.getByRole("button", { name: "做错", exact: true }).click();
  await page.getByRole("button", { name: "提交整卷" }).click();
  await page.getByText("参考答案", { exact: true }).waitFor();

  const paperStored = await page.evaluate(() =>
    localStorage.getItem("kaoyan:math1:paper-sessions:v1"),
  );
  if (!paperStored || !paperStored.includes('"status":"submitted"')) {
    throw new Error("Paper submission was not persisted");
  }

  await page.getByRole("button", { name: "数据中心" }).click();
  await page.getByRole("heading", { name: "数据中心" }).waitFor();
  const jsonDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "导出 JSON" }).click();
  if (!(await jsonDownload).suggestedFilename().endsWith(".json")) {
    throw new Error("JSON export filename is invalid");
  }
  const zipDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "导出 ZIP" }).click();
  if (!(await zipDownload).suggestedFilename().endsWith(".zip")) {
    throw new Error("Obsidian export filename is invalid");
  }

  const mobile = await browser.newPage({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
  });
  const mobileIssues = captureBrowserIssues(mobile);
  await routeAnonymousApi(mobile);
  await mobile.goto(baseUrl, { waitUntil: "networkidle" });
  await mobile.getByRole("heading", { name: "今天从一道真题开始" }).waitFor();
  await mobile.screenshot({
    path: resolve(outputDir, "dashboard-mobile.png"),
    fullPage: true,
  });

  await mobile.getByRole("button", { name: "打开菜单" }).click();
  await mobile.getByRole("button", { name: "真题库" }).click();
  await mobile.getByRole("button", { name: /数学一/ }).click();
  await mobile.getByRole("heading", { name: "数学一真题库" }).waitFor();

  const authenticated = await browser.newPage({
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 1,
  });
  const authenticatedIssues = captureBrowserIssues(authenticated);
  await authenticated.route("**/api/**", (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith("/api/auth/me")) {
      return fulfillJson(route, 200, {
        user: { id: "smoke-user", email: "smoke@example.com", emailVerified: true },
      });
    }
    if (url.pathname.endsWith("/api/admin/content/access")) {
      return fulfillJson(route, 200, { eligible: false });
    }
    if (url.pathname.includes("/api/question-animations/")) {
      return url.pathname.endsWith("/availability")
        ? fulfillJson(route, 200, { available: false })
        : fulfillJson(route, 404, { error: "animation_not_found" });
    }
    const detailMatch = /\/api\/content\/(math[123])\/questions\/(.+)$/.exec(
      url.pathname,
    );
    if (detailMatch) {
      const question = publishedQuestion(detailMatch[1]);
      return fulfillJson(route, 200, {
        data: {
          ...question,
          answer: detailMatch[1] === "math3" ? null : "A",
          answerStatus: detailMatch[1] === "math3" ? "missing" : "reviewed",
          explanation: detailMatch[1] === "math3" ? null : "已登录详情",
          explanationStatus:
            detailMatch[1] === "math3" ? "missing" : "reviewed",
          reviewStatus: "reviewed",
          knowledgePoints: [],
        },
      });
    }
    const listMatch = /\/api\/content\/(math[123])\/questions$/.exec(url.pathname);
    if (listMatch) {
      return fulfillJson(route, 200, {
        data: {
          items: [publishedQuestion(listMatch[1])],
          page: 1,
          pageSize: 50,
          totalItems: 1,
          totalPages: 1,
        },
      });
    }
    return fulfillJson(route, 404, { error: "not_found" });
  });
  await authenticated.goto(baseUrl, { waitUntil: "networkidle" });
  await authenticated.getByRole("button", { name: "真题库" }).click();
  await authenticated.getByRole("button", { name: /数学二/ }).click();
  await authenticated.getByRole("heading", { name: "数学二真题库" }).waitFor();
  await authenticated.getByText("1 题", { exact: true }).waitFor();
  await authenticated.locator(".question-row").first().click();
  await authenticated.locator(".workspace").waitFor();
  await authenticated.getByRole("button", { name: "查看答案解析" }).click();
  await authenticated.getByText("已登录详情", { exact: true }).waitFor();
  await authenticated.screenshot({
    path: resolve(outputDir, "authenticated-math2.png"),
    fullPage: true,
  });
  await authenticated.getByRole("button", { name: "真题库" }).click();
  await authenticated.getByRole("button", { name: "← 返回选择科目" }).click();
  await authenticated.getByRole("button", { name: /数学三/ }).click();
  await authenticated.locator(".question-row").first().click();
  await authenticated.getByRole("button", { name: "查看答案解析" }).click();
  await authenticated
    .getByText("答案整理中，暂未发布参考答案。", { exact: true })
    .waitFor();
  await authenticated
    .getByText("解析整理中，暂未发布。", { exact: true })
    .waitFor();

  const animationPage = await browser.newPage({
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 1,
    reducedMotion: "reduce",
  });
  const animationIssues = captureBrowserIssues(animationPage);
  await animationPage.route("**/api/**", (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith("/api/auth/me")) {
      return fulfillJson(route, 200, {
        user: { id: "animation-user", email: "animation@example.com", emailVerified: true },
      });
    }
    if (url.pathname.endsWith("/api/admin/content/access")) {
      return fulfillJson(route, 200, { eligible: false });
    }
    if (url.pathname.endsWith("/api/content/math1/public-overrides")) {
      return fulfillJson(route, 200, { data: [] });
    }
    if (url.pathname === "/api/content/math1/questions") {
      return fulfillJson(route, 200, {
        data: {
          items: [reducedMotionAnimationQuestion],
          page: 1,
          pageSize: 50,
          totalItems: 1,
          totalPages: 1,
        },
      });
    }
    if (url.pathname === "/api/content/math1/questions/math1-2025-q04") {
      return fulfillJson(route, 200, {
        data: {
          ...reducedMotionAnimationQuestion,
          answer: "A",
          answerStatus: "reviewed",
          explanation: "积分区域换序测试解析",
          explanationStatus: "reviewed",
          reviewStatus: "approved",
          knowledgePoints: [],
        },
      });
    }
    if (url.pathname === "/api/question-animations/math1-2025-q04") {
      return fulfillJson(route, 200, {
        animation: {
          questionId: "math1-2025-q04",
          subjectCode: "math1",
          payload: reducedMotionAnimationPayload,
          updatedAt: new Date(0).toISOString(),
        },
      });
    }
    return fulfillJson(route, 404, { error: "not_found" });
  });
  await animationPage.goto(baseUrl, { waitUntil: "networkidle" });
  if (!(await animationPage.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches))) {
    throw new Error("Reduced-motion browser preference was not active");
  }
  await animationPage.getByRole("button", { name: "真题库" }).click();
  await animationPage.getByRole("button", { name: /数学一/ }).click();
  await animationPage.locator(".question-row").first().click();
  await animationPage.getByRole("button", { name: "查看答案解析" }).click();
  await animationPage.getByText("换序关键：横切片会断成两段", { exact: true }).waitFor();
  await animationPage.getByRole("button", { name: "2 横切断成两段" }).click();
  await animationPage.getByText("中间不属于 D", { exact: true }).waitFor();
  await animationPage.getByRole("button", { name: "3 两段对应选项 A" }).click();
  await animationPage.getByText("[-2,-√(4-y)]", { exact: true }).waitFor();
  await animationPage.getByText("[√(4-y),2]", { exact: true }).waitFor();
  await animationPage.screenshot({
    path: resolve(outputDir, "animation-q04-reduced-motion.png"),
    fullPage: true,
  });
  animationIssues.splice(
    0,
    animationIssues.length,
    ...animationIssues.filter(
      (issue) => !issue.includes("You have Reduced Motion enabled on your device"),
    ),
  );
  await animationPage.close();

  const legacyProbabilityAnimationPage = await browser.newPage({
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 1,
    reducedMotion: "reduce",
  });
  const legacyProbabilityAnimationIssues = captureBrowserIssues(
    legacyProbabilityAnimationPage,
  );
  await routeProbabilityAnimationApi(
    legacyProbabilityAnimationPage,
    legacyProbabilityAnimationPayload,
  );
  await legacyProbabilityAnimationPage.goto(baseUrl, { waitUntil: "networkidle" });
  await legacyProbabilityAnimationPage.getByRole("button", { name: "真题库" }).click();
  await legacyProbabilityAnimationPage.getByRole("button", { name: /数学一/ }).click();
  await legacyProbabilityAnimationPage.locator(".question-row").first().click();
  await legacyProbabilityAnimationPage
    .getByRole("button", { name: "查看答案解析" })
    .click();
  await legacyProbabilityAnimationPage
    .getByText("从径向密度推到 f_Z(z)=2z", { exact: true })
    .waitFor();
  const legacyProbabilityCard = legacyProbabilityAnimationPage.locator(
    ".math-animation-card",
  );
  await legacyProbabilityCard
    .getByText("f(x,y)=(2/π)r²", { exact: true })
    .waitFor();
  await legacyProbabilityCard
    .getByRole("button", { name: "2 先求分布函数" })
    .click();
  await legacyProbabilityCard
    .getByText("F_Z(z)=P(r²≤z)=z²", { exact: true })
    .waitFor();
  await legacyProbabilityCard
    .getByRole("button", { name: "3 求导得到密度" })
    .click();
  await legacyProbabilityCard.getByText("f_Z(z)=2z", { exact: true }).waitFor();
  await legacyProbabilityCard.screenshot({
    path: resolve(outputDir, "animation-q22-legacy-compatible.png"),
  });
  legacyProbabilityAnimationIssues.splice(
    0,
    legacyProbabilityAnimationIssues.length,
    ...legacyProbabilityAnimationIssues.filter(
      (issue) => !issue.includes("You have Reduced Motion enabled on your device"),
    ),
  );
  await legacyProbabilityAnimationPage.close();

  const probabilityAnimationPage = await browser.newPage({
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 1,
    reducedMotion: "reduce",
  });
  const probabilityAnimationIssues = captureBrowserIssues(probabilityAnimationPage);
  await routeProbabilityAnimationApi(
    probabilityAnimationPage,
    probabilityAnimationPayload,
  );
  await probabilityAnimationPage.goto(baseUrl, { waitUntil: "networkidle" });
  await probabilityAnimationPage.getByRole("button", { name: "真题库" }).click();
  await probabilityAnimationPage.getByRole("button", { name: /数学一/ }).click();
  await probabilityAnimationPage.locator(".question-row").first().click();
  await probabilityAnimationPage.getByRole("button", { name: "查看答案解析" }).click();
  await probabilityAnimationPage
    .getByText("零协方差、不独立，再到 f_Z(z)=2z", { exact: true })
    .waitFor();
  const probabilityCard = probabilityAnimationPage.locator(".math-animation-card");
  await probabilityCard.getByText("E(X)=E(Y)=0", { exact: true }).waitFor();
  await probabilityCard.getByText("E(XY)=0 ⇒ Cov(X,Y)=0", { exact: true }).waitFor();
  await probabilityCard.screenshot({
    path: resolve(outputDir, "animation-q22-covariance.png"),
  });
  await probabilityCard
    .getByRole("button", { name: "2 圆外小邻域，证明不独立" })
    .click();
  await probabilityCard.getByText("P(3/4,3/4)", { exact: true }).waitFor();
  await probabilityCard
    .getByText("P((X,Y)∈A×B)=0", { exact: true })
    .waitFor();
  await probabilityCard
    .getByText("P(X∈A)P(Y∈B)>0 ⇒ 不独立", { exact: true })
    .waitFor();
  await probabilityCard.screenshot({
    path: resolve(outputDir, "animation-q22-not-independent.png"),
  });
  await probabilityCard
    .getByRole("button", { name: "3 半径平方给出 Z 的密度" })
    .click();
  await probabilityCard.getByText("Z=r²", { exact: true }).waitFor();
  await probabilityCard.getByText("F_Z(z)=z²", { exact: true }).waitFor();
  await probabilityCard.getByText("f_Z(z)=2z", { exact: true }).waitFor();
  await probabilityCard.screenshot({
    path: resolve(outputDir, "animation-q22-z-density.png"),
  });
  probabilityAnimationIssues.splice(
    0,
    probabilityAnimationIssues.length,
    ...probabilityAnimationIssues.filter(
      (issue) => !issue.includes("You have Reduced Motion enabled on your device"),
    ),
  );
  await probabilityAnimationPage.close();

  const adminPage = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 1,
  });
  const adminIssues = captureBrowserIssues(adminPage);
  const adminKey = "browser-test-admin-key";
  let adminExplanation = "原始解析";
  let adminRevision = 2;
  let armPostCommitRefreshFailures = false;
  let failNextAdminSnapshotRefresh = false;
  let failNextPracticeDetailRefresh = false;
  let sawAdminKeyHeader = false;
  let sawClientEditorField = false;
  let sawExplicitRevertTarget = false;
  let adminDetailRequests = 0;
  const adminBase = {
    stableId: "math1-2025-q04",
    sourceYear: 2025,
    type: "multiple_choice",
    questionNumber: 4,
    stem: "原始题干",
    options: [
      { label: "A", value: "选项 A" },
      { label: "B", value: "选项 B" },
      { label: "C", value: "选项 C" },
      { label: "D", value: "选项 D" },
    ],
    answer: "A",
    answerStatus: "reviewed",
    explanation: "原始解析",
    explanationStatus: "reviewed",
    reviewStatus: "approved",
    finalizationStatus: "published",
    knowledgePoints: [],
  };
  const adminSnapshot = () => ({
    stableId: adminBase.stableId,
    subjectCode: "math1",
    base: adminBase,
    effective: {
      ...adminBase,
      explanation: adminExplanation,
    },
    override: adminRevision > 2
      ? {
          revision: adminRevision,
          active: true,
          changes: { explanation: adminExplanation },
          editor: "admin@example.com",
          reason: "浏览器测试修正",
          updatedAt: new Date().toISOString(),
        }
      : {
          revision: 2,
          active: true,
          changes: { explanation: "原始解析" },
          editor: "admin@example.com",
          reason: "初始测试修订",
          updatedAt: new Date().toISOString(),
        },
    revisions: [],
    historyHasMore: true,
  });
  await adminPage.route("**/api/**", async (route) => {
    const url = new URL(route.request().url());
    const pathname = url.pathname;
    if (pathname.endsWith("/api/auth/me")) {
      return fulfillJson(route, 200, {
        user: {
          id: "admin-user",
          email: "admin@example.com",
          emailVerified: true,
        },
      });
    }
    if (pathname.endsWith("/api/auth/logout")) {
      return route.fulfill({ status: 204, body: "" });
    }
    if (pathname.endsWith("/api/admin/content/access")) {
      return fulfillJson(route, 200, { eligible: true });
    }
    if (pathname.endsWith("/api/content/math1/questions/math1-2025-q04")) {
      adminDetailRequests += 1;
      if (failNextPracticeDetailRefresh) {
        failNextPracticeDetailRefresh = false;
        return fulfillJson(route, 503, { error: "temporary_detail_failure" });
      }
      return fulfillJson(route, 200, {
        data: {
          ...adminBase,
          explanation: adminExplanation,
        },
      });
    }
    if (pathname.endsWith("/api/admin/content/questions/math1-2025-q04")) {
      const suppliedKey = route.request().headers()["x-admin-content-key"];
      sawAdminKeyHeader = sawAdminKeyHeader || suppliedKey === adminKey;
      if (suppliedKey !== adminKey) {
        return fulfillJson(route, 403, { error: "admin_access_denied" });
      }
      if (failNextAdminSnapshotRefresh) {
        failNextAdminSnapshotRefresh = false;
        return fulfillJson(route, 503, { error: "temporary_admin_refresh_failure" });
      }
      return fulfillJson(route, 200, { data: adminSnapshot() });
    }
    if (
      pathname.endsWith(
        "/api/admin/content/questions/math1-2025-q04/override",
      )
    ) {
      sawAdminKeyHeader =
        sawAdminKeyHeader ||
        route.request().headers()["x-admin-content-key"] === adminKey;
      const input = route.request().postDataJSON();
      sawClientEditorField = sawClientEditorField || "editor" in input;
      sawExplicitRevertTarget =
        sawExplicitRevertTarget ||
        (input.action === "revert" && input.targetRevision === 1);
      const nextRevision = adminRevision + 1;
      if (input.mode === "commit") {
        adminRevision = nextRevision;
        if (input.action === "upsert" && input.changes.explanation) {
          adminExplanation = input.changes.explanation;
        }
        if (armPostCommitRefreshFailures) {
          armPostCommitRefreshFailures = false;
          failNextAdminSnapshotRefresh = true;
          failNextPracticeDetailRefresh = true;
        }
      }
      return fulfillJson(route, 200, {
        result: {
          stableId: adminBase.stableId,
          subjectCode: "math1",
          action: input.action,
          previousRevision: adminRevision - (input.mode === "commit" ? 1 : 0),
          revision: input.mode === "commit" ? adminRevision : nextRevision,
          targetRevision: input.action === "revert" ? input.targetRevision : null,
          beforePatchHash: "a".repeat(64),
          afterPatchHash: "b".repeat(64),
          baseSnapshotHash: "c".repeat(64),
          dryRun: input.mode === "preview",
          transaction: input.mode === "preview" ? "rolled_back" : "committed",
        },
      });
    }
    const listMatch = /\/api\/content\/(math[123])\/questions$/.exec(pathname);
    if (listMatch) {
      return fulfillJson(route, 200, {
        data: {
          items:
            listMatch[1] === "math1"
              ? [adminBase]
              : [publishedQuestion(listMatch[1])],
          page: 1,
          pageSize: 50,
          totalItems: 1,
          totalPages: 1,
        },
      });
    }
    if (pathname.includes("/api/question-animations/")) {
      return pathname.endsWith("/availability")
        ? fulfillJson(route, 200, { available: false })
        : fulfillJson(route, 200, {
            animation: {
              questionId: adminBase.stableId,
              subjectCode: "math1",
              payload: reducedMotionAnimationPayload,
              updatedAt: new Date(0).toISOString(),
            },
          });
    }
    if (pathname.endsWith("/api/content/math1/public-overrides")) {
      return fulfillJson(route, 200, { data: [] });
    }
    return fulfillJson(route, 200, {});
  });
  await adminPage.goto(baseUrl, { waitUntil: "networkidle" });
  await adminPage.getByRole("button", { name: "真题库" }).click();
  await adminPage.getByRole("button", { name: /数学一/ }).click();
  await adminPage.locator(".question-row").first().click();
  await adminPage.locator(".workspace").waitFor();
  await adminPage.getByRole("button", { name: "查看答案解析" }).click();
  await adminPage.getByText("原始解析", { exact: true }).waitFor();
  await adminPage.getByRole("button", { name: "内容管理" }).click();
  await adminPage.getByRole("heading", { name: "内容管理" }).waitFor();
  await adminPage.getByLabel(/管理员密钥/).fill(adminKey);
  await adminPage.getByLabel("题目 stable ID").fill("math1-2025-q04");
  await adminPage.getByRole("button", { name: "查询题目" }).click();
  await adminPage.getByText("math1-2025-q04", { exact: true }).waitFor();
  await adminPage
    .locator(".admin-editor-grid .admin-field-wide textarea")
    .nth(1)
    .fill("浏览器测试修正解析");
  await adminPage
    .getByLabel(/修改原因/)
    .fill("浏览器测试修正");
  await adminPage.getByRole("button", { name: "1. 预览并回滚事务" }).click();
  await adminPage.getByText(/预览成功：数据库事务已回滚/).waitFor();
  await adminPage.getByRole("button", { name: "2. 确认保存到数据库" }).click();
  await adminPage.getByText("保存成功，当前修订号为 3。").waitFor();
  for (let attempt = 0; attempt < 50 && adminDetailRequests < 2; attempt += 1) {
    await adminPage.waitForTimeout(20);
  }
  if (adminDetailRequests !== 2) {
    throw new Error("Admin commit did not refresh the active question detail");
  }
  await adminPage
    .locator(".admin-editor-grid .admin-field-wide textarea")
    .nth(1)
    .fill("第二次浏览器测试修正解析");
  await adminPage.getByLabel(/修改原因/).fill("验证保存后的刷新失败提示");
  await adminPage.getByRole("button", { name: "1. 预览并回滚事务" }).click();
  await adminPage.getByText(/预览成功：数据库事务已回滚/).waitFor();
  armPostCommitRefreshFailures = true;
  await adminPage.getByRole("button", { name: "2. 确认保存到数据库" }).click();
  await adminPage
    .getByText(
      "保存成功，当前修订号为 4；管理页数据刷新失败，请重新查询这道题；练习页自动刷新失败，请重新打开或刷新页面重试。",
      { exact: true },
    )
    .waitFor();
  if (adminDetailRequests !== 3) {
    throw new Error("Admin partial-success scenario did not attempt the practice refresh");
  }
  adminIssues.splice(
    0,
    adminIssues.length,
    ...adminIssues.filter(
      (issue) => !issue.includes("status of 503 (Service Unavailable)"),
    ),
  );
  await adminPage.getByRole("button", { name: "查询题目" }).click();
  const refreshedExplanationEditor = adminPage
    .locator(".admin-editor-grid .admin-field-wide textarea")
    .nth(1);
  for (let attempt = 0; attempt < 50; attempt += 1) {
    if ((await refreshedExplanationEditor.inputValue()) === "第二次浏览器测试修正解析") {
      break;
    }
    await adminPage.waitForTimeout(20);
  }
  if ((await refreshedExplanationEditor.inputValue()) !== "第二次浏览器测试修正解析") {
    throw new Error("Admin re-query did not load the committed content after partial success");
  }
  if (!sawAdminKeyHeader) throw new Error("Admin key header was not sent");
  if (sawClientEditorField) throw new Error("Browser was allowed to choose audit editor");
  const persistedAdminKey = await adminPage.evaluate((key) => {
    const storageValues = [localStorage, sessionStorage].flatMap((storage) =>
      Array.from({ length: storage.length }, (_, index) =>
        storage.getItem(storage.key(index) ?? ""),
      ),
    );
    return storageValues.some((value) => value?.includes(key));
  }, adminKey);
  if (persistedAdminKey) throw new Error("Admin key was persisted in browser storage");
  await adminPage.getByRole("button", { name: "恢复历史版本" }).click();
  await adminPage.getByLabel(/目标修订号/).fill("1");
  await adminPage.getByLabel(/修改原因/).fill("恢复到未列出的早期版本");
  await adminPage.getByRole("button", { name: "1. 预览并回滚事务" }).click();
  await adminPage.getByText(/预览成功：数据库事务已回滚/).waitFor();
  if (!sawExplicitRevertTarget) {
    throw new Error("Explicit older revision was not accepted for revert preview");
  }
  const expectedDeniedIssueStart = adminIssues.length;
  await adminPage.getByLabel(/管理员密钥/).fill("incorrect-browser-key");
  await adminPage.getByRole("button", { name: "查询题目" }).click();
  await adminPage.getByText(/管理员密钥不正确/).waitFor();
  if ((await adminPage.getByLabel(/管理员密钥/).inputValue()) !== "") {
    throw new Error("Rejected admin key was not cleared from React state");
  }
  adminIssues.splice(
    expectedDeniedIssueStart,
    adminIssues.length - expectedDeniedIssueStart,
    ...adminIssues
      .slice(expectedDeniedIssueStart)
      .filter((issue) => !issue.includes("status of 403")),
  );
  await adminPage.getByRole("button", { name: "开始练习" }).click();
  await adminPage.locator(".workspace").waitFor();
  await adminPage.getByRole("button", { name: "查看答案解析" }).click();
  for (let attempt = 0; attempt < 50 && adminDetailRequests < 4; attempt += 1) {
    await adminPage.waitForTimeout(20);
  }
  if (adminDetailRequests < 4) {
    throw new Error(
      `Reopening after a failed admin refresh did not retry detail loading (requests: ${adminDetailRequests})`,
    );
  }
  await adminPage
    .getByText("第二次浏览器测试修正解析", { exact: true })
    .waitFor();
  await adminPage.getByRole("button", { name: "账号" }).click();
  await adminPage.getByRole("button", { name: "退出登录" }).click();
  await adminPage.getByRole("heading", { name: "让学习记录跨设备保存" }).waitFor();
  if ((await adminPage.getByRole("button", { name: "内容管理" }).count()) !== 0) {
    throw new Error("Admin navigation remained visible after logout");
  }
  await adminPage.close();

  const browserIssues = [
    ["parallel", parallelIssues],
    ["detail-generation-race", generationRaceIssues],
    ["detail-logout-race", logoutRaceIssues],
    ["detail-account-switch-race", accountSwitchIssues],
    ["auth-race", authRaceIssues],
    ["desktop", pageIssues],
    ["mobile", mobileIssues],
    ["authenticated", authenticatedIssues],
    ["animation", animationIssues],
    ["legacy-probability-animation", legacyProbabilityAnimationIssues],
    ["probability-animation", probabilityAnimationIssues],
    ["admin", adminIssues],
  ].flatMap(([scenario, issues]) =>
    issues.map((issue) => `${scenario}: ${issue}`),
  );
  if (browserIssues.length > 0) {
    throw new Error(`Browser console/page errors:\n${browserIssues.join("\n")}`);
  }

  console.log(
    JSON.stringify(
      {
        status: "passed",
        dashboard: "dashboard-desktop.png",
        practice: "practice-desktop.png",
        mobile: "dashboard-mobile.png",
        authenticated: "authenticated-math2.png",
        animation: "animation-q04-reduced-motion.png",
        probabilityAnimation: [
          "animation-q22-legacy-compatible.png",
          "animation-q22-covariance.png",
          "animation-q22-not-independent.png",
          "animation-q22-z-density.png",
        ],
        anonymousProtectedRedirect: true,
        authenticatedProtectedContent: true,
        animationReducedMotion: true,
        probabilityAnimationThreeResults: true,
        probabilityAnimationReducedMotion: true,
        legacyProbabilityAnimationCompatible: true,
        publicLoadParallelWithAuthentication: true,
        authenticatedBankReplacedPublicBank: true,
        authenticatedSelectionDetailRefreshed: true,
        newestDetailResponseWon: true,
        detailResponseDiscardedAfterLogout: true,
        detailResponseDiscardedAfterAccountSwitch: true,
        unloadedDetailUsesLoadingLabels: true,
        missingDetailUsesMissingLabels: true,
        publicBankStayedVisibleDuringAuthenticatedLoad: true,
        publicOverrideDidNotBlockInitialBank: true,
        publicOverrideAppliedAfterResponse: true,
        adminTwoGateEditor: true,
        adminPreviewBeforeCommit: true,
        adminCommitRefreshedActiveQuestion: true,
        adminCommitPartialSuccessReported: true,
        failedAdminDetailRefreshRetriedOnOpen: true,
        adminKeyMemoryOnly: true,
        staleStartupAuthDidNotOverrideManualLogin: true,
        anonymousAuth401Fallback: true,
        paperSubmission: true,
        reviewQueue: true,
        exports: ["json", "zip"],
      },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
}
