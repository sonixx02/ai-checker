import { describe, expect, it } from "vitest";
import { answerPageLabel } from "./answerPages";
import type { AnswerBlock } from "./types";

function block(id: string, ...pages: number[]): AnswerBlock {
  return {
    id,
    writtenLabel: null,
    text: "a",
    regions: pages.map((page) => ({ page, ymin: 0, xmin: 0, ymax: 0.1, xmax: 0.1 })),
    confidence: 0.9,
  };
}

describe("answerPageLabel", () => {
  it("returns null when there is no answer", () => {
    expect(answerPageLabel([])).toBeNull();
  });

  it("names a single page", () => {
    expect(answerPageLabel([block("b1", 0)])).toBe("p. 1");
  });

  it("joins two consecutive pages with a dash", () => {
    expect(answerPageLabel([block("b1", 3), block("b2", 4)])).toBe("pp. 4-5");
  });

  it("lists non-consecutive pages with commas", () => {
    expect(answerPageLabel([block("b1", 0), block("b2", 5)])).toBe("pp. 1, 6");
  });

  it("collapses duplicate pages and sorts them", () => {
    expect(answerPageLabel([block("b1", 4, 4), block("b2", 1)])).toBe("pp. 2, 5");
  });
})
