import type { Question } from "./types";

export type QuestionProblems = {
  gaps: number[];
  duplicates: string[];
};

export function validateQuestions(questions: Question[]): QuestionProblems {
  const gaps: number[] = [];
  const duplicates: string[] = [];

  const seenIds = new Set<string>();
  for (const question of questions) {
    if (seenIds.has(question.id)) {
      duplicates.push(question.id);
    }
    seenIds.add(question.id);
  }

  const presentNumbers = new Set<number>();
  for (const question of questions) {
    presentNumbers.add(question.number);
  }

  if (presentNumbers.size === 0) {
    return { gaps, duplicates };
  }

  const sortedNumbers = Array.from(presentNumbers).sort((a, b) => a - b);
  const lowest = sortedNumbers[0];
  const highest = sortedNumbers[sortedNumbers.length - 1];

  for (let candidate = lowest; candidate <= highest; candidate++) {
    if (!presentNumbers.has(candidate)) {
      gaps.push(candidate);
    }
  }

  return { gaps, duplicates };
}
