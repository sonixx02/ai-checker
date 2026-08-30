import type { JoinPair } from "./buildMappings";
import type { AnswerBlock, Question } from "./types";

const STORE_KEY = "veda.results";
const MAX_ENTRIES = 5;
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export type CacheEntry = {
  savedAt: number;
  questions: Question[];
  blocks: AnswerBlock[];
  pairs: JoinPair[];
};

export type CacheStore = Record<string, CacheEntry>;

export function cacheKey(
  questionHash: string,
  answerHash: string,
  provider: { name: string; model: string },
): string {
  return `${questionHash}.${answerHash}.${provider.name}.${provider.model}`;
}

export function isFresh(entry: CacheEntry, now: number, maxAgeMs: number): boolean {
  return now - entry.savedAt <= maxAgeMs;
}

export function evictOldest(store: CacheStore, maxEntries: number): CacheStore {
  const keys = Object.keys(store);
  if (keys.length <= maxEntries) {
    return store;
  }

  keys.sort((a, b) => store[b].savedAt - store[a].savedAt);

  const kept: CacheStore = {};
  for (const key of keys.slice(0, maxEntries)) {
    kept[key] = store[key];
  }
  return kept;
}

export async function hashFile(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  const bytes = new Uint8Array(digest);

  let hex = "";
  for (const byte of bytes.slice(0, 12)) {
    hex += byte.toString(16).padStart(2, "0");
  }
  return hex;
}

function readStore(): CacheStore {
  if (typeof window === "undefined") {
    return {};
  }
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function loadCached(key: string): CacheEntry | null {
  const entry = readStore()[key];
  if (entry === undefined) {
    return null;
  }
  if (!isFresh(entry, Date.now(), MAX_AGE_MS)) {
    return null;
  }
  return entry;
}

export function saveCached(
  key: string,
  value: Omit<CacheEntry, "savedAt">,
): void {
  if (typeof window === "undefined") {
    return;
  }

  const store = readStore();
  store[key] = { savedAt: Date.now(), ...value };

  try {
    window.localStorage.setItem(
      STORE_KEY,
      JSON.stringify(evictOldest(store, MAX_ENTRIES)),
    );
  } catch {
    return;
  }
}
