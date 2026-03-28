// extensions/vaniblu/tools/critic.ts
import { anthropic, MODEL } from "../lib/anthropic-client.js";
import { getBrandBrain } from "../lib/brand-brain.js";
import type { CritiqueResult, ToolTextResult } from "../lib/types.js";

interface CritiqueParams {
  post_text: string;
  cta: string;
  angle: string;
}

export async function critiquePost(params: CritiqueParams): Promise<CritiqueResult> {
  const brain = getBrandBrain();

  let raw = "";
  try {
    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: `אתה מבקר תוכן קפדני למותג ${brain.brand}.

**קריטריונים לבדיקה:**
1. קרינג' — האם נשמע מאולץ?
2. אמינות — האם נשמע אמיתי ואנושי?
3. התאמה לקהל — אמהות לנערות גיל 12-17
4. האם מגביר חרדה? (אסור לחלוטין)
5. conversion פוטנציאל — האם מקרב למייל?
6. טון: ${brain.tone.join(", ")}
7. אסור: ${brain.tone_forbidden.join(", ")}
8. נושאים אסורים: ${brain.forbidden_themes.join(", ")}

**כלל הציון:** approve = ציון 7 ומעלה + ללא בעיות קריטיות.`,
      messages: [{
        role: "user",
        content: `בקר את הפוסט הבא:

---
${params.post_text}

CTA: ${params.cta}
זווית: ${params.angle}
---

החזר JSON בלבד:
{
  "score": <מספר 0-10>,
  "issues": ["בעיה ספציפית", "..."],
  "improvements": ["שיפור ספציפי", "..."],
  "final_verdict": "approve|revise"
}`
      }]
    });
    const first = message.content[0];
    raw = first?.type === "text" ? first.text : "";
  } catch {
    return {
      score: 0,
      issues: ["שגיאה בביקורת הפוסט"],
      improvements: ["אנא נסה שוב"],
      final_verdict: "revise",
    };
  }

  try {
    return JSON.parse(raw) as CritiqueResult;
  } catch {
    return {
      score: 0,
      issues: ["שגיאה בפענוח תשובת הביקורת"],
      improvements: ["אנא נסה שוב"],
      final_verdict: "revise",
    };
  }
}

export async function criticToolExecute(
  post_text: string,
  cta: string,
  angle: string
): Promise<ToolTextResult> {
  const result = await critiquePost({ post_text, cta, angle });

  const verdict = result.final_verdict === "approve" ? "✅ מאושר לפרסום" : "⚠️ דורש שיפור";
  const formatted =
    `**ביקורת פוסט**\n\n` +
    `ציון: **${result.score}/10** — ${verdict}\n\n` +
    (result.issues.length > 0
      ? `**בעיות:**\n${result.issues.map(i => `• ${i}`).join("\n")}\n\n`
      : "") +
    (result.improvements.length > 0
      ? `**שיפורים מוצעים:**\n${result.improvements.map(i => `• ${i}`).join("\n")}`
      : "");

  return { content: [{ type: "text", text: formatted }], details: {} };
}
