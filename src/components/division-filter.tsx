"use client";

import { divisionLabels, divisionColors } from "@/lib/division";

type Props = {
  value: string;
  onChange: (v: string) => void;
  counts?: { MR: number; CR: number };
};

export function DivisionFilter({ value, onChange, counts }: Props) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onChange("all")}
        className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${
          value === "all"
            ? "bg-primary-600 text-text-inverse"
            : "bg-surface border border-border text-text-secondary hover:bg-surface-tertiary"
        }`}
      >
        全区分
      </button>
      {(["MR", "CR"] as const).map((div) => (
        <button
          key={div}
          onClick={() => onChange(value === div ? "all" : div)}
          className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${
            value === div
              ? "border-2 border-primary-400"
              : "border border-border hover:border-primary-200"
          } ${divisionColors[div]}`}
        >
          {divisionLabels[div]}
          {counts && (
            <span className="ml-1.5 text-xs">({counts[div]})</span>
          )}
        </button>
      ))}
    </div>
  );
}
