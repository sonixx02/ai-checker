import { describe, expect, it } from "vitest";
import { collapseSubpartStems, type RawQuestion } from "./normalizeQuestions";

function raw(
  number: number,
  subpart: string | null,
  text: string,
  maxMarks: number | null,
): RawQuestion {
  return { number, subpart, text, maxMarks };
}

describe("collapseSubpartStems", () => {
  it("drops a stem row that has sub-part siblings", () => {
    const input = [
      raw(11, null, "A diagram shows two potted plants.", null),
      raw(11, "a", "Account for the colour difference.", 2),
      raw(11, "b", "Suggest a measure to help Plant B.", 3),
    ];
    const result = collapseSubpartStems(input);
    expect(result).toHaveLength(2);
    expect(result.map((q) => q.id)).toEqual(["11a", "11b"]);
  });

  it("keeps the stem text as context on each sub-part", () => {
    const input = [
      raw(11, null, "A diagram shows two potted plants.", null),
      raw(11, "a", "Account for the colour difference.", 2),
      raw(11, "b", "Suggest a measure to help Plant B.", 3),
    ];
    const result = collapseSubpartStems(input);
    expect(result[0].context).toBe("A diagram shows two potted plants.");
    expect(result[1].context).toBe("A diagram shows two potted plants.");
  });

  it("leaves a plain question untouched", () => {
    const result = collapseSubpartStems([raw(1, null, "Name the organelle.", 2)]);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("1");
    expect(result[0].context).toBeNull();
  });

  it("keeps a numbered question that has marks even if sub-parts follow", () => {
    const input = [
      raw(5, null, "Define osmosis.", 2),
      raw(5, "a", "Give an example.", 1),
    ];
    const result = collapseSubpartStems(input);
    expect(result.map((q) => q.id)).toEqual(["5", "5a"]);
  });

  it("assigns printed order after collapsing", () => {
    const input = [
      raw(1, null, "First.", 2),
      raw(11, null, "Stem.", null),
      raw(11, "a", "Part a.", 2),
      raw(12, null, "Last.", 3),
    ];
    const result = collapseSubpartStems(input);
    expect(result.map((q) => q.order)).toEqual([0, 1, 2]);
    expect(result.map((q) => q.id)).toEqual(["1", "11a", "12"]);
  });
});
