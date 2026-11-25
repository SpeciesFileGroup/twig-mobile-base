/** Turn from `from` to `to` the short way round (0 → 270 turns -90, not +270) */
export function nearestRotation(from: number, to: number): number {
  const delta = ((((to - from) % 360) + 540) % 360) - 180
  return from + delta
}
