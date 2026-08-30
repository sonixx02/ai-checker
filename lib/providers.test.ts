import { describe, expect, it } from "vitest";
import {
  isVisionModel,
  isFreeModel,
  rankModels,
  resolveProvider,
  validateApiKey,
  type OpenRouterModel,
} from "./providers";

function model(
  id: string,
  modalities: string[],
  prompt: string,
  params: string[],
): OpenRouterModel {
  return {
    id,
    name: id,
    context_length: 100000,
    architecture: { input_modalities: modalities },
    pricing: { prompt, completion: prompt },
    supported_parameters: params,
  };
}

describe("isVisionModel", () => {
  it("accepts a model that takes images", () => {
    expect(isVisionModel(model("a", ["text", "image"], "0", []))).toBe(true);
  });

  it("rejects a text-only model", () => {
    expect(isVisionModel(model("b", ["text"], "0", []))).toBe(false);
  });
});

describe("isFreeModel", () => {
  it("treats zero prompt and completion cost as free", () => {
    expect(isFreeModel(model("a", ["image"], "0", []))).toBe(true);
  });

  it("treats any cost as paid", () => {
    expect(isFreeModel(model("b", ["image"], "0.0000008", []))).toBe(false);
  });
});

describe("rankModels", () => {
  const models = [
    model("paid-plain", ["text", "image"], "0.001", []),
    model("free-plain", ["text", "image"], "0", []),
    model("free-structured", ["text", "image"], "0", ["structured_outputs"]),
    model("text-only", ["text"], "0", ["structured_outputs"]),
  ];

  it("drops models that cannot read images", () => {
    const ranked = rankModels(models);
    expect(ranked.some((m) => m.id === "text-only")).toBe(false);
  });

  it("puts free models that support structured output first", () => {
    expect(rankModels(models)[0].id).toBe("free-structured");
  });

  it("marks each model so the picker can warn", () => {
    const ranked = rankModels(models);
    const plain = ranked.find((m) => m.id === "free-plain");
    expect(plain?.free).toBe(true);
    expect(plain?.structuredOutput).toBe(false);
  });
});

describe("resolveProvider", () => {
  it("defaults to gemini when nothing is chosen", () => {
    expect(resolveProvider(undefined).name).toBe("gemini");
  });

  it("uses openrouter when a key and model are supplied", () => {
    const provider = resolveProvider({
      name: "openrouter",
      apiKey: "sk-or-test",
      model: "some/model:free",
    });
    expect(provider.name).toBe("openrouter");
    expect(provider.model).toBe("some/model:free");
  });

  it("refuses openrouter without a key", () => {
    expect(() =>
      resolveProvider({ name: "openrouter", apiKey: "", model: "x" }),
    ).toThrow(/key/i);
  });

  it("refuses openrouter without a model", () => {
    expect(() =>
      resolveProvider({ name: "openrouter", apiKey: "sk-or-test", model: "" }),
    ).toThrow(/model/i);
  });
});

describe("validateApiKey", () => {
  it("accepts a normal OpenRouter key", () => {
    expect(validateApiKey("sk-or-v1-abc123DEF_-")).toBeNull();
  });

  it("rejects a key containing a box drawing character", () => {
    const problem = validateApiKey("sk-or-v1-abc─def");
    expect(problem).toMatch(/character/i);
  });

  it("rejects a key with a smart quote from copy and paste", () => {
    expect(validateApiKey("sk-or’v1")).toMatch(/character/i);
  });

  it("rejects an empty key", () => {
    expect(validateApiKey("")).toMatch(/required/i);
  });

  it("trims surrounding whitespace before judging", () => {
    expect(validateApiKey("  sk-or-v1-abc  ")).toBeNull();
  });
});
