import { apiClient } from "./client";

export interface AdminAttentionMetric {
  id: string;
  category: "Attendance" | "Complaints" | "Finance" | "Placements" | "Academics" | "System";
  count: number;
  label: string;
  description: string;
  severity: "high" | "medium" | "low";
  actionText: string;
  actionUrl: string;
}

export interface AdminAnalyticsData {
  enrollmentTrend: { year: string; cse: number; ece: number; me: number; civil: number }[];
  attendanceByDept: { department: string; attendance: number; target: number }[];
  cgpaDistribution: { bracket: string; students: number }[];
  feeCollectionStatus: { name: string; value: number; fill: string }[];
  placementStats: { company: string; offers: number; avgPackage: number }[];
  complaintResolutionTime: { category: string; avgHours: number; openCount: number }[];
}

export interface ManagedUser {
  id: string;
  name: string;
  email: string;
  role: "STUDENT" | "TEACHER" | "HOD" | "ADMIN" | "PLACEMENT_OFFICER" | "ACCOUNTANT";
  department: string;
  status: "ACTIVE" | "INACTIVE" | "PENDING";
  joinedDate: string;
}

export interface TimetableConflictCheck {
  hasConflict: boolean;
  conflicts: {
    type: "TEACHER_CONFLICT" | "ROOM_CONFLICT" | "SECTION_CONFLICT";
    message: string;
    details: string;
  }[];
}

export interface AIAgentExecutionLog {
  id: string;
  timestamp: string;
  userRole: string;
  userName: string;
  query: string;
  intent: string;
  agentSelected: string;
  toolsUsed: string[];
  sourcesRetrieved: string[];
  responsePreview: string;
  latencyMs: number;
  status: "SUCCESS" | "FALLBACK" | "ERROR";
}

export const adminApi = {
  getAttentionMetrics: async (): Promise<AdminAttentionMetric[]> => {
    const mapActionUrl = (key?: string, action?: string): string => {
      if (action && action.startsWith("/")) return action;
      switch (key) {
        case "attendance_shortage":
          return "/hod/dashboard";
        case "attendance_corrections":
          return "/hod/dashboard";
        case "complaints_high":
        case "complaints_sla":
          return "/support/dashboard";
        case "fees_overdue":
          return "/accountant/dashboard";
        case "placement_drives_today":
        case "placement_jobs_closing":
          return "/placement-officer/dashboard";
        case "results_unpublished":
          return "/exam-controller/dashboard";
        case "documents_failed":
          return "/library/dashboard";
        case "students_high_risk":
          return "/principal/dashboard";
        case "scholarship_deadlines":
          return "/student/scholarships";
        case "assignment_deadlines":
          return "/teacher/assignments";
        default:
          return "/admin/analytics";
      }
    };
    const raw = await apiClient<any>("/analytics/attention");
    const items = Array.isArray(raw) ? raw : raw?.items || raw?.data || [];

    return items.map((item: any, idx: number) => {
      let category: AdminAttentionMetric["category"] = "Academics";
      if (item.key?.includes("attendance")) category = "Attendance";
      else if (item.key?.includes("complaint")) category = "Complaints";
      else if (item.key?.includes("fee")) category = "Finance";
      else if (item.key?.includes("job") || item.key?.includes("placement")) category = "Placements";
      else if (item.key?.includes("doc") || item.key?.includes("system")) category = "System";

      let severity: AdminAttentionMetric["severity"] = "low";
      if (item.severity === "CRITICAL" || item.severity === "HIGH") severity = "high";
      else if (item.severity === "MEDIUM") severity = "medium";

      return {
        id: `att_${idx}_${item.key || idx}`,
        category,
        count: item.count || 0,
        label: item.message || item.key || "Attention Needed",
        description: item.message || "",
        severity,
        actionText: "Review Item",
        actionUrl: mapActionUrl(item.key, item.action),
      };
    });
  },

  getAnalyticsData: async (): Promise<AdminAnalyticsData> => {
    const [overview, depts, exec] = await Promise.all([
      apiClient<any>("/analytics/overview"),
      apiClient<any[]>("/analytics/departments"),
      apiClient<any>("/analytics/executive").catch(() => null),
    ]);

    const attendanceByDept = Array.isArray(depts)
      ? depts.map((d: any) => ({
          department: d.department || "Dept",
          attendance: d.attendancePct ?? 0,
          target: overview?.attendanceThreshold ?? 75,
        }))
      : [];

    const feeCollectionStatus = overview?.feeCollection
      ? [
          { name: "Collected", value: overview.feeCollection.collected ?? 0, fill: "#10b981" },
          { name: "Pending", value: overview.feeCollection.outstanding ?? 0, fill: "#f59e0b" },
        ]
      : [];

    const cgpaDistribution = Array.isArray(exec?.cgpaDistribution)
      ? exec.cgpaDistribution.map((b: any) => ({
          bracket: b.bracket || b.range || "N/A",
          students: Number(b.students ?? b.count ?? 0),
        }))
      : Array.isArray(depts)
        ? depts
            .filter((d: any) => typeof d.avgCgpa === "number" && d.avgCgpa > 0)
            .map((d: any) => ({ bracket: `${d.department} Avg`, students: Number(d.avgCgpa.toFixed(2)) }))
        : [];

    const placementStats = Array.isArray(exec?.topRecruiters)
      ? exec.topRecruiters.map((r: any) => ({
          company: r.company || r.name || "Recruiter",
          offers: r.offers ?? r.count ?? 0,
          avgPackage: r.avgPackage ?? r.avgCtc ?? 0,
        }))
      : Array.isArray(exec?.placementStats)
        ? exec.placementStats
        : exec?.placementStats && typeof exec.placementStats === "object"
          ? [
              { company: "Total Jobs", offers: Number(exec.placementStats.totalJobs ?? 0), avgPackage: Number(exec.placementStats.averageCtc ?? 0) },
              { company: "Open Jobs", offers: Number(exec.placementStats.openJobs ?? 0), avgPackage: Number(exec.placementStats.averageCtc ?? 0) },
              { company: "Drives", offers: Number(exec.placementStats.drivesCount ?? 0), avgPackage: Number(exec.placementStats.averageCtc ?? 0) },
              { company: "Applications", offers: Number(exec.placementStats.applicationsCount ?? 0), avgPackage: Number(exec.placementStats.averageCtc ?? 0) },
              { company: "Offers Issued", offers: Number(exec.placementStats.offersIssued ?? 0), avgPackage: Number(exec.placementStats.averageCtc ?? 0) },
              { company: "Offers Accepted", offers: Number(exec.placementStats.offersAccepted ?? 0), avgPackage: Number(exec.placementStats.averageCtc ?? 0) },
            ].filter((row) => row.offers > 0)
          : [];

    return {
      enrollmentTrend: Array.isArray(exec?.enrollmentTrend) ? exec.enrollmentTrend : [],
      attendanceByDept,
      cgpaDistribution,
      feeCollectionStatus,
      placementStats,
      complaintResolutionTime: overview?.complaints
        ? [
            {
              category: "Overall",
              avgHours: overview.complaints.avgResolutionHours ?? 0,
              openCount: (overview.complaints.total ?? 0) - (overview.complaints.resolved ?? 0),
            },
          ]
        : [],
    };
  },

  getUsers: async (params?: { page?: number; limit?: number; search?: string }): Promise<ManagedUser[]> => {
    const raw = await apiClient<any>("/users", { params });
    const items = Array.isArray(raw) ? raw : raw?.items || raw?.data || [];

    return items.map((u: any) => ({
      id: u.id,
      name: `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.loginId,
      email: u.email,
      role: (u.userRoles?.[0]?.role?.key as any) || "STUDENT",
      roles: (u.userRoles || []).map((ur: any) => ur.role?.key).filter(Boolean),
      department: u.userRoles?.[0]?.department?.code || u.userRoles?.[0]?.departmentId || "General",
      status: u.status || "ACTIVE",
      joinedDate: u.createdAt ? new Date(u.createdAt).toISOString().split("T")[0] : "",
    }));
  },

  createUser: async (user: Partial<ManagedUser>) => {
    const names = (user.name || "").split(" ");
    const firstName = names[0] || "User";
    const lastName = names.slice(1).join(" ") || "Account";
    const rawRole = user.role || "STUDENT";
    const normalizedRole =
      rawRole === "ADMIN" ? "COLLEGE_ADMIN" : rawRole;

    return apiClient<ManagedUser>("/users", {
      method: "POST",
      body: JSON.stringify({
        loginId: user.email?.split("@")[0] || `USR${Date.now()}`,
        email: user.email,
        firstName,
        lastName,
        roles: [normalizedRole],
      }),
    });
  },

  checkTimetableConflict: async (dto: {
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    roomId?: string;
    subjectOfferingId: string;
  }): Promise<TimetableConflictCheck> => {
    try {
      const parseMin = (str: string) => {
        const [h, m] = str.split(":").map(Number);
        return (h || 0) * 60 + (m || 0);
      };
      const res = await apiClient<any>("/timetable/check", {
        method: "POST",
        body: JSON.stringify({
          dayOfWeek: dto.dayOfWeek,
          startMinute: parseMin(dto.startTime),
          endMinute: parseMin(dto.endTime),
          subjectOfferingId: dto.subjectOfferingId,
          roomId: dto.roomId || undefined,
          validFrom: new Date().toISOString(),
        }),
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

  getAIUsage: async (days: number = 7): Promise<{
    since: string;
    byModel: Array<{
      provider: string;
      model: string;
      kind: string;
      calls: number;
      avgLatencyMs: number;
      promptTokens: number;
      completionTokens: number;
    }>;
    errors: number;
    recentErrors: Array<{
      createdAt: string;
      model: string;
      kind: string;
      error: string;
      latencyMs?: number;
    }>;
    toolUse: Record<string, number>;
  } | null> => {
    return apiClient<any>(`/ai/admin/usage?days=${days}`).catch(() => null);
  },

  getAILogs: async (days: number = 7): Promise<AIAgentExecutionLog[]> => {
    const raw = await apiClient<any>(`/ai/admin/usage?days=${days}`);
    if (!raw || !raw.byModel) return [];

    return (raw.recentErrors || []).map((err: any, idx: number) => ({
      id: err.id || `err_${idx}`,
      timestamp: err.createdAt || new Date().toISOString(),
      userRole: err.userRole || err.kind || "SYSTEM",
      userName: err.userName || err.provider || "AI Runtime",
      query: err.query || `Model invocation: ${err.model || "default"}`,
      intent: err.kind || "general",
      agentSelected: err.agent || err.kind || "AI Pipeline",
      toolsUsed: Array.isArray(err.toolsUsed) ? err.toolsUsed : [],
      sourcesRetrieved: Array.isArray(err.sourcesRetrieved) ? err.sourcesRetrieved : [],
      responsePreview: err.error || "Execution error logged",
      latencyMs: err.latencyMs || 0,
      status: "ERROR" as const,
    }));
  },
};
