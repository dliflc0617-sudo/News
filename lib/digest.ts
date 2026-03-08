import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { Resend } from "resend";
import { z } from "zod";

import { getEnv } from "@/lib/config";
import { collectNewsItems } from "@/lib/rss";
import type { DailyDigest, DigestRunResult, RawNewsItem } from "@/lib/types";

type PromptNewsItem = RawNewsItem & {
  id: string;
};

const modelHighlightSchema = z.object({
  itemId: z.string(),
  titleCn: z.string(),
  whyItMattersCn: z.string(),
  summaryCn: z.string()
});

const modelDigestSchema = z.object({
  dateLabelCn: z.string(),
  introCn: z.string(),
  aiHeadlineCn: z.string(),
  financeHeadlineCn: z.string(),
  aiHighlights: z.array(modelHighlightSchema),
  financeHighlights: z.array(modelHighlightSchema),
  watchlistCn: z.array(z.string()),
  closingCn: z.string()
});

const digestTextFormat = zodTextFormat(modelDigestSchema, "daily_news_digest");

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function buildPrompt(items: { ai: PromptNewsItem[]; finance: PromptNewsItem[] }) {
  const env = getEnv();
  const nowLabel = new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: env.DIGEST_TIMEZONE ?? "America/Los_Angeles"
  }).format(new Date());

  return [
    "请基于以下过去 24 小时左右的英文新闻条目，生成一份高信息密度的中文晨报。",
    `当前参考时间：${nowLabel}`,
    "要求：",
    "1. 只保留最重要、最值得读的新闻。",
    `2. AI 版块输出 ${env.DIGEST_AI_LIMIT ?? 5} 条，金融版块输出 ${env.DIGEST_FINANCE_LIMIT ?? 5} 条。`,
    "3. 严格使用候选条目的 itemId 作为引用，不要编造新的 ID、链接或事实。",
    "4. whyItMattersCn 用一句话解释为什么值得关注。",
    "5. summaryCn 用 1-2 句中文概括，不要过度延展，总长度尽量控制在 90 个中文字符以内。",
    "6. titleCn 输出自然、克制、专业的中文标题。",
    "7. 如果条目重复，自动合并取信息更完整的一条。",
    "8. watchlistCn 输出 3-5 条接下来值得继续关注的观察点。",
    "9. 只输出符合 schema 的合法 JSON，不要输出 markdown 代码块，不要输出额外解释。",
    "",
    "AI 候选新闻：",
    JSON.stringify(toPromptPayload(items.ai), null, 2),
    "",
    "金融候选新闻：",
    JSON.stringify(toPromptPayload(items.finance), null, 2)
  ].join("\n");
}

function stripCodeFence(value: string) {
  return value
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function preparePromptItems(items: RawNewsItem[], prefix: string): PromptNewsItem[] {
  return items.map((item, index) => ({
    ...item,
    id: `${prefix}-${index + 1}`
  }));
}

function toPromptPayload(items: PromptNewsItem[]) {
  return items.map((item) => ({
    itemId: item.id,
    title: item.title,
    source: item.source,
    publishedAt: item.publishedAt,
    excerpt: item.excerpt
  }));
}

function hydrateHighlights(
  highlights: Array<z.infer<typeof modelHighlightSchema>>,
  itemMap: Map<string, PromptNewsItem>
) {
  const seen = new Set<string>();

  return highlights.flatMap((item) => {
    if (seen.has(item.itemId)) {
      return [];
    }

    seen.add(item.itemId);
    const sourceItem = itemMap.get(item.itemId);

    if (!sourceItem) {
      return [];
    }

    return [
      {
        title: item.titleCn.trim() || sourceItem.title,
        source: sourceItem.source,
        publishedAt: sourceItem.publishedAt,
        link: sourceItem.link,
        whyItMattersCn: item.whyItMattersCn,
        summaryCn: item.summaryCn
      }
    ];
  });
}

function buildEmailHtml(digest: DailyDigest) {
  const renderSection = (title: string, headline: string, items: DailyDigest["aiHighlights"]) => {
    const cards = items
      .map(
        (item) => `
          <article style="padding:20px;border:1px solid #e5e7eb;border-radius:18px;background:#ffffff;margin-bottom:16px;">
            <div style="font-size:12px;color:#6b7280;margin-bottom:8px;">${escapeHtml(item.source)} · ${escapeHtml(new Date(item.publishedAt).toLocaleString("zh-CN"))}</div>
            <h3 style="margin:0 0 10px;font-size:20px;line-height:1.4;color:#111827;">${escapeHtml(item.title)}</h3>
            <p style="margin:0 0 10px;font-size:15px;line-height:1.7;color:#1f2937;"><strong>看点：</strong>${escapeHtml(item.whyItMattersCn)}</p>
            <p style="margin:0 0 14px;font-size:15px;line-height:1.8;color:#374151;">${escapeHtml(item.summaryCn)}</p>
            <a href="${escapeHtml(item.link)}" style="display:inline-block;color:#0f766e;text-decoration:none;font-weight:600;">阅读原文</a>
          </article>
        `
      )
      .join("");

    return `
      <section style="margin-bottom:32px;">
        <div style="display:inline-block;padding:6px 10px;border-radius:999px;background:#d1fae5;color:#065f46;font-size:12px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;">${escapeHtml(title)}</div>
        <h2 style="margin:14px 0 10px;font-size:28px;line-height:1.3;color:#111827;">${escapeHtml(headline)}</h2>
        ${cards}
      </section>
    `;
  };

  const watchlist = digest.watchlistCn
    .map((item) => `<li style="margin-bottom:10px;">${escapeHtml(item)}</li>`)
    .join("");

  return `
    <div style="margin:0;padding:32px 16px;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
      <main style="max-width:860px;margin:0 auto;background:linear-gradient(180deg,#ffffff 0%,#f8fafc 100%);border-radius:28px;padding:40px 28px;border:1px solid #e5e7eb;">
        <div style="margin-bottom:28px;">
          <div style="display:inline-block;padding:8px 12px;border-radius:999px;background:#111827;color:#ffffff;font-size:12px;font-weight:700;">${escapeHtml(digest.dateLabelCn)}</div>
          <h1 style="margin:16px 0 12px;font-size:38px;line-height:1.15;color:#111827;">AI 与金融晨报</h1>
          <p style="margin:0;font-size:17px;line-height:1.8;color:#374151;">${escapeHtml(digest.introCn)}</p>
        </div>

        ${renderSection("AI", digest.aiHeadlineCn, digest.aiHighlights)}
        ${renderSection("Finance", digest.financeHeadlineCn, digest.financeHighlights)}

        <section style="padding:24px;border-radius:24px;background:#ecfeff;border:1px solid #a5f3fc;">
          <h2 style="margin:0 0 12px;font-size:24px;color:#0f172a;">后续观察</h2>
          <ul style="margin:0;padding-left:20px;font-size:15px;line-height:1.8;color:#334155;">
            ${watchlist}
          </ul>
        </section>

        <p style="margin:24px 0 0;font-size:15px;line-height:1.8;color:#475569;">${escapeHtml(digest.closingCn)}</p>
      </main>
    </div>
  `;
}

function buildEmailText(digest: DailyDigest) {
  const renderItems = (title: string, headline: string, items: DailyDigest["aiHighlights"]) => {
    return [
      `${title} | ${headline}`,
      ...items.map((item, index) => {
        return [
          `${index + 1}. ${item.title}`,
          `来源：${item.source}`,
          `看点：${item.whyItMattersCn}`,
          `摘要：${item.summaryCn}`,
          `链接：${item.link}`
        ].join("\n");
      })
    ].join("\n\n");
  };

  return [
    `AI 与金融晨报 | ${digest.dateLabelCn}`,
    "",
    digest.introCn,
    "",
    renderItems("AI", digest.aiHeadlineCn, digest.aiHighlights),
    "",
    renderItems("Finance", digest.financeHeadlineCn, digest.financeHighlights),
    "",
    "后续观察：",
    ...digest.watchlistCn.map((item, index) => `${index + 1}. ${item}`),
    "",
    digest.closingCn
  ].join("\n");
}

async function generateDigest(items: { ai: RawNewsItem[]; finance: RawNewsItem[] }) {
  const env = getEnv();
  const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  const aiItems = preparePromptItems(items.ai, "ai");
  const financeItems = preparePromptItems(items.finance, "fin");
  const itemMap = new Map<string, PromptNewsItem>(
    [...aiItems, ...financeItems].map((item) => [item.id, item])
  );

  const response = await client.responses.create({
    model: env.OPENAI_MODEL ?? "gpt-5-mini",
    instructions:
      "你是严谨的中文新闻编辑。只根据给定条目生成摘要，不补造链接和细节。输出必须符合 JSON schema。",
    input: buildPrompt({
      ai: aiItems,
      finance: financeItems
    }),
    max_output_tokens: 3000,
    text: {
      format: digestTextFormat
    }
  });

  if (response.status === "incomplete") {
    throw new Error(
      `OpenAI response incomplete: ${response.incomplete_details?.reason ?? "unknown"}`
    );
  }

  const rawOutput = stripCodeFence(response.output_text ?? "");

  if (!rawOutput) {
    throw new Error("OpenAI did not return any digest content.");
  }

  let parsedDigest: z.infer<typeof modelDigestSchema>;

  try {
    parsedDigest = modelDigestSchema.parse(JSON.parse(rawOutput));
  } catch (error) {
    console.error("[digest] Failed to parse structured output", {
      message: error instanceof Error ? error.message : "Unknown parse error",
      preview: rawOutput.slice(0, 800)
    });
    throw error;
  }

  return {
    ...parsedDigest,
    aiHighlights: hydrateHighlights(parsedDigest.aiHighlights, itemMap).slice(
      0,
      env.DIGEST_AI_LIMIT ?? 5
    ),
    financeHighlights: hydrateHighlights(parsedDigest.financeHighlights, itemMap).slice(
      0,
      env.DIGEST_FINANCE_LIMIT ?? 5
    )
  };
}

async function sendDigestEmail(digest: DailyDigest) {
  const env = getEnv();
  const resend = new Resend(env.RESEND_API_KEY);

  const response = await resend.emails.send({
    from: env.RESEND_FROM_EMAIL ?? "AI Finance Brief <onboarding@resend.dev>",
    to: env.RESEND_TO_EMAIL,
    subject: `AI 与金融晨报 | ${digest.dateLabelCn}`,
    html: buildEmailHtml(digest),
    text: buildEmailText(digest)
  });

  if (response.error) {
    throw new Error(response.error.message);
  }

  return response.data?.id ?? null;
}

export async function runDailyDigest(options?: { dryRun?: boolean }): Promise<DigestRunResult> {
  const env = getEnv();
  const items = await collectNewsItems(
    env.DIGEST_HOURS_BACK ?? 30,
    env.DIGEST_MAX_INPUT_ITEMS ?? 14
  );

  if (items.ai.length === 0 && items.finance.length === 0) {
    throw new Error("No recent news items were collected from the configured feeds.");
  }

  const digest = await generateDigest(items);
  const sentEmailId = options?.dryRun ? null : await sendDigestEmail(digest);

  return {
    digest,
    sourceCounts: {
      ai: items.ai.length,
      finance: items.finance.length
    },
    sentEmailId,
    dryRun: Boolean(options?.dryRun)
  };
}
