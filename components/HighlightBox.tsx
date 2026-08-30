"use client";

import { padRegion, regionToPercentStyle } from "@/lib/geometry";
import type { Region } from "@/lib/types";

const PADDING = 0.012;

type Props = {
  region: Region;
  label: string | null;
  dimmed: boolean;
  onClick: () => void;
};

export default function HighlightBox({ region, label, dimmed, onClick }: Props) {
  const paddedRegion = padRegion(region, PADDING);
  const style = regionToPercentStyle(paddedRegion);

  const boxClass = dimmed
    ? "border-dashed border-muted-foreground/45 bg-transparent hover:border-good-line hover:bg-good-line/10"
    : "border-good-line bg-good-line/15";

  const tagClass = dimmed
    ? "bg-white text-muted-foreground ring-1 ring-line"
    : "bg-good-line text-white";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label ?? "answer region"}
      className={`absolute rounded-md border-2 transition ${boxClass}`}
      style={style}
    >
      {label !== null && (
        <span
          className={`absolute -top-6 left-0 rounded-md px-2 py-0.5 text-xs font-semibold ${tagClass}`}
        >
          {label}
        </span>
      )}
    </button>
  );
}
