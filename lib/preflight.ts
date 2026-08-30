import type { JoinPair } from "./buildMappings";
import type { AnswerBlock, Question } from "./types";

const FREE_TIER_REQUESTS_PER_MINUTE = 10;

export type PipelineProblem = {
  title: string;
  detail: string;
  blame: "question-paper" | "answer-sheet" | "both";
};

type FileLike = {
  name: string;
  size: number;
};

export function checkSameFile(
  questionPaper: FileLike,
  answerSheet: FileLike,
): PipelineProblem | null {
  const sameName = questionPaper.name === answerSheet.name;
  const sameSize = questionPaper.size === answerSheet.size;

  if (!sameName || !sameSize) {
    return null;
  }

  return {
    title: "Both uploads are the same file",
    detail: `You uploaded ${questionPaper.name} as both the question paper and the answer sheet. Upload the student's answer sheet in the second slot.`,
    blame: "both",
  };
}

export function checkQuestions(
  questions: Question[],
  fileName: string,
): PipelineProblem | null {
  if (questions.length > 0) {
    return null;
  }

  return {
    title: "No questions found in the question paper",
    detail: `We could not read any questions from ${fileName}. Check that this file is the printed question paper, and that the pages are not blank or rotated.`,
    blame: "question-paper",
  };
}

export function checkAnswerBlocks(
  blocks: AnswerBlock[],
  fileName: string,
): PipelineProblem | null {
  if (blocks.length > 0) {
    return null;
  }

  return {
    title: "No handwritten answers found",
    detail: `We could not find any handwriting in ${fileName}. Check that this file is the student's answer sheet rather than a second copy of the question paper.`,
    blame: "answer-sheet",
  };
}

export function checkMatchQuality(
  questions: Question[],
  blocks: AnswerBlock[],
  pairs: JoinPair[],
): PipelineProblem | null {
  if (questions.length === 0 || blocks.length === 0) {
    return null;
  }

  if (pairs.length > 0) {
    return null;
  }

  return {
    title: "These files do not appear to match",
    detail: `We read ${questions.length} questions and ${blocks.length} answers, but none of the answers matched any question. The question paper and the answer sheet may be from different exams.`,
    blame: "both",
  };
}

export function callsNeededFor(answerPageCount: number): number {
  return answerPageCount + 2;
}

export function pagesExceedFreeTier(answerPageCount: number): boolean {
  return callsNeededFor(answerPageCount) > FREE_TIER_REQUESTS_PER_MINUTE;
}
