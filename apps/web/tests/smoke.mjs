import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium } from "playwright-core";

const baseUrl = process.env.BASE_URL ?? "http://127.0.0.1:5173";
const chromePath =
  process.env.CHROME_PATH ??
  "C:/Program Files/Google/Chrome/Application/chrome.exe";
const outputDir = resolve("temp", "web-qa");

await mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({
  executablePath: chromePath,
  headless: true,
});

try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 1,
  });

  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "networkidle" });

  await page.getByRole("heading", { name: "今天从一道真题开始" }).waitFor();
  const bodyText = await page.locator("body").innerText();
  if (!bodyText.includes("852 题")) throw new Error("Question count missing");

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
  await page
    .getByRole("heading", { name: "数学二真题库尚未完成" })
    .waitFor();
  await page.getByRole("button", { name: "返回选择数学一" }).click();
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

  console.log(
    JSON.stringify(
      {
        status: "passed",
        dashboard: "dashboard-desktop.png",
        practice: "practice-desktop.png",
        mobile: "dashboard-mobile.png",
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
