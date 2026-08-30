import { describe, expect, it } from "vitest";
import { buildMappings, regionsForMapping, type JoinPair } from "./buildMappings";
import type { AnswerBlock, Question } from "./types";

function makeQuestion(id: string, order: number): Question {
  return { id, number: order + 1, subpart: null, order, text: "q", context: null, maxMarks: 2 };
}

function makeBlock(id: string, confidence: number): AnswerBlock {
  return {
    id,
    writtenLabel: null,
    text: "a",
    regions: [{ page: 0, ymin: 0, xmin: 0, ymax: 0.1, xmax: 0.1 }],
    confidence,
  };
}

function makePair(questionId: string, ...blockIds: string[]): JoinPair {
  return { questionId, blockIds, score: null, feedback: null };
}

const questions = [makeQuestion("1", 0), makeQuestion("2", 1), makeQuestion("3", 2)];

describe("buildMappings", () => {
  it("marks a paired question as matched and keeps its score", () => {
    const blocks = [makeBlock("b1", 0.9)];
    const pairs: JoinPair[] = [
      { questionId: "1", blockIds: ["b1"], score: { awarded: 2, max: 2 }, feedback: "good" },
    ];
    const mappings = buildMappings(questions, blocks, pairs, 0.5);
    const first = mappings.find((m) => m.questionId === "1");
    expect(first?.status).toBe("matched");
    expect(first?.score).toEqual({ awarded: 2, max: 2 });
    expect(first?.feedback).toBe("good");
  });

  it("marks questions with no block as unanswered", () => {
    const blocks = [makeBlock("b1", 0.9)];
    const mappings = buildMappings(questions, blocks, [makePair("1", "b1")], 0.5);
    const second = mappings.find((m) => m.questionId === "2");
    expect(second?.status).toBe("unanswered");
    expect(second?.blockIds).toEqual([]);
  });

  it("emits a row for a block that matches no question", () => {
    const blocks = [makeBlock("b1", 0.9), makeBlock("b9", 0.9)];
    const mappings = buildMappings(questions, blocks, [makePair("1", "b1")], 0.5);
    const orphan = mappings.find((m) => m.blockIds.includes("b9"));
    expect(orphan?.status).toBe("unmatched");
    expect(orphan?.questionId).toBeNull();
  });

  it("flags a matched pair whose block confidence is below the threshold", () => {
    const blocks = [makeBlock("b1", 0.2)];
    const mappings = buildMappings(questions, blocks, [makePair("1", "b1")], 0.5);
    expect(mappings.find((m) => m.questionId === "1")?.status).toBe("low-confidence");
  });

  it("ignores a pair naming a question that does not exist", () => {
    const blocks = [makeBlock("b1", 0.9)];
    const mappings = buildMappings(questions, blocks, [makePair("99", "b1")], 0.5);
    expect(mappings.some((m) => m.questionId === "99")).toBe(false);
    expect(mappings.find((m) => m.blockIds.includes("b1"))?.status).toBe("unmatched");
  });

  it("ignores a pair naming a block that does not exist", () => {
    const blocks = [makeBlock("b1", 0.9)];
    const mappings = buildMappings(questions, blocks, [makePair("1", "bZ")], 0.5);
    expect(mappings.find((m) => m.questionId === "1")?.status).toBe("unanswered");
  });

  it("gives one question every block named in its pair", () => {
    const blocks = [makeBlock("b1", 0.9), makeBlock("b2", 0.9)];
    const mappings = buildMappings(questions, blocks, [makePair("1", "b1", "b2")], 0.5);
    const first = mappings.find((m) => m.questionId === "1");
    expect(first?.blockIds).toEqual(["b1", "b2"]);
    expect(mappings.some((m) => m.status === "unmatched")).toBe(false);
  });

  it("ignores a second pair for a question already matched", () => {
    const blocks = [makeBlock("b1", 0.9), makeBlock("b2", 0.9)];
    const pairs = [makePair("1", "b1"), makePair("1", "b2")];
    const mappings = buildMappings(questions, blocks, pairs, 0.5);
    expect(mappings.filter((m) => m.questionId === "1")).toHaveLength(1);
    expect(mappings.find((m) => m.blockIds.includes("b2"))?.status).toBe("unmatched");
  });

  it("takes the lowest confidence across a multi-block answer", () => {
    const blocks = [makeBlock("b1", 0.95), makeBlock("b2", 0.2)];
    const mappings = buildMappings(questions, blocks, [makePair("1", "b1", "b2")], 0.5);
    expect(mappings.find((m) => m.questionId === "1")?.status).toBe("low-confidence");
  });

  it("refuses to give one block to two questions", () => {
    const blocks = [makeBlock("b1", 0.9)];
    const pairs = [makePair("1", "b1"), makePair("2", "b1")];
    const mappings = buildMappings(questions, blocks, pairs, 0.5);
    expect(mappings.find((m) => m.questionId === "1")?.blockIds).toEqual(["b1"]);
    expect(mappings.find((m) => m.questionId === "2")?.status).toBe("unanswered");
  });

  it("keeps questions in printed order regardless of pair order", () => {
    const blocks = [makeBlock("b1", 0.9), makeBlock("b3", 0.9)];
    const pairs = [makePair("3", "b3"), makePair("1", "b1")];
    const mappings = buildMappings(questions, blocks, pairs, 0.5);
    const questionIds = mappings
      .filter((m) => m.questionId !== null)
      .map((m) => m.questionId);
    expect(questionIds).toEqual(["1", "2", "3"]);
  });

  it("marks every question unanswered when nothing was extracted", () => {
    const mappings = buildMappings(questions, [], [], 0.5);
    expect(mappings).toHaveLength(3);
    for (const mapping of mappings) {
      expect(mapping.status).toBe("unanswered");
    }
  });
});

describe("regionsForMapping", () => {
  it("collects regions from every block, across pages", () => {
    const spanning: AnswerBlock[] = [
      {
        id: "b1",
        writtenLabel: "4b",
        text: "start of the answer",
        regions: [{ page: 3, ymin: 0.6, xmin: 0.1, ymax: 0.95, xmax: 0.9 }],
        confidence: 0.9,
      },
      {
        id: "b2",
        writtenLabel: null,
        text: "continued on the next page",
        regions: [{ page: 4, ymin: 0.1, xmin: 0.1, ymax: 0.4, xmax: 0.9 }],
        confidence: 0.9,
      },
    ];
    const blocksById = new Map(spanning.map((b) => [b.id, b]));
    const mappings = buildMappings(questions, spanning, [makePair("1", "b1", "b2")], 0.5);
    const first = mappings.find((m) => m.questionId === "1")!;

    const regions = regionsForMapping(first, blocksById);
    expect(regions).toHaveLength(2);
    expect(regions.map((r) => r.page)).toEqual([3, 4]);
  });
});
