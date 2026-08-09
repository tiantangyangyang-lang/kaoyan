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
  const authGate = new Promise((resolveGate) => {
    releaseAuth = resolveGate;
  });
  const authenticatedBankGate = new Promise((resolveGate) => {
    releaseAuthenticatedBank = resolveGate;
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
    if (pathname.endsWith("/api/content/math1/public-overrides")) {
      return fulfillJson(route, 200, { data: [] });
    }
    const listMatch = /\/api\/content\/(math[123])\/questions$/.exec(pathname);
    if (listMatch) {
      await authenticatedBankGate;
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

  releaseAuth();
  for (let attempt = 0; attempt < 50; attempt += 1) {
    if (parallelRequests.has("/api/content/math1/questions")) break;
    await parallelPage.waitForTimeout(20);
  }
  await parallelPage
    .getByText("数学一真题当前收录 179 题。", { exact: true })
    .waitFor();
  if ((await parallelPage.locator(".loading-state").count()) !== 0) {
    throw new Error("Public Math1 disappeared during authenticated bank loading");
  }
  releaseAuthenticatedBank();
  await parallelPage
    .getByText("数学一真题当前收录 1 题。", { exact: true })
    .waitFor();
  if (!parallelRequests.has("/api/content/math1/questions")) {
    throw new Error("Authenticated Math1 did not replace the public bank");
  }
  await parallelPage.close();

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
    if (url.pathname.includes("/api/question-animations/")) {
      return fulfillJson(route, 404, { error: "animation_not_found" });
    }
    const detailMatch = /\/api\/content\/(math[123])\/questions\/(.+)$/.exec(
      url.pathname,
    );
    if (detailMatch) {
      const question = publishedQuestion(detailMatch[1]);
      return fulfillJson(route, 200, {
        data: {
          ...question,
          answer: "A",
          answerStatus: "reviewed",
          explanation: "已登录详情",
          explanationStatus: "reviewed",
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

  const browserIssues = [
    ...parallelIssues,
    ...authRaceIssues,
    ...pageIssues,
    ...mobileIssues,
    ...authenticatedIssues,
  ];
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
        anonymousProtectedRedirect: true,
        authenticatedProtectedContent: true,
        publicLoadParallelWithAuthentication: true,
        authenticatedBankReplacedPublicBank: true,
        publicBankStayedVisibleDuringAuthenticatedLoad: true,
        publicOverrideDidNotBlockInitialBank: true,
        publicOverrideAppliedAfterResponse: true,
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
