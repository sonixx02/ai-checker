import type { AnswerBlock } from "./types";

export function answerPageLabel(blocks: AnswerBlock[]): string | null {
  const pages: number[] = [];

  for (const block of blocks) {
    for (const region of block.regions) {
      if (!pages.includes(region.page)) {
        pages.push(region.page);
      }
    }
  }

  if (pages.length === 0) {
    return null;
  }

  pages.sort((a, b) => a - b);
  const humanPages = pages.map((page) => page + 1);

  if (humanPages.length === 1) {
    return `p. ${humanPages[0]}`;
  }

  const isConsecutiveRun =
    humanPages[humanPages.length - 1] - humanPages[0] === humanPages.length - 1;

  if (isConsecutiveRun) {
    return `pp. ${humanPages[0]}-${humanPages[humanPages.length - 1]}`;
  }

  return `pp. ${humanPages.join(", ")}`;
}
