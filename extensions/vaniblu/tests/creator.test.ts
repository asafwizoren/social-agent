// extensions/vaniblu/tests/creator.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import type Anthropic from "@anthropic-ai/sdk";

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
      } as Anthropic.Message),
    }
  }
}));

beforeEach(() => {
  vi.clearAllMocks();
});

import { createPost } from "../tools/creator.js";
import { anthropic } from "../lib/anthropic-client.js";

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
    await createPost({
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
