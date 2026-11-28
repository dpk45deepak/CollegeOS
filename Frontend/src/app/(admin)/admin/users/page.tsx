"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import {
  Users,
  Plus,
  Search,
  Shield,
  Filter,
  UserCheck,
  UserX,
  GraduationCap,
  Briefcase,
  Key,
  Building2,
  Edit2,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { useAuthStore } from "@/lib/auth/authStore";
import {
  useUsers,
  useCreateUser,
  useUpdateUserRoles,
  useUpdateUserStatus,
} from "@/hooks/useUsers";
import { useStudents, useCreateStudent, useUpdateStudent } from "@/hooks/useStudents";
import { useCreateTeacher } from "@/hooks/useFaculty";
import {
  useColleges,
  useCreateCollege,
  useDepartments,
  usePrograms,
  useBatches,
  useSemesters,
  useSections,
} from "@/hooks/useAcademic";
import { UserItem } from "@/services/api/users.api";
import { StudentProfile, StudentGender } from "@/services/api/students.api";

type UserModal =
  | "CREATE_USER"
  | "ONBOARD_STUDENT"
  | "EDIT_STUDENT"
  | "ONBOARD_TEACHER"
  | "EDIT_ROLES"
  | "CREATE_COLLEGE";

export default function AdminUsersPage() {
  const { user: currentUser } = useAuthStore();
  const isSuperAdmin =
    currentUser?.role === "SUPER_ADMIN" ||
    (currentUser?.roleKeys || []).includes("SUPER_ADMIN");

  const [activeDirectoryTab, setActiveDirectoryTab] = useState<"USERS" | "STUDENTS" | "COLLEGES">("USERS");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [activeModal, setActiveModal] = useState<UserModal | null>(null);
  const [selectedUserForRoles, setSelectedUserForRoles] = useState<UserItem | null>(null);
  const [editingStudent, setEditingStudent] = useState<StudentProfile | null>(null);

  // Queries
  const { data: usersData, isLoading, error, refetch } = useUsers({ search: search || undefined });
  const { data: studentsRaw, isLoading: loadingStudents, refetch: refetchStudents } = useStudents({ search: search || undefined, limit: 50 });
  const { data: collegesList = [] } = useColleges(isSuperAdmin);
  const { data: departments } = useDepartments();
  const { data: programs } = usePrograms();
  const { data: batches } = useBatches();
  const { data: semesters } = useSemesters();
  const { data: sections } = useSections();

  // Mutations
  const createUserMutation = useCreateUser();
  const createStudentMutation = useCreateStudent();
  const updateStudentMutation = useUpdateStudent();
  const createTeacherMutation = useCreateTeacher();
  const updateRolesMutation = useUpdateUserRoles();
  const updateStatusMutation = useUpdateUserStatus();
  const createCollegeMutation = useCreateCollege();

  // Create College (Super Admin) State
  const [colCode, setColCode] = useState("");
  const [colName, setColName] = useState("");
  const [colAdminLogin, setColAdminLogin] = useState("ADMIN001");
  const [colAdminEmail, setColAdminEmail] = useState("");
  const [colAdminPassword, setColAdminPassword] = useState("Admin@12345");

  // Edit Student State
  const [editRollNo, setEditRollNo] = useState("");
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editDept, setEditDept] = useState("");
  const [editProg, setEditProg] = useState("");
  const [editBatch, setEditBatch] = useState("");
  const [editSem, setEditSem] = useState("");
  const [editSec, setEditSec] = useState("");
  const [editGender, setEditGender] = useState<StudentGender>("MALE");
  const [editDob, setEditDob] = useState("");

  // Standard User Form State
  const [userLoginId, setUserLoginId] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userFirstName, setUserFirstName] = useState("");
  const [userLastName, setUserLastName] = useState("");
  const [userRole, setUserRole] = useState("COLLEGE_ADMIN");
  const [userDeptId, setUserDeptId] = useState("");
  const [userPassword, setUserPassword] = useState("");

  // Student Onboarding State
  const [stdCollegeId, setStdCollegeId] = useState("");
  const [stdRollNo, setStdRollNo] = useState("");
  const [stdEmail, setStdEmail] = useState("");
  const [stdFirstName, setStdFirstName] = useState("");
  const [stdLastName, setStdLastName] = useState("");
  const [stdPhone, setStdPhone] = useState("");
  const [stdDeptId, setStdDeptId] = useState("");
  const [stdProgId, setStdProgId] = useState("");
  const [stdBatchId, setStdBatchId] = useState("");
  const [stdSectionId, setStdSectionId] = useState("");
  const [stdDob, setStdDob] = useState("2004-05-15");
  const [stdGender, setStdGender] = useState<"MALE" | "FEMALE" | "OTHER">("MALE");
  const [stdGuardianName, setStdGuardianName] = useState("");
  const [stdGuardianPhone, setStdGuardianPhone] = useState("");
  const [stdPassword, setStdPassword] = useState("Student@12345");

  // Faculty Onboarding State
  const [facEmpId, setFacEmpId] = useState("");
  const [facEmail, setFacEmail] = useState("");
  const [facFirstName, setFacFirstName] = useState("");
  const [facLastName, setFacLastName] = useState("");
  const [facPhone, setFacPhone] = useState("");
  const [facDeptId, setFacDeptId] = useState("");
  const [facDesignation, setFacDesignation] = useState("Assistant Professor");
  const [facQualifications, setFacQualifications] = useState("Ph.D. / M.Tech");
  const [facIsHod, setFacIsHod] = useState(false);
  const [facPassword, setFacPassword] = useState("Faculty@12345");

  // Edit Roles State
  const [editRolesList, setEditRolesList] = useState<string[]>([]);
  const [editDeptId, setEditDeptId] = useState<string>("");

  const rawUsers = Array.isArray(usersData) ? usersData : (usersData as any)?.items || [];
  const filtered = (rawUsers || []).filter((u: UserItem) => {
    if (!u) return false;
    const userRoleKeys = (u.userRoles || []).map((ur: any) => ur.role?.key).filter(Boolean);
    const matchesRole = roleFilter === "ALL" || userRoleKeys.includes(roleFilter) || (userRoleKeys.length === 0 && roleFilter === "STUDENT");
    return matchesRole;
  });

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    await createUserMutation.mutateAsync({
      loginId: userLoginId || userEmail.split("@")[0],
      email: userEmail,
      firstName: userFirstName,
      lastName: userLastName,
      roles: [userRole],
      departmentIds: userDeptId ? [userDeptId] : undefined,
      initialPassword: userPassword || undefined,
    });
    setActiveModal(null);
  };

  const handleOnboardStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    await createStudentMutation.mutateAsync({
      collegeStudentId: stdCollegeId || stdRollNo,
      rollNumber: stdRollNo,
      email: stdEmail,
      firstName: stdFirstName,
      lastName: stdLastName,
      phone: stdPhone || undefined,
      departmentId: stdDeptId || (departments && departments[0]?.id) || "",
      programId: stdProgId || (programs && programs[0]?.id) || "",
      batchId: stdBatchId || (batches && batches[0]?.id) || "",
      sectionId: stdSectionId || undefined,
      dateOfBirth: stdDob,
      gender: stdGender,
      guardians: stdGuardianName
        ? [{ name: stdGuardianName, relation: "Parent", phone: stdGuardianPhone }]
        : undefined,
      initialPassword: stdPassword || undefined,
    });
    setActiveModal(null);
  };

  const handleOnboardTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    await createTeacherMutation.mutateAsync({
      employeeId: facEmpId,
      email: facEmail,
      firstName: facFirstName,
      lastName: facLastName,
      phone: facPhone || undefined,
      departmentId: facDeptId || (departments && departments[0]?.id) || "",
      designation: facDesignation,
      qualifications: facQualifications,
      isHod: facIsHod,
      initialPassword: facPassword || undefined,
    });
    setActiveModal(null);
  };

  const handleOpenEditRoles = (user: UserItem) => {
    setSelectedUserForRoles(user);
    const existingRoles = (user.userRoles || []).map((r) => r.role.key);
    setEditRolesList(existingRoles.length > 0 ? existingRoles : ["STUDENT"]);
    setEditDeptId(user.userRoles?.[0]?.departmentId || "");
    setActiveModal("EDIT_ROLES");
  };

  const handleSaveRoles = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForRoles) return;
    await updateRolesMutation.mutateAsync({
      id: selectedUserForRoles.id,
      roles: editRolesList,
      departmentIds: editDeptId ? [editDeptId] : undefined,
    });
    setActiveModal(null);
  };

  const rawStudents: StudentProfile[] = Array.isArray(studentsRaw)
    ? studentsRaw
    : (studentsRaw as any)?.items || [];

  const handleOpenEditStudent = (st: StudentProfile) => {
    setEditingStudent(st);
    setEditRollNo(st.rollNumber || "");
    setEditFirstName(st.user?.firstName || "");
    setEditLastName(st.user?.lastName || "");
    setEditPhone(st.user?.phone || "");
    setEditDept(st.department?.id || "");
    setEditProg(st.program?.id || "");
    setEditBatch(st.batch?.id || "");
    setEditSem(st.semester?.id || "");
    setEditSec(st.section?.id || "");
    setEditGender(st.gender || "MALE");
    setEditDob(st.dateOfBirth ? String(st.dateOfBirth).split("T")[0] : "");
    setActiveModal("EDIT_STUDENT");
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    try {
      await updateStudentMutation.mutateAsync({
        id: editingStudent.id,
        dto: {
          rollNumber: editRollNo.trim() || undefined,
          firstName: editFirstName.trim() || undefined,
          lastName: editLastName.trim() || undefined,
          phone: editPhone.trim() || undefined,
          departmentId: editDept || undefined,
          programId: editProg || undefined,
          batchId: editBatch || undefined,
          semesterId: editSem || undefined,
          sectionId: editSec || undefined,
          gender: editGender,
          dateOfBirth: editDob || undefined,
        },
      });
      toast.success("Student record updated.");
      setActiveModal(null);
      refetchStudents();
    } catch (err: any) {
      toast.error(err?.message || "Failed to update student");
    }
  };

  const handleCreateCollege = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createCollegeMutation.mutateAsync({
        code: colCode.trim(),
        name: colName.trim(),
        adminLoginId: colAdminLogin.trim(),
        adminEmail: colAdminEmail.trim(),
        adminPassword: colAdminPassword,
      });
      toast.success("College tenant and administrator provisioned.");
      setActiveModal(null);
      setColCode("");
      setColName("");
      setColAdminEmail("");
    } catch (err: any) {
      toast.error(err?.message || "Failed to onboard college");
    }
  };

  const handleToggleStatus = async (user: UserItem) => {
    const nextStatus = user.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      await updateStatusMutation.mutateAsync({
        id: user.id,
        status: nextStatus,
      });
      toast.success(`User marked ${nextStatus}.`);
    } catch (err: any) {
      toast.error(err?.message || "Failed to update status");
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h1 className="text-xl font-bold text-foreground">
            Identity, RBAC & Institutional User Directory
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Full lifecycle account provisioning: student onboarding with guardians, faculty appointments, HOD elevations, and permissions management.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isSuperAdmin && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setActiveModal("CREATE_COLLEGE")}
              className="text-xs gap-1.5 h-8 shadow-sm"
            >
              <Building2 className="h-4 w-4 text-primary" /> Onboard College
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setActiveModal("ONBOARD_STUDENT")}
            className="text-xs gap-1.5 h-8 shadow-sm"
          >
            <GraduationCap className="h-4 w-4 text-primary" /> Onboard Student
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setActiveModal("ONBOARD_TEACHER")}
            className="text-xs gap-1.5 h-8 shadow-sm"
          >
            <Briefcase className="h-4 w-4 text-primary" /> Add Faculty
          </Button>
          <Button
            size="sm"
            onClick={() => setActiveModal("CREATE_USER")}
            className="text-xs gap-1.5 h-8 shadow-sm"
          >
            <Plus className="h-4 w-4" /> Add User / Admin
          </Button>
        </div>
      </div>

      {/* Directory Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-2 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveDirectoryTab("USERS")}
          className={`px-3 py-1.5 rounded-lg transition-colors ${
            activeDirectoryTab === "USERS" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
          }`}
        >
          User Accounts &amp; Roles
        </button>
        <button
          type="button"
          onClick={() => setActiveDirectoryTab("STUDENTS")}
          className={`px-3 py-1.5 rounded-lg transition-colors ${
            activeDirectoryTab === "STUDENTS" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
          }`}
        >
          Students Academic Profiles
        </button>
        {isSuperAdmin && (
          <button
            type="button"
            onClick={() => setActiveDirectoryTab("COLLEGES")}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeDirectoryTab === "COLLEGES" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            College Tenants ({collegesList.length})
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card p-3 rounded-xl border border-border">
        <div className="w-full sm:w-80">
          <Input
            placeholder="Search by name, email, roll number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search className="h-3.5 w-3.5" />}
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            id="roleFilter"
            aria-label="Filter users by role"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="h-8 rounded-lg border border-input bg-background px-2.5 text-xs font-semibold"
          >
            <option value="ALL">All Roles</option>
            <option value="STUDENT">Students</option>
            <option value="PARENT">Parents / Guardians</option>
            <option value="TEACHER">Faculty / Teachers</option>
            <option value="HOD">Heads of Department (HOD)</option>
            <option value="EXAM_CONTROLLER">Exam Controllers</option>
            <option value="ACCOUNTANT">Accountants</option>
            <option value="PLACEMENT_OFFICER">Placement Officers</option>
            <option value="LIBRARY_STAFF">Library Staff</option>
            <option value="SUPPORT_STAFF">Support Staff</option>
            <option value="COLLEGE_ADMIN">College Administrators</option>
            <option value="SUPER_ADMIN">Super Administrators</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      {activeDirectoryTab === "USERS" && (
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          {isLoading ? (
            <div className="p-6">
              <Skeleton className="h-64 w-full rounded-xl" />
            </div>
          ) : error ? (
            <div className="p-6">
              <ErrorState message="Could not load institutional user directory." onRetry={refetch} />
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">
              No users found matching the search criteria.
            </div>
          ) : (
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] font-semibold border-b border-border">
                <tr>
                  <th className="p-3 pl-4">Name / Login ID</th>
                  <th className="p-3">Email Address</th>
                  <th className="p-3">Assigned Roles</th>
                  <th className="p-3">Department Scope</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right pr-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((u: UserItem) => {
                  const roleKey = u.userRoles?.[0]?.role?.key || "STUDENT";
                  const deptName = u.userRoles?.[0]?.department?.name || u.userRoles?.[0]?.department?.code || "College-wide";
                  return (
                    <tr key={u.id} className="hover:bg-muted/20">
                      <td className="p-3 pl-4">
                        <div className="font-semibold text-foreground">
                          {u.firstName} {u.lastName}
                        </div>
                        <div className="font-mono text-muted-foreground text-[11px]">{u.loginId}</div>
                      </td>
                      <td className="p-3 font-mono text-muted-foreground">{u.email}</td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1">
                          {(u.userRoles || []).map((ur, idx) => (
                            <span key={`${ur.role.key}-${ur.departmentId ?? idx}`} className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                              {ur.role.key}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-3 text-muted-foreground">{deptName}</td>
                      <td className="p-3">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            u.status === "ACTIVE"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                              : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                          }`}
                        >
                          {u.status}
                        </span>
                      </td>
                      <td className="p-3 text-right pr-4">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-[11px] gap-1 px-2"
                            onClick={() => handleOpenEditRoles(u)}
                          >
                            <Shield className="h-3 w-3" /> Roles
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className={`h-7 text-[11px] px-2 ${u.status === "ACTIVE" ? "text-rose-600 hover:text-rose-700" : "text-emerald-600 hover:text-emerald-700"}`}
                            onClick={() => handleToggleStatus(u)}
                          >
                            {u.status === "ACTIVE" ? <UserX className="h-3 w-3" /> : <UserCheck className="h-3 w-3" />}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
      )}

      {/* Students Profile Table (PATCH /students/:id) */}
      {activeDirectoryTab === "STUDENTS" && (
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            {loadingStudents ? (
              <div className="p-6"><Skeleton className="h-48 w-full rounded-xl" /></div>
            ) : rawStudents.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground">No student profiles found.</div>
            ) : (
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] font-semibold border-b border-border">
                  <tr>
                    <th className="p-3 pl-4">Roll No / Name</th>
                    <th className="p-3">Dept / Program</th>
                    <th className="p-3">Batch / Sem / Section</th>
                    <th className="p-3">CGPA</th>
                    <th className="p-3 text-right pr-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {rawStudents.map((st) => (
                    <tr key={st.id} className="hover:bg-muted/20">
                      <td className="p-3 pl-4">
                        <div className="font-semibold text-foreground">{st.user?.firstName} {st.user?.lastName}</div>
                        <div className="font-mono text-[11px] text-muted-foreground">{st.rollNumber} • {st.user?.email}</div>
                      </td>
                      <td className="p-3 text-muted-foreground">{st.department?.code} • {st.program?.code}</td>
                      <td className="p-3 text-muted-foreground">
                        {st.batch?.name} • Sem {st.semester?.number || "—"} • Sec {st.section?.name || "—"}
                      </td>
                      <td className="p-3 font-mono font-bold">{st.cgpa != null ? Number(st.cgpa).toFixed(2) : "—"}</td>
                      <td className="p-3 text-right pr-4">
                        <Button type="button" size="sm" variant="outline" className="h-7 text-[11px] gap-1" onClick={() => handleOpenEditStudent(st)}>
                          <Edit2 className="h-3 w-3" /> Edit Profile
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      )}

      {/* College Tenants Table (SUPER_ADMIN GET / POST /colleges) */}
      {activeDirectoryTab === "COLLEGES" && isSuperAdmin && (
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            {collegesList.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground">No colleges found.</div>
            ) : (
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] font-semibold border-b border-border">
                  <tr>
                    <th className="p-3 pl-4">Code</th>
                    <th className="p-3">Institution Name</th>
                    <th className="p-3">Attendance Mode</th>
                    <th className="p-3 pr-4 text-right">Threshold</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {collegesList.map((col) => (
                    <tr key={col.id} className="hover:bg-muted/20">
                      <td className="p-3 pl-4 font-mono font-bold text-primary">{col.code}</td>
                      <td className="p-3 font-semibold text-foreground">{col.name}</td>
                      <td className="p-3 text-muted-foreground">{col.attendanceMode}</td>
                      <td className="p-3 pr-4 text-right font-mono">{col.attendanceThreshold}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      )}

      {/* MODAL 1: Onboard Student */}
      <Dialog
        isOpen={activeModal === "ONBOARD_STUDENT"}
        onClose={() => setActiveModal(null)}
        title="Student Onboarding & Registration"
        description="Creates student profile, relational department/program/batch/section associations, and login credentials."
      >
        <form onSubmit={handleOnboardStudent} className="space-y-3 text-xs max-h-[75vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-semibold block mb-1">Roll Number</label>
              <Input placeholder="e.g. 23CSE041" value={stdRollNo} onChange={(e) => setStdRollNo(e.target.value)} required />
            </div>
            <div>
              <label className="font-semibold block mb-1">College Student ID</label>
              <Input placeholder="e.g. SDCET-2023-041" value={stdCollegeId} onChange={(e) => setStdCollegeId(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-semibold block mb-1">First Name</label>
              <Input placeholder="e.g. Priya" value={stdFirstName} onChange={(e) => setStdFirstName(e.target.value)} required />
            </div>
            <div>
              <label className="font-semibold block mb-1">Last Name</label>
              <Input placeholder="e.g. Sharma" value={stdLastName} onChange={(e) => setStdLastName(e.target.value)} required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-semibold block mb-1">Email Address</label>
              <Input type="email" placeholder="p.sharma@sdcet.edu" value={stdEmail} onChange={(e) => setStdEmail(e.target.value)} required />
            </div>
            <div>
              <label className="font-semibold block mb-1">Phone Number</label>
              <Input placeholder="+91 9876543210" value={stdPhone} onChange={(e) => setStdPhone(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-semibold block mb-1">Department</label>
              <select value={stdDeptId} onChange={(e) => setStdDeptId(e.target.value)} className="w-full h-8 rounded-lg border border-input bg-background px-2 text-xs">
                {(departments || []).map((d) => (<option key={d.id} value={d.id}>{d.name}</option>))}
              </select>
            </div>
            <div>
              <label className="font-semibold block mb-1">Program</label>
              <select value={stdProgId} onChange={(e) => setStdProgId(e.target.value)} className="w-full h-8 rounded-lg border border-input bg-background px-2 text-xs">
                {(programs || []).map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-semibold block mb-1">Batch</label>
              <select value={stdBatchId} onChange={(e) => setStdBatchId(e.target.value)} className="w-full h-8 rounded-lg border border-input bg-background px-2 text-xs">
                {(batches || []).map((b) => (<option key={b.id} value={b.id}>{b.name}</option>))}
              </select>
            </div>
            <div>
              <label className="font-semibold block mb-1">Section (Optional)</label>
              <select value={stdSectionId} onChange={(e) => setStdSectionId(e.target.value)} className="w-full h-8 rounded-lg border border-input bg-background px-2 text-xs">
                <option value="">None / To be allocated</option>
                {(sections || []).map((s) => (<option key={s.id} value={s.id}>Sec {s.name} (Sem {s.semester?.number})</option>))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-semibold block mb-1">Date of Birth</label>
              <Input type="date" value={stdDob} onChange={(e) => setStdDob(e.target.value)} />
            </div>
            <div>
              <label className="font-semibold block mb-1">Gender</label>
              <select value={stdGender} onChange={(e) => setStdGender(e.target.value as any)} className="w-full h-8 rounded-lg border border-input bg-background px-2 text-xs">
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          <div className="pt-2 border-t border-border">
            <span className="font-bold block mb-1 text-foreground">Guardian Details</span>
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Guardian Full Name" value={stdGuardianName} onChange={(e) => setStdGuardianName(e.target.value)} />
              <Input placeholder="Guardian Phone" value={stdGuardianPhone} onChange={(e) => setStdGuardianPhone(e.target.value)} />
            </div>
          </div>

          <div className="pt-2 border-t border-border">
            <label className="font-semibold block mb-1">Initial Password</label>
            <Input type="password" value={stdPassword} onChange={(e) => setStdPassword(e.target.value)} required />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button type="button" variant="outline" size="sm" onClick={() => setActiveModal(null)}>Cancel</Button>
            <Button type="submit" size="sm" isLoading={createStudentMutation.isPending}>Onboard Student</Button>
          </div>
        </form>
      </Dialog>

      {/* MODAL 2: Onboard Faculty */}
      <Dialog
        isOpen={activeModal === "ONBOARD_TEACHER"}
        onClose={() => setActiveModal(null)}
        title="Faculty & Teacher Appointment"
        description="Provision faculty credentials, departmental affiliation, and optional HOD administrative privileges."
      >
        <form onSubmit={handleOnboardTeacher} className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-semibold block mb-1">Employee ID</label>
              <Input placeholder="e.g. EMP-1092" value={facEmpId} onChange={(e) => setFacEmpId(e.target.value)} required />
            </div>
            <div>
              <label className="font-semibold block mb-1">Email Address</label>
              <Input type="email" placeholder="faculty@sdcet.edu" value={facEmail} onChange={(e) => setFacEmail(e.target.value)} required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-semibold block mb-1">First Name</label>
              <Input placeholder="e.g. Amit" value={facFirstName} onChange={(e) => setFacFirstName(e.target.value)} required />
            </div>
            <div>
              <label className="font-semibold block mb-1">Last Name</label>
              <Input placeholder="e.g. Verma" value={facLastName} onChange={(e) => setFacLastName(e.target.value)} required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-semibold block mb-1">Department</label>
              <select value={facDeptId} onChange={(e) => setFacDeptId(e.target.value)} className="w-full h-8 rounded-lg border border-input bg-background px-2 text-xs">
                {(departments || []).map((d) => (<option key={d.id} value={d.id}>{d.name}</option>))}
              </select>
            </div>
            <div>
              <label className="font-semibold block mb-1">Designation</label>
              <Input value={facDesignation} onChange={(e) => setFacDesignation(e.target.value)} />
            </div>
          </div>

          <div>
            <label className="font-semibold block mb-1">Academic Qualifications</label>
            <Input value={facQualifications} onChange={(e) => setFacQualifications(e.target.value)} />
          </div>

          <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/40 border border-border">
            <input type="checkbox" id="isHodCheck" checked={facIsHod} onChange={(e) => setFacIsHod(e.target.checked)} className="rounded" />
            <label htmlFor="isHodCheck" className="font-semibold cursor-pointer">
              Appoint as Head of Department (HOD) for this Department
            </label>
          </div>

          <div>
            <label className="font-semibold block mb-1">Initial Password</label>
            <Input type="password" value={facPassword} onChange={(e) => setFacPassword(e.target.value)} required />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button type="button" variant="outline" size="sm" onClick={() => setActiveModal(null)}>Cancel</Button>
            <Button type="submit" size="sm" isLoading={createTeacherMutation.isPending}>Appoint Faculty</Button>
          </div>
        </form>
      </Dialog>

      {/* MODAL 3: Create User / Admin */}
      <Dialog
        isOpen={activeModal === "CREATE_USER"}
        onClose={() => setActiveModal(null)}
        title="Create Institutional Account"
        description="Provision an administrator, accountant, placement officer, or staff user account."
      >
        <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-semibold block mb-1">First Name</label>
              <Input value={userFirstName} onChange={(e) => setUserFirstName(e.target.value)} required />
            </div>
            <div>
              <label className="font-semibold block mb-1">Last Name</label>
              <Input value={userLastName} onChange={(e) => setUserLastName(e.target.value)} required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-semibold block mb-1">Email</label>
              <Input type="email" value={userEmail} onChange={(e) => setUserEmail(e.target.value)} required />
            </div>
            <div>
              <label className="font-semibold block mb-1">Login ID (Optional)</label>
              <Input value={userLoginId} onChange={(e) => setUserLoginId(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-semibold block mb-1">Role</label>
              <select value={userRole} onChange={(e) => setUserRole(e.target.value)} className="w-full h-8 rounded-lg border border-input bg-background px-2 text-xs">
                <option value="COLLEGE_ADMIN">Administrator</option>
                <option value="ACCOUNTANT">Accountant</option>
                <option value="PLACEMENT_OFFICER">Placement Officer</option>
                <option value="EXAM_CONTROLLER">Examination Officer</option>
                <option value="LIBRARY_STAFF">Librarian</option>
              </select>
            </div>
            <div>
              <label className="font-semibold block mb-1">Department Scope</label>
              <select value={userDeptId} onChange={(e) => setUserDeptId(e.target.value)} className="w-full h-8 rounded-lg border border-input bg-background px-2 text-xs">
                <option value="">College-Wide (No scope)</option>
                {(departments || []).map((d) => (<option key={d.id} value={d.id}>{d.name}</option>))}
              </select>
            </div>
          </div>

          <div>
            <label className="font-semibold block mb-1">Initial Password</label>
            <Input type="password" value={userPassword} onChange={(e) => setUserPassword(e.target.value)} />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button type="button" variant="outline" size="sm" onClick={() => setActiveModal(null)}>Cancel</Button>
            <Button type="submit" size="sm" isLoading={createUserMutation.isPending}>Create User</Button>
          </div>
        </form>
      </Dialog>

      {/* MODAL 4: Edit Roles */}
      <Dialog
        isOpen={activeModal === "EDIT_ROLES"}
        onClose={() => setActiveModal(null)}
        title="Manage User Roles & Permissions"
        description={`Modify role assignments for ${selectedUserForRoles?.firstName} ${selectedUserForRoles?.lastName}`}
      >
        <form onSubmit={handleSaveRoles} className="space-y-3 text-xs">
          <div>
            <label className="font-semibold block mb-1">Assigned Role</label>
            <select
              value={editRolesList[0] || "STUDENT"}
              onChange={(e) => setEditRolesList([e.target.value])}
              className="w-full h-8 rounded-lg border border-input bg-background px-2 text-xs"
            >
              <option value="STUDENT">Student</option>
              <option value="TEACHER">Teacher / Faculty</option>
              <option value="HOD">Head of Department (HOD)</option>
              <option value="COLLEGE_ADMIN">College Administrator</option>
              <option value="EXAM_CONTROLLER">Exam Controller</option>
              <option value="ACCOUNTANT">Accountant</option>
              <option value="PLACEMENT_OFFICER">Placement Officer</option>
              <option value="PARENT">Parent / Guardian</option>
              <option value="SUPPORT_STAFF">Support Staff</option>
              <option value="LIBRARY_STAFF">Library Staff</option>
            </select>
          </div>

          <div>
            <label className="font-semibold block mb-1">Department Affiliation</label>
            <select
              value={editDeptId}
              onChange={(e) => setEditDeptId(e.target.value)}
              className="w-full h-8 rounded-lg border border-input bg-background px-2 text-xs"
            >
              <option value="">College-Wide (No scope)</option>
              {(departments || []).map((d) => (<option key={d.id} value={d.id}>{d.name}</option>))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button type="button" variant="outline" size="sm" onClick={() => setActiveModal(null)}>Cancel</Button>
            <Button type="submit" size="sm" isLoading={updateRolesMutation.isPending}>Save Roles</Button>
          </div>
        </form>
      </Dialog>

      {/* MODAL 5: Edit Student Profile (PATCH /students/:id) */}
      <Dialog
        isOpen={activeModal === "EDIT_STUDENT"}
        onClose={() => setActiveModal(null)}
        title={`Edit Student — ${editingStudent?.user?.firstName || ""} ${editingStudent?.user?.lastName || ""}`}
        description="Update student academic allocation, section, semester, and personal metadata."
      >
        <form onSubmit={handleSaveStudent} className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-semibold block mb-1">First Name</label>
              <Input value={editFirstName} onChange={(e) => setEditFirstName(e.target.value)} required />
            </div>
            <div>
              <label className="font-semibold block mb-1">Last Name</label>
              <Input value={editLastName} onChange={(e) => setEditLastName(e.target.value)} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-semibold block mb-1">Roll Number</label>
              <Input value={editRollNo} onChange={(e) => setEditRollNo(e.target.value)} required />
            </div>
            <div>
              <label className="font-semibold block mb-1">Phone</label>
              <Input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-semibold block mb-1">Department</label>
              <select value={editDept} onChange={(e) => setEditDept(e.target.value)} className="w-full h-8 rounded-lg border border-input bg-background px-2 text-xs">
                {(departments || []).map((d) => (<option key={d.id} value={d.id}>{d.name}</option>))}
              </select>
            </div>
            <div>
              <label className="font-semibold block mb-1">Program</label>
              <select value={editProg} onChange={(e) => setEditProg(e.target.value)} className="w-full h-8 rounded-lg border border-input bg-background px-2 text-xs">
                {(programs || []).map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="font-semibold block mb-1">Batch</label>
              <select value={editBatch} onChange={(e) => setEditBatch(e.target.value)} className="w-full h-8 rounded-lg border border-input bg-background px-2 text-xs">
                {(batches || []).map((b) => (<option key={b.id} value={b.id}>{b.name}</option>))}
              </select>
            </div>
            <div>
              <label className="font-semibold block mb-1">Semester</label>
              <select value={editSem} onChange={(e) => setEditSem(e.target.value)} className="w-full h-8 rounded-lg border border-input bg-background px-2 text-xs">
                <option value="">Unchanged</option>
                {(semesters || []).map((s) => (<option key={s.id} value={s.id}>Sem {s.number}</option>))}
              </select>
            </div>
            <div>
              <label className="font-semibold block mb-1">Section</label>
              <select value={editSec} onChange={(e) => setEditSec(e.target.value)} className="w-full h-8 rounded-lg border border-input bg-background px-2 text-xs">
                <option value="">Unassigned</option>
                {(sections || []).map((s) => (<option key={s.id} value={s.id}>Sec {s.name}</option>))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-semibold block mb-1">Date of Birth</label>
              <Input type="date" value={editDob} onChange={(e) => setEditDob(e.target.value)} />
            </div>
            <div>
              <label className="font-semibold block mb-1">Gender</label>
              <select value={editGender} onChange={(e) => setEditGender(e.target.value as StudentGender)} className="w-full h-8 rounded-lg border border-input bg-background px-2 text-xs">
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
                <option value="UNDISCLOSED">Undisclosed</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button type="button" variant="outline" size="sm" onClick={() => setActiveModal(null)}>Cancel</Button>
            <Button type="submit" size="sm" isLoading={updateStudentMutation.isPending}>Save Student</Button>
          </div>
        </form>
      </Dialog>

      {/* MODAL 6: Onboard New College (SUPER_ADMIN POST /colleges) */}
      <Dialog
        isOpen={activeModal === "CREATE_COLLEGE"}
        onClose={() => setActiveModal(null)}
        title="Onboard New College Tenant"
        description="Provision an isolated college tenant and its initial College Admin account (Super Admin only)."
      >
        <form onSubmit={handleCreateCollege} className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-semibold block mb-1">College Short Code</label>
              <Input placeholder="e.g. SDCET" value={colCode} onChange={(e) => setColCode(e.target.value)} required />
            </div>
            <div>
              <label className="font-semibold block mb-1">Admin Login ID</label>
              <Input placeholder="e.g. ADMIN001" value={colAdminLogin} onChange={(e) => setColAdminLogin(e.target.value)} required />
            </div>
          </div>
          <div>
            <label className="font-semibold block mb-1">Institution Full Name</label>
            <Input placeholder="e.g. Satyug Darshan Institute" value={colName} onChange={(e) => setColName(e.target.value)} required />
          </div>
          <div>
            <label className="font-semibold block mb-1">Admin Email</label>
            <Input type="email" placeholder="admin@college.edu" value={colAdminEmail} onChange={(e) => setColAdminEmail(e.target.value)} required />
          </div>
          <div>
            <label className="font-semibold block mb-1">Admin Initial Password</label>
            <Input type="password" value={colAdminPassword} onChange={(e) => setColAdminPassword(e.target.value)} minLength={10} required />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button type="button" variant="outline" size="sm" onClick={() => setActiveModal(null)}>Cancel</Button>
            <Button type="submit" size="sm" isLoading={createCollegeMutation.isPending}>Create College</Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
