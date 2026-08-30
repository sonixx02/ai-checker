import { NextResponse } from "next/server";
import { callGeminiJson, providerUsed, type GeminiPart } from "@/lib/gemini";
import type { ProviderChoice } from "@/lib/providers";
import { answerBlocksResponseSchema } from "@/lib/schemas";
import { boxToRegion, normalizeBox } from "@/lib/geometry";
import type { AnswerBlock } from "@/lib/types";

const PROMPT = `You are reading one page of a student's handwritten answer sheet.

Find every distinct answer on this page.

Group writing that answers the same question into ONE block, even when it is
spread over several lines, several dotted rules, or several fields of a table.
Do not emit one block per line.

For each block:
- writtenLabel: the question label the student wrote next to it, exactly as
  written, for example "Q2" or "3(b)". Use null if the student wrote no label.
- text: transcribe the handwriting as accurately as you can. Describe diagrams
  briefly in square brackets, for example "[diagram of a plant labelled
  Sunlight, Water, Oxygen]".
- box_2d: the bounding box of the whole block as [ymin, xmin, ymax, xmax],
  integers normalised to 0-1000.
- confidence: 0 to 1, how legible the handwriting in this block was. Be honest.
  Use a low value when you are guessing at words.

A page usually contains at least one answer. Printed question text, printed
diagrams, graphs and grids are not answer blocks, but do not let a large
printed diagram stop you finding the handwriting elsewhere on the page. Return
an empty list only when there is genuinely no handwriting anywhere.

Return JSON: { "blocks": [ { "writtenLabel": string|null, "text": string, "box_2d": [int,int,int,int], "confidence": number } ] }`;

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const provider: ProviderChoice | undefined = body.provider;
    const image: string = body.image;
    const page: number = body.page;

    if (typeof image !== "string" || typeof page !== "number") {
      return NextResponse.json(
        { error: "Expected an image string and a page number" },
        { status: 400 },
      );
    }

    const parts: GeminiPart[] = [
      { text: PROMPT },
      { inlineData: { mimeType: "image/jpeg", data: image } },
    ];

    const result = await callGeminiJson(parts, answerBlocksResponseSchema, provider);

    const blocks: AnswerBlock[] = [];
    for (let index = 0; index < result.blocks.length; index++) {
      const raw = result.blocks[index];

      const box = normalizeBox(raw.box_2d);
      if (box === null) {
        continue;
      }

      const region = boxToRegion(box, page);

      blocks.push({
        id: `p${page}b${index}`,
        writtenLabel: raw.writtenLabel,
        text: raw.text,
        regions: [region],
        confidence: raw.confidence,
      });
    }

    return NextResponse.json({ blocks, usedProvider: providerUsed(provider) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
