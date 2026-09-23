import { formatNumber } from "@/lib/format";
import { Badge } from "./Badge";

/**
 * Stock level at a glance. Three states, each with its own colour so a long table
 * can be scanned rather than read:
 *   0        → out of stock (rose)
 *   1..10    → low stock (amber)
 *   11+      → in stock (emerald)
 */

const LOW_STOCK_THRESHOLD = 10;

interface StockBadgeProps {
  stock: number;
}

export function StockBadge({ stock }: StockBadgeProps) {
  const safeStock = Number.isFinite(stock) ? Math.max(0, Math.floor(stock)) : 0;

  if (safeStock === 0) {
    return <Badge tone="danger">Out of stock</Badge>;
  }

  if (safeStock <= LOW_STOCK_THRESHOLD) {
    return <Badge tone="warning">Low · {formatNumber(safeStock)} left</Badge>;
  }

  return <Badge tone="success">In stock · {formatNumber(safeStock)}</Badge>;
}
