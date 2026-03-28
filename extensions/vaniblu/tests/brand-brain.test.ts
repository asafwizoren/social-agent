import { describe, it, expect } from "vitest";
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
