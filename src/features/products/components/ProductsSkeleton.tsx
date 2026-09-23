/**
 * Loading placeholder.
 *
 * Renders roughly the number of rows the page will contain so the layout does not
 * jump when the data arrives. Capped at 10 so a page size of 50 does not paint 50
 * animated placeholders.
 */

interface ProductsSkeletonProps {
  rows?: number;
}

const MAX_PLACEHOLDER_ROWS = 10;

export function ProductsSkeleton({ rows = 10 }: ProductsSkeletonProps) {
  const count = Math.min(Math.max(rows, 1), MAX_PLACEHOLDER_ROWS);

  return (
    <div aria-busy="true" aria-live="polite" className="min-h-[420px]">
      <span className="sr-only">Loading products…</span>

      {/* Desktop table skeleton */}
      <div className="hidden md:block">
        <div className="flex gap-4 border-b border-slate-200 bg-slate-50/70 px-5 py-3">
          {[38, 14, 12, 16, 14, 6].map((width, index) => (
            <div key={index} className="skeleton h-3 rounded" style={{ width: `${width}%` }} />
          ))}
        </div>

        {Array.from({ length: count }, (_, index) => (
          <div
            key={index}
            className="flex items-center gap-4 border-b border-slate-100 px-5 py-3.5 last:border-b-0"
          >
            <div className="skeleton size-12 shrink-0 rounded-xl" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-3.5 w-2/5 rounded" />
              <div className="skeleton h-3 w-1/5 rounded" />
            </div>
            <div className="skeleton h-6 w-24 rounded-full" />
            <div className="skeleton h-4 w-16 rounded" />
            <div className="skeleton h-4 w-24 rounded" />
            <div className="skeleton h-8 w-20 rounded-xl" />
          </div>
        ))}
      </div>

      {/* Mobile card skeleton */}
      <div className="flex flex-col gap-3 p-3 md:hidden">
        {Array.from({ length: Math.min(count, 4) }, (_, index) => (
          <div key={index} className="rounded-2xl border border-slate-200/80 bg-white p-4">
            <div className="flex gap-3.5">
              <div className="skeleton size-20 shrink-0 rounded-xl" />
              <div className="flex-1 space-y-2.5">
                <div className="skeleton h-4 w-4/5 rounded" />
                <div className="skeleton h-5 w-24 rounded-full" />
                <div className="skeleton h-4 w-1/3 rounded" />
                <div className="skeleton h-3.5 w-32 rounded" />
              </div>
            </div>
            <div className="mt-3.5 flex justify-end gap-2 border-t border-slate-100 pt-3">
              <div className="skeleton h-9 w-16 rounded-xl" />
              <div className="skeleton h-9 w-16 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
