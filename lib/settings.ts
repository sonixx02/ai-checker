import type { ProviderChoice } from "./providers";

export const DURABLE_KEY = "veda.provider";
export const SESSION_KEY = "veda.providerKey";

export type DurableSettings = {
  name: ProviderChoice["name"];
  model: string;
};

export type SessionSettings = {
  apiKey: string;
};

export function splitForStorage(choice: ProviderChoice) {
  return {
    durable: { name: choice.name, model: choice.model },
    session: { apiKey: choice.apiKey },
  };
}

export function mergeStoredSettings(
  durable: DurableSettings | null,
  session: SessionSettings | null,
): ProviderChoice {
  const fallback: ProviderChoice = { name: "gemini", apiKey: "", model: "" };

  if (durable === null) {
    return fallback;
  }

  if (durable.name !== "gemini" && durable.name !== "openrouter") {
    return fallback;
  }

  const apiKey = session?.apiKey ?? "";

  if (durable.name === "openrouter" && apiKey === "") {
    return fallback;
  }

  return { name: durable.name, apiKey, model: durable.model ?? "" };
}

export function loadSettings(): ProviderChoice {
  if (typeof window === "undefined") {
    return { name: "gemini", apiKey: "", model: "" };
  }

  let durable: DurableSettings | null = null;
  let session: SessionSettings | null = null;

  try {
    const rawDurable = window.localStorage.getItem(DURABLE_KEY);
    if (rawDurable) {
      durable = JSON.parse(rawDurable);
    }
    const rawSession = window.sessionStorage.getItem(SESSION_KEY);
    if (rawSession) {
      session = JSON.parse(rawSession);
    }
  } catch {
    return { name: "gemini", apiKey: "", model: "" };
  }

  return mergeStoredSettings(durable, session);
}

export function saveSettings(choice: ProviderChoice): void {
  if (typeof window === "undefined") {
    return;
  }

  const { durable, session } = splitForStorage(choice);

  try {
    window.localStorage.setItem(DURABLE_KEY, JSON.stringify(durable));
    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    return;
  }
}
