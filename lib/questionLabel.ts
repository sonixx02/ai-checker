import type { Question } from "./types";

export function questionBadge(question: Question | null): string {
  if (question === null) {
    return "?";
  }

  if (question.subpart === null) {
    return `${question.number}`;
  }

  return `${question.number}(${question.subpart})`;
}

export function questionTag(question: Question | null): string {
  if (question === null) {
    return "Unmatched";
  }

  return `Q${questionBadge(question)}`;
}
