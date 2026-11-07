import { useQuery } from "@tanstack/react-query";
import { searchApi, SearchHit } from "@/services/api/search.api";

export function useSearch(query: string, types?: string[]) {
  const trimmed = query.trim();
  return useQuery<SearchHit[]>({
    queryKey: ["global_search", trimmed, types],
    queryFn: () => searchApi.search(trimmed, types),
    enabled: trimmed.length >= 2,
    staleTime: 1000 * 30, // 30 seconds
  });
}

