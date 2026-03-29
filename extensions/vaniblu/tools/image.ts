// extensions/vaniblu/tools/image.ts
import { GoogleGenAI } from "@google/genai";
import type { ToolImageResult } from "../lib/types.js";

interface ImageResult {
  data: string;
  mimeType: string;
}

function getClient(): InstanceType<typeof GoogleGenAI> {
  const key = process.env.GOOGLE_AI_STUDIO_KEY;
  if (!key) {
    throw new Error("GOOGLE_AI_STUDIO_KEY environment variable is required");
  }
  return new GoogleGenAI({ apiKey: key });
}

export async function generateImage(visualPrompt: string): Promise<ImageResult> {
  if (!visualPrompt.trim()) {
    throw new Error("Visual prompt cannot be empty");
  }

  const ai = getClient();
  const response = await ai.models.generateImages({
    model: "imagen-3.0-generate-002",
    prompt: visualPrompt,
    config: { numberOfImages: 1, outputMimeType: "image/png" },
  });

  const imageBytes = response.generatedImages?.[0]?.image?.imageBytes;
  if (!imageBytes) {
    throw new Error("No image returned from Imagen 3");
  }

  return { data: imageBytes, mimeType: "image/png" };
}

export async function imageToolExecute(visualPrompt: string): Promise<ToolImageResult> {
  const { data, mimeType } = await generateImage(visualPrompt);
  return { content: [{ type: "image", data, mimeType }], details: {} };
}
