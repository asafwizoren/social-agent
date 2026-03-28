// extensions/vaniblu/tests/critic.test.ts
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
            score: 8,
            issues: ["ה-CTA יכול להיות חזק יותר"],
            improvements: ["הוסיפי urgency לCTA", "הקצרי את הפסקה השנייה"],
            final_verdict: "approve"
          })
        }]
      } as Anthropic.Message),
    }
  }
}));

import { critiquePost } from "../tools/critic.js";

beforeEach(() => {
  vi.clearAllMocks();
});

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
