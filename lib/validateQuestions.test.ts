import { describe, expect, it } from "vitest";
import { validateQuestions } from "./validateQuestions";
import type { Question } from "./types";

function makeQuestion(
  id: string,
  number: number,
  subpart: string | null,
  order: number,
): Question {
  return { id, number, subpart, order, text: "q", context: null, maxMarks: null };
}

describe("validateQuestions", () => {
  it("reports no problems for a clean sequence", () => {
    const questions = [
      makeQuestion("1", 1, null, 0),
      makeQuestion("2", 2, null, 1),
      makeQuestion("3", 3, null, 2),
    ];
    const result = validateQuestions(questions);
    expect(result.gaps).toEqual([]);
    expect(result.duplicates).toEqual([]);
  });

  it("reports a missing number as a gap", () => {
    const questions = [
      makeQuestion("1", 1, null, 0),
      makeQuestion("2", 2, null, 1),
      makeQuestion("4", 4, null, 2),
    ];
    const result = validateQuestions(questions);
    expect(result.gaps).toEqual([3]);
  });

  it("does not treat sub-parts of one number as duplicates", () => {
    const questions = [
      makeQuestion("11a", 11, "a", 0),
      makeQuestion("11b", 11, "b", 1),
    ];
    const result = validateQuestions(questions);
    expect(result.duplicates).toEqual([]);
    expect(result.gaps).toEqual([]);
  });

  it("reports a repeated id as a duplicate", () => {
    const questions = [
      makeQuestion("11a", 11, "a", 0),
      makeQuestion("11a", 11, "a", 1),
    ];
    const result = validateQuestions(questions);
    expect(result.duplicates).toEqual(["11a"]);
  });

  it("returns nothing for an empty paper", () => {
    const result = validateQuestions([]);
    expect(result.gaps).toEqual([]);
    expect(result.duplicates).toEqual([]);
  });
});
