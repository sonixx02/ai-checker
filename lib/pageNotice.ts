import type { Region } from "./types";

export type PageNotice = {
  lead: string;
  pages: number[];
  pageIndexes: number[];
};

export function describeOtherPages(
  regions: Region[],
  currentPage: number,
): PageNotice | null {
  const otherPages: number[] = [];
  let hasRegionHere = false;

  for (const region of regions) {
    if (region.page === currentPage) {
      hasRegionHere = true;
      continue;
    }
    if (!otherPages.includes(region.page)) {
      otherPages.push(region.page);
    }
  }

  if (otherPages.length === 0) {
    return null;
  }

  const lead = hasRegionHere
    ? "This answer continues on"
    : "This answer is not on this page. It is on";

  return {
    lead,
    pages: otherPages.map((page) => page + 1),
    pageIndexes: otherPages,
  };
}
