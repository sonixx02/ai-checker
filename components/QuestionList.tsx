"use client";

import QuestionRow from "./QuestionRow";
import type { AnswerBlock, Mapping, Question } from "@/lib/types";

type Props = {
  mappings: Mapping[];
  questionsById: Map<string, Question>;
  blocksById: Map<string, AnswerBlock>;
  selectedKey: string | null;
  expandedKeys: Set<string>;
  onSelect: (mapping: Mapping) => void;
  onToggleExpand: (key: string) => void;
  onExpandAll: () => void;
};

export function mappingKey(mapping: Mapping): string {
  if (mapping.questionId !== null) {
    return `q:${mapping.questionId}`;
  }
  return `b:${mapping.blockIds[0]}`;
}

export default function QuestionList({
  mappings,
  questionsById,
  blocksById,
  selectedKey,
  expandedKeys,
  onSelect,
  onToggleExpand,
  onExpandAll,
}: Props) {
  const questionMappings: Mapping[] = [];
  const unmatchedMappings: Mapping[] = [];

  for (const mapping of mappings) {
    if (mapping.questionId === null) {
      unmatchedMappings.push(mapping);
    } else {
      questionMappings.push(mapping);
    }
  }

  function renderRow(mapping: Mapping) {
    const key = mappingKey(mapping);

    const question =
      mapping.questionId === null
        ? null
        : questionsById.get(mapping.questionId) ?? null;

    const blocks: AnswerBlock[] = [];
    for (const blockId of mapping.blockIds) {
      const block = blocksById.get(blockId);
      if (block !== undefined) {
        blocks.push(block);
      }
    }

    return (
      <QuestionRow
        key={key}
        mapping={mapping}
        question={question}
        blocks={blocks}
        isSelected={selectedKey === key}
        isExpanded={expandedKeys.has(key)}
        onSelect={() => onSelect(mapping)}
        onToggleExpand={() => onToggleExpand(key)}
      />
    );
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col rounded-2xl border border-line bg-white">
      <header className="flex items-center justify-between border-b border-line px-4 py-3">
        <h2 className="text-sm font-semibold">
          Extracted Questions{" "}
          <span className="font-normal text-muted">(from question paper)</span>
        </h2>
        <button
          type="button"
          onClick={onExpandAll}
          className="text-xs font-medium text-muted hover:text-ink"
        >
          Expand All
        </button>
      </header>

      <div className="min-h-0 flex-1 space-y-2 overflow-auto p-3">
        {questionMappings.map(renderRow)}

        {unmatchedMappings.length > 0 && (
          <div className="pt-4">
            <p className="px-1 pb-2 text-xs font-semibold text-brand">
              Unmatched answers ({unmatchedMappings.length})
            </p>
            <div className="space-y-2">{unmatchedMappings.map(renderRow)}</div>
          </div>
        )}
      </div>
    </section>
  );
}
