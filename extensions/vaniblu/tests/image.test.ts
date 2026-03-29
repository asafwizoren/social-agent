// extensions/vaniblu/tests/image.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

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

// Set env var before importing (module-level guard check)
process.env.GOOGLE_AI_STUDIO_KEY = "test-key";

import { generateImage } from "../tools/image.js";
import { GoogleGenAI } from "@google/genai";

beforeEach(() => {
  vi.clearAllMocks();
  // Re-apply mock for each test
  vi.mocked(GoogleGenAI).mockImplementation(() => ({
    models: {
      generateImages: vi.fn().mockResolvedValue({
        generatedImages: [{
          image: { imageBytes: Buffer.from("fake-image-bytes").toString("base64") }
        }]
      })
    }
  }) as any);
});

describe("generateImage", () => {
  it("returns base64 image data for a valid prompt", async () => {
    const result = await generateImage("A warm mother-daughter skincare moment, natural light");
    expect(result.data).toBeTruthy();
    expect(result.mimeType).toBe("image/png");
  });

  it("throws when prompt is empty", async () => {
    await expect(generateImage("")).rejects.toThrow("Visual prompt cannot be empty");
  });

  it("throws when no image is returned", async () => {
    vi.mocked(GoogleGenAI).mockImplementationOnce(() => ({
      models: { generateImages: vi.fn().mockResolvedValue({ generatedImages: [] }) }
    }) as any);

    await expect(generateImage("valid prompt")).rejects.toThrow("No image returned from Imagen 3");
  });
});
