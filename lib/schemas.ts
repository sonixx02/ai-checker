import { z } from "zod";

export const questionsResponseSchema = z.object({
  questions: z.array(
    z.object({
      number: z.number(),
      subpart: z.string().nullable(),
      text: z.string(),
      maxMarks: z.number().nullable(),
    }),
  ),
});

export const answerBlocksResponseSchema = z.object({
  blocks: z.array(
    z.object({
      writtenLabel: z.string().nullish().transform((value) => value ?? null),
      text: z.string(),
      box_2d: z.unknown(),
      confidence: z.number().nullish().transform((value) => value ?? 0.8),
    }),
  ),
});

export const joinResponseSchema = z.object({
  pairs: z.array(
    z.object({
      questionId: z.string(),
      blockIds: z.array(z.string()),
      awarded: z.number().nullable(),
      max: z.number().nullable(),
      feedback: z.string().nullable(),
    }),
  ),
});
