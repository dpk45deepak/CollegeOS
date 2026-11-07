import { apiClient } from "@/lib/api/client";

export interface NoticeItem {
  id: string;
  title: string;
  body: string;
  published: boolean;
  publishedAt?: string | null;
  expiresAt?: string | null;
  createdAt: string;
  departmentId?: string | null;
  audienceRoles?: string[];
  attachmentKeys?: string[];
  department?: { id: string; code: string; name: string };
  author?: { firstName: string; lastName: string };
}

export interface ClubItem {
  id: string;
  name: string;
  description?: string | null;
  _count?: { events?: number };
}

export interface CampusEventItem {
  id: string;
  title: string;
  description?: string | null;
  venue?: string | null;
  clubId?: string | null;
  startsAt: string;
  endsAt?: string | null;
  club?: ClubItem;
}

export interface CreateNoticeDto {
  title: string;
  body: string;
  departmentId?: string;
  audienceRoles?: string[];
  attachmentKeys?: string[];
  expiresAt?: string;
}

export interface CreateEventDto {
  title: string;
  description?: string;
  venue?: string;
  clubId?: string;
  startsAt: string;
  endsAt?: string;
}

export const campusApi = {
  // Notices
  listNotices: async (params?: { page?: number; limit?: number }): Promise<NoticeItem[]> => {
    const raw = await apiClient<any>("/notices", { params });
    return Array.isArray(raw) ? raw : raw?.items || raw?.data || [];
  },

  listDraftNotices: async (): Promise<NoticeItem[]> => {
    const raw = await apiClient<any>("/notices/drafts");
    return Array.isArray(raw) ? raw : raw?.items || raw?.data || [];
  },

  createNotice: async (dto: CreateNoticeDto): Promise<NoticeItem> => {
    return apiClient<NoticeItem>("/notices", {
      method: "POST",
      body: JSON.stringify(dto),
    });
  },

  publishNotice: async (id: string): Promise<NoticeItem> => {
    return apiClient<NoticeItem>(`/notices/${id}/publish`, { method: "POST" });
  },

  // Clubs
  listClubs: async (): Promise<ClubItem[]> => {
    const raw = await apiClient<any>("/clubs");
    return Array.isArray(raw) ? raw : raw?.items || raw?.data || [];
  },

  createClub: async (dto: { name: string; description?: string }): Promise<ClubItem> => {
    return apiClient<ClubItem>("/clubs", {
      method: "POST",
      body: JSON.stringify(dto),
    });
  },

  // Events
  listEvents: async (params?: { page?: number; limit?: number }): Promise<CampusEventItem[]> => {
    const raw = await apiClient<any>("/events", { params });
    return Array.isArray(raw) ? raw : raw?.items || raw?.data || [];
  },

  createEvent: async (dto: CreateEventDto): Promise<CampusEventItem> => {
    return apiClient<CampusEventItem>("/events", {
      method: "POST",
      body: JSON.stringify(dto),
    });
  },

  updateEvent: async (id: string, dto: Partial<CreateEventDto>): Promise<CampusEventItem> => {
    return apiClient<CampusEventItem>(`/events/${id}`, {
      method: "PATCH",
      body: JSON.stringify(dto),
    });
  },
};

