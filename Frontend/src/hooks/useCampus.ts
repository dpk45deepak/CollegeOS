import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { campusApi, CreateNoticeDto, CreateEventDto } from "@/services/api/campus.api";

export const campusKeys = {
  all: ["campus"] as const,
  notices: (params?: any) => [...campusKeys.all, "notices", params] as const,
  drafts: () => [...campusKeys.all, "notices", "drafts"] as const,
  clubs: () => [...campusKeys.all, "clubs"] as const,
  events: (params?: any) => [...campusKeys.all, "events", params] as const,
};

export function useNotices(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: campusKeys.notices(params),
    queryFn: () => campusApi.listNotices(params),
  });
}

export function useDraftNotices() {
  return useQuery({
    queryKey: campusKeys.drafts(),
    queryFn: () => campusApi.listDraftNotices(),
  });
}

export function useCreateNotice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateNoticeDto) => campusApi.createNotice(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: campusKeys.all }),
  });
}

export function usePublishNotice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => campusApi.publishNotice(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: campusKeys.all }),
  });
}

export function useClubs() {
  return useQuery({
    queryKey: campusKeys.clubs(),
    queryFn: () => campusApi.listClubs(),
  });
}

export function useCreateClub() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: { name: string; description?: string }) => campusApi.createClub(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: campusKeys.clubs() }),
  });
}

export function useEvents(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: campusKeys.events(params),
    queryFn: () => campusApi.listEvents(params),
  });
}

export function useCreateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateEventDto) => campusApi.createEvent(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...campusKeys.all, "events"] }),
  });
}

export function useUpdateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: Partial<CreateEventDto> }) => campusApi.updateEvent(id, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...campusKeys.all, "events"] }),
  });
}

