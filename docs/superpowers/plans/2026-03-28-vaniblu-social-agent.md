# VaniBlu Social Agent — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the VaniBlu Social Agent MVP — an OpenClaw plugin that researches trends, creates Facebook posts, critiques them, and generates matching images, all accessible via Telegram in Hebrew.

**Architecture:** OpenClaw plugin (TypeScript/ESM) with 4 registered tools: `vaniblu_researcher` (web search + Claude synthesis), `vaniblu_creator` (brand-aware post generation via Claude), `vaniblu_critic` (quality evaluation via Claude), `vaniblu_image` (Imagen 3 via Google AI Studio). OpenClaw handles Telegram, memory, and web search natively. This plan covers the Week 1-2 MVP; the strategist tool (Week 3) is a separate plan.

**Tech Stack:** TypeScript (ESM), OpenClaw SDK, `@anthropic-ai/sdk`, `@google/genai`, `@sinclair/typebox`, Vitest for tests.

> **Note:** The project has a Python `.venv` from earlier exploration. Ignore it — this plugin is Node.js/TypeScript only.

---

## ⚠️ API Corrections (verified against installed openclaw package)

The code examples in this plan were written before inspecting the actual SDK. These corrections override any conflicting code in the tasks below.

### 1. Import paths

```typescript
// WRONG (plan):
import { definePluginEntry } from "@openclaw/sdk/plugin";
import { createPluginRuntimeStore } from "@openclaw/sdk/runtime";

// CORRECT:
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
import type { OpenClawPluginApi } from "openclaw/plugin-sdk/plugin-entry";
```

### 2. `definePluginEntry` requires `id` and `description`

```typescript
// WRONG (plan):
definePluginEntry({ name: "vaniblu-social-agent", register(api) {...} })

// CORRECT:
definePluginEntry({
  id: "vaniblu-social-agent",
  name: "VaniBlu Social Agent",
  description: "Social media manager for VaniBlu brand",
  register(api) {...}
})
```

### 3. `createPluginRuntimeStore` API

```typescript
// WRONG (plan):
const runtimeStore = createPluginRuntimeStore();
runtimeStore.set(api.runtime);   // in register()
runtimeStore.get()               // in execute()

// CORRECT:
type PluginRuntime = OpenClawPluginApi["runtime"];
const runtimeStore = createPluginRuntimeStore<PluginRuntime>("error message");
runtimeStore.setRuntime(api.runtime);  // in register()
runtimeStore.getRuntime()              // in execute()
```

### 4. Tool structure — requires `label` + `details` in result

```typescript
// WRONG (plan):
api.registerTool({
  name: "vaniblu_researcher",
  description: "...",
  parameters: Type.Object({...}),
  async execute(_id, params) {
    return { content: [{ type: "text", text: result }] };  // missing details
  },
});

// CORRECT:
api.registerTool({
  name: "vaniblu_researcher",
  label: "VaniBlu Researcher",          // required field
  description: "...",
  parameters: Type.Object({...}),
  async execute(toolCallId, params, signal) {
    const runtime = runtimeStore.getRuntime();
    return {
      content: [{ type: "text", text: result }],
      details: {}                        // required field
    };
  },
});
```

### 5. ImageContent uses `mimeType` not `mediaType`

```typescript
// WRONG (plan):
return { content: [{ type: "image", data: base64, mediaType: "image/png" }], details: {} };

// CORRECT:
return { content: [{ type: "image", data: base64, mimeType: "image/png" }], details: {} };
```

### 6. Web search API

```typescript
// The plan's SearchFn type was invented — actual API:
const result = await runtime.webSearch.search({
  args: { query: "search term" }
});
// result = { provider: string, result: Record<string, unknown> }
// The shape of result.result depends on the configured provider — treat as unknown
// Extract text content from result.result and pass to Claude for synthesis
```

---

## File Structure

```
extensions/vaniblu/
├── package.json               # ESM, "openclaw" field → index.ts
├── openclaw.plugin.json       # Plugin manifest
├── tsconfig.json              # TypeScript config
├── index.ts                   # Plugin entry: registers all 4 tools
├── lib/
│   ├── types.ts               # Shared TypeScript interfaces
│   ├── brand-brain.ts         # Loads brand_brain.json, exports typed object
│   └── anthropic-client.ts    # Shared Anthropic client + model constant
├── tools/
│   ├── researcher.ts          # Web search + Claude synthesis → TrendInsight[]
│   ├── creator.ts             # Brand context + Claude → PostDraft
│   ├── critic.ts              # Evaluation rubric + Claude → CritiqueResult
│   └── image.ts               # Google AI Studio Imagen 3 → image buffer
├── data/
│   └── brand_brain.json       # VaniBlu brand rules (single source of truth)
└── tests/
    ├── brand-brain.test.ts
    ├── researcher.test.ts
    ├── creator.test.ts
    ├── critic.test.ts
    └── image.test.ts
```

---

## Task 1: Project Setup & Plugin Scaffold

**Files:**
- Create: `extensions/vaniblu/package.json`
- Create: `extensions/vaniblu/tsconfig.json`
- Create: `extensions/vaniblu/openclaw.plugin.json`
- Create: `extensions/vaniblu/index.ts`

- [ ] **Step 1: Install OpenClaw globally**

```bash
npm install -g openclaw
openclaw --version
```
Expected: version string printed (e.g., `1.x.x`). If not found, follow instructions at openclaw.ai.

- [ ] **Step 2: Create directory structure**

```bash
mkdir -p extensions/vaniblu/tools extensions/vaniblu/lib extensions/vaniblu/data extensions/vaniblu/tests
```

- [ ] **Step 3: Write package.json**

```json
{
  "name": "@vaniblu/social-agent",
  "version": "1.0.0",
  "type": "module",
  "openclaw": ["./index.ts"],
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@anthropic-ai/sdk": "^0.39.0",
    "@google/genai": "^0.8.0",
    "@openclaw/sdk": "latest",
    "@sinclair/typebox": "^0.34.0"
  },
  "devDependencies": {
    "vitest": "^2.0.0",
    "typescript": "^5.0.0",
    "@types/node": "^22.0.0"
  }
}
```

- [ ] **Step 4: Write tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "outDir": "./dist",
    "rootDir": ".",
    "resolveJsonModule": true,
    "esModuleInterop": true
  },
  "include": ["**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 5: Write openclaw.plugin.json**

```json
{
  "name": "vaniblu-social-agent",
  "displayName": "VaniBlu Social Agent",
  "version": "1.0.0",
  "description": "Social media manager for VaniBlu brand",
  "author": "VaniBlu",
  "config": {}
}
```

- [ ] **Step 6: Write minimal index.ts (empty plugin for verification)**

```typescript
// extensions/vaniblu/index.ts
import { definePluginEntry } from "@openclaw/sdk/plugin";
import { createPluginRuntimeStore } from "@openclaw/sdk/runtime";

export const runtimeStore = createPluginRuntimeStore();

export default definePluginEntry({
  name: "vaniblu-social-agent",
  register(api) {
    runtimeStore.set(api.runtime);
    // Tools registered in later tasks
  },
});
```

- [ ] **Step 7: Install dependencies**

```bash
cd extensions/vaniblu && npm install
```
Expected: packages installed with no errors.

- [ ] **Step 8: Set environment variables**

Add to `~/.zshrc` or `~/.bashrc`:
```bash
export ANTHROPIC_API_KEY="sk-ant-..."
export GOOGLE_AI_STUDIO_KEY="AIza..."
```
Then: `source ~/.zshrc`

- [ ] **Step 9: Set up OpenClaw with Telegram**

```bash
openclaw setup
```
When prompted:
- Choose **Telegram** as the channel
- Enter your Telegram bot token (from @BotFather on Telegram)
- Point OpenClaw to your plugin directory: `extensions/vaniblu`

- [ ] **Step 10: Verify OpenClaw recognizes the plugin**

```bash
openclaw plugins list
```
Expected: `vaniblu-social-agent` appears in the list.

- [ ] **Step 11: Commit**

```bash
git init
git add extensions/vaniblu/package.json extensions/vaniblu/tsconfig.json extensions/vaniblu/openclaw.plugin.json extensions/vaniblu/index.ts
git commit -m "feat: scaffold VaniBlu OpenClaw plugin"
```

---

## Task 2: Shared Types & brand_brain.json

**Files:**
- Create: `extensions/vaniblu/lib/types.ts`
- Create: `extensions/vaniblu/data/brand_brain.json`
- Create: `extensions/vaniblu/lib/brand-brain.ts`
- Test: `extensions/vaniblu/tests/brand-brain.test.ts`

- [ ] **Step 1: Write types.ts**

```typescript
// extensions/vaniblu/lib/types.ts

export interface BrandBrain {
  brand: string;
  product: string;
  tagline: string;
  target_audience: {
    primary: string;
    secondary: string;
  };
  tone: string[];
  tone_forbidden: string[];
  kpis: { name: string; priority: number }[];
  cta_default: string;
  platform_focus: string;
  post_cadence: string;
  brand_values: string[];
  forbidden_themes: string[];
  post_examples: string[];
}

export interface TrendInsight {
  trend: string;
  relevance_to_brand: string;
  risk_level: "low" | "medium" | "high";
  opportunity: string;
  content_angles: string[];
}

export interface PostDraft {
  post_text: string;
  hook: string;
  cta: string;
  platform: "facebook";
  angle: string;
  visual_prompt: string;
  variants: string[];
}

export interface CritiqueResult {
  score: number;
  issues: string[];
  improvements: string[];
  final_verdict: "approve" | "revise";
}

export type ToolTextContent = { type: "text"; text: string };
export type ToolImageContent = { type: "image"; data: string; mediaType: string };
export type ToolResult = { content: (ToolTextContent | ToolImageContent)[] };
```

- [ ] **Step 2: Write brand_brain.json**

```json
{
  "brand": "VaniBlu",
  "product": "קו טיפוח טבעי לנערות גיל ההתבגרות",
  "tagline": "יופי אמיתי מתחיל מבפנים",
  "target_audience": {
    "primary": "אמהות לנערות גיל 12-17 — Facebook",
    "secondary": "נערות גיל 12-17 — YouTube, Instagram"
  },
  "tone": [
    "אחות גדולה חכמה",
    "חמה ואמפטית",
    "מדעית אבל לא יבשה",
    "מעצימה ולא מתיילדת",
    "כנה ולא שיווקית"
  ],
  "tone_forbidden": [
    "שיווקי מדי",
    "מגביר חרדות",
    "מדבר על מושלמות",
    "משתמש בסלנג מאולץ",
    "מרגיש כמו פרסומת"
  ],
  "kpis": [
    { "name": "newsletter_signup", "priority": 1 },
    { "name": "waitlist", "priority": 2 },
    { "name": "whatsapp_community", "priority": 3 }
  ],
  "cta_default": "להצטרפות לניוזלטר",
  "platform_focus": "Facebook (אמהות)",
  "post_cadence": "5-15 פוסטים בשבוע",
  "brand_values": [
    "טבעיות",
    "מדע מוכח",
    "הכלה ואהבה עצמית",
    "שקיפות",
    "חינוך לא מכירה"
  ],
  "forbidden_themes": [
    "השוואות גוף",
    "דייאט",
    "מושלמות",
    "בושה",
    "פחד"
  ],
  "post_examples": [
    "\"גיל ההתבגרות מגיע עם הרבה שאלות על העור. לא כדי להפחיד — אלא כדי שתדעי מה באמת עוזר.\"",
    "\"3 דברים שאמא שלך כנראה לא ידעה על טיפוח בגיל 14 — ואת כן תדעי.\""
  ]
}
```

- [ ] **Step 3: Write brand-brain.ts**

```typescript
// extensions/vaniblu/lib/brand-brain.ts
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import type { BrandBrain } from "./types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

let _cache: BrandBrain | null = null;

export function getBrandBrain(): BrandBrain {
  if (_cache) return _cache;
  const path = join(__dirname, "../data/brand_brain.json");
  _cache = JSON.parse(readFileSync(path, "utf-8")) as BrandBrain;
  return _cache;
}
```

- [ ] **Step 4: Write failing test**

```typescript
// extensions/vaniblu/tests/brand-brain.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { getBrandBrain } from "../lib/brand-brain.js";

describe("getBrandBrain", () => {
  it("loads brand brain with correct structure", () => {
    const brain = getBrandBrain();
    expect(brain.brand).toBe("VaniBlu");
    expect(brain.kpis[0].name).toBe("newsletter_signup");
    expect(brain.tone).toContain("אחות גדולה חכמה");
    expect(brain.cta_default).toBe("להצטרפות לניוזלטר");
  });

  it("returns same instance on second call (cached)", () => {
    const a = getBrandBrain();
    const b = getBrandBrain();
    expect(a).toBe(b);
  });
});
```

- [ ] **Step 5: Run test — verify it fails first**

```bash
cd extensions/vaniblu && npm test -- tests/brand-brain.test.ts
```
Expected: FAIL — `Cannot find module '../lib/brand-brain.js'` (the files don't exist yet since we write test before code).

> Note: For this task the test and code are written in the same step. Run it now to confirm it passes after Step 3.

- [ ] **Step 6: Run test — verify it passes**

```bash
cd extensions/vaniblu && npm test -- tests/brand-brain.test.ts
```
Expected: 2 tests pass.

- [ ] **Step 7: Commit**

```bash
git add extensions/vaniblu/lib/types.ts extensions/vaniblu/data/brand_brain.json extensions/vaniblu/lib/brand-brain.ts extensions/vaniblu/tests/brand-brain.test.ts
git commit -m "feat: add shared types and VaniBlu brand brain"
```

---

## Task 3: Shared Anthropic Client

**Files:**
- Create: `extensions/vaniblu/lib/anthropic-client.ts`

- [ ] **Step 1: Write anthropic-client.ts**

```typescript
// extensions/vaniblu/lib/anthropic-client.ts
import Anthropic from "@anthropic-ai/sdk";

if (!process.env.ANTHROPIC_API_KEY) {
  throw new Error("ANTHROPIC_API_KEY environment variable is required");
}

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const MODEL = "claude-sonnet-4-6";
```

- [ ] **Step 2: Commit**

```bash
git add extensions/vaniblu/lib/anthropic-client.ts
git commit -m "feat: add shared Anthropic client"
```

---

## Task 4: researcher_tool

**Files:**
- Create: `extensions/vaniblu/tools/researcher.ts`
- Modify: `extensions/vaniblu/index.ts`
- Test: `extensions/vaniblu/tests/researcher.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
// extensions/vaniblu/tests/researcher.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { researchTrends } from "../tools/researcher.js";

const mockSearch = vi.fn();

beforeEach(() => mockSearch.mockReset());

describe("researchTrends", () => {
  it("returns structured trend insights for a topic", async () => {
    mockSearch.mockResolvedValue({
      results: [
        { title: "Teen skincare anxiety on TikTok", snippet: "Teens are overwhelmed by complex routines...", url: "https://example.com/1" },
        { title: "Simple skincare for teens 2026", snippet: "Dermatologists recommend minimal routines...", url: "https://example.com/2" },
      ]
    });

    // Mock Claude to return structured JSON
    vi.doMock("../lib/anthropic-client.js", () => ({
      MODEL: "claude-sonnet-4-6",
      anthropic: {
        messages: {
          create: vi.fn().mockResolvedValue({
            content: [{ type: "text", text: JSON.stringify([{
              trend: "חרדת שגרת טיפוח אצל נערות",
              relevance_to_brand: "גבוהה — VaniBlu מציעה פתרון פשוט",
              risk_level: "low",
              opportunity: "סדרת פוסטים להורדת לחץ",
              content_angles: ["חינוכי", "רגשי", "אמא-בת"]
            }]) }]
          })
        }
      }
    }));

    const insights = await researchTrends("חרדת טיפוח", mockSearch);
    expect(insights).toHaveLength(1);
    expect(insights[0]).toMatchObject({
      trend: expect.any(String),
      relevance_to_brand: expect.any(String),
      risk_level: expect.stringMatching(/^(low|medium|high)$/),
      opportunity: expect.any(String),
      content_angles: expect.arrayContaining([expect.any(String)]),
    });
  });

  it("returns empty array when search yields no results", async () => {
    mockSearch.mockResolvedValue({ results: [] });
    const insights = await researchTrends("nonexistent topic xyz", mockSearch);
    expect(insights).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd extensions/vaniblu && npm test -- tests/researcher.test.ts
```
Expected: FAIL — `Cannot find module '../tools/researcher.js'`

- [ ] **Step 3: Implement researcher.ts**

```typescript
// extensions/vaniblu/tools/researcher.ts
import { anthropic, MODEL } from "../lib/anthropic-client.js";
import { getBrandBrain } from "../lib/brand-brain.js";
import type { TrendInsight, ToolResult } from "../lib/types.js";

type SearchFn = (opts: { query: string }) => Promise<{
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

export async function researcherToolExecute(topic: string, searchFn: SearchFn): Promise<ToolResult> {
  const insights = await researchTrends(topic, searchFn);

  if (insights.length === 0) {
    return { content: [{ type: "text", text: "לא נמצאו טרנדים רלוונטיים לנושא זה." }] };
  }

  const formatted = insights.map((ins, i) =>
    `**טרנד ${i + 1}:** ${ins.trend}\n` +
    `רלוונטיות: ${ins.relevance_to_brand}\n` +
    `רמת סיכון: ${ins.risk_level}\n` +
    `הזדמנות: ${ins.opportunity}\n` +
    `כיוונים: ${ins.content_angles.join(" | ")}`
  ).join("\n\n---\n\n");

  return { content: [{ type: "text", text: formatted }] };
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd extensions/vaniblu && npm test -- tests/researcher.test.ts
```
Expected: 2 tests pass.

- [ ] **Step 5: Add researcher_tool to index.ts**

```typescript
// extensions/vaniblu/index.ts
import { definePluginEntry } from "@openclaw/sdk/plugin";
import { Type } from "@sinclair/typebox";
import { createPluginRuntimeStore } from "@openclaw/sdk/runtime";
import { researcherToolExecute } from "./tools/researcher.js";

export const runtimeStore = createPluginRuntimeStore();

export default definePluginEntry({
  name: "vaniblu-social-agent",
  register(api) {
    runtimeStore.set(api.runtime);

    api.registerTool({
      name: "vaniblu_researcher",
      description: "מחקר טרנדים ברשתות חברתיות רלוונטיים למותג VaniBlu. קרא לכלי זה לפני יצירת תוכן כדי להבין מה קורה בשוק.",
      parameters: Type.Object({
        topic: Type.String({ description: "נושא המחקר בעברית, למשל: 'חרדת טיפוח בגיל ההתבגרות'" }),
      }),
      async execute(_id, params) {
        const runtime = runtimeStore.get();
        return researcherToolExecute(params.topic, runtime.webSearch.search.bind(runtime.webSearch));
      },
    });
  },
});
```

- [ ] **Step 6: Test via Telegram**

Send to your bot:
```
חקרי לי טרנדים בנושא חרדת טיפוח אצל נערות
```
Expected: Bot responds with 1-3 trend insights in Hebrew with opportunities and content angles.

- [ ] **Step 7: Commit**

```bash
git add extensions/vaniblu/tools/researcher.ts extensions/vaniblu/index.ts extensions/vaniblu/tests/researcher.test.ts
git commit -m "feat: add vaniblu_researcher tool with web search + Claude synthesis"
```

---

## Task 5: creator_tool

**Files:**
- Create: `extensions/vaniblu/tools/creator.ts`
- Modify: `extensions/vaniblu/index.ts`
- Test: `extensions/vaniblu/tests/creator.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
// extensions/vaniblu/tests/creator.test.ts
import { describe, it, expect, vi } from "vitest";

vi.mock("../lib/anthropic-client.js", () => ({
  MODEL: "claude-sonnet-4-6",
  anthropic: {
    messages: {
      create: vi.fn().mockResolvedValue({
        content: [{
          type: "text",
          text: JSON.stringify({
            post_text: "לכל אמא שתוהה מה הבת שלה צריכה — הגוף בגיל ההתבגרות משתנה, והעור צריך תשומת לב פשוטה, לא מסובכת.",
            hook: "לכל אמא שתוהה",
            cta: "רוצה לדעת עוד? הצטרפי לניוזלטר שלנו",
            platform: "facebook",
            angle: "emotional",
            visual_prompt: "A warm photo of a mother and teenage daughter looking at skincare products together, natural light, soft colors, no text",
            variants: ["גרסה קצרה: הבת שלך בגיל 14 — היא לא צריכה 12 מוצרים. היא צריכה 3."]
          })
        }]
      })
    }
  }
}));

import { createPost } from "../tools/creator.js";

describe("createPost", () => {
  it("returns a valid PostDraft with all required fields", async () => {
    const draft = await createPost({ topic: "טיפוח בסיסי לנערות", angle: "emotional" });

    expect(draft).toMatchObject({
      post_text: expect.any(String),
      hook: expect.any(String),
      cta: expect.any(String),
      platform: "facebook",
      angle: expect.any(String),
      visual_prompt: expect.any(String),
      variants: expect.arrayContaining([expect.any(String)]),
    });
  });

  it("passes trend_context to the prompt when provided", async () => {
    const { anthropic } = await import("../lib/anthropic-client.js");
    const draft = await createPost({
      topic: "שגרת טיפוח מינימליסטית",
      angle: "education",
      trend_context: "טרנד הטיפוח המינימליסטי עולה ב-TikTok"
    });

    expect(anthropic.messages.create).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: expect.arrayContaining([
          expect.objectContaining({
            content: expect.stringContaining("טרנד הטיפוח המינימליסטי")
          })
        ])
      })
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd extensions/vaniblu && npm test -- tests/creator.test.ts
```
Expected: FAIL — `Cannot find module '../tools/creator.js'`

- [ ] **Step 3: Implement creator.ts**

```typescript
// extensions/vaniblu/tools/creator.ts
import { anthropic, MODEL } from "../lib/anthropic-client.js";
import { getBrandBrain } from "../lib/brand-brain.js";
import type { PostDraft, ToolResult } from "../lib/types.js";

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
  return JSON.parse(raw) as PostDraft;
}

export async function creatorToolExecute(
  topic: string,
  angle: string,
  trend_context?: string
): Promise<ToolResult> {
  const draft = await createPost({ topic, angle, trend_context });

  const formatted =
    `📝 **טיוטת פוסט**\n\n` +
    `${draft.post_text}\n\n` +
    `---\n` +
    `**CTA:** ${draft.cta}\n` +
    `**זווית:** ${draft.angle}\n` +
    `**Visual prompt:** ${draft.visual_prompt}`;

  return { content: [{ type: "text", text: formatted }] };
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd extensions/vaniblu && npm test -- tests/creator.test.ts
```
Expected: 2 tests pass.

- [ ] **Step 5: Add creator_tool to index.ts**

Replace the full contents of `extensions/vaniblu/index.ts`:

```typescript
// extensions/vaniblu/index.ts
import { definePluginEntry } from "@openclaw/sdk/plugin";
import { Type } from "@sinclair/typebox";
import { createPluginRuntimeStore } from "@openclaw/sdk/runtime";
import { researcherToolExecute } from "./tools/researcher.js";
import { creatorToolExecute } from "./tools/creator.js";

export const runtimeStore = createPluginRuntimeStore();

export default definePluginEntry({
  name: "vaniblu-social-agent",
  register(api) {
    runtimeStore.set(api.runtime);

    api.registerTool({
      name: "vaniblu_researcher",
      description: "מחקר טרנדים ברשתות חברתיות רלוונטיים למותג VaniBlu. קרא לכלי זה לפני יצירת תוכן.",
      parameters: Type.Object({
        topic: Type.String({ description: "נושא המחקר בעברית" }),
      }),
      async execute(_id, params) {
        const runtime = runtimeStore.get();
        return researcherToolExecute(params.topic, runtime.webSearch.search.bind(runtime.webSearch));
      },
    });

    api.registerTool({
      name: "vaniblu_creator",
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
      async execute(_id, params) {
        return creatorToolExecute(params.topic, params.angle, params.trend_context);
      },
    });
  },
});
```

- [ ] **Step 6: Test via Telegram**

Send to your bot:
```
צרי לי פוסט על חרדת גיל ההתבגרות בזווית emotional
```
Expected: Bot returns a full Hebrew post with visual_prompt in English.

- [ ] **Step 7: Commit**

```bash
git add extensions/vaniblu/tools/creator.ts extensions/vaniblu/index.ts extensions/vaniblu/tests/creator.test.ts
git commit -m "feat: add vaniblu_creator tool"
```

---

## Task 6: critic_tool

**Files:**
- Create: `extensions/vaniblu/tools/critic.ts`
- Modify: `extensions/vaniblu/index.ts`
- Test: `extensions/vaniblu/tests/critic.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
// extensions/vaniblu/tests/critic.test.ts
import { describe, it, expect, vi } from "vitest";

vi.mock("../lib/anthropic-client.js", () => ({
  MODEL: "claude-sonnet-4-6",
  anthropic: {
    messages: {
      create: vi.fn().mockResolvedValue({
        content: [{
          type: "text",
          text: JSON.stringify({
            score: 8,
            issues: ["ה-CTA יכול להיות חזק יותר"],
            improvements: ["הוסיפי urgency לCTA", "הקצרי את הפסקה השנייה"],
            final_verdict: "approve"
          })
        }]
      })
    }
  }
}));

import { critiquePost } from "../tools/critic.js";

describe("critiquePost", () => {
  it("returns a CritiqueResult with score 0-10", async () => {
    const result = await critiquePost({
      post_text: "פוסט לדוגמה על טיפוח עור",
      cta: "הצטרפי לניוזלטר",
      angle: "emotional"
    });

    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(10);
    expect(["approve", "revise"]).toContain(result.final_verdict);
    expect(Array.isArray(result.issues)).toBe(true);
    expect(Array.isArray(result.improvements)).toBe(true);
  });

  it("approve verdict has score >= 7", async () => {
    const result = await critiquePost({
      post_text: "פוסט טוב",
      cta: "הצטרפי אלינו",
      angle: "education"
    });
    if (result.final_verdict === "approve") {
      expect(result.score).toBeGreaterThanOrEqual(7);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd extensions/vaniblu && npm test -- tests/critic.test.ts
```
Expected: FAIL — `Cannot find module '../tools/critic.js'`

- [ ] **Step 3: Implement critic.ts**

```typescript
// extensions/vaniblu/tools/critic.ts
import { anthropic, MODEL } from "../lib/anthropic-client.js";
import { getBrandBrain } from "../lib/brand-brain.js";
import type { CritiqueResult, ToolResult } from "../lib/types.js";

interface CritiqueParams {
  post_text: string;
  cta: string;
  angle: string;
}

export async function critiquePost(params: CritiqueParams): Promise<CritiqueResult> {
  const brain = getBrandBrain();

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

  const raw = message.content[0].type === "text" ? message.content[0].text : "{}";
  return JSON.parse(raw) as CritiqueResult;
}

export async function criticToolExecute(
  post_text: string,
  cta: string,
  angle: string
): Promise<ToolResult> {
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

  return { content: [{ type: "text", text: formatted }] };
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd extensions/vaniblu && npm test -- tests/critic.test.ts
```
Expected: 2 tests pass.

- [ ] **Step 5: Add critic_tool to index.ts**

Replace full contents of `extensions/vaniblu/index.ts`:

```typescript
// extensions/vaniblu/index.ts
import { definePluginEntry } from "@openclaw/sdk/plugin";
import { Type } from "@sinclair/typebox";
import { createPluginRuntimeStore } from "@openclaw/sdk/runtime";
import { researcherToolExecute } from "./tools/researcher.js";
import { creatorToolExecute } from "./tools/creator.js";
import { criticToolExecute } from "./tools/critic.js";

export const runtimeStore = createPluginRuntimeStore();

export default definePluginEntry({
  name: "vaniblu-social-agent",
  register(api) {
    runtimeStore.set(api.runtime);

    api.registerTool({
      name: "vaniblu_researcher",
      description: "מחקר טרנדים ברשתות חברתיות רלוונטיים למותג VaniBlu. קרא לכלי זה לפני יצירת תוכן.",
      parameters: Type.Object({
        topic: Type.String({ description: "נושא המחקר בעברית" }),
      }),
      async execute(_id, params) {
        const runtime = runtimeStore.get();
        return researcherToolExecute(params.topic, runtime.webSearch.search.bind(runtime.webSearch));
      },
    });

    api.registerTool({
      name: "vaniblu_creator",
      description: "יצירת פוסט פייסבוק מלא למותג VaniBlu. תמיד קרא ל-vaniblu_critic אחריו.",
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
      async execute(_id, params) {
        return creatorToolExecute(params.topic, params.angle, params.trend_context);
      },
    });

    api.registerTool({
      name: "vaniblu_critic",
      description: "ביקורת פוסט VaniBlu — בודק קרינג', אמינות, התאמה לקהל, וסיכוי conversion. תמיד קרא לכלי זה אחרי vaniblu_creator.",
      parameters: Type.Object({
        post_text: Type.String({ description: "טקסט הפוסט המלא" }),
        cta: Type.String({ description: "ה-CTA של הפוסט" }),
        angle: Type.String({ description: "זווית הפוסט" }),
      }),
      async execute(_id, params) {
        return criticToolExecute(params.post_text, params.cta, params.angle);
      },
    });
  },
});
```

- [ ] **Step 6: Test full creator→critic pipeline via Telegram**

Send:
```
צרי פוסט על יתרונות שגרת טיפוח פשוטה, ובקרי אותו
```
Expected: Bot creates post, then critiques it with score and improvements.

- [ ] **Step 7: Commit**

```bash
git add extensions/vaniblu/tools/critic.ts extensions/vaniblu/index.ts extensions/vaniblu/tests/critic.test.ts
git commit -m "feat: add vaniblu_critic tool"
```

---

## Task 7: image_tool (Imagen 3 via Google AI Studio)

**Files:**
- Create: `extensions/vaniblu/tools/image.ts`
- Modify: `extensions/vaniblu/index.ts`
- Test: `extensions/vaniblu/tests/image.test.ts`

- [ ] **Step 1: Get Google AI Studio API key**

1. Go to aistudio.google.com
2. Click "Get API Key" → "Create API Key"
3. Add to shell profile: `export GOOGLE_AI_STUDIO_KEY="AIza..."`
4. Reload: `source ~/.zshrc`

- [ ] **Step 2: Write failing test**

```typescript
// extensions/vaniblu/tests/image.test.ts
import { describe, it, expect, vi } from "vitest";

vi.mock("@google/genai", () => ({
  GoogleGenAI: vi.fn().mockImplementation(() => ({
    models: {
      generateImages: vi.fn().mockResolvedValue({
        generatedImages: [{
          image: { imageBytes: Buffer.from("fake-image-bytes").toString("base64") }
        }]
      })
    }
  }))
}));

import { generateImage } from "../tools/image.js";

describe("generateImage", () => {
  it("returns base64 image data for a valid prompt", async () => {
    const result = await generateImage("A warm mother-daughter skincare moment, natural light");
    expect(result.data).toBeTruthy();
    expect(result.mediaType).toBe("image/png");
  });

  it("throws when prompt is empty", async () => {
    await expect(generateImage("")).rejects.toThrow("Visual prompt cannot be empty");
  });

  it("throws when no image is returned", async () => {
    const { GoogleGenAI } = await import("@google/genai");
    vi.mocked(GoogleGenAI).mockImplementationOnce(() => ({
      models: { generateImages: vi.fn().mockResolvedValue({ generatedImages: [] }) }
    }) as any);

    await expect(generateImage("valid prompt")).rejects.toThrow("No image returned from Imagen 3");
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

```bash
cd extensions/vaniblu && npm test -- tests/image.test.ts
```
Expected: FAIL — `Cannot find module '../tools/image.js'`

- [ ] **Step 4: Implement image.ts**

```typescript
// extensions/vaniblu/tools/image.ts
import { GoogleGenAI } from "@google/genai";
import type { ToolResult } from "../lib/types.js";

if (!process.env.GOOGLE_AI_STUDIO_KEY) {
  throw new Error("GOOGLE_AI_STUDIO_KEY environment variable is required");
}

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_STUDIO_KEY });

interface ImageResult {
  data: string;
  mediaType: string;
}

export async function generateImage(visualPrompt: string): Promise<ImageResult> {
  if (!visualPrompt.trim()) {
    throw new Error("Visual prompt cannot be empty");
  }

  const response = await ai.models.generateImages({
    model: "imagen-3.0-generate-002",
    prompt: visualPrompt,
    config: { numberOfImages: 1, outputMimeType: "image/png" },
  });

  const imageBytes = response.generatedImages?.[0]?.image?.imageBytes;
  if (!imageBytes) {
    throw new Error("No image returned from Imagen 3");
  }

  return { data: imageBytes, mediaType: "image/png" };
}

export async function imageToolExecute(visualPrompt: string): Promise<ToolResult> {
  const { data, mediaType } = await generateImage(visualPrompt);
  return { content: [{ type: "image", data, mediaType }] };
}
```

- [ ] **Step 5: Run test to verify it passes**

```bash
cd extensions/vaniblu && npm test -- tests/image.test.ts
```
Expected: 3 tests pass.

- [ ] **Step 6: Add image_tool to index.ts — final complete version**

Replace full contents of `extensions/vaniblu/index.ts`:

```typescript
// extensions/vaniblu/index.ts
import { definePluginEntry } from "@openclaw/sdk/plugin";
import { Type } from "@sinclair/typebox";
import { createPluginRuntimeStore } from "@openclaw/sdk/runtime";
import { researcherToolExecute } from "./tools/researcher.js";
import { creatorToolExecute } from "./tools/creator.js";
import { criticToolExecute } from "./tools/critic.js";
import { imageToolExecute } from "./tools/image.js";

export const runtimeStore = createPluginRuntimeStore();

export default definePluginEntry({
  name: "vaniblu-social-agent",
  register(api) {
    runtimeStore.set(api.runtime);

    api.registerTool({
      name: "vaniblu_researcher",
      description: "מחקר טרנדים ברשתות חברתיות רלוונטיים למותג VaniBlu. קרא לכלי זה לפני יצירת תוכן.",
      parameters: Type.Object({
        topic: Type.String({ description: "נושא המחקר בעברית" }),
      }),
      async execute(_id, params) {
        const runtime = runtimeStore.get();
        return researcherToolExecute(params.topic, runtime.webSearch.search.bind(runtime.webSearch));
      },
    });

    api.registerTool({
      name: "vaniblu_creator",
      description: "יצירת פוסט פייסבוק מלא למותג VaniBlu. תמיד קרא ל-vaniblu_critic אחריו, ואז ל-vaniblu_image.",
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
      async execute(_id, params) {
        return creatorToolExecute(params.topic, params.angle, params.trend_context);
      },
    });

    api.registerTool({
      name: "vaniblu_critic",
      description: "ביקורת פוסט VaniBlu — בודק קרינג', אמינות, התאמה לקהל, וסיכוי conversion. תמיד קרא לכלי זה אחרי vaniblu_creator.",
      parameters: Type.Object({
        post_text: Type.String({ description: "טקסט הפוסט המלא" }),
        cta: Type.String({ description: "ה-CTA של הפוסט" }),
        angle: Type.String({ description: "זווית הפוסט" }),
      }),
      async execute(_id, params) {
        return criticToolExecute(params.post_text, params.cta, params.angle);
      },
    });

    api.registerTool({
      name: "vaniblu_image",
      description: "יצירת תמונה לפוסט VaniBlu דרך Imagen 3. קרא לכלי זה עם ה-visual_prompt שמגיע מvaniblu_creator.",
      parameters: Type.Object({
        visual_prompt: Type.String({ description: "תיאור התמונה באנגלית (מגיע מvaniblu_creator)" }),
      }),
      async execute(_id, params) {
        return imageToolExecute(params.visual_prompt);
      },
    });
  },
});
```

- [ ] **Step 7: Run all tests**

```bash
cd extensions/vaniblu && npm test
```
Expected: All 9 tests pass (2 brand-brain + 2 researcher + 2 creator + 2 critic + 3 image).

- [ ] **Step 8: Test full pipeline via Telegram**

Send:
```
חקרי טרנד בנושא לחץ עם טיפוח, צרי פוסט emotional, בקרי אותו, וצרי תמונה
```
Expected: Bot runs the full pipeline — research → post → critique → image — and sends all results to Telegram.

- [ ] **Step 9: Commit**

```bash
git add extensions/vaniblu/tools/image.ts extensions/vaniblu/index.ts extensions/vaniblu/tests/image.test.ts
git commit -m "feat: add vaniblu_image tool with Imagen 3 — MVP complete"
```

---

## Self-Review Checklist

- [x] **Spec §4 Architecture (5 tools):** researcher ✅, creator ✅, critic ✅, image ✅ — strategist deferred to Week 3 plan
- [x] **Spec §2 KPIs:** brand_brain.json has KPI priorities, critic checks conversion, CTA hardcoded to email
- [x] **Spec §3 Brand Personality:** full brand context in brand_brain.json, used in all system prompts
- [x] **Spec §6 UX Flow:** Telegram pipeline tested in Step 8 of each task
- [x] **Spec §7 Memory:** OpenClaw's built-in conversational memory handles session context automatically
- [x] **Spec §10 Cadence (5-15/week):** noted in brand_brain.json; enforced by human review, not code
- [x] **Spec §14 Permissions (drafts only):** no auto-publish code exists — all output is drafts
- [x] **Type consistency:** `ToolResult`, `PostDraft`, `CritiqueResult`, `TrendInsight` defined once in types.ts and used everywhere
- [x] **No placeholders:** all code blocks are complete
