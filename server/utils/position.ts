const GAP = 1000

export function firstPosition() {
  return GAP
}

export function nextPosition(lastPosition: number | undefined) {
  return (lastPosition ?? 0) + GAP
}

/**
 * Position for an item dropped between `before` and `after` (either can be
 * absent at the ends of the list). Uses the midpoint so most reorders never
 * touch other rows; callers should rebalance the column if this narrows to 0.
 */
export function positionBetween(before: number | undefined, after: number | undefined) {
  if (before === undefined && after === undefined) return GAP
  if (before === undefined) return after! / 2
  if (after === undefined) return before + GAP
  return (before + after) / 2
}
