// extensions/vaniblu/tools/analyst.ts
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import type { ToolTextResult } from "../lib/types.js";

const IG_ACCOUNT_ID = "17841400071340846";

function getInstagramToken(): string | undefined {
  if (process.env.INSTAGRAM_API_KEY) return process.env.INSTAGRAM_API_KEY;
  const envFile = join(homedir(), "social-agent", ".env");
  if (!existsSync(envFile)) return undefined;
  const match = readFileSync(envFile, "utf8").match(/^INSTAGRAM_API_KEY=(.+)$/m);
  return match?.[1]?.trim();
}
const GRAPH_API_BASE = "https://graph.facebook.com/v19.0";

export interface PostInsight {
  id: string;
  caption: string;
  media_type: string;
  like_count: number;
  comments_count: number;
  timestamp: string;
  reach?: number;
  impressions?: number;
}

export interface AccountStats {
  username: string;
  followers_count: number;
  media_count: number;
}

export interface AnalystResult {
  account: AccountStats;
  posts: PostInsight[];
  summary: string;
}

async function fetchGraph(path: string, token: string): Promise<unknown> {
  const url = `${GRAPH_API_BASE}${path}${path.includes("?") ? "&" : "?"}access_token=${token}`;
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Graph API error ${res.status}: ${err}`);
  }
  return res.json();
}

export async function fetchAccountStats(token: string): Promise<AccountStats> {
  const data = await fetchGraph(
    `/${IG_ACCOUNT_ID}?fields=username,followers_count,media_count`,
    token
  ) as { username: string; followers_count: number; media_count: number };
  return {
    username: data.username,
    followers_count: data.followers_count,
    media_count: data.media_count,
  };
}

export async function fetchRecentPosts(token: string, limit = 10): Promise<PostInsight[]> {
  const data = await fetchGraph(
    `/${IG_ACCOUNT_ID}/media?fields=id,caption,media_type,like_count,comments_count,timestamp&limit=${limit}`,
    token
  ) as { data: Array<{ id: string; caption?: string; media_type: string; like_count: number; comments_count: number; timestamp: string }> };

  const posts: PostInsight[] = [];
  for (const item of data.data ?? []) {
    const post: PostInsight = {
      id: item.id,
      caption: item.caption ?? "",
      media_type: item.media_type,
      like_count: item.like_count,
      comments_count: item.comments_count,
      timestamp: item.timestamp,
    };

    try {
      const insights = await fetchGraph(
        `/${item.id}/insights?metric=reach,impressions`,
        token
      ) as { data: Array<{ name: string; values: Array<{ value: number }> }> };
      for (const metric of insights.data ?? []) {
        const value = metric.values?.[0]?.value ?? 0;
        if (metric.name === "reach") post.reach = value;
        if (metric.name === "impressions") post.impressions = value;
      }
    } catch {
      // per-post insights may be unavailable for some media types — skip silently
    }

    posts.push(post);
  }

  return posts;
}

function buildSummary(account: AccountStats, posts: PostInsight[]): string {
  if (posts.length === 0) return "לא נמצאו פוסטים אחרונים.";

  const sorted = [...posts].sort((a, b) => b.like_count - a.like_count);
  const best = sorted[0];
  const totalLikes = posts.reduce((s, p) => s + p.like_count, 0);
  const totalComments = posts.reduce((s, p) => s + p.comments_count, 0);
  const avgLikes = Math.round(totalLikes / posts.length);
  const avgComments = Math.round(totalComments / posts.length);

  const bestCaption = best.caption.slice(0, 80) + (best.caption.length > 80 ? "..." : "");
  const bestDate = new Date(best.timestamp).toLocaleDateString("he-IL");

  return (
    `📊 **סיכום ביצועי אינסטגרם — @${account.username}**\n\n` +
    `👥 עוקבים: ${account.followers_count.toLocaleString("he-IL")} | פוסטים סה"כ: ${account.media_count}\n\n` +
    `📅 **${posts.length} פוסטים אחרונים:**\n` +
    `• ממוצע לייקים: ${avgLikes}\n` +
    `• ממוצע תגובות: ${avgComments}\n\n` +
    `🏆 **הפוסט הכי טוב:**\n` +
    `"${bestCaption}"\n` +
    `${best.like_count} לייקים, ${best.comments_count} תגובות` +
    (best.reach ? `, ${best.reach} חשיפות` : "") +
    ` — ${bestDate}`
  );
}

export async function analystToolExecute(limit: number): Promise<ToolTextResult> {
  const token = getInstagramToken();
  if (!token) {
    return {
      content: [{ type: "text", text: "שגיאה: INSTAGRAM_API_KEY לא מוגדר ב-.env" }],
      details: {},
    };
  }

  try {
    const [account, posts] = await Promise.all([
      fetchAccountStats(token),
      fetchRecentPosts(token, limit),
    ]);
    const summary = buildSummary(account, posts);
    return {
      content: [{ type: "text", text: summary }],
      details: { account, posts },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      content: [{ type: "text", text: `שגיאה בשליפת נתוני אינסטגרם: ${message}` }],
      details: {},
    };
  }
}
