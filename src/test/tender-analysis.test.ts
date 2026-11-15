import { describe, expect, it } from "vitest";

import { parseTenderResponse } from "@/lib/services/tenderAnalysis";

describe("parseTenderResponse", () => {
  it("accepts a complete JSON response wrapped in a code fence", () => {
    const response = {
      summary: "One tender requirement was identified.",
      requirements: [],
      deadlines: [],
      specifications: [],
      risks: [],
      missing: [],
      inconsistencies: [],
    };

    expect(parseTenderResponse(`\`\`\`json\n${JSON.stringify(response)}\n\`\`\``)).toEqual(
      response,
    );
  });

  it("surfaces malformed or incomplete model output", () => {
    expect(() => parseTenderResponse("not JSON")).toThrow(
      "The AI response could not be parsed as structured analysis",
    );
    expect(() => parseTenderResponse('{"summary":"incomplete"}')).toThrow(
      "The AI response did not match the required analysis format",
    );
  });
});
