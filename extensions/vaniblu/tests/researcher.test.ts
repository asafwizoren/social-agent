// extensions/vaniblu/tests/researcher.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

// vi.mock is hoisted — intercepts the static import in researcher.ts
vi.mock("../lib/anthropic-client.js", () => ({
  MODEL: "claude-sonnet-4-6",
  anthropic: {
    messages: {
      create: vi.fn(),
    },
  },
}));

import { researchTrends } from "../tools/researcher.js";
import { anthropic } from "../lib/anthropic-client.js";

const mockSearch = vi.fn();
const mockCreate = vi.mocked(anthropic.messages.create);

beforeEach(() => {
  mockSearch.mockReset();
  mockCreate.mockReset();
});

describe("researchTrends", () => {
  it("returns structured trend insights for a topic", async () => {
    mockSearch.mockResolvedValue({
      results: [
        { title: "Teen skincare anxiety on TikTok", snippet: "Teens are overwhelmed by complex routines...", url: "https://example.com/1" },
        { title: "Simple skincare for teens 2026", snippet: "Dermatologists recommend minimal routines...", url: "https://example.com/2" },
      ]
    });

    mockCreate.mockResolvedValue({
      content: [{ type: "text", text: JSON.stringify([{
        trend: "חרדת שגרת טיפוח אצל נערות",
        relevance_to_brand: "גבוהה — VaniBlu מציעה פתרון פשוט",
        risk_level: "low",
        opportunity: "סדרת פוסטים להורדת לחץ",
        content_angles: ["חינוכי", "רגשי", "אמא-בת"]
      }]) }]
    } as any);

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
