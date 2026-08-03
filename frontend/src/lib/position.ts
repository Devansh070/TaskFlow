// Calculates a position value that sits between two existing positions,
// so reordering never requires rewriting every row's position.
export function getPositionBetween(before: number | null, after: number | null): number {
  if (before === null && after === null) return 1000;
  if (before === null) return (after as number) - 1000;
  if (after === null) return before + 1000;
  return (before + after) / 2;
}