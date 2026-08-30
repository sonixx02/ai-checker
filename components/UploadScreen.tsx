"use client";

import { useId, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  FileText,
  ScanText,
  Settings2,
  Upload,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { callsNeededFor, pagesExceedFreeTier } from "@/lib/preflight";

export type PickedFile = {
  file: File;
  pageCount: number;
};

type Props = {
  questionPaper: PickedFile | null;
  answerSheet: PickedFile | null;
  onPickQuestionPaper: (file: File) => void;
  onPickAnswerSheet: (file: File) => void;
  onClearQuestionPaper: () => void;
  onClearAnswerSheet: () => void;
  onStart: () => void;
  error: string | null;
  providerLabel: string;
};

function formatSize(bytes: number): string {
  const megabytes = bytes / (1024 * 1024);
  return `${megabytes.toFixed(1)}MB`;
}

function Dropzone({
  title,
  picked,
  onPick,
  onClear,
}: {
  title: string;
  picked: PickedFile | null;
  onPick: (file: File) => void;
  onClear: () => void;
}) {
  const inputId = useId();
  const [isDragging, setIsDragging] = useState(false);

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      onPick(file);
    }
    event.target.value = "";
  }

  function handleDrop(event: React.DragEvent) {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) {
      onPick(file);
    }
  }

  if (picked !== null) {
    return (
      <div className="rounded-2xl border border-dashed border-line bg-white p-4">
        <div className="flex items-center gap-3 rounded-xl bg-surface p-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-soft">
            <FileText className="h-4 w-4 text-brand" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{picked.file.name}</p>
            <p className="text-xs text-muted-foreground">
              {formatSize(picked.file.size)} &bull; {picked.pageCount}{" "}
              {picked.pageCount === 1 ? "Page" : "Pages"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClear}
            aria-label={`Remove ${title}`}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink text-white transition hover:opacity-80"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <input
        id={inputId}
        type="file"
        accept="application/pdf,image/*"
        onChange={handleChange}
        className="sr-only"
      />
      <label
        htmlFor={inputId}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`block w-full cursor-pointer rounded-2xl border border-dashed bg-white p-8 text-center transition ${
          isDragging ? "border-brand bg-brand-soft/40" : "border-line hover:border-brand-ring"
        }`}
      >
        <span className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-surface text-muted-foreground">
          <Upload className="h-4 w-4" />
        </span>
        <span className="block text-sm">
          Upload <span className="font-semibold text-brand">{title}</span>
        </span>
        <span className="mt-1 block text-xs text-muted-foreground">
          PDF or image, max 10MB
        </span>
      </label>
    </>
  );
}

export default function UploadScreen({
  questionPaper,
  answerSheet,
  onPickQuestionPaper,
  onPickAnswerSheet,
  onClearQuestionPaper,
  onClearAnswerSheet,
  onStart,
  error,
  providerLabel,
}: Props) {
  const canStart = questionPaper !== null && answerSheet !== null;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col items-center px-4 py-10 sm:py-14">
      <h1 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">
        Upload{" "}
        <span className="rounded-lg bg-brand-soft px-2 py-0.5 text-brand">
          Question Paper &amp; Answer Sheets
        </span>
      </h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Upload both files to get started
      </p>

      <div className="relative my-8 flex h-24 w-24 items-center justify-center">
        <span className="absolute inset-0 rounded-full bg-brand-soft/60" />
        <span className="absolute inset-3 rounded-full bg-brand-soft" />
        <ScanText className="relative h-8 w-8 text-brand" />
      </div>

      <div className="grid w-full gap-4 sm:grid-cols-2">
        <Dropzone
          title="Question Paper"
          picked={questionPaper}
          onPick={onPickQuestionPaper}
          onClear={onClearQuestionPaper}
        />
        <Dropzone
          title="Answer Sheet"
          picked={answerSheet}
          onPick={onPickAnswerSheet}
          onClear={onClearAnswerSheet}
        />
      </div>

      {answerSheet !== null && pagesExceedFreeTier(answerSheet.pageCount) && (
        <div className="mt-5 flex w-full max-w-lg items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-left">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <p className="text-xs leading-relaxed text-amber-800">
            This answer sheet has {answerSheet.pageCount} pages, needing{" "}
            {callsNeededFor(answerSheet.pageCount)} model requests. The free tier
            allows 10 per minute, so processing will slow down while it waits and
            retries. It will still finish.
          </p>
        </div>
      )}

      {error !== null && (
        <p className="mt-4 rounded-lg bg-brand-soft px-3 py-2 text-sm text-brand">
          {error}
        </p>
      )}

      <Button
        onClick={onStart}
        disabled={!canStart}
        size="lg"
        className="mt-8 rounded-full px-6"
      >
        Start Mapping
        <ArrowRight className="h-4 w-4" />
      </Button>

      <p className="mt-4 max-w-sm text-center text-xs text-muted-foreground">
        Once both files are uploaded, you&rsquo;ll be able to map answers with
        questions
      </p>

      <p className="mt-5 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Settings2 className="h-3.5 w-3.5" />
        Reading with {providerLabel}. Change it in Settings.
      </p>
    </div>
  );
}
