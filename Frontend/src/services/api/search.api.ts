import { apiClient } from "@/lib/api/client";

export interface SearchHit {
  type: string;
  id: string;
  title: string;
  subtitle?: string;
}

export interface SearchResponse {
  query: string;
  results: SearchHit[];
}

export const searchApi = {
  search: async (q: string, types?: string[]): Promise<SearchHit[]> => {
    if (!q || q.trim().length < 2) return [];
    const params: Record<string, string> = { q: q.trim() };
    if (types && types.length > 0) {
      params.types = types.join(",");
    }
    const raw = await apiClient<any>("/search", { params });
    if (Array.isArray(raw)) return raw;
    if (raw?.results && Array.isArray(raw.results)) return raw.results;
    if (raw?.data?.results && Array.isArray(raw.data.results)) return raw.data.results;
    return [];
  },
};

