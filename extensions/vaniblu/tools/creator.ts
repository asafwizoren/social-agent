// extensions/vaniblu/tools/creator.ts
import { anthropic, MODEL } from "../lib/anthropic-client.js";
import { getBrandBrain } from "../lib/brand-brain.js";
import type { PostDraft, ToolTextResult } from "../lib/types.js";

interface CreatePostParams {
  topic: string;
  angle: string;
  trend_context?: string;
}

export async function createPost(params: CreatePostParams): Promise<PostDraft> {
  const brain = getBrandBrain();

  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 2048,
    system: `אתה יוצר תוכן למותג ${brain.brand} — ${brain.product}.

**קהל יעד:** ${brain.target_audience.primary}
**טון:** ${brain.tone.join(", ")}
**אסור:** ${brain.tone_forbidden.join(", ")}
**ערכים:** ${brain.brand_values.join(", ")}
**נושאים אסורים:** ${brain.forbidden_themes.join(", ")}
**CTA ברירת מחדל:** ${brain.cta_default}
**פלטפורמה:** ${brain.platform_focus}

**דוגמאות טון:**
${brain.post_examples.map(e => `- ${e}`).join("\n")}`,
    messages: [{
      role: "user",
      content: `צור פוסט פייסבוק על: "${params.topic}"
זווית: ${params.angle}
${params.trend_context ? `הקשר טרנד: ${params.trend_context}` : ""}

החזר JSON בלבד, ללא טקסט נוסף:
{
  "post_text": "הפוסט המלא (150-300 מילים)",
  "hook": "המשפט הפותח בלבד",
  "cta": "קריאה לפעולה",
  "platform": "facebook",
  "angle": "${params.angle}",
  "visual_prompt": "תיאור מפורט באנגלית לתמונה מתאימה, ללא טקסט בתמונה",
  "variants": ["וריאציה קצרה אלטרנטיבית אחת"]
}`
    }]
  });

  const raw = message.content[0].type === "text" ? message.content[0].text : "{}";
  try {
    return JSON.parse(raw) as PostDraft;
  } catch {
    return {
      post_text: raw,
      hook: "",
      cta: brain.cta_default,
      platform: "facebook",
      angle: params.angle,
      visual_prompt: "",
      variants: [],
    };
  }
}

export async function creatorToolExecute(
  topic: string,
  angle: string,
  trend_context?: string
): Promise<ToolTextResult> {
  const draft = await createPost({ topic, angle, trend_context });

  const formatted =
    `📝 **טיוטת פוסט**\n\n` +
    `${draft.post_text}\n\n` +
    `---\n` +
    `**CTA:** ${draft.cta}\n` +
    `**זווית:** ${draft.angle}\n` +
    `**Visual prompt:** ${draft.visual_prompt}`;

  return { content: [{ type: "text", text: formatted }], details: {} };
}
