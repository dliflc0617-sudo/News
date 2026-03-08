export type NewsCategory = "ai" | "finance";

export interface FeedDefinition {
  id: string;
  name: string;
  url: string;
  category: NewsCategory;
}

export interface RawNewsItem {
  category: NewsCategory;
  title: string;
  link: string;
  source: string;
  publishedAt: string;
  excerpt: string;
  feedName: string;
}

export interface DigestHighlight {
  title: string;
  source: string;
  publishedAt: string;
  link: string;
  whyItMattersCn: string;
  summaryCn: string;
}

export interface DailyDigest {
  dateLabelCn: string;
  introCn: string;
  aiHeadlineCn: string;
  financeHeadlineCn: string;
  aiHighlights: DigestHighlight[];
  financeHighlights: DigestHighlight[];
  watchlistCn: string[];
  closingCn: string;
}

export interface DigestRunResult {
  digest: DailyDigest;
  sourceCounts: Record<NewsCategory, number>;
  sentEmailId: string | null;
  dryRun: boolean;
}
