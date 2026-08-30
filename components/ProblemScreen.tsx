"use client";

import { FileQuestion, FileWarning, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PipelineProblem } from "@/lib/preflight";

const BLAME_LABEL = {
  "question-paper": "Question paper",
  "answer-sheet": "Answer sheet",
  both: "Both files",
} as const;

export default function ProblemScreen({
  problem,
  onStartOver,
}: {
  problem: PipelineProblem;
  onStartOver: () => void;
}) {
  const Icon = problem.blame === "question-paper" ? FileQuestion : FileWarning;

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-2xl border border-line bg-white p-6 text-center">
        <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-soft">
          <Icon className="h-5 w-5 text-brand" />
        </span>

        <span className="mb-3 inline-block rounded-full bg-brand-soft px-2.5 py-1 text-xs font-medium text-brand">
          {BLAME_LABEL[problem.blame]}
        </span>

        <h2 className="text-lg font-semibold tracking-tight">{problem.title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {problem.detail}
        </p>

        <Button onClick={onStartOver} className="mt-6 rounded-full px-5">
          <RotateCcw className="h-4 w-4" />
          Start over
        </Button>
      </div>
    </div>
  );
}
