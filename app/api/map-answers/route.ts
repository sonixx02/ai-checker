import { NextResponse } from "next/server";
import { callGeminiJson, providerUsed, type GeminiPart } from "@/lib/gemini";
import type { ProviderChoice } from "@/lib/providers";
import { joinResponseSchema } from "@/lib/schemas";
import type { JoinPair } from "@/lib/buildMappings";
import type { AnswerBlock, Question } from "@/lib/types";

const PROMPT = `You are matching a student's answers to the questions on an exam paper.

You are given a list of questions and a list of answer blocks found on the
answer sheet. The student may have answered out of order, skipped questions, or
written something that answers no question at all.

Rules:
- Match on the student's written label first when it is present and sensible.
- Otherwise match on whether the answer text actually addresses the question.
- A question may be answered by several blocks. Put every block that forms part
  of one answer into that question's blockIds, in reading order. This includes
  an answer that runs onto the next page, and an answer written as several
  separate lines or table fields.
- A block belongs to at most one question.
- Two blocks are part of the same answer when one continues the other: it starts
  mid-sentence, finishes a word the previous block cut off, or repeats the
  previous block's closing words because the pages overlap. Group them, do not
  discard one as a duplicate.
- Leave a question out entirely rather than guessing a bad match.
- Do not report unanswered questions or unmatched blocks. Only report pairs.
- awarded and max are the marks you would give. Use null if you cannot judge.
- feedback is one short sentence addressed to the student.

Return JSON: { "pairs": [ { "questionId": string, "blockIds": string[], "awarded": number|null, "max": number|null, "feedback": string|null } ] }`;

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const provider: ProviderChoice | undefined = body.provider;
    const questions: Question[] = body.questions;
    const blocks: AnswerBlock[] = body.blocks;

    if (!Array.isArray(questions) || !Array.isArray(blocks)) {
      return NextResponse.json(
        { error: "Expected questions and blocks arrays" },
        { status: 400 },
      );
    }

    if (blocks.length === 0) {
      return NextResponse.json({ pairs: [] });
    }

    const questionLines: string[] = [];
    for (const question of questions) {
      const marks =
        question.maxMarks === null ? "unknown" : String(question.maxMarks);
      const context =
        question.context === null ? "" : ` context=${question.context}`;
      questionLines.push(
        `id=${question.id} marks=${marks}${context} text=${question.text}`,
      );
    }

    const blockLines: string[] = [];
    for (const block of blocks) {
      const label = block.writtenLabel === null ? "none" : block.writtenLabel;
      blockLines.push(`id=${block.id} label=${label} text=${block.text}`);
    }

    const payload = [
      "QUESTIONS:",
      questionLines.join("\n"),
      "",
      "ANSWER BLOCKS:",
      blockLines.join("\n"),
    ].join("\n");

    const parts: GeminiPart[] = [{ text: PROMPT }, { text: payload }];

    const result = await callGeminiJson(parts, joinResponseSchema, provider);

    const pairs: JoinPair[] = [];
    for (const pair of result.pairs) {
      const hasScore = pair.awarded !== null && pair.max !== null;

      pairs.push({
        questionId: pair.questionId,
        blockIds: pair.blockIds,
        score: hasScore ? { awarded: pair.awarded!, max: pair.max! } : null,
        feedback: pair.feedback,
      });
    }

    return NextResponse.json({ pairs, usedProvider: providerUsed(provider) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
