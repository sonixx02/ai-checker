import type { AnswerBlock, Mapping, Question } from "./types";

export type JoinPair = {
  questionId: string;
  blockIds: string[];
  score: { awarded: number; max: number } | null;
  feedback: string | null;
};

export function buildMappings(
  questions: Question[],
  blocks: AnswerBlock[],
  pairs: JoinPair[],
  confidenceThreshold: number,
): Mapping[] {
  const questionsById = new Map<string, Question>();
  for (const question of questions) {
    questionsById.set(question.id, question);
  }

  const blocksById = new Map<string, AnswerBlock>();
  for (const block of blocks) {
    blocksById.set(block.id, block);
  }

  const claimedBlockIds = new Set<string>();
  const blockIdsByQuestionId = new Map<string, string[]>();
  const pairByQuestionId = new Map<string, JoinPair>();

  for (const pair of pairs) {
    if (!questionsById.has(pair.questionId)) {
      continue;
    }
    if (blockIdsByQuestionId.has(pair.questionId)) {
      continue;
    }

    const accepted: string[] = [];
    for (const blockId of pair.blockIds) {
      if (!blocksById.has(blockId)) {
        continue;
      }
      if (claimedBlockIds.has(blockId)) {
        continue;
      }
      accepted.push(blockId);
      claimedBlockIds.add(blockId);
    }

    if (accepted.length === 0) {
      continue;
    }

    blockIdsByQuestionId.set(pair.questionId, accepted);
    pairByQuestionId.set(pair.questionId, pair);
  }

  const questionsInPrintedOrder = [...questions].sort((a, b) => a.order - b.order);
  const mappings: Mapping[] = [];

  for (const question of questionsInPrintedOrder) {
    const claimed = blockIdsByQuestionId.get(question.id);

    if (claimed === undefined) {
      mappings.push({
        questionId: question.id,
        blockIds: [],
        status: "unanswered",
        score: null,
        feedback: null,
      });
      continue;
    }

    let lowestConfidence = 1;
    for (const blockId of claimed) {
      const block = blocksById.get(blockId);
      if (block !== undefined && block.confidence < lowestConfidence) {
        lowestConfidence = block.confidence;
      }
    }

    const pair = pairByQuestionId.get(question.id);

    mappings.push({
      questionId: question.id,
      blockIds: claimed,
      status: lowestConfidence >= confidenceThreshold ? "matched" : "low-confidence",
      score: pair?.score ?? null,
      feedback: pair?.feedback ?? null,
    });
  }

  for (const block of blocks) {
    if (claimedBlockIds.has(block.id)) {
      continue;
    }

    mappings.push({
      questionId: null,
      blockIds: [block.id],
      status: "unmatched",
      score: null,
      feedback: null,
    });
  }

  return mappings;
}

export function regionsForMapping(
  mapping: Mapping,
  blocksById: Map<string, AnswerBlock>,
) {
  const regions = [];
  for (const blockId of mapping.blockIds) {
    const block = blocksById.get(blockId);
    if (block === undefined) {
      continue;
    }
    for (const region of block.regions) {
      regions.push(region);
    }
  }
  return regions;
}
