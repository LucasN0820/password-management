export const PASSWORD_LIST_VIRTUALIZATION_THRESHOLD = 50;
export const CANDIDATE_LIST_VIRTUALIZATION_THRESHOLD = 20;

export function shouldVirtualizeList(
  itemCount: number,
  threshold: number
): boolean {
  return threshold > 0 && itemCount >= threshold;
}
