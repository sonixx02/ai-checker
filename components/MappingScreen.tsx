"use client";

import { useState } from "react";
import AnswerSheetPane, { type SheetAnnotation } from "./AnswerSheetPane";
import QuestionList, { mappingKey } from "./QuestionList";
import { regionsForMapping } from "@/lib/buildMappings";
import { questionTag } from "@/lib/questionLabel";
import type { PageImage } from "@/lib/rasterize";
import type { AnswerBlock, Mapping, Question } from "@/lib/types";

type Props = {
  usedProvider: { name: string; model: string } | null;
  mappings: Mapping[];
  questions: Question[];
  blocks: AnswerBlock[];
  answerPages: PageImage[];
  problems: { gaps: number[]; duplicates: string[] };
};

type MobileTab = "questions" | "answer-sheet";

export default function MappingScreen({
  usedProvider,
  mappings,
  questions,
  blocks,
  answerPages,
  problems,
}: Props) {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(0);
  const [zoom, setZoom] = useState(100);
  const [mobileTab, setMobileTab] = useState<MobileTab>("questions");

  const questionsById = new Map<string, Question>();
  for (const question of questions) {
    questionsById.set(question.id, question);
  }

  const blocksById = new Map<string, AnswerBlock>();
  for (const block of blocks) {
    blocksById.set(block.id, block);
  }

  function handleSelect(mapping: Mapping) {
    const key = mappingKey(mapping);
    setSelectedKey(key);

    const regions = regionsForMapping(mapping, blocksById);
    if (regions.length > 0) {
      setCurrentPage(regions[0].page);
    }

    setMobileTab("answer-sheet");
  }

  function handleToggleExpand(key: string) {
    const next = new Set(expandedKeys);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    setExpandedKeys(next);
  }

  function handleExpandAll() {
    if (expandedKeys.size === mappings.length) {
      setExpandedKeys(new Set());
      return;
    }

    const all = new Set<string>();
    for (const mapping of mappings) {
      all.add(mappingKey(mapping));
    }
    setExpandedKeys(all);
  }

  const annotations: SheetAnnotation[] = [];
  for (const mapping of mappings) {
    const regions = regionsForMapping(mapping, blocksById);
    if (regions.length === 0) {
      continue;
    }

    const question =
      mapping.questionId === null
        ? null
        : questionsById.get(mapping.questionId) ?? null;

    const key = mappingKey(mapping);
    annotations.push({
      key,
      label: questionTag(question),
      regions,
      selected: key === selectedKey,
    });
  }

  function handleSelectAnnotation(key: string) {
    const mapping = mappings.find((m) => mappingKey(m) === key);
    if (mapping !== undefined) {
      handleSelect(mapping);
    }
  }

  const hasProblems = problems.gaps.length > 0 || problems.duplicates.length > 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 p-3">
      {usedProvider !== null && (
        <p className="px-1 text-xs text-muted-foreground">
          Read with{" "}
          <span className="font-medium text-ink">
            {usedProvider.name === "openrouter" ? "OpenRouter" : "Gemini"}
          </span>{" "}
          &middot; <span className="font-mono">{usedProvider.model}</span>
        </p>
      )}

      {hasProblems && (
        <p className="rounded-lg bg-brand-soft px-3 py-2 text-xs text-brand">
          Question numbering looks incomplete.
          {problems.gaps.length > 0 &&
            ` Missing: ${problems.gaps.join(", ")}.`}
          {problems.duplicates.length > 0 &&
            ` Repeated: ${problems.duplicates.join(", ")}.`}
        </p>
      )}

      <div className="flex justify-center lg:hidden">
        <div className="flex rounded-full bg-white p-1">
          <button
            type="button"
            onClick={() => setMobileTab("questions")}
            className={`rounded-full px-5 py-2 text-sm ${
              mobileTab === "questions" ? "bg-ink text-white" : "text-muted"
            }`}
          >
            Questions
          </button>
          <button
            type="button"
            onClick={() => setMobileTab("answer-sheet")}
            className={`rounded-full px-5 py-2 text-sm ${
              mobileTab === "answer-sheet" ? "bg-ink text-white" : "text-muted"
            }`}
          >
            Answer Sheet
          </button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 gap-3">
        <div
          className={`min-h-0 flex-1 ${
            mobileTab === "questions" ? "flex" : "hidden"
          } lg:flex`}
        >
          <QuestionList
            mappings={mappings}
            questionsById={questionsById}
            blocksById={blocksById}
            selectedKey={selectedKey}
            expandedKeys={expandedKeys}
            onSelect={handleSelect}
            onToggleExpand={handleToggleExpand}
            onExpandAll={handleExpandAll}
          />
        </div>

        <div
          className={`min-h-0 flex-1 ${
            mobileTab === "answer-sheet" ? "flex" : "hidden"
          } lg:flex`}
        >
          <AnswerSheetPane
            pages={answerPages}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            zoom={zoom}
            onZoomChange={setZoom}
            annotations={annotations}
            onSelectAnnotation={handleSelectAnnotation}
          />
        </div>
      </div>
    </div>
  );
}
