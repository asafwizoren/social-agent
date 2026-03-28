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
