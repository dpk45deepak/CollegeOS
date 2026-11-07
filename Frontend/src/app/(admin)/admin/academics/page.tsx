"use client";

import React, { useState } from "react";
import {
  Building2,
  GraduationCap,
  BookOpen,
  CalendarDays,
  DoorOpen,
  Settings,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Search,
  Users,
  Layers,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCampuses,
  useCreateCampus,
  useDepartments,
  useCreateDepartment,
  usePrograms,
  useCreateProgram,
  useBatches,
  useCreateBatch,
  useSemesters,
  useCreateSemester,
  useSections,
  useCreateSection,
  useSubjects,
  useCreateSubject,
  useCollegeSettings,
  useUpdateCollegeSettings,
} from "@/hooks/useAcademic";
import {
  useSubjectOfferings,
  useCreateSubjectOffering,
  useTeachers,
} from "@/hooks/useFaculty";
import {
  useRooms,
  useCreateRoom,
  useCreateTimetableSlot,
  useCheckTimetableConflict,
  useSectionTimetable,
  useDeleteTimetableSlot,
} from "@/hooks/useTimetable";
import { timeStringToMinutes, DayOfWeek } from "@/services/api/timetable.api";

type AcademicTab =
  | "DEPARTMENTS"
  | "PROGRAMS_BATCHES"
  | "SECTIONS"
  | "SUBJECTS"
  | "OFFERINGS"
  | "TIMETABLE_ROOMS"
  | "SETTINGS";

export default function AdminAcademicsPage() {
  const [activeTab, setActiveTab] = useState<AcademicTab>("DEPARTMENTS");

  // Queries
  const { data: settings, isLoading: loadingSettings } = useCollegeSettings();
  const { data: campuses, isLoading: loadingCampuses } = useCampuses();
  const { data: departments, isLoading: loadingDepts } = useDepartments();
  const { data: programs, isLoading: loadingPrograms } = usePrograms();
  const { data: batches, isLoading: loadingBatches } = useBatches();
  const { data: semesters, isLoading: loadingSemesters } = useSemesters();
  const { data: sections, isLoading: loadingSections } = useSections();
  const { data: subjects, isLoading: loadingSubjects } = useSubjects();
  const { data: offerings, isLoading: loadingOfferings } = useSubjectOfferings();
  const { data: teachers } = useTeachers();
  const { data: rooms } = useRooms();

  // Modals state
  const [modalType, setModalType] = useState<string | null>(null);

  // Department / Campus Form
  const [deptCode, setDeptCode] = useState("");
  const [deptName, setDeptName] = useState("");
  const [deptCampusId, setDeptCampusId] = useState("");

  const [campusCode, setCampusCode] = useState("");
  const [campusName, setCampusName] = useState("");
  const [campusAddress, setCampusAddress] = useState("");

  // Program / Batch Form
  const [progCode, setProgCode] = useState("");
  const [progName, setProgName] = useState("");
  const [progDuration, setProgDuration] = useState("8");

  const [batchProgId, setBatchProgId] = useState("");
  const [batchDeptId, setBatchDeptId] = useState("");
  const [batchName, setBatchName] = useState("");
  const [batchStartYear, setBatchStartYear] = useState("2023");
  const [batchEndYear, setBatchEndYear] = useState("2027");

  // Semester / Section Form
  const [semBatchId, setSemBatchId] = useState("");
  const [semNumber, setSemNumber] = useState("1");
  const [semYear, setSemYear] = useState("2026-27");
  const [semStart, setSemStart] = useState("2026-08-01");
  const [semEnd, setSemEnd] = useState("2026-12-15");

  const [secSemId, setSecSemId] = useState("");
  const [secName, setSecName] = useState("");
  const [secCapacity, setSecCapacity] = useState("60");

  // Subject Form
  const [subDeptId, setSubDeptId] = useState("");
  const [subCode, setSubCode] = useState("");
  const [subName, setSubName] = useState("");
  const [subCredits, setSubCredits] = useState("3");
  const [subSemNumber, setSubSemNumber] = useState("1");
  const [subIsElective, setSubIsElective] = useState(false);

  // Offering Form
  const [offSubId, setOffSubId] = useState("");
  const [offSemId, setOffSemId] = useState("");
  const [offSecId, setOffSecId] = useState("");
  const [offTeacherId, setOffTeacherId] = useState("");

  // Room Form
  const [roomCampusId, setRoomCampusId] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [roomCap, setRoomCap] = useState("60");

  // Timetable Slot Form
  const [slotDay, setSlotDay] = useState<DayOfWeek>("MON");
  const [slotStartTime, setSlotStartTime] = useState("09:00");
  const [slotEndTime, setSlotEndTime] = useState("10:15");
  const [slotOfferingId, setSlotOfferingId] = useState("");
  const [slotRoomId, setSlotRoomId] = useState("");
  const [selectedSectionForView, setSelectedSectionForView] = useState("");
  const [conflictResult, setConflictResult] = useState<{ hasConflict: boolean; message: string } | null>(null);

  // Settings Form
  const [settingThreshold, setSettingThreshold] = useState<number>(75);
  const [settingMode, setSettingMode] = useState<"PER_LECTURE" | "DAILY" | "CUSTOM">("PER_LECTURE");

  // Mutations
  const createCampusMutation = useCreateCampus();
  const createDeptMutation = useCreateDepartment();
  const createProgramMutation = useCreateProgram();
  const createBatchMutation = useCreateBatch();
  const createSemesterMutation = useCreateSemester();
  const createSectionMutation = useCreateSection();
  const createSubjectMutation = useCreateSubject();
  const createOfferingMutation = useCreateSubjectOffering();
  const createRoomMutation = useCreateRoom();
  const createSlotMutation = useCreateTimetableSlot();
  const checkConflictMutation = useCheckTimetableConflict();
  const deleteSlotMutation = useDeleteTimetableSlot();
  const updateSettingsMutation = useUpdateCollegeSettings();

  const { data: sectionSlots, refetch: refetchSectionSlots } = useSectionTimetable(selectedSectionForView);

  // Handlers
  const handleCreateCampus = async (e: React.FormEvent) => {
    e.preventDefault();
    await createCampusMutation.mutateAsync({
      code: campusCode,
      name: campusName,
      address: campusAddress || undefined,
    });
    setModalType(null);
    setCampusCode("");
    setCampusName("");
  };

  const handleCreateDept = async (e: React.FormEvent) => {
    e.preventDefault();
    await createDeptMutation.mutateAsync({
      code: deptCode,
      name: deptName,
      campusId: deptCampusId || undefined,
    });
    setModalType(null);
    setDeptCode("");
    setDeptName("");
  };

  const handleCreateProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    await createProgramMutation.mutateAsync({
      code: progCode,
      name: progName,
      durationSemesters: parseInt(progDuration, 10),
    });
    setModalType(null);
    setProgCode("");
    setProgName("");
  };

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    await createBatchMutation.mutateAsync({
      programId: batchProgId || (programs && programs[0]?.id) || "",
      departmentId: batchDeptId || (departments && departments[0]?.id) || "",
      name: batchName,
      startYear: parseInt(batchStartYear, 10),
      endYear: parseInt(batchEndYear, 10),
    });
    setModalType(null);
    setBatchName("");
  };

  const handleCreateSemester = async (e: React.FormEvent) => {
    e.preventDefault();
    await createSemesterMutation.mutateAsync({
      batchId: semBatchId || (batches && batches[0]?.id) || "",
      number: parseInt(semNumber, 10),
      academicYear: semYear,
      startDate: semStart,
      endDate: semEnd,
      isCurrent: true,
    });
    setModalType(null);
  };

  const handleCreateSection = async (e: React.FormEvent) => {
    e.preventDefault();
    await createSectionMutation.mutateAsync({
      semesterId: secSemId || (semesters && semesters[0]?.id) || "",
      name: secName,
      capacity: parseInt(secCapacity, 10),
    });
    setModalType(null);
    setSecName("");
  };

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    await createSubjectMutation.mutateAsync({
      departmentId: subDeptId || (departments && departments[0]?.id) || "",
      code: subCode,
      name: subName,
      credits: parseInt(subCredits, 10),
      semesterNumber: parseInt(subSemNumber, 10),
      isElective: subIsElective,
    });
    setModalType(null);
    setSubCode("");
    setSubName("");
  };

  const handleCreateOffering = async (e: React.FormEvent) => {
    e.preventDefault();
    const teacherList = Array.isArray(teachers) ? teachers : (teachers as any)?.items || [];
    await createOfferingMutation.mutateAsync({
      subjectId: offSubId || (subjects && subjects[0]?.id) || "",
      semesterId: offSemId || (semesters && semesters[0]?.id) || "",
      sectionId: offSecId || (sections && sections[0]?.id) || "",
      teacherId: offTeacherId || teacherList[0]?.id || "",
      enrollSection: true,
    });
    setModalType(null);
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    await createRoomMutation.mutateAsync({
      campusId: roomCampusId || (campuses && campuses[0]?.id) || "",
      code: roomCode,
      capacity: parseInt(roomCap, 10),
    });
    setModalType(null);
    setRoomCode("");
  };

  const handleCheckConflict = async () => {
    if (!slotOfferingId) return;
    const startM = timeStringToMinutes(slotStartTime);
    const endM = timeStringToMinutes(slotEndTime);
    try {
      const res = await checkConflictMutation.mutateAsync({
        subjectOfferingId: slotOfferingId,
        roomId: slotRoomId || undefined,
        dayOfWeek: slotDay,
        startMinute: startM,
        endMinute: endM,
        validFrom: new Date().toISOString(),
      });
      if (res.hasConflict) {
        setConflictResult({
          hasConflict: true,
          message: res.conflicts.map((c) => c.message).join("; "),
        });
      } else {
        setConflictResult({
          hasConflict: false,
          message: "Zero conflicts detected across teacher, room, and section schedules.",
        });
      }
    } catch (err: any) {
      setConflictResult({
        hasConflict: true,
        message: err.message || "Conflict validation check failed.",
      });
    }
  };

  const handleSaveSlot = async () => {
    if (!slotOfferingId) return;
    const startM = timeStringToMinutes(slotStartTime);
    const endM = timeStringToMinutes(slotEndTime);
    await createSlotMutation.mutateAsync({
      subjectOfferingId: slotOfferingId,
      roomId: slotRoomId || undefined,
      dayOfWeek: slotDay,
      startMinute: startM,
      endMinute: endM,
      validFrom: new Date().toISOString(),
    });
    setConflictResult({
      hasConflict: false,
      message: "Slot scheduled successfully!",
    });
    if (selectedSectionForView) {
      refetchSectionSlots();
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSettingsMutation.mutateAsync({
      attendanceThreshold: settingThreshold,
      attendanceMode: settingMode,
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h1 className="text-xl font-bold text-foreground">
            Academic Architecture & Curriculum Hub
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure campuses, departments, degree programs, batches, semesters, sections, subjects, offerings, and conflict-free schedules.
          </p>
        </div>

        {/* Global Tab Navigation */}
        <div className="flex flex-wrap items-center gap-1 bg-muted p-1 rounded-xl text-xs">
          <button
            onClick={() => setActiveTab("DEPARTMENTS")}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              activeTab === "DEPARTMENTS" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Departments
          </button>
          <button
            onClick={() => setActiveTab("PROGRAMS_BATCHES")}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              activeTab === "PROGRAMS_BATCHES" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Programs & Batches
          </button>
          <button
            onClick={() => setActiveTab("SECTIONS")}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              activeTab === "SECTIONS" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Sections
          </button>
          <button
            onClick={() => setActiveTab("SUBJECTS")}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              activeTab === "SUBJECTS" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Subjects
          </button>
          <button
            onClick={() => setActiveTab("OFFERINGS")}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              activeTab === "OFFERINGS" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Offerings
          </button>
          <button
            onClick={() => setActiveTab("TIMETABLE_ROOMS")}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              activeTab === "TIMETABLE_ROOMS" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Timetable & Rooms
          </button>
          <button
            onClick={() => setActiveTab("SETTINGS")}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              activeTab === "SETTINGS" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Settings
          </button>
        </div>
      </div>

      {/* TAB 1: DEPARTMENTS & CAMPUSES */}
      {activeTab === "DEPARTMENTS" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-foreground">Academic Departments & Campuses</h2>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setModalType("CAMPUS")} className="text-xs gap-1.5">
                <Plus className="h-3.5 w-3.5" /> Add Campus
              </Button>
              <Button size="sm" onClick={() => setModalType("DEPT")} className="text-xs gap-1.5">
                <Plus className="h-3.5 w-3.5" /> Add Department
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loadingDepts ? (
              <Skeleton className="h-36 w-full rounded-xl" />
            ) : (departments || []).length === 0 ? (
              <div className="col-span-full p-8 text-center text-xs text-muted-foreground border border-dashed rounded-xl">
                No departments configured yet. Click "Add Department" to create one.
              </div>
            ) : (
              (departments || []).map((d) => (
                <Card key={d.id} className="hover:border-primary/50 transition-colors">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 bg-primary/10 text-primary rounded">
                        {d.code}
                      </span>
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="font-semibold text-sm text-foreground">{d.name}</div>
                    <div className="text-xs text-muted-foreground flex gap-4 pt-2 border-t border-border">
                      <span>Students: {d._count?.students ?? 0}</span>
                      <span>Faculty: {d._count?.teachers ?? 0}</span>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 2: PROGRAMS & BATCHES */}
      {activeTab === "PROGRAMS_BATCHES" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-foreground">Degree Programs & Batches</h2>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setModalType("PROGRAM")} className="text-xs gap-1.5">
                <Plus className="h-3.5 w-3.5" /> Add Program
              </Button>
              <Button size="sm" onClick={() => setModalType("BATCH")} className="text-xs gap-1.5">
                <Plus className="h-3.5 w-3.5" /> Add Batch
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="p-4 pb-2 border-b border-border">
                <CardTitle className="text-xs font-bold flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-primary" /> Degree Programs
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border text-xs">
                  {(programs || []).map((p) => (
                    <div key={p.id} className="p-3 flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-foreground">{p.name}</div>
                        <div className="text-muted-foreground font-mono">{p.code}</div>
                      </div>
                      <span className="bg-muted px-2 py-0.5 rounded text-[11px] font-semibold">
                        {p.durationSemesters} Semesters
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="p-4 pb-2 border-b border-border">
                <CardTitle className="text-xs font-bold flex items-center gap-2">
                  <Layers className="h-4 w-4 text-primary" /> Academic Batches
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border text-xs">
                  {(batches || []).map((b) => (
                    <div key={b.id} className="p-3 flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-foreground">{b.name}</div>
                        <div className="text-muted-foreground">{b.program?.name || "Program"}</div>
                      </div>
                      <span className="font-mono text-xs text-muted-foreground">
                        {b.startYear} - {b.endYear}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 3: SECTIONS & SEMESTERS */}
      {activeTab === "SECTIONS" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-foreground">Semesters & Student Sections</h2>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setModalType("SEMESTER")} className="text-xs gap-1.5">
                <Plus className="h-3.5 w-3.5" /> Add Semester
              </Button>
              <Button size="sm" onClick={() => setModalType("SECTION")} className="text-xs gap-1.5">
                <Plus className="h-3.5 w-3.5" /> Add Section
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(sections || []).map((sec) => (
              <Card key={sec.id}>
                <CardContent className="p-4 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-foreground">Section {sec.name}</span>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="text-muted-foreground">
                    Semester {sec.semester?.number} ({sec.semester?.academicYear})
                  </div>
                  <div className="pt-2 border-t border-border flex justify-between font-mono text-[11px]">
                    <span>Enrolled: {sec._count?.students ?? 0}</span>
                    <span>Capacity: {sec.capacity ?? 60}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: SUBJECTS */}
      {activeTab === "SUBJECTS" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-foreground">Course Catalog & Subjects</h2>
            <Button size="sm" onClick={() => setModalType("SUBJECT")} className="text-xs gap-1.5">
              <Plus className="h-3.5 w-3.5" /> Add Subject
            </Button>
          </div>

          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] font-semibold border-b border-border">
                  <tr>
                    <th className="p-3 pl-4">Code</th>
                    <th className="p-3">Subject Name</th>
                    <th className="p-3">Department</th>
                    <th className="p-3 text-center">Semester</th>
                    <th className="p-3 text-center">Credits</th>
                    <th className="p-3 text-right pr-4">Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {(subjects || []).map((sub) => (
                    <tr key={sub.id} className="hover:bg-muted/20">
                      <td className="p-3 pl-4 font-mono font-bold text-primary">{sub.code}</td>
                      <td className="p-3 font-semibold text-foreground">{sub.name}</td>
                      <td className="p-3 text-muted-foreground">{sub.department?.name || "General"}</td>
                      <td className="p-3 text-center">{sub.semesterNumber || 1}</td>
                      <td className="p-3 text-center font-bold">{sub.credits}</td>
                      <td className="p-3 text-right pr-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${sub.isElective ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300" : "bg-muted text-muted-foreground"}`}>
                          {sub.isElective ? "Elective" : "Core"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 5: SUBJECT OFFERINGS */}
      {activeTab === "OFFERINGS" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-foreground">Faculty Subject Offerings</h2>
              <p className="text-xs text-muted-foreground">Assign teachers to deliver curriculum to specific student sections.</p>
            </div>
            <Button size="sm" onClick={() => setModalType("OFFERING")} className="text-xs gap-1.5">
              <Plus className="h-3.5 w-3.5" /> Assign Subject to Teacher
            </Button>
          </div>

          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] font-semibold border-b border-border">
                  <tr>
                    <th className="p-3 pl-4">Course / Code</th>
                    <th className="p-3">Faculty Instructor</th>
                    <th className="p-3">Section</th>
                    <th className="p-3">Semester</th>
                    <th className="p-3 text-right pr-4">Students Enrolled</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {(offerings || []).map((off) => (
                    <tr key={off.id} className="hover:bg-muted/20">
                      <td className="p-3 pl-4">
                        <div className="font-semibold text-foreground">{off.subject?.name}</div>
                        <div className="font-mono text-muted-foreground text-[11px]">{off.subject?.code}</div>
                      </td>
                      <td className="p-3 font-medium text-foreground">
                        {off.teacher?.user?.firstName} {off.teacher?.user?.lastName}
                      </td>
                      <td className="p-3 font-bold text-foreground">Section {off.section?.name}</td>
                      <td className="p-3 text-muted-foreground">Sem {off.semester?.number}</td>
                      <td className="p-3 text-right pr-4 font-mono font-bold">
                        {off._count?.enrollments ?? 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 6: TIMETABLE & ROOMS */}
      {activeTab === "TIMETABLE_ROOMS" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-foreground">Autonomous Timetable Scheduler & Conflict Engine</h2>
              <p className="text-xs text-muted-foreground">Validates zero room overlaps and faculty workload clashes against NestJS timetable service.</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => setModalType("ROOM")} className="text-xs gap-1.5">
              <Plus className="h-3.5 w-3.5" /> Add Room
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Slot Creator Form */}
            <Card className="lg:col-span-1">
              <CardHeader className="p-4 pb-2 border-b border-border">
                <CardTitle className="text-xs font-bold flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-primary" /> Schedule Lecture Slot
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3 text-xs">
                <div>
                  <label className="font-semibold block mb-1">Subject Offering</label>
                  <select
                    value={slotOfferingId}
                    onChange={(e) => setSlotOfferingId(e.target.value)}
                    className="w-full h-8 rounded-lg border border-input bg-background px-2.5 text-xs"
                  >
                    <option value="">Select Offering...</option>
                    {(offerings || []).map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.subject?.code} - {o.subject?.name} (Sec {o.section?.name})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold block mb-1">Classroom / Room</label>
                  <select
                    value={slotRoomId}
                    onChange={(e) => setSlotRoomId(e.target.value)}
                    className="w-full h-8 rounded-lg border border-input bg-background px-2.5 text-xs"
                  >
                    <option value="">Select Room (Optional)...</option>
                    {(rooms || []).map((r) => (
                      <option key={r.id} value={r.id}>
                        Room {r.code} (Cap: {r.capacity})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="font-semibold block mb-1">Day</label>
                    <select
                      value={slotDay}
                      onChange={(e) => setSlotDay(e.target.value as DayOfWeek)}
                      className="w-full h-8 rounded-lg border border-input bg-background px-2 text-xs"
                    >
                      <option value="MON">Mon</option>
                      <option value="TUE">Tue</option>
                      <option value="WED">Wed</option>
                      <option value="THU">Thu</option>
                      <option value="FRI">Fri</option>
                      <option value="SAT">Sat</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-semibold block mb-1">Start</label>
                    <Input value={slotStartTime} onChange={(e) => setSlotStartTime(e.target.value)} className="h-8" />
                  </div>
                  <div>
                    <label className="font-semibold block mb-1">End</label>
                    <Input value={slotEndTime} onChange={(e) => setSlotEndTime(e.target.value)} className="h-8" />
                  </div>
                </div>

                {conflictResult && (
                  <div
                    className={`p-3 rounded-lg text-xs flex items-start gap-2 border ${
                      conflictResult.hasConflict
                        ? "bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-950/40 dark:text-rose-200 dark:border-rose-800"
                        : "bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-800"
                    }`}
                  >
                    {conflictResult.hasConflict ? (
                      <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600" />
                    )}
                    <span>{conflictResult.message}</span>
                  </div>
                )}

                <div className="flex gap-2 pt-2 border-t border-border">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs"
                    disabled={!slotOfferingId || checkConflictMutation.isPending}
                    onClick={handleCheckConflict}
                  >
                    {checkConflictMutation.isPending ? "Validating..." : "Dry-Run Clash Check"}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className="flex-1 text-xs"
                    disabled={!slotOfferingId || createSlotMutation.isPending}
                    onClick={handleSaveSlot}
                  >
                    Save Slot
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Section Timetable Viewer */}
            <Card className="lg:col-span-2">
              <CardHeader className="p-4 pb-2 border-b border-border flex flex-row items-center justify-between">
                <CardTitle className="text-xs font-bold">Section Timetable Viewer</CardTitle>
                <select
                  value={selectedSectionForView}
                  onChange={(e) => setSelectedSectionForView(e.target.value)}
                  className="h-8 rounded-lg border border-input bg-background px-2.5 text-xs"
                >
                  <option value="">Select Section to View...</option>
                  {(sections || []).map((s) => (
                    <option key={s.id} value={s.id}>
                      Section {s.name} (Sem {s.semester?.number})
                    </option>
                  ))}
                </select>
              </CardHeader>
              <CardContent className="p-4">
                {!selectedSectionForView ? (
                  <div className="p-8 text-center text-xs text-muted-foreground border border-dashed rounded-xl">
                    Select a student section above to inspect its active weekly lecture sequence and scheduled classrooms.
                  </div>
                ) : (sectionSlots || []).length === 0 ? (
                  <div className="p-8 text-center text-xs text-muted-foreground border border-dashed rounded-xl">
                    No lecture slots scheduled for this section yet.
                  </div>
                ) : (
                  <div className="divide-y divide-border text-xs">
                    {(sectionSlots || []).map((slot) => (
                      <div key={slot.id} className="py-2.5 flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-foreground">
                            {slot.subjectOffering?.subject?.code} - {slot.subjectOffering?.subject?.name}
                          </div>
                          <div className="text-muted-foreground text-[11px]">
                            {slot.dayOfWeek} • {Math.floor(slot.startMinute / 60)}:{(slot.startMinute % 60).toString().padStart(2, "0")} - {Math.floor(slot.endMinute / 60)}:{(slot.endMinute % 60).toString().padStart(2, "0")} • Room: {slot.room?.code || "TBD"}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                          onClick={() => deleteSlotMutation.mutate(slot.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 7: COLLEGE SETTINGS */}
      {activeTab === "SETTINGS" && (
        <Card className="max-w-xl">
          <CardHeader className="p-4 pb-2 border-b border-border">
            <CardTitle className="text-xs font-bold flex items-center gap-2">
              <Settings className="h-4 w-4 text-primary" /> College Academic Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4 text-xs">
            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div>
                <label className="font-semibold block mb-1">Attendance Policy Mode</label>
                <select
                  value={settingMode}
                  onChange={(e) => setSettingMode(e.target.value as any)}
                  className="w-full h-8 rounded-lg border border-input bg-background px-2.5 text-xs"
                >
                  <option value="PER_LECTURE">Per Lecture (Mandatory default)</option>
                  <option value="DAILY">Daily Overall</option>
                  <option value="CUSTOM">Custom Slot</option>
                </select>
              </div>

              <div>
                <label className="font-semibold block mb-1">Statutory Attendance Threshold (%)</label>
                <Input
                  type="number"
                  min="50"
                  max="100"
                  value={settingThreshold}
                  onChange={(e) => setSettingThreshold(parseInt(e.target.value, 10))}
                  className="h-8"
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  Students below this percentage receive automatic shortage alerts and are blocked from final exams unless authorized.
                </p>
              </div>

              <div className="pt-2">
                <Button type="submit" size="sm" isLoading={updateSettingsMutation.isPending} className="text-xs">
                  Save Academic Settings
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* DIALOGS */}
      {/* 1. Add Department */}
      <Dialog isOpen={modalType === "DEPT"} onClose={() => setModalType(null)} title="Add Department" description="Provision a new academic department in this college.">
        <form onSubmit={handleCreateDept} className="space-y-3 text-xs">
          <div>
            <label className="font-semibold block mb-1">Department Code</label>
            <Input placeholder="e.g. CSE" value={deptCode} onChange={(e) => setDeptCode(e.target.value)} required />
          </div>
          <div>
            <label className="font-semibold block mb-1">Department Name</label>
            <Input placeholder="e.g. Computer Science & Engineering" value={deptName} onChange={(e) => setDeptName(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button type="button" variant="outline" size="sm" onClick={() => setModalType(null)}>Cancel</Button>
            <Button type="submit" size="sm" isLoading={createDeptMutation.isPending}>Create Department</Button>
          </div>
        </form>
      </Dialog>

      {/* 2. Add Campus */}
      <Dialog isOpen={modalType === "CAMPUS"} onClose={() => setModalType(null)} title="Add Campus" description="Provision a new college campus branch.">
        <form onSubmit={handleCreateCampus} className="space-y-3 text-xs">
          <div>
            <label className="font-semibold block mb-1">Campus Code</label>
            <Input placeholder="e.g. MAIN" value={campusCode} onChange={(e) => setCampusCode(e.target.value)} required />
          </div>
          <div>
            <label className="font-semibold block mb-1">Campus Name</label>
            <Input placeholder="e.g. Main Technology Campus" value={campusName} onChange={(e) => setCampusName(e.target.value)} required />
          </div>
          <div>
            <label className="font-semibold block mb-1">Address</label>
            <Input placeholder="e.g. Sector 12, Tech Park" value={campusAddress} onChange={(e) => setCampusAddress(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button type="button" variant="outline" size="sm" onClick={() => setModalType(null)}>Cancel</Button>
            <Button type="submit" size="sm" isLoading={createCampusMutation.isPending}>Create Campus</Button>
          </div>
        </form>
      </Dialog>

      {/* 3. Add Program */}
      <Dialog isOpen={modalType === "PROGRAM"} onClose={() => setModalType(null)} title="Add Degree Program" description="Create an accredited degree program (e.g. B.Tech).">
        <form onSubmit={handleCreateProgram} className="space-y-3 text-xs">
          <div>
            <label className="font-semibold block mb-1">Program Code</label>
            <Input placeholder="e.g. B.Tech" value={progCode} onChange={(e) => setProgCode(e.target.value)} required />
          </div>
          <div>
            <label className="font-semibold block mb-1">Program Name</label>
            <Input placeholder="e.g. Bachelor of Technology" value={progName} onChange={(e) => setProgName(e.target.value)} required />
          </div>
          <div>
            <label className="font-semibold block mb-1">Duration (Semesters)</label>
            <Input type="number" min="1" max="16" value={progDuration} onChange={(e) => setProgDuration(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button type="button" variant="outline" size="sm" onClick={() => setModalType(null)}>Cancel</Button>
            <Button type="submit" size="sm" isLoading={createProgramMutation.isPending}>Create Program</Button>
          </div>
        </form>
      </Dialog>

      {/* 4. Add Batch */}
      <Dialog isOpen={modalType === "BATCH"} onClose={() => setModalType(null)} title="Add Academic Batch" description="Create a cohort year group (e.g. 2023-2027).">
        <form onSubmit={handleCreateBatch} className="space-y-3 text-xs">
          <div>
            <label className="font-semibold block mb-1">Batch Title</label>
            <Input placeholder="e.g. 2023-2027" value={batchName} onChange={(e) => setBatchName(e.target.value)} required />
          </div>
          <div>
            <label className="font-semibold block mb-1">Program</label>
            <select value={batchProgId} onChange={(e) => setBatchProgId(e.target.value)} className="w-full h-8 rounded-lg border border-input bg-background px-2 text-xs">
              {(programs || []).map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
            </select>
          </div>
          <div>
            <label className="font-semibold block mb-1">Department</label>
            <select value={batchDeptId} onChange={(e) => setBatchDeptId(e.target.value)} className="w-full h-8 rounded-lg border border-input bg-background px-2 text-xs">
              {(departments || []).map((d) => (<option key={d.id} value={d.id}>{d.name}</option>))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-semibold block mb-1">Start Year</label>
              <Input type="number" value={batchStartYear} onChange={(e) => setBatchStartYear(e.target.value)} required />
            </div>
            <div>
              <label className="font-semibold block mb-1">End Year</label>
              <Input type="number" value={batchEndYear} onChange={(e) => setBatchEndYear(e.target.value)} required />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button type="button" variant="outline" size="sm" onClick={() => setModalType(null)}>Cancel</Button>
            <Button type="submit" size="sm" isLoading={createBatchMutation.isPending}>Create Batch</Button>
          </div>
        </form>
      </Dialog>

      {/* 5. Add Semester */}
      <Dialog isOpen={modalType === "SEMESTER"} onClose={() => setModalType(null)} title="Add Semester" description="Schedule a semester term for a batch.">
        <form onSubmit={handleCreateSemester} className="space-y-3 text-xs">
          <div>
            <label className="font-semibold block mb-1">Batch</label>
            <select value={semBatchId} onChange={(e) => setSemBatchId(e.target.value)} className="w-full h-8 rounded-lg border border-input bg-background px-2 text-xs">
              {(batches || []).map((b) => (<option key={b.id} value={b.id}>{b.name} ({b.program?.name})</option>))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-semibold block mb-1">Semester Number</label>
              <Input type="number" min="1" max="16" value={semNumber} onChange={(e) => setSemNumber(e.target.value)} required />
            </div>
            <div>
              <label className="font-semibold block mb-1">Academic Year</label>
              <Input value={semYear} onChange={(e) => setSemYear(e.target.value)} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-semibold block mb-1">Start Date</label>
              <Input type="date" value={semStart} onChange={(e) => setSemStart(e.target.value)} required />
            </div>
            <div>
              <label className="font-semibold block mb-1">End Date</label>
              <Input type="date" value={semEnd} onChange={(e) => setSemEnd(e.target.value)} required />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button type="button" variant="outline" size="sm" onClick={() => setModalType(null)}>Cancel</Button>
            <Button type="submit" size="sm" isLoading={createSemesterMutation.isPending}>Create Semester</Button>
          </div>
        </form>
      </Dialog>

      {/* 6. Add Section */}
      <Dialog isOpen={modalType === "SECTION"} onClose={() => setModalType(null)} title="Add Section" description="Create a student section for a semester.">
        <form onSubmit={handleCreateSection} className="space-y-3 text-xs">
          <div>
            <label className="font-semibold block mb-1">Semester</label>
            <select value={secSemId} onChange={(e) => setSecSemId(e.target.value)} className="w-full h-8 rounded-lg border border-input bg-background px-2 text-xs">
              {(semesters || []).map((s) => (<option key={s.id} value={s.id}>Sem {s.number} ({s.academicYear})</option>))}
            </select>
          </div>
          <div>
            <label className="font-semibold block mb-1">Section Name</label>
            <Input placeholder="e.g. A" value={secName} onChange={(e) => setSecName(e.target.value)} required />
          </div>
          <div>
            <label className="font-semibold block mb-1">Capacity</label>
            <Input type="number" value={secCapacity} onChange={(e) => setSecCapacity(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button type="button" variant="outline" size="sm" onClick={() => setModalType(null)}>Cancel</Button>
            <Button type="submit" size="sm" isLoading={createSectionMutation.isPending}>Create Section</Button>
          </div>
        </form>
      </Dialog>

      {/* 7. Add Subject */}
      <Dialog isOpen={modalType === "SUBJECT"} onClose={() => setModalType(null)} title="Add Subject" description="Add a course subject to curriculum catalog.">
        <form onSubmit={handleCreateSubject} className="space-y-3 text-xs">
          <div>
            <label className="font-semibold block mb-1">Department</label>
            <select value={subDeptId} onChange={(e) => setSubDeptId(e.target.value)} className="w-full h-8 rounded-lg border border-input bg-background px-2 text-xs">
              {(departments || []).map((d) => (<option key={d.id} value={d.id}>{d.name}</option>))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-semibold block mb-1">Subject Code</label>
              <Input placeholder="e.g. CS301" value={subCode} onChange={(e) => setSubCode(e.target.value)} required />
            </div>
            <div>
              <label className="font-semibold block mb-1">Credits</label>
              <Input type="number" min="0" max="10" value={subCredits} onChange={(e) => setSubCredits(e.target.value)} required />
            </div>
          </div>
          <div>
            <label className="font-semibold block mb-1">Subject Name</label>
            <Input placeholder="e.g. Data Structures & Algorithms" value={subName} onChange={(e) => setSubName(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button type="button" variant="outline" size="sm" onClick={() => setModalType(null)}>Cancel</Button>
            <Button type="submit" size="sm" isLoading={createSubjectMutation.isPending}>Create Subject</Button>
          </div>
        </form>
      </Dialog>

      {/* 8. Add Offering */}
      <Dialog isOpen={modalType === "OFFERING"} onClose={() => setModalType(null)} title="Assign Subject to Faculty" description="Assign a teacher to teach a subject to a section.">
        <form onSubmit={handleCreateOffering} className="space-y-3 text-xs">
          <div>
            <label className="font-semibold block mb-1">Subject</label>
            <select value={offSubId} onChange={(e) => setOffSubId(e.target.value)} className="w-full h-8 rounded-lg border border-input bg-background px-2 text-xs">
              {(subjects || []).map((s) => (<option key={s.id} value={s.id}>{s.code} - {s.name}</option>))}
            </select>
          </div>
          <div>
            <label className="font-semibold block mb-1">Teacher</label>
            <select value={offTeacherId} onChange={(e) => setOffTeacherId(e.target.value)} className="w-full h-8 rounded-lg border border-input bg-background px-2 text-xs">
              {((Array.isArray(teachers) ? teachers : (teachers as any)?.items) || []).map((t: any) => (
                <option key={t.id} value={t.id}>{t.user?.firstName} {t.user?.lastName} ({t.employeeId})</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-semibold block mb-1">Semester</label>
              <select value={offSemId} onChange={(e) => setOffSemId(e.target.value)} className="w-full h-8 rounded-lg border border-input bg-background px-2 text-xs">
                {(semesters || []).map((s) => (<option key={s.id} value={s.id}>Sem {s.number}</option>))}
              </select>
            </div>
            <div>
              <label className="font-semibold block mb-1">Section</label>
              <select value={offSecId} onChange={(e) => setOffSecId(e.target.value)} className="w-full h-8 rounded-lg border border-input bg-background px-2 text-xs">
                {(sections || []).map((sec) => (<option key={sec.id} value={sec.id}>Sec {sec.name}</option>))}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button type="button" variant="outline" size="sm" onClick={() => setModalType(null)}>Cancel</Button>
            <Button type="submit" size="sm" isLoading={createOfferingMutation.isPending}>Assign Offering</Button>
          </div>
        </form>
      </Dialog>

      {/* 9. Add Room */}
      <Dialog isOpen={modalType === "ROOM"} onClose={() => setModalType(null)} title="Add Classroom / Lab" description="Register a physical room in a campus for lecture allocation.">
        <form onSubmit={handleCreateRoom} className="space-y-3 text-xs">
          <div>
            <label className="font-semibold block mb-1">Campus</label>
            <select value={roomCampusId} onChange={(e) => setRoomCampusId(e.target.value)} className="w-full h-8 rounded-lg border border-input bg-background px-2 text-xs">
              {(campuses || []).map((c) => (<option key={c.id} value={c.id}>{c.name} ({c.code})</option>))}
            </select>
          </div>
          <div>
            <label className="font-semibold block mb-1">Room Code / Number</label>
            <Input placeholder="e.g. LT-101 or LAB-3" value={roomCode} onChange={(e) => setRoomCode(e.target.value)} required />
          </div>
          <div>
            <label className="font-semibold block mb-1">Capacity</label>
            <Input type="number" min="1" max="500" value={roomCap} onChange={(e) => setRoomCap(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button type="button" variant="outline" size="sm" onClick={() => setModalType(null)}>Cancel</Button>
            <Button type="submit" size="sm" isLoading={createRoomMutation.isPending}>Register Room</Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
