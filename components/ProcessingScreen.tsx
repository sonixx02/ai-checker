import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";

export type PipelineProgress = {
  stage: "questions" | "answers" | "mapping";
  pageDone: number;
  pageTotal: number;
};

const STAGES = [
  { key: "questions", label: "Reading the question paper" },
  { key: "answers", label: "Reading the answer sheet" },
  { key: "mapping", label: "Matching answers to questions" },
] as const;

function percentDone(progress: PipelineProgress): number {
  if (progress.stage === "questions") {
    return 10;
  }
  if (progress.stage === "mapping") {
    return 92;
  }
  if (progress.pageTotal === 0) {
    return 25;
  }
  return 20 + Math.round((progress.pageDone / progress.pageTotal) * 65);
}

export default function ProcessingScreen({ progress }: { progress: PipelineProgress }) {
  const activeIndex = STAGES.findIndex((s) => s.key === progress.stage);

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-16">
      <div className="relative mb-7 flex h-20 w-20 items-center justify-center">
        <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-brand-soft">
          <Loader2 className="h-7 w-7 animate-spin text-brand" />
        </span>
      </div>

      <h2 className="text-2xl font-bold tracking-tight">Extracting...</h2>
      <p className="mt-1 text-sm text-muted-foreground">This may take a while</p>

      <div className="mt-8 w-full max-w-sm">
        <Progress value={percentDone(progress)} className="h-1.5" />

        <ul className="mt-5 space-y-2.5">
          {STAGES.map((stage, index) => {
            const isDone = index < activeIndex;
            const isActive = index === activeIndex;

            let detail = "";
            if (stage.key === "answers" && isActive && progress.pageTotal > 0) {
              detail = ` — page ${progress.pageDone} of ${progress.pageTotal}`;
            }

            return (
              <li
                key={stage.key}
                className={`flex items-center gap-2.5 text-sm ${
                  isActive ? "text-ink" : isDone ? "text-good" : "text-muted-foreground"
                }`}
              >
                <span
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] ${
                    isDone
                      ? "bg-good text-white"
                      : isActive
                        ? "bg-brand text-white"
                        : "bg-line text-transparent"
                  }`}
                >
                  {isDone ? "✓" : ""}
                </span>
                {stage.label}
                {detail}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
