import { GoogleGenAI } from "@google/genai";
import type { ZodType } from "zod";
import { resolveProvider, type ProviderChoice } from "./providers";

const MAX_ATTEMPTS = 3;
const BACKOFF_MS = [0, 1500, 4000];

export type GeminiPart =
  | { text: string }
  | { inlineData: { mimeType: string; data: string } };

function stripCodeFence(text: string): string {
  const trimmed = text.trim();

  if (!trimmed.startsWith("```")) {
    return trimmed;
  }

  const firstNewline = trimmed.indexOf("\n");
  const withoutOpening = trimmed.slice(firstNewline + 1);
  const closingIndex = withoutOpening.lastIndexOf("```");

  if (closingIndex === -1) {
    return withoutOpening;
  }

  return withoutOpening.slice(0, closingIndex).trim();
}

function isRetryable(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("429") ||
    message.includes("503") ||
    message.includes("500") ||
    message.includes("RESOURCE_EXHAUSTED") ||
    message.includes("UNAVAILABLE")
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function requestGemini(
  parts: GeminiPart[],
  apiKey: string,
  model: string,
): Promise<string> {
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }

  const client = new GoogleGenAI({ apiKey });

  const response = await client.models.generateContent({
    model,
    contents: [{ role: "user", parts }],
    config: { responseMimeType: "application/json" },
  });

  const rawText = response.text;
  if (!rawText) {
    throw new Error("Gemini returned an empty response");
  }

  return rawText;
}

type OpenRouterContent =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

function toOpenRouterContent(parts: GeminiPart[]): OpenRouterContent[] {
  const content: OpenRouterContent[] = [];

  for (const part of parts) {
    if ("text" in part) {
      content.push({ type: "text", text: part.text });
      continue;
    }

    const { mimeType, data } = part.inlineData;
    content.push({
      type: "image_url",
      image_url: { url: `data:${mimeType};base64,${data}` },
    });
  }

  return content;
}

async function requestOpenRouter(
  parts: GeminiPart[],
  apiKey: string,
  model: string,
): Promise<string> {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: toOpenRouterContent(parts) }],
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`OpenRouter ${response.status}: ${body.slice(0, 200)}`);
  }

  const data = await response.json();
  const rawText = data.choices?.[0]?.message?.content;

  if (!rawText) {
    throw new Error("OpenRouter returned an empty response");
  }

  return rawText;
}

async function requestOnce(
  parts: GeminiPart[],
  choice: ProviderChoice | undefined,
): Promise<string> {
  const provider = resolveProvider(choice);

  if (provider.name === "openrouter") {
    return requestOpenRouter(parts, provider.apiKey, provider.model);
  }

  return requestGemini(parts, provider.apiKey, provider.model);
}

export type UsedProvider = { name: string; model: string };

export function providerUsed(choice: ProviderChoice | undefined): UsedProvider {
  const provider = resolveProvider(choice);
  return { name: provider.name, model: provider.model };
}

export async function callGeminiJson<T>(
  parts: GeminiPart[],
  schema: ZodType<T>,
  choice?: ProviderChoice,
): Promise<T> {
  let lastError: unknown = null;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    if (BACKOFF_MS[attempt] > 0) {
      await sleep(BACKOFF_MS[attempt]);
    }

    try {
      const rawText = await requestOnce(parts, choice);
      const cleanText = stripCodeFence(rawText);

      let parsedJson: unknown;
      try {
        parsedJson = JSON.parse(cleanText);
      } catch {
        throw new Error(
          `Gemini returned text that is not JSON: ${cleanText.slice(0, 200)}`,
        );
      }

      return schema.parse(parsedJson);
    } catch (error) {
      lastError = error;

      if (!isRetryable(error)) {
        throw error;
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Gemini request failed after retries");
}
