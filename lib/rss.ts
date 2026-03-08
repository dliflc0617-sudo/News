import Parser from "rss-parser";

import { FEEDS } from "@/lib/feeds";
import type { FeedDefinition, NewsCategory, RawNewsItem } from "@/lib/types";

const parser = new Parser();

function stripHtml(value: string) {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function deriveSource(feed: FeedDefinition, title: string, creator?: string | null) {
  if (creator?.trim()) {
    return creator.trim();
  }

  const titleParts = title.split(" - ");
  if (titleParts.length > 1) {
    return titleParts[titleParts.length - 1].trim();
  }

  return feed.name;
}

function normalizeGoogleLink(link: string) {
  try {
    const url = new URL(link);
    const target = url.searchParams.get("url");
    return target || link;
  } catch {
    return link;
  }
}

function normalizeTitle(title: string) {
  return title.replace(/\s+/g, " ").trim();
}

function toIsoDate(value?: string) {
  if (!value) {
    return new Date().toISOString();
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString();
  }

  return date.toISOString();
}

function isRecentEnough(publishedAt: string, hoursBack: number) {
  const cutoff = Date.now() - hoursBack * 60 * 60 * 1000;
  return new Date(publishedAt).getTime() >= cutoff;
}

function dedupeItems(items: RawNewsItem[]) {
  const seen = new Set<string>();
  const output: RawNewsItem[] = [];

  for (const item of items) {
    const key = `${item.category}:${item.title.toLowerCase()}:${item.source.toLowerCase()}`;
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    output.push(item);
  }

  return output;
}

async function fetchFeed(feed: FeedDefinition, hoursBack: number): Promise<RawNewsItem[]> {
  const response = await fetch(feed.url, {
    headers: {
      "User-Agent": "daily-news-digest/0.1"
    },
    next: {
      revalidate: 0
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch feed ${feed.name}: ${response.status}`);
  }

  const xml = await response.text();
  const parsed = await parser.parseString(xml);

  return (parsed.items ?? [])
    .map((item) => {
      const richContent = item as Record<string, string | undefined>;
      const title = normalizeTitle(item.title ?? "");
      const excerpt = stripHtml(
        item.contentSnippet ?? item.content ?? richContent.summary ?? richContent["content:encoded"] ?? ""
      );
      const publishedAt = toIsoDate(item.isoDate ?? item.pubDate);
      const link = normalizeGoogleLink(item.link ?? "");

      return {
        category: feed.category,
        title,
        link,
        source: deriveSource(feed, title, item.creator),
        publishedAt,
        excerpt,
        feedName: feed.name
      } satisfies RawNewsItem;
    })
    .filter((item) => item.title && item.link && isRecentEnough(item.publishedAt, hoursBack));
}

export async function collectNewsItems(hoursBack: number, maxItemsPerCategory: number) {
  const fetched = await Promise.all(FEEDS.map((feed) => fetchFeed(feed, hoursBack)));

  const merged = dedupeItems(
    fetched.flat().sort((a, b) => {
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    })
  );

  const byCategory: Record<NewsCategory, RawNewsItem[]> = {
    ai: [],
    finance: []
  };

  for (const item of merged) {
    if (byCategory[item.category].length >= maxItemsPerCategory) {
      continue;
    }

    byCategory[item.category].push(item);
  }

  return byCategory;
}
