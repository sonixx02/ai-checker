import type { Question } from "./types";

export type RawQuestion = {
  number: number;
  subpart: string | null;
  text: string;
  maxMarks: number | null;
};

function questionId(number: number, subpart: string | null): string {
  if (subpart === null) {
    return String(number);
  }
  return `${number}${subpart}`;
}

function isStem(candidate: RawQuestion, all: RawQuestion[]): boolean {
  if (candidate.subpart !== null) {
    return false;
  }

  if (candidate.maxMarks !== null) {
    return false;
  }

  for (const other of all) {
    if (other.number === candidate.number && other.subpart !== null) {
      return true;
    }
  }

  return false;
}

function stemTextFor(number: number, all: RawQuestion[]): string | null {
  for (const candidate of all) {
    if (candidate.number === number && isStem(candidate, all)) {
      return candidate.text;
    }
  }
  return null;
}

export function collapseSubpartStems(rawQuestions: RawQuestion[]): Question[] {
  const questions: Question[] = [];

  for (const raw of rawQuestions) {
    if (isStem(raw, rawQuestions)) {
      continue;
    }

    let context: string | null = null;
    if (raw.subpart !== null) {
      context = stemTextFor(raw.number, rawQuestions);
    }

    questions.push({
      id: questionId(raw.number, raw.subpart),
      number: raw.number,
      subpart: raw.subpart,
      order: questions.length,
      text: raw.text,
      context,
      maxMarks: raw.maxMarks,
    });
  }

  return questions;
}
