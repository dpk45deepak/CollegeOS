/** Reciprocal Rank Fusion: merges ranked id lists without needing comparable scores. */
export function rrf(lists: string[][], k = 60): Map<string, number> {
  const out = new Map<string, number>();
  for (const list of lists) list.forEach((id, rank) => out.set(id, (out.get(id) ?? 0) + 1 / (k + rank + 1)));
  return out;
}
