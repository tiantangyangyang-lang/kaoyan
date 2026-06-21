import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1),
  DATABASE_SSL: z.string().default("true").transform((value) => value === "true"),
  DATABASE_CA_BASE64: z.string().optional(),
  WEB_ORIGIN: z.string().url().default("http://127.0.0.1:5173"),
  COOKIE_DOMAIN: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  MAIL_FROM: z.string().min(3).default("研数 <verify@mail.gongren.xyz>"),
  VERIFICATION_URL_BASE: z
    .string()
    .url()
    .default("http://127.0.0.1:5173/?verify="),
  VERIFICATION_TTL_MINUTES: z.coerce.number().int().positive().default(60),
  SESSION_DAYS: z.coerce.number().int().positive().default(30),
  TRUST_PROXY: z.coerce.number().int().min(0).max(2).default(1),
});

export type AppConfig = z.infer<typeof schema>;

export function loadConfig(): AppConfig {
  return schema.parse(process.env);
}
