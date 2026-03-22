import { divisionColors } from "@/lib/division";

export function DivisionBadge({ division }: { division: "MR" | "CR" | string }) {
  const color = divisionColors[division] ?? "bg-gray-100 text-gray-700";
  return (
    <span className={`inline-flex px-2 py-0.5 text-xs font-bold rounded-full ${color}`}>
      {division}
    </span>
  );
}
