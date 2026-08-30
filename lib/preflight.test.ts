import { describe, expect, it } from "vitest";
import {
  checkAnswerBlocks,
  checkMatchQuality,
  checkQuestions,
  checkSameFile,
  pagesExceedFreeTier,
} from "./preflight";
import type { AnswerBlock, Question } from "./types";

function question(id: string, order: number): Question {
  return { id, number: order + 1, subpart: null, order, text: "q", context: null, maxMarks: 2 };
}

function block(id: string): AnswerBlock {
  return {
    id,
    writtenLabel: null,
    text: "a",
    regions: [{ page: 0, ymin: 0, xmin: 0, ymax: 0.1, xmax: 0.1 }],
    confidence: 0.9,
  };
}

describe("checkSameFile", () => {
  it("catches the same file uploaded twice", () => {
    const problem = checkSameFile(
      { name: "paper.pdf", size: 1024 },
      { name: "paper.pdf", size: 1024 },
    );
    expect(problem).not.toBeNull();
    expect(problem?.blame).toBe("both");
  });

  it("allows two genuinely different files", () => {
    expect(
      checkSameFile({ name: "paper.pdf", size: 1024 }, { name: "answers.pdf", size: 4096 }),
    ).toBeNull();
  });

  it("allows same name at a different size", () => {
    expect(
      checkSameFile({ name: "scan.pdf", size: 1024 }, { name: "scan.pdf", size: 9999 }),
    ).toBeNull();
  });
});

describe("checkQuestions", () => {
  it("blames the question paper when nothing was extracted", () => {
    const problem = checkQuestions([], "paper.pdf");
    expect(problem?.blame).toBe("question-paper");
    expect(problem?.detail).toContain("paper.pdf");
  });

  it("passes when questions were found", () => {
    expect(checkQuestions([question("1", 0)], "paper.pdf")).toBeNull();
  });
});

describe("checkAnswerBlocks", () => {
  it("blames the answer sheet when no handwriting was found", () => {
    const problem = checkAnswerBlocks([], "answers.pdf");
    expect(problem?.blame).toBe("answer-sheet");
    expect(problem?.detail).toContain("answers.pdf");
  });

  it("passes when blocks were found", () => {
    expect(checkAnswerBlocks([block("b1")], "answers.pdf")).toBeNull();
  });
});

describe("checkMatchQuality", () => {
  it("flags a total mismatch when nothing paired at all", () => {
    const problem = checkMatchQuality(
      [question("1", 0), question("2", 1)],
      [block("b1"), block("b2")],
      [],
    );
    expect(problem).not.toBeNull();
    expect(problem?.blame).toBe("both");
  });

  it("stays quiet when at least one answer paired", () => {
    const problem = checkMatchQuality(
      [question("1", 0), question("2", 1)],
      [block("b1"), block("b2")],
      [{ questionId: "1", blockIds: ["b1"], score: null, feedback: null }],
    );
    expect(problem).toBeNull();
  });

  it("stays quiet when there was nothing to pair", () => {
    expect(checkMatchQuality([question("1", 0)], [], [])).toBeNull();
  });
});

describe("pagesExceedFreeTier", () => {
  it("is fine for a small sheet", () => {
    expect(pagesExceedFreeTier(7)).toBe(false);
  });

  it("warns once the call count passes the per-minute allowance", () => {
    expect(pagesExceedFreeTier(12)).toBe(true);
  });
});
