import { NextResponse } from "next/server";
import { rankModels, validateApiKey, type OpenRouterModel } from "@/lib/providers";

export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const apiKey: string = body.apiKey;

    if (typeof apiKey !== "string") {
      return NextResponse.json(
        { error: "An OpenRouter API key is required" },
        { status: 400 },
      );
    }

    const keyProblem = validateApiKey(apiKey);
    if (keyProblem !== null) {
      return NextResponse.json({ error: keyProblem }, { status: 400 });
    }

    const cleanKey = apiKey.trim();

    const keyResponse = await fetch("https://openrouter.ai/api/v1/key", {
      headers: { Authorization: `Bearer ${cleanKey}` },
    });

    if (!keyResponse.ok) {
      return NextResponse.json(
        { error: "That OpenRouter key was rejected. Check it and try again." },
        { status: 401 },
      );
    }

    const keyInfo = await keyResponse.json();

    const modelsResponse = await fetch("https://openrouter.ai/api/v1/models", {
      headers: { Authorization: `Bearer ${cleanKey}` },
    });

    if (!modelsResponse.ok) {
      return NextResponse.json(
        { error: "Could not load the model list from OpenRouter" },
        { status: 502 },
      );
    }

    const modelsBody = await modelsResponse.json();
    const models: OpenRouterModel[] = modelsBody.data ?? [];
    const ranked = rankModels(models);

    return NextResponse.json({
      models: ranked,
      keyLabel: keyInfo.data?.label ?? null,
      isFreeTier: keyInfo.data?.is_free_tier ?? null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
