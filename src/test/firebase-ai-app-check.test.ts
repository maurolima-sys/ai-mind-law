import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

// Structural test: verify that useLimitedUseAppCheckTokens: true is present
// in the firebaseAi.ts source. This is the guarantee that the production bundle
// will request limited-use App Check tokens, which is required for Firebase AI
// Logic replay protection. The browser integration test confirmed HTTP 200 with
// this setting; this test ensures the setting is not accidentally removed.
describe("Firebase AI App Check", () => {
  it("uses limited-use tokens for cloud and hybrid requests", () => {
    const source = readFileSync(join(process.cwd(), "src/lib/services/firebaseAi.ts"), "utf8");
    expect(source).toContain("useLimitedUseAppCheckTokens: true");
    // Confirm it is inside getAI() call, not in a comment
    const getAICallIndex = source.indexOf("getAI(app,");
    expect(getAICallIndex).toBeGreaterThan(-1);
    const afterGetAI = source.slice(getAICallIndex, getAICallIndex + 200);
    expect(afterGetAI).toContain("useLimitedUseAppCheckTokens: true");
  });
});
