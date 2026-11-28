"use client";

import React, { useState } from "react";
import { useAuthStore } from "@/lib/auth/authStore";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { studentApi } from "@/lib/api/student";
import { studentsApi, PortfolioItemType } from "@/services/api/students.api";
import { facultyApi } from "@/services/api/faculty.api";
import { specialistApi } from "@/lib/api/specialist";
import Link from "next/link";
import {
  User,
  GraduationCap,
  Shield,
  Award,
  BookOpen,
  Mail,
  Phone,
  Laptop,
  CheckCircle2,
  Building,
  Plus,
  Trash2,
  Edit2,
  Sparkles,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function ProfilePage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: dashboard } = useQuery({
    queryKey: ["profile_student_dashboard"],
    queryFn: () => studentApi.getDashboard(),
    enabled: user?.role === "STUDENT",
  });

  const { data: studentMe, refetch: refetchMe } = useQuery({
    queryKey: ["students_me_profile"],
    queryFn: () => studentsApi.getMe(),
    enabled: user?.role === "STUDENT",
  });

  const isTeacherOrHod = user?.role === "TEACHER" || user?.role === "HOD";
  const { data: teacherMe } = useQuery({
    queryKey: ["teachers_me_profile"],
    queryFn: () => facultyApi.getMe().catch(() => null),
    enabled: isTeacherOrHod,
  });

  const { data: parentWards = [] } = useQuery({
    queryKey: ["parent_wards_profile"],
    queryFn: () => specialistApi.getParentWards().catch(() => []),
    enabled: user?.role === "PARENT",
  });

  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [addrLine, setAddrLine] = useState("");
  const [addrCity, setAddrCity] = useState("");
  const [addrState, setAddrState] = useState("");
  const [addrPin, setAddrPin] = useState("");
  const [newSkillName, setNewSkillName] = useState("");
  const [newSkillLevel, setNewSkillLevel] = useState(3);
  const [skillMsg, setSkillMsg] = useState<string | null>(null);
  const [portType, setPortType] = useState<PortfolioItemType>("PROJECT");
  const [portTitle, setPortTitle] = useState("");
  const [portDesc, setPortDesc] = useState("");
  const [portUrl, setPortUrl] = useState("");

  const updatePhoneMutation = useMutation({
    mutationFn: (phone: string) => studentsApi.updateMe({ phone }),
    onSuccess: () => {
      setIsEditingPhone(false);
      toast.success("Phone number updated.");
      refetchMe();
    },
    onError: (err: any) => toast.error(err?.message || "Failed to update phone number"),
  });

  const updateAddressMutation = useMutation({
    mutationFn: (address: Record<string, string>) => studentsApi.updateMe({ address }),
    onSuccess: () => {
      setIsEditingAddress(false);
      toast.success("Address saved.");
      refetchMe();
    },
    onError: (err: any) => toast.error(err?.message || "Failed to update address"),
  });

  const addSkillMutation = useMutation({
    mutationFn: (dto: { name: string; level: number }) => studentsApi.addSkill(dto),
    onSuccess: () => {
      setNewSkillName("");
      setSkillMsg("Skill added successfully!");
      setTimeout(() => setSkillMsg(null), 3000);
      refetchMe();
    },
    onError: (err: any) => toast.error(err?.message || "Failed to add skill"),
  });

  const removeSkillMutation = useMutation({
    mutationFn: (name: string) => studentsApi.removeSkill(name),
    onSuccess: () => {
      refetchMe();
    },
    onError: (err: any) => toast.error(err?.message || "Failed to remove skill"),
  });

  const addPortfolioMutation = useMutation({
    mutationFn: () =>
      studentsApi.addPortfolioItem({
        type: portType,
        title: portTitle.trim(),
        description: portDesc.trim() || undefined,
        url: portUrl.trim() || undefined,
      }),
    onSuccess: () => {
      setPortTitle("");
      setPortDesc("");
      setPortUrl("");
      toast.success("Portfolio item added!");
      refetchMe();
    },
    onError: (err: any) => toast.error(err?.message || "Failed to add portfolio item"),
  });

  const removePortfolioMutation = useMutation({
    mutationFn: (id: string) => studentsApi.removePortfolioItem(id),
    onSuccess: () => {
      toast.success("Portfolio item removed.");
      refetchMe();
    },
    onError: (err: any) => toast.error(err?.message || "Failed to remove portfolio item"),
  });

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="pb-2 border-b border-border">
        <h1 className="text-xl font-bold text-foreground">
          Institutional Identity & Credentials
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Master institutional profile verified by the Office of Academic Affairs.
        </p>
      </div>

      {/* Hero Profile Card */}
      <div className="p-6 rounded-2xl border border-border bg-card shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-5">
        <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white font-bold text-2xl flex items-center justify-center shrink-0 shadow-lg shadow-brand-500/25">
          {user?.name?.charAt(0) || "U"}
        </div>
        <div className="space-y-1 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg font-bold text-foreground">{user?.name || "Institutional User"}</h2>
            <span className="text-[10px] font-mono font-bold bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 px-2 py-0.5 rounded">
              {user?.role}
            </span>
            <span className="text-[10px] text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full font-semibold">
              Verified Session
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {user?.department || studentMe?.department?.name || "Academic Department"} • Identifier: {studentMe?.rollNumber || user?.rollNumber || user?.id}
          </p>
          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-1">
            <span className="flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5" /> {studentMe?.user?.email || user?.email || "Email on File"}
            </span>
            {isEditingPhone ? (
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  placeholder="Enter phone number"
                  defaultValue={studentMe?.user?.phone || user?.phone || ""}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="h-6 w-36 px-2 text-xs border rounded bg-background"
                />
                <Button
                  size="sm"
                  className="h-6 px-2 text-[10px]"
                  isLoading={updatePhoneMutation.isPending}
                  onClick={() => updatePhoneMutation.mutate(phoneNumber)}
                >
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 px-1.5 text-[10px]"
                  onClick={() => setIsEditingPhone(false)}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <span className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" /> {studentMe?.user?.phone || user?.phone || "No phone linked"}
                {user?.role === "STUDENT" && (
                  <button
                    onClick={() => {
                      setPhoneNumber(studentMe?.user?.phone || user?.phone || "");
                      setIsEditingPhone(true);
                    }}
                    className="text-brand-600 hover:text-brand-700 text-[10px] underline ml-1"
                  >
                    Edit
                  </button>
                )}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Grid: Academic Info & Permissions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="p-5 pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-brand-600" />
              Academic Standing
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-0 space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-border">
              <span className="text-muted-foreground">Primary Department:</span>
              <span className="font-semibold text-foreground">
                {studentMe?.department?.name || user?.department || "Assigned at Onboarding"}
              </span>
            </div>
            {studentMe?.program && (
              <div className="flex justify-between py-1.5 border-b border-border">
                <span className="text-muted-foreground">Degree Program:</span>
                <span className="font-semibold text-foreground">{studentMe.program.name}</span>
              </div>
            )}
            {(studentMe?.batch || user?.batch) && (
              <div className="flex justify-between py-1.5 border-b border-border">
                <span className="text-muted-foreground">Academic Batch:</span>
                <span className="font-semibold text-foreground">{studentMe?.batch?.name || user?.batch}</span>
              </div>
            )}
            {(studentMe?.semester?.number || user?.semester) && (
              <div className="flex justify-between py-1.5 border-b border-border">
                <span className="text-muted-foreground">Current Semester / Section:</span>
                <span className="font-semibold text-foreground">
                  Sem {studentMe?.semester?.number || user?.semester}
                  {(studentMe?.section?.name || user?.section) ? ` • Section ${studentMe?.section?.name || user?.section}` : ""}
                </span>
              </div>
            )}
            {user?.employeeId && (
              <div className="flex justify-between py-1.5 border-b border-border">
                <span className="text-muted-foreground">Employee ID / Designation:</span>
                <span className="font-semibold text-foreground">
                  {user.employeeId}{user.designation ? ` • ${user.designation}` : ""}
                </span>
              </div>
            )}
            <div className="flex justify-between py-1.5 border-b border-border">
              <span className="text-muted-foreground">Assigned Role:</span>
              <span className="font-semibold text-foreground">{user?.role}</span>
            </div>
            {user?.role === "STUDENT" && (studentMe?.cgpa != null || user?.cgpa != null) && (
              <div className="flex justify-between py-1.5 border-b border-border">
                <span className="text-muted-foreground">Verified CGPA:</span>
                <span className="font-mono font-bold text-foreground">
                  {Number(studentMe?.cgpa ?? user?.cgpa ?? 0).toFixed(2)}
                </span>
              </div>
            )}
            <div className="flex justify-between py-1.5">
              <span className="text-muted-foreground">Attendance Status:</span>
              <span className="font-mono font-bold text-emerald-600">
                {dashboard?.attendance?.overall?.percentage
                  ? `${dashboard.attendance.overall.percentage}% Verified`
                  : "Good Standing"}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-5 pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Award className="h-4 w-4 text-amber-500" />
              Institutional Capabilities
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-0 space-y-3 text-xs">
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-muted-foreground">
                Authorized Workspaces
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  "Attendance Records",
                  "Lecture Schedules",
                  "Deliverable Submissions",
                  "Grievance Triage",
                  "AI College Copilot",
                  "Institutional Announcements",
                ].map((cap, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-lg bg-muted text-foreground font-medium text-[11px] border border-border"
                  >
                    {cap}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-border space-y-1">
              <span className="text-[10px] uppercase font-bold text-muted-foreground">
                Verification Authority
              </span>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Signed by Satyug Darshan Institute of Engineering and Technology (SDIET) Registrar & Academic Council.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Student Skills & Portfolio (If Student) */}
      {user?.role === "STUDENT" && (
        <Card>
          <CardHeader className="p-5 pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-600" />
              Skills & Placement Registry
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-0 space-y-4 text-xs">
            <p className="text-muted-foreground text-[11px]">
              Skills registered here are autonomously matched by the AI Placement & Career Engine for campus drive recommendations.
            </p>

            {skillMsg && (
              <div className="p-2 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs">
                {skillMsg}
              </div>
            )}

            {/* List existing skills */}
            <div className="flex flex-wrap gap-2">
              {(studentMe?.skills || []).length === 0 ? (
                <span className="text-muted-foreground italic text-xs">No skills registered yet. Add your core competencies below.</span>
              ) : (
                (studentMe?.skills || []).map((sk, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 font-medium text-xs border border-brand-200 dark:border-brand-800"
                  >
                    <span>{sk.name}</span>
                    {sk.level && <span className="text-[10px] text-muted-foreground">★{sk.level}</span>}
                    <button
                      onClick={() => removeSkillMutation.mutate(sk.name)}
                      className="text-red-500 hover:text-red-700 ml-1"
                      title="Remove skill"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </span>
                ))
              )}
            </div>

            {/* Add skill form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (newSkillName.trim()) {
                  addSkillMutation.mutate({ name: newSkillName.trim(), level: Number(newSkillLevel) });
                }
              }}
              className="flex items-center gap-2 pt-2 border-t border-border"
            >
              <input
                type="text"
                placeholder="Skill name (e.g., Python, Docker, Next.js)"
                value={newSkillName}
                onChange={(e) => setNewSkillName(e.target.value)}
                className="h-8 flex-1 rounded-lg border border-input bg-background px-3 text-xs"
              />
              <select
                value={newSkillLevel}
                onChange={(e) => setNewSkillLevel(Number(e.target.value))}
                className="h-8 rounded-lg border border-input bg-background px-2 text-xs"
              >
                <option value={1}>Beginner (1★)</option>
                <option value={2}>Elementary (2★)</option>
                <option value={3}>Intermediate (3★)</option>
                <option value={4}>Advanced (4★)</option>
                <option value={5}>Expert (5★)</option>
              </select>
              <Button type="submit" size="sm" isLoading={addSkillMutation.isPending} className="text-xs h-8 gap-1">
                <Plus className="h-3.5 w-3.5" /> Add Skill
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Student Address & Academic Portfolio (If Student) */}
      {user?.role === "STUDENT" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="p-5 pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Building className="h-4 w-4 text-brand-600" />
                Residential Address
              </CardTitle>
              {!isEditingAddress && (
                <button
                  onClick={() => {
                    const a = (studentMe?.address || {}) as Record<string, string>;
                    setAddrLine(a.line1 || "");
                    setAddrCity(a.city || "");
                    setAddrState(a.state || "");
                    setAddrPin(a.pincode || "");
                    setIsEditingAddress(true);
                  }}
                  className="text-xs text-brand-600 hover:underline flex items-center gap-1"
                >
                  <Edit2 className="h-3 w-3" /> Edit
                </button>
              )}
            </CardHeader>
            <CardContent className="p-5 pt-0 text-xs">
              {isEditingAddress ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    updateAddressMutation.mutate({
                      line1: addrLine.trim(),
                      city: addrCity.trim(),
                      state: addrState.trim(),
                      pincode: addrPin.trim(),
                    });
                  }}
                  className="space-y-2.5"
                >
                  <input
                    type="text"
                    placeholder="Street / House Address"
                    value={addrLine}
                    onChange={(e) => setAddrLine(e.target.value)}
                    className="h-8 w-full rounded-lg border border-input bg-background px-3 text-xs"
                  />
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="text"
                      placeholder="City"
                      value={addrCity}
                      onChange={(e) => setAddrCity(e.target.value)}
                      className="h-8 rounded-lg border border-input bg-background px-2 text-xs"
                    />
                    <input
                      type="text"
                      placeholder="State"
                      value={addrState}
                      onChange={(e) => setAddrState(e.target.value)}
                      className="h-8 rounded-lg border border-input bg-background px-2 text-xs"
                    />
                    <input
                      type="text"
                      placeholder="PIN Code"
                      value={addrPin}
                      onChange={(e) => setAddrPin(e.target.value)}
                      className="h-8 rounded-lg border border-input bg-background px-2 text-xs"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="ghost" size="sm" onClick={() => setIsEditingAddress(false)} className="h-7 text-xs">
                      Cancel
                    </Button>
                    <Button type="submit" size="sm" isLoading={updateAddressMutation.isPending} className="h-7 text-xs">
                      Save Address
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="text-muted-foreground space-y-1">
                  {studentMe?.address && (studentMe.address.line1 || studentMe.address.city) ? (
                    <>
                      <p className="font-medium text-foreground">{studentMe.address.line1}</p>
                      <p>{[studentMe.address.city, studentMe.address.state, studentMe.address.pincode].filter(Boolean).join(", ")}</p>
                    </>
                  ) : (
                    <p className="italic">No residential address saved on file.</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-5 pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-emerald-600" />
                Academic Portfolio & Projects
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-0 space-y-3 text-xs">
              {(studentMe?.portfolio || []).length === 0 ? (
                <p className="text-muted-foreground italic">No projects, certifications, or internships recorded yet.</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {(studentMe?.portfolio || []).map((item) => (
                    <div key={item.id} className="p-2.5 rounded-lg bg-muted/40 border border-border flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-bold uppercase text-brand-600">{item.type}</span>
                        <div className="font-semibold text-foreground">{item.title}</div>
                        {item.description && <p className="text-[11px] text-muted-foreground">{item.description}</p>}
                      </div>
                      <button
                        type="button"
                        onClick={() => removePortfolioMutation.mutate(item.id)}
                        className="text-red-500 hover:text-red-700"
                        title="Remove item"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (portTitle.trim()) addPortfolioMutation.mutate();
                }}
                className="space-y-2 pt-2 border-t border-border"
              >
                <div className="grid grid-cols-3 gap-2">
                  <select
                    value={portType}
                    onChange={(e) => setPortType(e.target.value as any)}
                    className="h-8 rounded-lg border border-input bg-background px-2 text-xs"
                  >
                    <option value="PROJECT">Project</option>
                    <option value="CERTIFICATION">Certification</option>
                    <option value="ACHIEVEMENT">Achievement</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Title (e.g. AWS SAA)"
                    value={portTitle}
                    onChange={(e) => setPortTitle(e.target.value)}
                    className="col-span-2 h-8 rounded-lg border border-input bg-background px-2.5 text-xs"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Description (optional)"
                    value={portDesc}
                    onChange={(e) => setPortDesc(e.target.value)}
                    className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-xs"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      placeholder="Link URL (optional, https://...)"
                      value={portUrl}
                      onChange={(e) => setPortUrl(e.target.value)}
                      className="h-8 flex-1 rounded-lg border border-input bg-background px-2.5 text-xs"
                    />
                    <Button type="submit" size="sm" isLoading={addPortfolioMutation.isPending} className="h-8 text-xs gap-1">
                      <Plus className="h-3.5 w-3.5" /> Add
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Faculty / HOD Profile Summary (GET /teachers/me) */}
      {isTeacherOrHod && teacherMe && (
        <Card>
          <CardHeader className="p-5 pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-brand-600" />
              Faculty Appointment &amp; Qualifications
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-0 space-y-2 text-xs">
            <div className="flex justify-between py-1.5 border-b border-border">
              <span className="text-muted-foreground">Employee ID:</span>
              <span className="font-mono font-semibold text-foreground">{teacherMe.employeeId}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border">
              <span className="text-muted-foreground">Department:</span>
              <span className="font-semibold text-foreground">{teacherMe.department?.name || "Department"}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border">
              <span className="text-muted-foreground">Designation:</span>
              <span className="font-semibold text-foreground">{teacherMe.designation || "Faculty"}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-muted-foreground">Qualifications:</span>
              <span className="font-semibold text-foreground">{teacherMe.qualifications || "On File"}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Parent Linked Wards Summary */}
      {user?.role === "PARENT" && (
        <Card>
          <CardHeader className="p-5 pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <User className="h-4 w-4 text-brand-600" />
              Linked Student Wards ({parentWards.length})
            </CardTitle>
            <Link href="/parent/dashboard">
              <Button type="button" size="sm" variant="outline" className="h-7 text-xs">Open Parent Portal</Button>
            </Link>
          </CardHeader>
          <CardContent className="p-5 pt-0 space-y-2 text-xs">
            {parentWards.length === 0 ? (
              <p className="text-muted-foreground">No linked wards found on your guardian profile.</p>
            ) : (
              parentWards.map((w) => (
                <div key={w.id} className="p-3 rounded-xl border border-border flex items-center justify-between gap-2">
                  <div>
                    <div className="font-semibold text-foreground">
                      {w.user.firstName} {w.user.lastName}
                    </div>
                    <div className="text-[11px] text-muted-foreground font-mono">
                      Roll: {w.rollNumber} • {w.program?.code} {w.department?.code} {w.semester ? `• Sem ${w.semester.number}` : ""}
                    </div>
                  </div>
                  <span className="font-mono font-bold text-foreground">
                    CGPA: {w.cgpa != null ? Number(w.cgpa).toFixed(2) : "—"}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}

      {/* Active Device Sessions */}
      <Card>
        <CardHeader className="p-5 pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Shield className="h-4 w-4 text-brand-600" />
            Security & Authentication Session
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 pt-0 space-y-3 text-xs">
          <div className="p-3 rounded-xl bg-muted/40 border border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Laptop className="h-5 w-5 text-brand-600 shrink-0" />
              <div>
                <span className="font-semibold text-foreground">Authenticated Browser Session</span>
                <span className="text-[10px] text-emerald-600 ml-2 font-bold bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.2 rounded">
                  JWT Active
                </span>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Secured with bearer token rotation & institutional RBAC policy.
                </p>
              </div>
            </div>
            <span className="text-xs text-muted-foreground font-mono">Active</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
