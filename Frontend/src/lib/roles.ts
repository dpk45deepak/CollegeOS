import type { User, UserRole } from "@/types";

export const ALL_ROLE_KEYS: readonly UserRole[] = [
  "SUPER_ADMIN",
  "COLLEGE_ADMIN",
  "EXAM_CONTROLLER",
  "ACCOUNTANT",
  "PLACEMENT_OFFICER",
  "HOD",
  "TEACHER",
  "SUPPORT_STAFF",
  "LIBRARY_STAFF",
  "PARENT",
  "STUDENT",
];

/** Priority order when a user holds multiple roles (e.g., TEACHER + HOD -> HOD). */
export const ROLE_PRIORITY: readonly UserRole[] = [
  "SUPER_ADMIN",
  "COLLEGE_ADMIN",
  "EXAM_CONTROLLER",
  "ACCOUNTANT",
  "PLACEMENT_OFFICER",
  "HOD",
  "TEACHER",
  "SUPPORT_STAFF",
  "LIBRARY_STAFF",
  "PARENT",
  "STUDENT",
];

export const ROLE_DISPLAY_NAMES: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  COLLEGE_ADMIN: "College Admin",
  ADMIN: "Administrator",
  EXAM_CONTROLLER: "Exam Controller",
  ACCOUNTANT: "Accountant",
  PLACEMENT_OFFICER: "Placement Officer",
  HOD: "Head of Dept",
  TEACHER: "Faculty",
  SUPPORT_STAFF: "Support Staff",
  LIBRARY_STAFF: "Library Staff",
  PARENT: "Parent / Guardian",
  STUDENT: "Student",
};

export function resolvePrimaryRole(roleKeys: string[] | undefined): UserRole {
  const normalized = (roleKeys ?? []).map((r) => (r === "ADMIN" ? "COLLEGE_ADMIN" : r));
  for (const candidate of ROLE_PRIORITY) {
    if (normalized.includes(candidate)) return candidate;
  }
  return "STUDENT";
}

export function getRoleHomePath(role?: string): string {
  switch (role) {
    case "STUDENT":
      return "/student/dashboard";
    case "PARENT":
      return "/parent/dashboard";
    case "TEACHER":
      return "/teacher/dashboard";
    case "HOD":
      return "/hod/dashboard";
    case "ACCOUNTANT":
      return "/accountant/dashboard";
    case "EXAM_CONTROLLER":
      return "/exam-controller/dashboard";
    case "PLACEMENT_OFFICER":
      return "/placement-officer/dashboard";
    case "SUPPORT_STAFF":
      return "/support/dashboard";
    case "LIBRARY_STAFF":
      return "/library/dashboard";
    case "ADMIN":
    case "COLLEGE_ADMIN":
    case "SUPER_ADMIN":
      return "/admin/dashboard";
    default:
      return "/profile";
  }
}

export const SHARED_AUTH_ROUTES = [
  "/notices",
  "/documents",
  "/messages",
  "/profile",
  "/settings",
  "/campus-life",
  "/student/ai",
];

export function isAuthorizedForPath(pathname: string, role: string, user?: User | null): boolean {
  if (SHARED_AUTH_ROUTES.some((r) => pathname === r || pathname.startsWith(`${r}/`))) {
    return true;
  }
  if (role === "COLLEGE_ADMIN" || role === "SUPER_ADMIN" || role === "ADMIN") {
    return true;
  }

  const allRoles = new Set<string>([role, ...(user?.roleKeys ?? [])]);

  if (pathname.startsWith("/parent")) {
    return allRoles.has("PARENT");
  }
  if (pathname.startsWith("/accountant")) {
    return allRoles.has("ACCOUNTANT");
  }
  if (pathname.startsWith("/exam-controller")) {
    return allRoles.has("EXAM_CONTROLLER");
  }
  if (pathname.startsWith("/placement-officer")) {
    return allRoles.has("PLACEMENT_OFFICER");
  }
  if (pathname.startsWith("/support")) {
    return allRoles.has("SUPPORT_STAFF") || allRoles.has("HOD");
  }
  if (pathname.startsWith("/library")) {
    return allRoles.has("LIBRARY_STAFF");
  }
  if (pathname.startsWith("/principal")) {
    return allRoles.has("HOD") || allRoles.has("COLLEGE_ADMIN") || allRoles.has("SUPER_ADMIN");
  }
  if (pathname.startsWith("/student")) {
    if (allRoles.has("STUDENT")) return true;
    if (allRoles.has("PARENT")) {
      return ["/student/attendance", "/student/timetable", "/student/assignments", "/student/exams", "/student/results", "/student/fees", "/student/complaints"].some(
        (p) => pathname.startsWith(p),
      );
    }
    if (allRoles.has("ACCOUNTANT") && pathname.startsWith("/student/fees")) return true;
    if (allRoles.has("PLACEMENT_OFFICER") && pathname.startsWith("/student/placements")) return true;
    if (allRoles.has("SUPPORT_STAFF") && pathname.startsWith("/student/complaints")) return true;
    if ((allRoles.has("HOD") || allRoles.has("ACCOUNTANT") || allRoles.has("EXAM_CONTROLLER")) && pathname.startsWith("/student/complaints")) return true;
    return false;
  }
  if (pathname.startsWith("/teacher")) {
    return allRoles.has("TEACHER") || allRoles.has("HOD");
  }
  if (pathname.startsWith("/hod")) {
    return allRoles.has("HOD");
  }
  if (pathname.startsWith("/admin")) {
    if (pathname.startsWith("/admin/analytics")) {
      return allRoles.has("HOD") || allRoles.has("ACCOUNTANT") || allRoles.has("EXAM_CONTROLLER") || allRoles.has("PLACEMENT_OFFICER");
    }
    return false;
  }
  return true;
}
