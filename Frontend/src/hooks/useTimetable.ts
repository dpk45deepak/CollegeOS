import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { timetableApi, CreateSlotPayload } from "@/services/api/timetable.api";

export const timetableKeys = {
  all: ["timetable"] as const,
  section: (id: string) => [...timetableKeys.all, "section", id] as const,
  teacher: () => [...timetableKeys.all, "teacher"] as const,
  rooms: () => [...timetableKeys.all, "rooms"] as const,
};

export function useSectionTimetable(sectionId: string) {
  return useQuery({
    queryKey: timetableKeys.section(sectionId),
    queryFn: () => timetableApi.getForSection(sectionId),
    enabled: !!sectionId,
  });
}

export function useTeacherTimetable() {
  return useQuery({
    queryKey: timetableKeys.teacher(),
    queryFn: () => timetableApi.getMyTeacherTimetable(),
  });
}

export function useCreateTimetableSlot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateSlotPayload) => timetableApi.createSlot(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: timetableKeys.all }),
  });
}

export function useDeleteTimetableSlot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => timetableApi.deleteSlot(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: timetableKeys.all }),
  });
}

export function useCheckTimetableConflict() {
  return useMutation({
    mutationFn: (dto: CreateSlotPayload) => timetableApi.checkConflict(dto),
  });
}

export function useRooms() {
  return useQuery({
    queryKey: timetableKeys.rooms(),
    queryFn: () => timetableApi.listRooms(),
  });
}

export function useCreateRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: timetableApi.createRoom,
    onSuccess: () => qc.invalidateQueries({ queryKey: timetableKeys.rooms() }),
  });
}

