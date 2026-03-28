// extensions/vaniblu/tools/researcher.ts
import { getBrandBrain } from "../lib/brand-brain.js";
import { anthropic, MODEL } from "../lib/anthropic-client.js";
import type { TrendInsight, ToolTextResult } from "../lib/types.js";

export type SearchFn = (opts: { query: string }) => Promise<{
  results: { title: string; snippet: string; url: string }[];
}>;

export async function researchTrends(topic: string, searchFn: SearchFn): Promise<TrendInsight[]> {
  const brain = getBrandBrain();

  const queries = [
    `${topic} TikTok trend teens 2026`,
    `${topic} parenting facebook groups`,
    `${topic} teenage skincare advice dermatologist`,
  ];

  const allResults: string[] = [];

  for (const query of queries) {
    const { results } = await searchFn({ query });
    if (results.length === 0) continue;
    const lines = results.slice(0, 3).map(r => `- ${r.title}: ${r.snippet}`).join("\n");
    allResults.push(`### ${query}\n${lines}`);
  }

  if (allResults.length === 0) return [];

  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: `אתה מנהל מחקר שוק למותג ${brain.brand} — ${brain.product}.
קהל יעד: ${brain.target_audience.primary}.
ערכי מותג: ${brain.brand_values.join(", ")}.
נושאים אסורים: ${brain.forbidden_themes.join(", ")}.`,
    messages: [{
      role: "user",
      content: `נושא מחקר: "${topic}"

תוצאות חיפוש:
${allResults.join("\n\n")}

נתח את הממצאים. החזר JSON בלבד — מערך של אובייקטים:
[{
  "trend": "תיאור הטרנד",
  "relevance_to_brand": "למה זה רלוונטי לVaniBlu",
  "risk_level": "low|medium|high",
  "opportunity": "הזדמנות תוכן ספציפית",
  "content_angles": ["כיוון 1", "כיוון 2", "כיוון 3"]
}]`
    }]
  });

  const raw = message.content[0].type === "text" ? message.content[0].text : "[]";
  try {
    return JSON.parse(raw) as TrendInsight[];
  } catch {
    return [];
  }
}

export async function researcherToolExecute(topic: string, searchFn: SearchFn): Promise<ToolTextResult> {
  const insights = await researchTrends(topic, searchFn);

  if (insights.length === 0) {
    return {
      content: [{ type: "text", text: "לא נמצאו טרנדים רלוונטיים לנושא זה." }],
      details: {},
    };
  }

  const formatted = insights.map((ins, i) =>
    `**טרנד ${i + 1}:** ${ins.trend}\n` +
    `רלוונטיות: ${ins.relevance_to_brand}\n` +
    `רמת סיכון: ${ins.risk_level}\n` +
    `הזדמנות: ${ins.opportunity}\n` +
    `כיוונים: ${ins.content_angles.join(" | ")}`
  ).join("\n\n---\n\n");

  return {
    content: [{ type: "text", text: formatted }],
    details: {},
  };
}
