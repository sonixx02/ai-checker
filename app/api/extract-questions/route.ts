import { NextResponse } from "next/server";
import { callGeminiJson, providerUsed, type GeminiPart } from "@/lib/gemini";
import type { ProviderChoice } from "@/lib/providers";
import { questionsResponseSchema } from "@/lib/schemas";
import { collapseSubpartStems } from "@/lib/normalizeQuestions";

const PROMPT = `You are reading a printed exam question paper.

List every question in the exact order it appears on the page, top to bottom.

Rules:
- A labelled sub-part is its own entry. "11 (a)" and "11 (b)" are two entries,
  both with number 11, with subpart "a" and "b".
- A question with no sub-parts has subpart null.
- Preserve the printed number exactly. Do not renumber.
- If marks are printed next to a question, put the number in maxMarks,
  otherwise null.
- Include the full question text. Do not summarise or shorten it.
- Ignore headers, instructions, and page numbers. Only list questions.

Return JSON: { "questions": [ { "number": int, "subpart": string|null, "text": string, "maxMarks": number|null } ] }`;

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const provider: ProviderChoice | undefined = body.provider;
    const images: string[] = body.images;

    if (!Array.isArray(images) || images.length === 0) {
      return NextResponse.json({ error: "No images provided" }, { status: 400 });
    }

    const parts: GeminiPart[] = [{ text: PROMPT }];
    for (const image of images) {
      parts.push({ inlineData: { mimeType: "image/jpeg", data: image } });
    }

    const result = await callGeminiJson(parts, questionsResponseSchema, provider);
    const questions = collapseSubpartStems(result.questions);

    return NextResponse.json({ questions, usedProvider: providerUsed(provider) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
