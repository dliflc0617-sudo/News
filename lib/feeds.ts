import type { FeedDefinition } from "@/lib/types";

const GOOGLE_NEWS_BASE = "https://news.google.com/rss/search";
const COMMON_QUERY_SUFFIX = "&hl=en-US&gl=US&ceid=US:en";

function googleNewsUrl(query: string) {
  return `${GOOGLE_NEWS_BASE}?q=${encodeURIComponent(query)}${COMMON_QUERY_SUFFIX}`;
}

export const FEEDS: FeedDefinition[] = [
  {
    id: "ai-general",
    name: "Google News - AI",
    category: "ai",
    url: googleNewsUrl(
      "artificial intelligence OR generative AI OR OpenAI OR Anthropic OR DeepMind when:1d"
    )
  },
  {
    id: "ai-enterprise",
    name: "Google News - AI Business",
    category: "ai",
    url: googleNewsUrl(
      "NVIDIA AI OR Microsoft AI OR Gemini AI OR AI regulation OR AI chips when:1d"
    )
  },
  {
    id: "finance-markets",
    name: "Google News - Markets",
    category: "finance",
    url: googleNewsUrl(
      "stocks OR markets OR treasury yields OR fed OR inflation OR earnings when:1d"
    )
  },
  {
    id: "finance-economy",
    name: "Google News - Economy",
    category: "finance",
    url: googleNewsUrl(
      "economy OR recession OR Federal Reserve OR CPI OR jobs report OR banking when:1d"
    )
  }
];
