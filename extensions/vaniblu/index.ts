// extensions/vaniblu/index.ts
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
import type { OpenClawPluginApi } from "openclaw/plugin-sdk/plugin-entry";
import { Type } from "@sinclair/typebox";
import { researcherToolExecute } from "./tools/researcher.js";
import type { SearchFn } from "./tools/researcher.js";
import { creatorToolExecute } from "./tools/creator.js";

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
  },
});
