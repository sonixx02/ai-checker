"use client";

import { AlertTriangle, ChevronDown, MinusCircle } from "lucide-react";
import { answerPageLabel } from "@/lib/answerPages";
import { questionBadge } from "@/lib/questionLabel";
import type { AnswerBlock, Mapping, Question } from "@/lib/types";

type Props = {
  mapping: Mapping;
  question: Question | null;
  blocks: AnswerBlock[];
  isSelected: boolean;
  isExpanded: boolean;
  onSelect: () => void;
  onToggleExpand: () => void;
};


function pageLabel(block: AnswerBlock): string {
  const pages: number[] = [];
  for (const region of block.regions) {
    if (!pages.includes(region.page)) {
      pages.push(region.page);
    }
  }
  if (pages.length === 0) {
    return "no page";
  }
  if (pages.length === 1) {
    return `page ${pages[0] + 1}`;
  }
  return `pages ${pages.map((p) => p + 1).join(", ")}`;
}

function confidenceWord(confidence: number): string {
  if (confidence >= 0.85) {
    return "clear";
  }
  if (confidence >= 0.6) {
    return "fair";
  }
  return "unclear";
}

function confidenceTone(confidence: number): string {
  if (confidence >= 0.85) {
    return "text-good";
  }
  if (confidence >= 0.6) {
    return "text-amber-700";
  }
  return "text-brand";
}

function StatusChip({ mapping }: { mapping: Mapping }) {
  if (mapping.status === "unanswered") {
    return (
      <span className="flex shrink-0 items-center gap-1 rounded-full bg-surface px-2.5 py-1 text-xs font-medium text-muted-foreground">
        <MinusCircle className="h-3 w-3" />
        Not attempted
      </span>
    );
  }

  if (mapping.status === "low-confidence") {
    return (
      <span className="flex shrink-0 items-center gap-1 rounded-full bg-brand-soft px-2.5 py-1 text-xs font-medium text-brand">
        <AlertTriangle className="h-3 w-3" />
        Needs review
      </span>
    );
  }

  if (mapping.status === "unmatched") {
    return (
      <span className="shrink-0 rounded-full bg-brand-soft px-2.5 py-1 text-xs font-medium text-brand">
        Not on the paper
      </span>
    );
  }

  if (mapping.score === null) {
    return (
      <span className="shrink-0 rounded-full bg-good-soft px-2.5 py-1 text-xs font-medium text-good">
        Answered
      </span>
    );
  }

  const { awarded, max } = mapping.score;
  const ratio = max === 0 ? 0 : awarded / max;

  let tone = "bg-good-soft text-good";
  if (ratio < 0.4) {
    tone = "bg-brand-soft text-brand";
  } else if (ratio < 0.75) {
    tone = "bg-amber-50 text-amber-700";
  }

  return (
    <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}>
      {awarded}/{max}
    </span>
  );
}

export default function QuestionRow({
  mapping,
  question,
  blocks,
  isSelected,
  isExpanded,
  onSelect,
  onToggleExpand,
}: Props) {
  const isUnanswered = mapping.status === "unanswered";

  let cardClass = "border-line hover:border-brand-ring/60";
  if (isSelected) {
    cardClass = "border-brand ring-1 ring-brand-ring";
  }

  let badgeClass = "bg-ink text-white";
  if (isSelected) {
    badgeClass = "bg-brand text-white";
  }
  if (isUnanswered) {
    badgeClass = "bg-surface text-muted-foreground";
  }

  const bodyText =
    question === null ? (blocks[0]?.text ?? "") : question.text;
  const rowPages = answerPageLabel(blocks);

  return (
    <div className={`rounded-xl border bg-white transition ${cardClass}`}>
      <div className="flex items-start gap-3 p-3">
        <button
          type="button"
          onClick={onSelect}
          className="flex flex-1 items-start gap-3 text-left"
        >
          <span
            className={`mt-0.5 flex h-6 shrink-0 items-center justify-center rounded-full px-2 text-xs font-semibold ${badgeClass}`}
          >
            {questionBadge(question)}
          </span>

          <span className="flex-1 text-sm leading-relaxed">{bodyText}</span>
        </button>

        <div className="flex shrink-0 items-center gap-2">
          {rowPages !== null && (
            <span className="hidden rounded-full bg-surface px-2 py-1 text-xs font-medium text-muted-foreground sm:inline">
              {rowPages}
            </span>
          )}
          <StatusChip mapping={mapping} />
          <button
            type="button"
            onClick={onToggleExpand}
            aria-label={isExpanded ? "Collapse" : "Expand"}
            className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-surface"
          >
            <ChevronDown
              className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
            />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-3 border-t border-line px-3 pb-3 pt-3">
          {mapping.feedback !== null && (
            <div className="rounded-lg bg-surface p-3">
              <p className="text-xs font-semibold">AI Feedback</p>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {mapping.feedback}
              </p>
            </div>
          )}

          {isUnanswered && (
            <p className="text-sm text-muted-foreground">
              Nothing on the answer sheet was matched to this question. If the
              student did answer it, the writing may have been unreadable.
            </p>
          )}

          {mapping.status === "unmatched" && blocks.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground">
                Answered, but nothing on the uploaded question paper asks this
              </p>
              <div className="mt-1.5 space-y-1.5">
                {blocks.map((block) => (
                  <div
                    key={block.id}
                    className="rounded-lg border border-line bg-surface/60 p-2.5"
                  >
                    <div className="mb-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                      <span className="rounded bg-white px-1.5 py-0.5 font-medium">
                        {pageLabel(block)}
                      </span>
                      {block.writtenLabel !== null && (
                        <span>labelled &ldquo;{block.writtenLabel}&rdquo;</span>
                      )}
                      <span className={confidenceTone(block.confidence)}>
                        {confidenceWord(block.confidence)} read
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">
                      {block.text}
                    </p>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                Matching is done against the question paper you uploaded. A
                question printed on the answer sheet itself does not count, so a
                student answering from a different paper lands here. Click the
                row to see where it sits on the sheet.
              </p>
            </div>
          )}

          {blocks.length > 0 && question !== null && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground">
                What was read from the answer sheet
                {blocks.length > 1 && ` (${blocks.length} parts)`}
              </p>

              <div className="mt-1.5 space-y-1.5">
                {blocks.map((block) => (
                  <div
                    key={block.id}
                    className="rounded-lg border border-line bg-surface/60 p-2.5"
                  >
                    <div className="mb-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                      <span className="rounded bg-white px-1.5 py-0.5 font-medium">
                        {pageLabel(block)}
                      </span>
                      {block.writtenLabel !== null && (
                        <span>
                          labelled &ldquo;{block.writtenLabel}&rdquo;
                        </span>
                      )}
                      <span className={confidenceTone(block.confidence)}>
                        {confidenceWord(block.confidence)} read
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">
                      {block.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
