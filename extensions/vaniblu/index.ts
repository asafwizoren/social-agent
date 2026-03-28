// extensions/vaniblu/index.ts
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
import type { OpenClawPluginApi } from "openclaw/plugin-sdk/plugin-entry";
import { Type } from "@sinclair/typebox";
import { researcherToolExecute } from "./tools/researcher.js";
import type { SearchFn } from "./tools/researcher.js";

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
          // result.result shape is provider-dependent — extract text best-effort
          const raw = JSON.stringify(r.result ?? {});
          return {
            results: [{ title: query, snippet: raw.slice(0, 800), url: "" }],
          };
        };
        return researcherToolExecute(params.topic, searchAdapter);
      },
    });
  },
});
