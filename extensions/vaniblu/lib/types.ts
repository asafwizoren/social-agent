import type { TextContent, ImageContent } from "@mariozechner/pi-ai";

export type { TextContent, ImageContent };

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

export type ToolTextResult = {
  content: [TextContent, ...TextContent[]];
  details: Record<string, unknown>;
};

export type ToolImageResult = {
  content: [ImageContent, ...ImageContent[]];
  details: Record<string, unknown>;
};
