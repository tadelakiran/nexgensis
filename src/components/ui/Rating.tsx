import { formatRating } from "@/lib/format";
import { StarIcon } from "./icons";

/**
 * Star rating.
 *
 * The fractional part is drawn by overlaying a clipped gold row on a grey row, so
 * a 4.3 rating really does show 4.3 stars rather than rounding. The visual row is
 * hidden from assistive tech and replaced with plain text.
 */

interface RatingProps {
  value: number;
  /** Number of reviews, shown in brackets when provided. */
  count?: number;
  className?: string;
}

export function Rating({ value, count, className }: RatingProps) {
  const clamped = Number.isFinite(value) ? Math.max(0, Math.min(5, value)) : 0;
  const filledPercent = (clamped / 5) * 100;

  const stars = (
    <>
      {Array.from({ length: 5 }, (_, index) => (
        <StarIcon key={index} className="size-3.5 shrink-0" />
      ))}
    </>
  );

  return (
    <span className={["inline-flex items-center gap-1.5", className].filter(Boolean).join(" ")}>
      <span className="relative inline-flex" aria-hidden="true">
        <span className="flex gap-0.5 text-slate-200">{stars}</span>
        <span
          className="absolute inset-y-0 left-0 flex gap-0.5 overflow-hidden text-amber-400"
          style={{ width: `${filledPercent}%` }}
        >
          {stars}
        </span>
      </span>

      <span className="text-xs font-semibold text-slate-700">{formatRating(clamped)}</span>

      {typeof count === "number" ? (
        <span className="text-xs text-slate-400">
          ({count === 1 ? "1 review" : `${count} reviews`})
        </span>
      ) : null}

      <span className="sr-only">
        Rated {formatRating(clamped)} out of 5
        {typeof count === "number" ? ` from ${count} reviews` : ""}
      </span>
    </span>
  );
}
