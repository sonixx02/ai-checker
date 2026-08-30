"use client";

import { ChevronLeft, ChevronRight, Minus, Plus } from "lucide-react";
import HighlightBox from "./HighlightBox";
import { describeOtherPages } from "@/lib/pageNotice";
import type { PageImage } from "@/lib/rasterize";
import type { Region } from "@/lib/types";

const ZOOM_STEP = 20;
const MIN_ZOOM = 60;
const MAX_ZOOM = 200;

export type SheetAnnotation = {
  key: string;
  label: string;
  regions: Region[];
  selected: boolean;
};

type Props = {
  pages: PageImage[];
  currentPage: number;
  onPageChange: (page: number) => void;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  annotations: SheetAnnotation[];
  onSelectAnnotation: (key: string) => void;
};

export default function AnswerSheetPane({
  pages,
  currentPage,
  onPageChange,
  zoom,
  onZoomChange,
  annotations,
  onSelectAnnotation,
}: Props) {
  const page = pages[currentPage];

  const selected = annotations.find((a) => a.selected) ?? null;

  const onThisPage: { annotation: SheetAnnotation; region: Region }[] = [];
  for (const annotation of annotations) {
    for (const region of annotation.regions) {
      if (region.page === currentPage) {
        onThisPage.push({ annotation, region });
      }
    }
  }

  const notice =
    selected === null ? null : describeOtherPages(selected.regions, currentPage);

  function zoomOut() {
    const next = zoom - ZOOM_STEP;
    onZoomChange(next < MIN_ZOOM ? MIN_ZOOM : next);
  }

  function zoomIn() {
    const next = zoom + ZOOM_STEP;
    onZoomChange(next > MAX_ZOOM ? MAX_ZOOM : next);
  }

  function goToPreviousPage() {
    if (currentPage > 0) {
      onPageChange(currentPage - 1);
    }
  }

  function goToNextPage() {
    if (currentPage < pages.length - 1) {
      onPageChange(currentPage + 1);
    }
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col rounded-2xl border border-line bg-white">
      <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
        <h2 className="text-sm font-semibold">Answer Sheet</h2>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-full bg-surface px-3 py-1.5 text-xs">
            <button
              type="button"
              onClick={zoomOut}
              aria-label="Zoom out"
              className="text-muted hover:text-ink"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="w-10 text-center font-medium">{zoom}%</span>
            <button
              type="button"
              onClick={zoomIn}
              aria-label="Zoom in"
              className="text-muted hover:text-ink"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-2 rounded-full bg-surface px-3 py-1.5 text-xs">
            <button
              type="button"
              onClick={goToPreviousPage}
              disabled={currentPage === 0}
              aria-label="Previous page"
              className="text-muted disabled:opacity-30 hover:text-ink"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <span className="font-medium">
              Page {currentPage + 1} of {pages.length}
            </span>
            <button
              type="button"
              onClick={goToNextPage}
              disabled={currentPage === pages.length - 1}
              aria-label="Next page"
              className="text-muted disabled:opacity-30 hover:text-ink"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </header>

      {notice !== null && (
        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 border-b border-line bg-good-soft px-4 py-2 text-xs text-good">
          <span>{notice.lead}</span>
          {notice.pageIndexes.map((pageIndex) => (
            <button
              key={pageIndex}
              type="button"
              onClick={() => onPageChange(pageIndex)}
              className="rounded bg-white px-1.5 py-0.5 font-medium underline-offset-2 hover:underline"
            >
              page {pageIndex + 1}
            </button>
          ))}
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-auto bg-surface p-4">
        <div className="mx-auto" style={{ width: `${zoom}%` }}>
          <div className="relative">
            {page !== undefined && (
              <img
                src={page.dataUrl}
                alt={`Answer sheet page ${currentPage + 1}`}
                className="block w-full rounded-lg border border-line bg-white"
              />
            )}
            {onThisPage.map(({ annotation, region }, index) => (
              <HighlightBox
                key={`${annotation.key}-${index}`}
                region={region}
                label={annotation.label}
                dimmed={!annotation.selected}
                onClick={() => onSelectAnnotation(annotation.key)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
