import { apiClient } from "@/lib/api/client";

export type DayOfWeek = "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN";

export interface TimetableSlot {
  id: string;
  subjectOfferingId: string;
  roomId?: string | null;
  dayOfWeek: DayOfWeek;
  startMinute: number;
  endMinute: number;
  validFrom: string;
  validTo?: string | null;
  subjectOffering?: {
    id: string;
    subject?: { code: string; name: string };
    teacher?: { user?: { firstName: string; lastName: string } };
    section?: { name: string };
  };
  room?: { id: string; code: string; capacity?: number };
}

export interface RoomItem {
  id: string;
  campusId: string;
  code: string;
  capacity: number;
}

export interface ConflictResult {
  hasConflict: boolean;
  conflicts: Array<{
    type: "TEACHER_CONFLICT" | "ROOM_CONFLICT" | "SECTION_CONFLICT" | string;
    message: string;
    details?: string;
  }>;
}

export interface CreateSlotPayload {
  subjectOfferingId: string;
  roomId?: string;
  dayOfWeek: DayOfWeek;
  startMinute: number;
  endMinute: number;
  validFrom: string;
  validTo?: string;
}

export function timeStringToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function minutesToTimeString(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export const timetableApi = {
  createSlot: async (dto: CreateSlotPayload): Promise<TimetableSlot> => {
    return apiClient<TimetableSlot>("/timetable/slots", {
      method: "POST",
      body: JSON.stringify(dto),
    });
  },

  checkConflict: async (dto: CreateSlotPayload): Promise<ConflictResult> => {
    try {
      const res = await apiClient<any>("/timetable/check", {
        method: "POST",
        body: JSON.stringify(dto),
      });

      const conflicts = Array.isArray(res) ? res : res?.conflicts || [];
      return {
        hasConflict: conflicts.length > 0,
        conflicts: conflicts.map((c: any) => ({
          type: c.type || "SECTION_CONFLICT",
          message: c.message || "Conflict detected in schedule",
          details: c.details || "",
        })),
      };
    } catch (err: any) {
      if (err.status === 409 && err.data?.conflicts) {
        return {
          hasConflict: true,
          conflicts: err.data.conflicts,
        };
      }
      throw err;
    }
  },

  deleteSlot: async (id: string): Promise<void> => {
    return apiClient<void>(`/timetable/slots/${id}`, { method: "DELETE" });
  },

  getForSection: async (sectionId: string): Promise<TimetableSlot[]> => {
    const raw = await apiClient<any>(`/timetable/sections/${sectionId}`);
    return Array.isArray(raw) ? raw : raw?.items || raw?.data || [];
  },

  getMyTeacherTimetable: async (): Promise<TimetableSlot[]> => {
    const raw = await apiClient<any>("/timetable/teachers/me");
    return Array.isArray(raw) ? raw : raw?.items || raw?.data || [];
  },

  setTeacherAvailability: async (teacherId: string, windows: Array<{ dayOfWeek: DayOfWeek; startMinute: number; endMinute: number }>) => {
    return apiClient<any>(`/timetable/teachers/${teacherId}/availability`, {
      method: "PUT",
      body: JSON.stringify({ windows }),
    });
  },

  listRooms: async (): Promise<RoomItem[]> => {
    const raw = await apiClient<any>("/timetable/rooms");
    return Array.isArray(raw) ? raw : raw?.items || raw?.data || [];
  },

  createRoom: async (dto: { campusId: string; code: string; capacity: number }): Promise<RoomItem> => {
    return apiClient<RoomItem>("/timetable/rooms", {
      method: "POST",
      body: JSON.stringify(dto),
    });
  },
};

