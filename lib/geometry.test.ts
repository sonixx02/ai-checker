import { describe, expect, it } from "vitest";
import {
  boxToRegion,
  normalizeBox,
  padRegion,
  regionToPercentStyle,
} from "./geometry";

describe("boxToRegion", () => {
  it("converts Gemini 0-1000 ymin,xmin,ymax,xmax into fractions", () => {
    const region = boxToRegion([100, 250, 300, 750], 2);
    expect(region.page).toBe(2);
    expect(region.ymin).toBeCloseTo(0.1);
    expect(region.xmin).toBeCloseTo(0.25);
    expect(region.ymax).toBeCloseTo(0.3);
    expect(region.xmax).toBeCloseTo(0.75);
  });

  it("swaps reversed coordinates so the box is never inside out", () => {
    const region = boxToRegion([300, 750, 100, 250], 0);
    expect(region.ymin).toBeCloseTo(0.1);
    expect(region.ymax).toBeCloseTo(0.3);
    expect(region.xmin).toBeCloseTo(0.25);
    expect(region.xmax).toBeCloseTo(0.75);
  });
});

describe("padRegion", () => {
  it("grows the box on every side", () => {
    const region = padRegion(
      { page: 0, ymin: 0.4, xmin: 0.4, ymax: 0.6, xmax: 0.6 },
      0.02,
    );
    expect(region.ymin).toBeCloseTo(0.38);
    expect(region.xmax).toBeCloseTo(0.62);
  });

  it("never grows outside the page", () => {
    const region = padRegion(
      { page: 0, ymin: 0.01, xmin: 0.01, ymax: 0.99, xmax: 0.99 },
      0.05,
    );
    expect(region.ymin).toBe(0);
    expect(region.xmax).toBe(1);
  });
});

describe("regionToPercentStyle", () => {
  it("produces CSS percentages so zoom needs no recalculation", () => {
    const style = regionToPercentStyle({
      page: 0,
      ymin: 0.1,
      xmin: 0.2,
      ymax: 0.5,
      xmax: 0.6,
    });
    expect(style.top).toBe("10%");
    expect(style.left).toBe("20%");
    expect(style.height).toBe("40%");
    expect(style.width).toBe("40%");
  });
});

describe("normalizeBox", () => {
  it("passes a flat four-number box through", () => {
    expect(normalizeBox([10, 20, 30, 40])).toEqual([10, 20, 30, 40]);
  });

  it("unwraps a box the model nested one level deep", () => {
    expect(normalizeBox([[10, 20, 30, 40]])).toEqual([10, 20, 30, 40]);
  });

  it("coerces numeric strings", () => {
    expect(normalizeBox(["10", "20", "30", "40"])).toEqual([10, 20, 30, 40]);
  });

  it("returns null for anything else", () => {
    expect(normalizeBox([1, 2, 3])).toBeNull();
    expect(normalizeBox("nope")).toBeNull();
    expect(normalizeBox(null)).toBeNull();
  });
});

describe("normalizeBox with model output variants", () => {
  it("takes the first box when the model returns a list of boxes", () => {
    const repeated = [
      [620, 105, 847, 915],
      [620, 105, 847, 915],
      [620, 105, 847, 915],
    ];
    expect(normalizeBox(repeated)).toEqual([620, 105, 847, 915]);
  });

  it("takes the first valid box when a list has junk in it", () => {
    expect(normalizeBox([[1, 2, 3], [10, 20, 30, 40]])).toEqual([10, 20, 30, 40]);
  });

  it("still returns null when a list contains no valid box", () => {
    expect(normalizeBox([[1, 2], [3]])).toBeNull();
  });
});
