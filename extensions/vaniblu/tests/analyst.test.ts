// extensions/vaniblu/tests/analyst.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchAccountStats, fetchRecentPosts, analystToolExecute } from "../tools/analyst.js";

const MOCK_TOKEN = "test-token";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function mockGraphResponse(data: unknown) {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => data,
  } as Response);
}

function mockGraphError(status: number, body: string) {
  mockFetch.mockResolvedValueOnce({
    ok: false,
    status,
    text: async () => body,
  } as unknown as Response);
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.INSTAGRAM_API_KEY = MOCK_TOKEN;
});

afterEach(() => {
  delete process.env.INSTAGRAM_API_KEY;
});

describe("fetchAccountStats", () => {
  it("returns username, followers_count, media_count", async () => {
    mockGraphResponse({ username: "nitzanwizman", followers_count: 828, media_count: 617 });

    const stats = await fetchAccountStats(MOCK_TOKEN);

    expect(stats).toEqual({ username: "nitzanwizman", followers_count: 828, media_count: 617 });
  });

  it("throws on API error", async () => {
    mockGraphError(400, '{"error":"invalid token"}');

    await expect(fetchAccountStats(MOCK_TOKEN)).rejects.toThrow("Graph API error 400");
  });
});

describe("fetchRecentPosts", () => {
  it("returns posts with like_count and comments_count", async () => {
    // media list
    mockGraphResponse({
      data: [
        { id: "1", caption: "פוסט ראשון", media_type: "IMAGE", like_count: 31, comments_count: 13, timestamp: "2026-03-21T10:00:00Z" },
        { id: "2", caption: "פוסט שני", media_type: "IMAGE", like_count: 4, comments_count: 2, timestamp: "2026-03-26T10:00:00Z" },
      ]
    });
    // insights for post 1
    mockGraphResponse({ data: [{ name: "reach", values: [{ value: 200 }] }, { name: "impressions", values: [{ value: 250 }] }] });
    // insights for post 2
    mockGraphResponse({ data: [{ name: "reach", values: [{ value: 80 }] }, { name: "impressions", values: [{ value: 90 }] }] });

    const posts = await fetchRecentPosts(MOCK_TOKEN, 10);

    expect(posts).toHaveLength(2);
    expect(posts[0]).toMatchObject({ id: "1", like_count: 31, reach: 200, impressions: 250 });
    expect(posts[1]).toMatchObject({ id: "2", like_count: 4, reach: 80 });
  });

  it("skips per-post insights gracefully when unavailable", async () => {
    mockGraphResponse({
      data: [
        { id: "3", caption: "פוסט", media_type: "VIDEO", like_count: 5, comments_count: 1, timestamp: "2026-03-20T10:00:00Z" },
      ]
    });
    // insights call fails
    mockGraphError(400, '{"error":"insights unavailable"}');

    const posts = await fetchRecentPosts(MOCK_TOKEN, 5);

    expect(posts).toHaveLength(1);
    expect(posts[0].reach).toBeUndefined();
  });
});

describe("analystToolExecute", () => {
  it("returns formatted Hebrew summary with account and post data", async () => {
    mockGraphResponse({ username: "nitzanwizman", followers_count: 828, media_count: 617 });
    mockGraphResponse({
      data: [
        { id: "1", caption: "פוסט", media_type: "IMAGE", like_count: 31, comments_count: 13, timestamp: "2026-03-21T10:00:00Z" },
      ]
    });
    mockGraphResponse({ data: [] }); // insights

    const result = await analystToolExecute(10);

    expect(result.content[0].type).toBe("text");
    expect(result.content[0].text).toContain("nitzanwizman");
    expect(result.content[0].text).toContain("828");
    expect((result.details as { account?: unknown }).account).toBeDefined();
  });

  it("returns Hebrew error when INSTAGRAM_API_KEY is missing", async () => {
    delete process.env.INSTAGRAM_API_KEY;

    const result = await analystToolExecute(10);

    expect(result.content[0].text).toContain("INSTAGRAM_API_KEY");
  });

  it("returns Hebrew error message on API failure", async () => {
    mockGraphError(401, '{"error":"unauthorized"}');

    const result = await analystToolExecute(10);

    expect(result.content[0].text).toContain("שגיאה");
  });
});
