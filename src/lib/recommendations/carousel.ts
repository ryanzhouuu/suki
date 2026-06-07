export function nextIndexAfterDismiss(
  index: number,
  visibleLength: number,
): number {
  const nextLength = visibleLength - 1;
  if (nextLength <= 0) return 0;
  return index >= nextLength ? nextLength - 1 : index;
}
