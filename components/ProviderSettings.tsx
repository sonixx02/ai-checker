"use client";

import { useState } from "react";
import { Check, Loader2, TriangleAlert, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ProviderChoice, RankedModel } from "@/lib/providers";

type Props = {
  choice: ProviderChoice;
  onChange: (choice: ProviderChoice) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function ProviderSettings({
  choice,
  onChange,
  isOpen,
  onOpenChange,
}: Props) {
  const [models, setModels] = useState<RankedModel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [keyAccepted, setKeyAccepted] = useState(false);

  if (!isOpen) {
    return null;
  }

  async function loadModels() {
    setIsLoading(true);
    setError(null);
    setModels([]);
    setKeyAccepted(false);

    try {
      const response = await fetch("/api/models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: choice.apiKey }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Could not load models");
        return;
      }

      setModels(data.models);
      setKeyAccepted(true);

      if (data.models.length > 0 && choice.model === "") {
        onChange({ ...choice, model: data.models[0].id });
      }
    } catch {
      setError("Could not reach OpenRouter");
    } finally {
      setIsLoading(false);
    }
  }

  const usingOpenRouter = choice.name === "openrouter";
  const selected = models.find((m) => m.id === choice.model);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-auto bg-ink/40 p-4 sm:items-center">
      <div className="w-full max-w-lg rounded-2xl border border-line bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-base font-semibold tracking-tight">Settings</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Choose which model reads the papers
            </p>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Close settings"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-surface hover:text-ink"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mb-4 flex gap-1 rounded-lg bg-surface p-1">
          <button
            type="button"
            onClick={() => onChange({ name: "gemini", apiKey: "", model: "" })}
            className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium ${
              !usingOpenRouter ? "bg-white text-ink shadow-sm" : "text-muted-foreground"
            }`}
          >
            Built-in (Gemini)
          </button>
          <button
            type="button"
            onClick={() => onChange({ ...choice, name: "openrouter" })}
            className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium ${
              usingOpenRouter ? "bg-white text-ink shadow-sm" : "text-muted-foreground"
            }`}
          >
            My OpenRouter key
          </button>
        </div>

        {!usingOpenRouter && (
          <p className="text-xs leading-relaxed text-muted-foreground">
            Uses the server&rsquo;s Gemini key. If its free-tier quota runs out,
            switch to your own OpenRouter key.
          </p>
        )}

        {usingOpenRouter && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                type="password"
                value={choice.apiKey}
                onChange={(event) =>
                  onChange({ ...choice, apiKey: event.target.value, model: "" })
                }
                placeholder="sk-or-v1-..."
                className="flex-1 rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-brand-ring"
              />
              <Button
                type="button"
                variant="secondary"
                onClick={loadModels}
                disabled={choice.apiKey.length === 0 || isLoading}
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Load models"}
              </Button>
            </div>

            {error !== null && (
              <p className="rounded-lg bg-brand-soft px-3 py-2 text-xs text-brand">
                {error}
              </p>
            )}

            {keyAccepted && models.length > 0 && (
              <p className="flex items-center gap-1.5 text-xs text-good">
                <Check className="h-3.5 w-3.5" />
                Key accepted &mdash; {models.length} models can read images
              </p>
            )}

            {models.length > 0 && (
              <select
                value={choice.model}
                onChange={(event) => onChange({ ...choice, model: event.target.value })}
                className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-brand-ring"
              >
                {models.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.free ? "[free] " : ""}
                    {model.structuredOutput ? "" : "[no JSON mode] "}
                    {model.id}
                  </option>
                ))}
              </select>
            )}

            {selected !== undefined && !selected.structuredOutput && (
              <p className="flex items-start gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                This model does not advertise JSON mode. Extraction may fail to
                parse. Prefer one marked [free] without this warning.
              </p>
            )}

            <p className="text-xs leading-relaxed text-muted-foreground">
              Your key is sent with each request and never written to disk. Only
              models that accept image input are listed, because the pipeline
              reads scanned pages.
            </p>
          </div>
        )}

        <div className="mt-5 flex justify-end">
          <Button onClick={() => onOpenChange(false)} className="rounded-full px-5">
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
