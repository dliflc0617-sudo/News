import { z } from "zod";

const envSchema = z.object({
  OPENAI_API_KEY: z.string().min(1, "OPENAI_API_KEY is required"),
  OPENAI_MODEL: z.string().min(1).optional(),
  RESEND_API_KEY: z.string().min(1, "RESEND_API_KEY is required"),
  RESEND_FROM_EMAIL: z.string().min(1).optional(),
  RESEND_TO_EMAIL: z.string().email("RESEND_TO_EMAIL must be a valid email"),
  CRON_SECRET: z.string().min(1).optional(),
  DIGEST_TIMEZONE: z.string().min(1).optional(),
  DIGEST_AI_LIMIT: z.coerce.number().int().positive().max(10).optional(),
  DIGEST_FINANCE_LIMIT: z.coerce.number().int().positive().max(10).optional(),
  DIGEST_MAX_INPUT_ITEMS: z.coerce.number().int().positive().max(40).optional(),
  DIGEST_HOURS_BACK: z.coerce.number().int().positive().max(72).optional()
});

export type AppEnv = z.infer<typeof envSchema>;

export function getEnv(): AppEnv {
  return envSchema.parse(process.env);
}

export function getOptionalEnvStatus() {
  return {
    hasOpenAiKey: Boolean(process.env.OPENAI_API_KEY),
    hasResendKey: Boolean(process.env.RESEND_API_KEY),
    hasRecipient: Boolean(process.env.RESEND_TO_EMAIL),
    hasCronSecret: Boolean(process.env.CRON_SECRET)
  };
}
