import { describe, expect, it } from "vitest";
import {
  cacheKey,
  evictOldest,
  isFresh,
  type CacheEntry,
} from "./resultCache";

describe("cacheKey", () => {
  it("is the same for identical files and provider", () => {
    const a = cacheKey("hashQ", "hashA", { name: "gemini", model: "flash" });
    const b = cacheKey("hashQ", "hashA", { name: "gemini", model: "flash" });
    expect(a).toBe(b);
  });

  it("changes when either file changes", () => {
    const base = cacheKey("hashQ", "hashA", { name: "gemini", model: "flash" });
    expect(cacheKey("other", "hashA", { name: "gemini", model: "flash" })).not.toBe(base);
    expect(cacheKey("hashQ", "other", { name: "gemini", model: "flash" })).not.toBe(base);
  });

  it("changes when the model changes, because results differ per model", () => {
    const a = cacheKey("hashQ", "hashA", { name: "gemini", model: "flash" });
    const b = cacheKey("hashQ", "hashA", { name: "gemini", model: "pro" });
    expect(a).not.toBe(b);
  });

  it("changes when the provider changes", () => {
    const a = cacheKey("hashQ", "hashA", { name: "gemini", model: "m" });
    const b = cacheKey("hashQ", "hashA", { name: "openrouter", model: "m" });
    expect(a).not.toBe(b);
  });
});

describe("isFresh", () => {
  const entry = (savedAt: number): CacheEntry => ({
    savedAt,
    questions: [],
    blocks: [],
    pairs: [],
  });

  it("accepts an entry saved just now", () => {
    expect(isFresh(entry(1000), 1000, 60_000)).toBe(true);
  });

  it("accepts an entry inside the window", () => {
    expect(isFresh(entry(1000), 50_000, 60_000)).toBe(true);
  });

  it("rejects an entry past the window", () => {
    expect(isFresh(entry(1000), 100_000, 60_000)).toBe(false);
  });
});

describe("evictOldest", () => {
  it("keeps the newest entries up to the limit", () => {
    const store = {
      a: { savedAt: 1, questions: [], blocks: [], pairs: [] },
      b: { savedAt: 3, questions: [], blocks: [], pairs: [] },
      c: { savedAt: 2, questions: [], blocks: [], pairs: [] },
    };
    expect(Object.keys(evictOldest(store, 2)).sort()).toEqual(["b", "c"]);
  });

  it("leaves a small store alone", () => {
    const store = { a: { savedAt: 1, questions: [], blocks: [], pairs: [] } };
    expect(Object.keys(evictOldest(store, 5))).toEqual(["a"]);
  });
});
