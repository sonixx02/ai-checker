export type OpenRouterModel = {
  id: string;
  name: string;
  context_length: number;
  architecture?: { input_modalities?: string[] };
  pricing?: { prompt?: string; completion?: string };
  supported_parameters?: string[];
};

export type RankedModel = {
  id: string;
  name: string;
  contextLength: number;
  free: boolean;
  structuredOutput: boolean;
};

export type ProviderChoice = {
  name: "gemini" | "openrouter";
  apiKey: string;
  model: string;
};

export type ResolvedProvider = {
  name: "gemini" | "openrouter";
  apiKey: string;
  model: string;
};

const GEMINI_DEFAULT_MODEL = "gemini-3.5-flash-lite";

export function isVisionModel(model: OpenRouterModel): boolean {
  const modalities = model.architecture?.input_modalities ?? [];
  return modalities.includes("image");
}

export function isFreeModel(model: OpenRouterModel): boolean {
  const prompt = Number(model.pricing?.prompt ?? "1");
  const completion = Number(model.pricing?.completion ?? "1");
  return prompt === 0 && completion === 0;
}

export function supportsStructuredOutput(model: OpenRouterModel): boolean {
  const params = model.supported_parameters ?? [];
  return params.includes("structured_outputs") || params.includes("response_format");
}

export function rankModels(models: OpenRouterModel[]): RankedModel[] {
  const usable: RankedModel[] = [];

  for (const model of models) {
    if (!isVisionModel(model)) {
      continue;
    }

    usable.push({
      id: model.id,
      name: model.name,
      contextLength: model.context_length,
      free: isFreeModel(model),
      structuredOutput: supportsStructuredOutput(model),
    });
  }

  function score(model: RankedModel): number {
    if (model.free && model.structuredOutput) {
      return 0;
    }
    if (model.free) {
      return 1;
    }
    if (model.structuredOutput) {
      return 2;
    }
    return 3;
  }

  usable.sort((a, b) => {
    const byScore = score(a) - score(b);
    if (byScore !== 0) {
      return byScore;
    }
    return a.id.localeCompare(b.id);
  });

  return usable;
}

export function resolveProvider(
  choice: ProviderChoice | undefined,
): ResolvedProvider {
  if (choice === undefined || choice.name === "gemini") {
    const apiKey = process.env.GEMINI_API_KEY ?? "";
    const model = process.env.GEMINI_MODEL ?? GEMINI_DEFAULT_MODEL;
    return { name: "gemini", apiKey, model };
  }

  const keyProblem = validateApiKey(choice.apiKey);
  if (keyProblem !== null) {
    throw new Error(keyProblem);
  }

  if (!choice.model) {
    throw new Error("Choose an OpenRouter model");
  }

  return { name: "openrouter", apiKey: choice.apiKey.trim(), model: choice.model };
}

export function validateApiKey(rawKey: string): string | null {
  const key = rawKey.trim();

  if (key.length === 0) {
    return "An API key is required";
  }

  for (let index = 0; index < key.length; index++) {
    const code = key.charCodeAt(index);
    if (code < 33 || code > 126) {
      return `The key contains a character that is not valid in an API key (position ${index + 1}). Re-copy it, avoiding formatted text.`;
    }
  }

  return null;
}
