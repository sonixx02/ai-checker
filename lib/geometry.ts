import type { Region } from "./types";

const GEMINI_SCALE = 1000;

export function boxToRegion(box: number[], page: number): Region {
  const rawYmin = box[0] / GEMINI_SCALE;
  const rawXmin = box[1] / GEMINI_SCALE;
  const rawYmax = box[2] / GEMINI_SCALE;
  const rawXmax = box[3] / GEMINI_SCALE;

  let ymin = rawYmin;
  let ymax = rawYmax;
  if (rawYmin > rawYmax) {
    ymin = rawYmax;
    ymax = rawYmin;
  }

  let xmin = rawXmin;
  let xmax = rawXmax;
  if (rawXmin > rawXmax) {
    xmin = rawXmax;
    xmax = rawXmin;
  }

  return { page, ymin, xmin, ymax, xmax };
}

function clampToPage(value: number): number {
  if (value < 0) {
    return 0;
  }
  if (value > 1) {
    return 1;
  }
  return value;
}

export function padRegion(region: Region, amount: number): Region {
  return {
    page: region.page,
    ymin: clampToPage(region.ymin - amount),
    xmin: clampToPage(region.xmin - amount),
    ymax: clampToPage(region.ymax + amount),
    xmax: clampToPage(region.xmax + amount),
  };
}

export function regionToPercentStyle(region: Region) {
  const width = region.xmax - region.xmin;
  const height = region.ymax - region.ymin;

  return {
    left: `${region.xmin * 100}%`,
    top: `${region.ymin * 100}%`,
    width: `${width * 100}%`,
    height: `${height * 100}%`,
  };
}

function toFourNumbers(candidate: unknown): number[] | null {
  if (!Array.isArray(candidate) || candidate.length !== 4) {
    return null;
  }

  const numbers: number[] = [];
  for (const value of candidate) {
    const asNumber = Number(value);
    if (!Number.isFinite(asNumber)) {
      return null;
    }
    numbers.push(asNumber);
  }

  return numbers;
}

export function normalizeBox(raw: unknown): number[] | null {
  if (!Array.isArray(raw)) {
    return null;
  }

  const flat = toFourNumbers(raw);
  if (flat !== null) {
    return flat;
  }

  for (const entry of raw) {
    const nested = toFourNumbers(entry);
    if (nested !== null) {
      return nested;
    }
  }

  return null;
}
