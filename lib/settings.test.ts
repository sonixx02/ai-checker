import { describe, expect, it } from "vitest";
import { mergeStoredSettings, splitForStorage } from "./settings";

describe("splitForStorage", () => {
  it("keeps the api key out of durable storage", () => {
    const { durable, session } = splitForStorage({
      name: "openrouter",
      apiKey: "sk-or-secret",
      model: "some/model:free",
    });
    expect(durable).toEqual({ name: "openrouter", model: "some/model:free" });
    expect(JSON.stringify(durable)).not.toContain("sk-or-secret");
    expect(session).toEqual({ apiKey: "sk-or-secret" });
  });
});

describe("mergeStoredSettings", () => {
  it("falls back to gemini when nothing is stored", () => {
    expect(mergeStoredSettings(null, null)).toEqual({
      name: "gemini",
      apiKey: "",
      model: "",
    });
  });

  it("recombines durable and session parts", () => {
    const merged = mergeStoredSettings(
      { name: "openrouter", model: "a/b:free" },
      { apiKey: "sk-or-x" },
    );
    expect(merged).toEqual({
      name: "openrouter",
      apiKey: "sk-or-x",
      model: "a/b:free",
    });
  });

  it("drops back to gemini if openrouter was stored without a key", () => {
    const merged = mergeStoredSettings({ name: "openrouter", model: "a/b" }, null);
    expect(merged.name).toBe("gemini");
  });

  it("ignores a stored provider name it does not recognise", () => {
    const merged = mergeStoredSettings({ name: "wat" as never, model: "" }, null);
    expect(merged.name).toBe("gemini");
  });
});
