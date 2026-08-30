import { describe, expect, it } from "vitest";
import { describeOtherPages } from "./pageNotice";
import type { Region } from "./types";

function region(page: number): Region {
  return { page, ymin: 0.1, xmin: 0.1, ymax: 0.2, xmax: 0.9 };
}

describe("describeOtherPages", () => {
  it("says nothing when the whole answer is on this page", () => {
    expect(describeOtherPages([region(3)], 3)).toBeNull();
  });

  it("says nothing when no answer is selected", () => {
    expect(describeOtherPages([], 3)).toBeNull();
  });

  it("says the answer continues when part of it is on this page", () => {
    const notice = describeOtherPages([region(3), region(4)], 3);
    expect(notice?.lead).toBe("This answer continues on");
    expect(notice?.pages).toEqual([5]);
  });

  it("says the answer is elsewhere when none of it is on this page", () => {
    const notice = describeOtherPages([region(5)], 6);
    expect(notice?.lead).toBe("This answer is not on this page. It is on");
    expect(notice?.pages).toEqual([6]);
  });

  it("lists every other page once, in order", () => {
    const notice = describeOtherPages(
      [region(4), region(2), region(4), region(6)],
      0,
    );
    expect(notice?.pages).toEqual([5, 3, 7]);
  });
});
