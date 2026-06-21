import type { AppConfig } from "./config.js";

export interface VerificationMailer {
  sendVerification(email: string, token: string): Promise<void>;
}

export class ResendVerificationMailer implements VerificationMailer {
  constructor(private readonly config: AppConfig) {}

  async sendVerification(email: string, token: string): Promise<void> {
    const link = `${this.config.VERIFICATION_URL_BASE}${encodeURIComponent(token)}`;
    if (!this.config.RESEND_API_KEY) {
      if (this.config.NODE_ENV === "production") {
        throw new Error("RESEND_API_KEY is required in production");
      }
      console.info(`[dev-mail] Verify ${email}: ${link}`);
      return;
    }
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.config.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: this.config.MAIL_FROM,
        to: [email],
        subject: "验证你的研数账号",
        html: `<h1>验证邮箱</h1><p>点击下面的链接完成研数账号验证：</p><p><a href="${link}">${link}</a></p><p>链接将在 ${this.config.VERIFICATION_TTL_MINUTES} 分钟后失效。</p>`,
      }),
    });
    if (!response.ok) {
      throw new Error(`Resend failed with ${response.status}`);
    }
  }
}
