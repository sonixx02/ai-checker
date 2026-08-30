import { describe, expect, it } from "vitest";
import { questionBadge, questionTag } from "./questionLabel";
import type { Question } from "./types";

function question(number: number, subpart: string | null): Question {
  const id = subpart === null ? `${number}` : `${number}${subpart}`;
  return { id, number, subpart, order: 0, text: "q", context: null, maxMarks: 2 };
}

describe("questionBadge", () => {
  it("shows a plain number for a whole question", () => {
    expect(questionBadge(question(5, null))).toBe("5");
  });

  it("shows the sub-part with the number", () => {
    expect(questionBadge(question(4, "a"))).toBe("4(a)");
    expect(questionBadge(question(4, "b"))).toBe("4(b)");
  });

  it("shows a marker when there is no question", () => {
    expect(questionBadge(null)).toBe("?");
  });
});

describe("questionTag", () => {
  it("prefixes the badge with Q", () => {
    expect(questionTag(question(5, null))).toBe("Q5");
  });

  it("keeps the sub-part so 4(a) and 4(b) never look the same", () => {
    expect(questionTag(question(4, "a"))).toBe("Q4(a)");
    expect(questionTag(question(4, "b"))).toBe("Q4(b)");
    expect(questionTag(question(4, "a"))).not.toBe(questionTag(question(4, "b")));
  });

  it("labels an answer with no question as unmatched", () => {
    expect(questionTag(null)).toBe("Unmatched");
  });
});
