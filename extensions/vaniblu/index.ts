// extensions/vaniblu/index.ts
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
import type { OpenClawPluginApi } from "openclaw/plugin-sdk/plugin-entry";
import { Type } from "@sinclair/typebox";
import { researcherToolExecute } from "./tools/researcher.js";
import type { SearchFn } from "./tools/researcher.js";
import { creatorToolExecute } from "./tools/creator.js";
import { criticToolExecute } from "./tools/critic.js";
import { imageToolExecute } from "./tools/image.js";
import { analystToolExecute } from "./tools/analyst.js";

type PluginRuntime = OpenClawPluginApi["runtime"];

export const runtimeStore = createPluginRuntimeStore<PluginRuntime>(
  "VaniBlu: runtime not initialized — make sure the plugin is registered"
);

export default definePluginEntry({
  id: "vaniblu-social-agent",
  name: "VaniBlu Social Agent",
  description: "Social media manager for VaniBlu brand",
  register(api) {
    runtimeStore.setRuntime(api.runtime);

    api.registerTool({
      name: "vaniblu_researcher",
      label: "VaniBlu Researcher",
      description: "מחקר טרנדים ברשתות חברתיות רלוונטיים למותג VaniBlu. קרא לכלי זה לפני יצירת תוכן כדי להבין מה קורה בשוק.",
      parameters: Type.Object({
        topic: Type.String({ description: "נושא המחקר בעברית, למשל: 'חרדת טיפוח בגיל ההתבגרות'" }),
      }),
      async execute(_toolCallId, params, _signal) {
        const runtime = runtimeStore.getRuntime();
        const searchAdapter: SearchFn = async ({ query }) => {
          const r = await runtime.webSearch.search({ args: { query } });
          // TODO: result.result shape is provider-dependent. Currently we stringify it
          // as best-effort context for Claude. When the provider is known, parse structured results.
          const raw = JSON.stringify(r.result ?? {});
          return {
            results: [{ title: query, snippet: raw.slice(0, 800), url: "" }],
          };
        };
        return researcherToolExecute(params.topic, searchAdapter);
      },
    });

    api.registerTool({
      name: "vaniblu_creator",
      label: "VaniBlu Creator",
      description: "יצירת פוסט פייסבוק מלא למותג VaniBlu כולל hook, body, CTA ו-visual prompt לתמונה.",
      parameters: Type.Object({
        topic: Type.String({ description: "נושא הפוסט בעברית" }),
        angle: Type.Union([
          Type.Literal("emotional"),
          Type.Literal("education"),
          Type.Literal("storytelling"),
          Type.Literal("mother-daughter"),
          Type.Literal("science"),
        ], { description: "זווית התוכן" }),
        trend_context: Type.Optional(Type.String({ description: "הקשר טרנד מהresearcher (אופציונלי)" })),
      }),
      async execute(_toolCallId, params, _signal) {
        return creatorToolExecute(params.topic, params.angle, params.trend_context);
      },
    });

    api.registerTool({
      name: "vaniblu_critic",
      label: "VaniBlu Critic",
      description: "ביקורת פוסט VaniBlu — בודק קרינג', אמינות, התאמה לקהל, וסיכוי conversion. תמיד קרא לכלי זה אחרי vaniblu_creator.",
      parameters: Type.Object({
        post_text: Type.String({ description: "טקסט הפוסט המלא" }),
        cta: Type.String({ description: "ה-CTA של הפוסט" }),
        angle: Type.String({ description: "זווית הפוסט" }),
      }),
      async execute(_toolCallId, params, _signal) {
        return criticToolExecute(params.post_text, params.cta, params.angle);
      },
    });

    api.registerTool({
      name: "vaniblu_image",
      label: "VaniBlu Image",
      description: "יצירת תמונה לפוסט VaniBlu דרך Imagen 3. קרא לכלי זה עם ה-visual_prompt שמגיע מvaniblu_creator.",
      parameters: Type.Object({
        visual_prompt: Type.String({ description: "תיאור התמונה באנגלית (מגיע מvaniblu_creator)" }),
      }),
      async execute(_toolCallId, params, _signal) {
        return imageToolExecute(params.visual_prompt);
      },
    });

    api.registerTool({
      name: "vaniblu_analyst",
      label: "VaniBlu Analyst",
      description: "ניתוח ביצועי אינסטגרם של VaniBlu — שולף נתוני עוקבים, לייקים, תגובות וחשיפות לפוסטים האחרונים.",
      parameters: Type.Object({
        limit: Type.Optional(Type.Number({ description: "כמה פוסטים אחרונים לנתח (ברירת מחדל: 10, מקסימום: 25)", minimum: 1, maximum: 25 })),
      }),
      async execute(_toolCallId, params, _signal) {
        return analystToolExecute(params.limit ?? 10);
      },
    });
  },
});
