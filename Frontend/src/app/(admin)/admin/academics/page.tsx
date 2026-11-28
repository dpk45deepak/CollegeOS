"use client";

import React, { useEffect, useState } from "react";
import { toast } from "sonner";
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
  Edit2,
  UserPlus,
  Clock,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCampuses,
  useCreateCampus,
  useUpdateCampus,
  useDepartments,
  useCreateDepartment,
  useUpdateDepartment,
  usePrograms,
  useCreateProgram,
  useUpdateProgram,
  useBatches,
  useCreateBatch,
  useSemesters,
  useCreateSemester,
  useUpdateSemester,
  useSections,
  useCreateSection,
  useUpdateSection,
  useSubjects,
  useCreateSubject,
  useUpdateSubject,
  useCollegeSettings,
  useUpdateCollegeSettings,
} from "@/hooks/useAcademic";
import {
  useSubjectOfferings,
  useCreateSubjectOffering,
  useTeachers,
  useEnrollStudents,
} from "@/hooks/useFaculty";
import { useStudents } from "@/hooks/useStudents";
import {
  useRooms,
  useCreateRoom,
  useCreateTimetableSlot,
  useCheckTimetableConflict,
  useSectionTimetable,
  useDeleteTimetableSlot,
} from "@/hooks/useTimetable";
import { timeStringToMinutes, DayOfWeek, timetableApi } from "@/services/api/timetable.api";

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
  const [editingId, setEditingId] = useState<string | null>(null);

  // Enroll Students in Offering state
  const [enrollOfferingId, setEnrollOfferingId] = useState<string | null>(null);
  const [enrollOfferingLabel, setEnrollOfferingLabel] = useState("");
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const { data: studentsRaw } = useStudents({ limit: 100 });
  const enrollStudentsMutation = useEnrollStudents();

  // Faculty Availability state
  const [availTeacherId, setAvailTeacherId] = useState("");
  const [availWindows, setAvailWindows] = useState<Array<{ dayOfWeek: DayOfWeek; startTime: string; endTime: string }>>([
    { dayOfWeek: "MON", startTime: "09:00", endTime: "17:00" },
  ]);
  const [savingAvail, setSavingAvail] = useState(false);

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

  useEffect(() => {
    if (settings) {
      if (typeof settings.attendanceThreshold === "number") {
        setSettingThreshold(settings.attendanceThreshold);
      }
      if (settings.attendanceMode) {
        setSettingMode(settings.attendanceMode);
      }
    }
  }, [settings]);

  // Mutations
  const createCampusMutation = useCreateCampus();
  const updateCampusMutation = useUpdateCampus();
  const createDeptMutation = useCreateDepartment();
  const updateDeptMutation = useUpdateDepartment();
  const createProgramMutation = useCreateProgram();
  const updateProgramMutation = useUpdateProgram();
  const createBatchMutation = useCreateBatch();
  const createSemesterMutation = useCreateSemester();
  const updateSemesterMutation = useUpdateSemester();
  const createSectionMutation = useCreateSection();
  const updateSectionMutation = useUpdateSection();
  const createSubjectMutation = useCreateSubject();
  const updateSubjectMutation = useUpdateSubject();
  const createOfferingMutation = useCreateSubjectOffering();
  const createRoomMutation = useCreateRoom();
  const createSlotMutation = useCreateTimetableSlot();
  const checkConflictMutation = useCheckTimetableConflict();
  const deleteSlotMutation = useDeleteTimetableSlot();
  const updateSettingsMutation = useUpdateCollegeSettings();

  const { data: sectionSlots, refetch: refetchSectionSlots } = useSectionTimetable(selectedSectionForView);

  // Handlers
  const handleSaveCampus = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dto = {
        code: campusCode.trim(),
        name: campusName.trim(),
        address: campusAddress.trim() || undefined,
      };
      if (editingId) {
        await updateCampusMutation.mutateAsync({ id: editingId, dto });
        toast.success("Campus updated successfully.");
      } else {
        await createCampusMutation.mutateAsync(dto);
        toast.success("Campus created successfully.");
      }
      setModalType(null);
      setEditingId(null);
      setCampusCode("");
      setCampusName("");
      setCampusAddress("");
    } catch (err: any) {
      toast.error(err?.message || "Failed to save campus");
    }
  };

  const handleSaveDept = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dto = {
        code: deptCode.trim(),
        name: deptName.trim(),
        campusId: deptCampusId || undefined,
      };
      if (editingId) {
        await updateDeptMutation.mutateAsync({ id: editingId, dto });
        toast.success("Department updated successfully.");
      } else {
        await createDeptMutation.mutateAsync(dto);
        toast.success("Department created successfully.");
      }
      setModalType(null);
      setEditingId(null);
      setDeptCode("");
      setDeptName("");
      setDeptCampusId("");
    } catch (err: any) {
      toast.error(err?.message || "Failed to save department");
    }
  };

  const handleSaveProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dto = {
        code: progCode.trim(),
        name: progName.trim(),
        durationSemesters: parseInt(progDuration, 10) || 8,
      };
      if (editingId) {
        await updateProgramMutation.mutateAsync({ id: editingId, dto });
        toast.success("Degree program updated successfully.");
      } else {
        await createProgramMutation.mutateAsync(dto);
        toast.success("Degree program created successfully.");
      }
      setModalType(null);
      setEditingId(null);
      setProgCode("");
      setProgName("");
    } catch (err: any) {
      toast.error(err?.message || "Failed to save program");
    }
  };

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    const programId = batchProgId || programs?.[0]?.id || "";
    const departmentId = batchDeptId || departments?.[0]?.id || "";
    if (!programId || !departmentId) {
      toast.error("Create at least one program and department before creating a batch.");
      return;
    }
    try {
      await createBatchMutation.mutateAsync({
        programId,
        departmentId,
        name: batchName.trim(),
        startYear: parseInt(batchStartYear, 10),
        endYear: parseInt(batchEndYear, 10),
      });
      toast.success("Academic batch created successfully.");
      setModalType(null);
      setBatchName("");
    } catch (err: any) {
      toast.error(err?.message || "Failed to create batch");
    }
  };

  const handleSaveSemester = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateSemesterMutation.mutateAsync({
          id: editingId,
          dto: {
            number: parseInt(semNumber, 10),
            academicYear: semYear.trim(),
            startDate: semStart,
            endDate: semEnd,
          },
        });
        toast.success("Semester updated successfully.");
      } else {
        const batchId = semBatchId || batches?.[0]?.id || "";
        if (!batchId) {
          toast.error("Create an academic batch before creating a semester.");
          return;
        }
        await createSemesterMutation.mutateAsync({
          batchId,
          number: parseInt(semNumber, 10),
          academicYear: semYear.trim(),
          startDate: semStart,
          endDate: semEnd,
          isCurrent: true,
        });
        toast.success("Semester created successfully.");
      }
      setModalType(null);
      setEditingId(null);
    } catch (err: any) {
      toast.error(err?.message || "Failed to save semester");
    }
  };

  const handleSaveSection = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateSectionMutation.mutateAsync({
          id: editingId,
          dto: {
            name: secName.trim(),
            capacity: parseInt(secCapacity, 10) || 60,
          },
        });
        toast.success("Section updated successfully.");
      } else {
        const semesterId = secSemId || semesters?.[0]?.id || "";
        if (!semesterId) {
          toast.error("Create a semester before creating a section.");
          return;
        }
        await createSectionMutation.mutateAsync({
          semesterId,
          name: secName.trim(),
          capacity: parseInt(secCapacity, 10) || 60,
        });
        toast.success("Section created successfully.");
      }
      setModalType(null);
      setEditingId(null);
      setSecName("");
    } catch (err: any) {
      toast.error(err?.message || "Failed to save section");
    }
  };

  const handleSaveSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    const departmentId = subDeptId || departments?.[0]?.id || "";
    if (!departmentId) {
      toast.error("Create a department before saving a subject.");
      return;
    }
    try {
      const dto = {
        departmentId,
        code: subCode.trim(),
        name: subName.trim(),
        credits: parseInt(subCredits, 10),
        semesterNumber: parseInt(subSemNumber, 10) || 1,
        isElective: subIsElective,
      };
      if (editingId) {
        await updateSubjectMutation.mutateAsync({ id: editingId, dto });
        toast.success("Subject updated.");
      } else {
        await createSubjectMutation.mutateAsync(dto);
        toast.success("Subject added to catalog.");
      }
      setModalType(null);
      setEditingId(null);
      setSubCode("");
      setSubName("");
      setSubIsElective(false);
    } catch (err: any) {
      toast.error(err?.message || "Failed to save subject");
    }
  };

  const handleEnrollStudents = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollOfferingId || selectedStudentIds.length === 0) {
      toast.error("Select at least one student to enroll.");
      return;
    }
    try {
      await enrollStudentsMutation.mutateAsync({
        offeringId: enrollOfferingId,
        studentIds: selectedStudentIds,
      });
      toast.success(`Enrolled ${selectedStudentIds.length} student(s).`);
      setEnrollOfferingId(null);
      setSelectedStudentIds([]);
    } catch (err: any) {
      toast.error(err?.message || "Failed to enroll students");
    }
  };

  const handleSaveAvailability = async (e: React.FormEvent) => {
    e.preventDefault();
    const teacherList = Array.isArray(teachers) ? teachers : (teachers as any)?.items || [];
    const targetTeacherId = availTeacherId || teacherList[0]?.id || "";
    if (!targetTeacherId) {
      toast.error("Select a faculty member.");
      return;
    }
    const windows = availWindows
      .map((w) => ({
        dayOfWeek: w.dayOfWeek,
        startMinute: timeStringToMinutes(w.startTime),
        endMinute: timeStringToMinutes(w.endTime),
      }))
      .filter((w) => w.endMinute > w.startMinute);
    if (windows.length === 0) {
      toast.error("Add at least one valid window where end time is after start time.");
      return;
    }
    setSavingAvail(true);
    try {
      await timetableApi.setTeacherAvailability(targetTeacherId, windows);
      toast.success("Faculty availability windows updated for timetable clash engine.");
      setModalType(null);
    } catch (err: any) {
      toast.error(err?.message || "Failed to update faculty availability");
    } finally {
      setSavingAvail(false);
    }
  };

  const handleCreateOffering = async (e: React.FormEvent) => {
    e.preventDefault();
    const teacherList = Array.isArray(teachers) ? teachers : (teachers as any)?.items || [];
    const subjectId = offSubId || subjects?.[0]?.id || "";
    const semesterId = offSemId || semesters?.[0]?.id || "";
    const sectionId = offSecId || sections?.[0]?.id || "";
    const teacherId = offTeacherId || teacherList[0]?.id || "";
    if (!subjectId || !semesterId || !sectionId || !teacherId) {
      toast.error("Subject, semester, section, and teacher are all required.");
      return;
    }
    try {
      await createOfferingMutation.mutateAsync({
        subjectId,
        semesterId,
        sectionId,
        teacherId,
        enrollSection: true,
      });
      toast.success("Subject offering assigned and section enrolled.");
      setModalType(null);
    } catch (err: any) {
      toast.error(err?.message || "Failed to assign subject offering");
    }
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    const campusId = roomCampusId || campuses?.[0]?.id || "";
    if (!campusId) {
      toast.error("Create a campus before registering a room.");
      return;
    }
    try {
      await createRoomMutation.mutateAsync({
        campusId,
        code: roomCode.trim(),
        capacity: parseInt(roomCap, 10) || 60,
      });
      toast.success("Classroom registered.");
      setModalType(null);
      setRoomCode("");
    } catch (err: any) {
      toast.error(err?.message || "Failed to register room");
    }
  };

  const handleCheckConflict = async () => {
    if (!slotOfferingId) return;
    const startM = timeStringToMinutes(slotStartTime);
    const endM = timeStringToMinutes(slotEndTime);
    if (startM >= endM) {
      setConflictResult({ hasConflict: true, message: "End time must be after start time." });
      return;
    }
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
    if (startM >= endM) {
      setConflictResult({ hasConflict: true, message: "End time must be after start time." });
      return;
    }
    try {
      await createSlotMutation.mutateAsync({
        subjectOfferingId: slotOfferingId,
        roomId: slotRoomId || undefined,
        dayOfWeek: slotDay,
        startMinute: startM,
        endMinute: endM,
        validFrom: new Date().toISOString(),
      });
      toast.success("Timetable slot scheduled!");
      setConflictResult({
        hasConflict: false,
        message: "Slot scheduled successfully!",
      });
      if (selectedSectionForView) {
        refetchSectionSlots();
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to schedule slot");
      setConflictResult({
        hasConflict: true,
        message: err?.message || "Failed to schedule slot.",
      });
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateSettingsMutation.mutateAsync({
        attendanceThreshold: settingThreshold,
        attendanceMode: settingMode,
      });
      toast.success("Academic settings saved.");
    } catch (err: any) {
      toast.error(err?.message || "Failed to update settings");
    }
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
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setEditingId(null);
                  setCampusCode("");
                  setCampusName("");
                  setCampusAddress("");
                  setModalType("CAMPUS");
                }}
                className="text-xs gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" /> Add Campus
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setEditingId(null);
                  setDeptCode("");
                  setDeptName("");
                  setDeptCampusId("");
                  setModalType("DEPT");
                }}
                className="text-xs gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" /> Add Department
              </Button>
            </div>
          </div>

          {/* Campuses Strip */}
          {(campuses || []).length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {(campuses || []).map((c) => (
                <Card key={c.id} className="bg-muted/20">
                  <CardContent className="p-3 flex items-center justify-between gap-2 text-xs">
                    <div>
                      <span className="font-mono font-bold text-primary">{c.code}</span>
                      <div className="font-semibold text-foreground">{c.name}</div>
                      {c.address && <div className="text-[11px] text-muted-foreground">{c.address}</div>}
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-[11px]"
                      onClick={() => {
                        setEditingId(c.id);
                        setCampusCode(c.code);
                        setCampusName(c.name);
                        setCampusAddress(c.address || "");
                        setModalType("CAMPUS");
                      }}
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loadingDepts ? (
              <Skeleton className="h-36 w-full rounded-xl" />
            ) : (departments || []).length === 0 ? (
              <div className="col-span-full p-8 text-center text-xs text-muted-foreground border border-dashed rounded-xl">
                No departments configured yet. Click &quot;Add Department&quot; to create one.
              </div>
            ) : (
              (departments || []).map((d) => (
                <Card key={d.id} className="hover:border-primary/50 transition-colors">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 bg-primary/10 text-primary rounded">
                        {d.code}
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-[11px]"
                        onClick={() => {
                          setEditingId(d.id);
                          setDeptCode(d.code);
                          setDeptName(d.name);
                          setDeptCampusId(d.campusId || "");
                          setModalType("DEPT");
                        }}
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
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
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setEditingId(null);
                  setProgCode("");
                  setProgName("");
                  setProgDuration("8");
                  setModalType("PROGRAM");
                }}
                className="text-xs gap-1.5"
              >
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
                    <div key={p.id} className="p-3 flex items-center justify-between gap-2">
                      <div>
                        <div className="font-semibold text-foreground">{p.name}</div>
                        <div className="text-muted-foreground font-mono">{p.code}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="bg-muted px-2 py-0.5 rounded text-[11px] font-semibold">
                          {p.durationSemesters} Semesters
                        </span>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2"
                          onClick={() => {
                            setEditingId(p.id);
                            setProgCode(p.code);
                            setProgName(p.name);
                            setProgDuration(String(p.durationSemesters));
                            setModalType("PROGRAM");
                          }}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                      </div>
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
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setEditingId(null);
                  setSemNumber("1");
                  setSemYear("2026-27");
                  setModalType("SEMESTER");
                }}
                className="text-xs gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" /> Add Semester
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setEditingId(null);
                  setSecName("");
                  setSecCapacity("60");
                  setModalType("SECTION");
                }}
                className="text-xs gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" /> Add Section
              </Button>
            </div>
          </div>

          {/* Semesters Summary Strip */}
          {(semesters || []).length > 0 && (
            <div className="flex flex-wrap gap-2">
              {(semesters || []).map((sem) => (
                <div key={sem.id} className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border bg-muted/20 text-xs">
                  <span className="font-semibold">Sem {sem.number}</span>
                  <span className="text-muted-foreground font-mono">({sem.academicYear})</span>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-6 px-1.5"
                    onClick={() => {
                      setEditingId(sem.id);
                      setSemBatchId(sem.batchId);
                      setSemNumber(String(sem.number));
                      setSemYear(sem.academicYear);
                      setSemStart(sem.startDate ? String(sem.startDate).split("T")[0] : "2026-08-01");
                      setSemEnd(sem.endDate ? String(sem.endDate).split("T")[0] : "2026-12-15");
                      setModalType("SEMESTER");
                    }}
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(sections || []).map((sec) => (
              <Card key={sec.id}>
                <CardContent className="p-4 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-foreground">Section {sec.name}</span>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-6 px-1.5"
                      onClick={() => {
                        setEditingId(sec.id);
                        setSecSemId(sec.semesterId);
                        setSecName(sec.name);
                        setSecCapacity(String(sec.capacity ?? 60));
                        setModalType("SECTION");
                      }}
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
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
            <Button
              size="sm"
              onClick={() => {
                setEditingId(null);
                setSubCode("");
                setSubName("");
                setSubCredits("3");
                setSubSemNumber("1");
                setSubIsElective(false);
                setModalType("SUBJECT");
              }}
              className="text-xs gap-1.5"
            >
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
                    <th className="p-3">Type</th>
                    <th className="p-3 text-right pr-4">Edit</th>
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
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${sub.isElective ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300" : "bg-muted text-muted-foreground"}`}>
                          {sub.isElective ? "Elective" : "Core"}
                        </span>
                      </td>
                      <td className="p-3 text-right pr-4">
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2"
                          onClick={() => {
                            setEditingId(sub.id);
                            setSubDeptId(sub.departmentId);
                            setSubCode(sub.code);
                            setSubName(sub.name);
                            setSubCredits(String(sub.credits));
                            setSubSemNumber(String(sub.semesterNumber || 1));
                            setSubIsElective(Boolean(sub.isElective));
                            setModalType("SUBJECT");
                          }}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
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
                    <th className="p-3 text-center">Students Enrolled</th>
                    <th className="p-3 text-right pr-4">Actions</th>
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
                      <td className="p-3 text-center font-mono font-bold">
                        {off._count?.enrollments ?? 0}
                      </td>
                      <td className="p-3 text-right pr-4">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-7 text-[11px] gap-1"
                          onClick={() => {
                            setEnrollOfferingId(off.id);
                            setEnrollOfferingLabel(`${off.subject?.code || ""} (Sec ${off.section?.name || ""})`);
                            setSelectedStudentIds([]);
                          }}
                        >
                          <UserPlus className="h-3 w-3" /> Enroll Students
                        </Button>
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
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setModalType("AVAILABILITY")} className="text-xs gap-1.5">
                <Clock className="h-3.5 w-3.5" /> Faculty Availability
              </Button>
              <Button size="sm" variant="outline" onClick={() => setModalType("ROOM")} className="text-xs gap-1.5">
                <Plus className="h-3.5 w-3.5" /> Add Room
              </Button>
            </div>
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
      {/* 1. Add / Edit Department */}
      <Dialog isOpen={modalType === "DEPT"} onClose={() => { setModalType(null); setEditingId(null); }} title={editingId ? "Edit Department" : "Add Department"} description="Provision or update an academic department in this college.">
        <form onSubmit={handleSaveDept} className="space-y-3 text-xs">
          <div>
            <label className="font-semibold block mb-1">Department Code</label>
            <Input placeholder="e.g. CSE" value={deptCode} onChange={(e) => setDeptCode(e.target.value)} required />
          </div>
          <div>
            <label className="font-semibold block mb-1">Department Name</label>
            <Input placeholder="e.g. Computer Science & Engineering" value={deptName} onChange={(e) => setDeptName(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button type="button" variant="outline" size="sm" onClick={() => { setModalType(null); setEditingId(null); }}>Cancel</Button>
            <Button type="submit" size="sm" isLoading={createDeptMutation.isPending || updateDeptMutation.isPending}>{editingId ? "Save Changes" : "Create Department"}</Button>
          </div>
        </form>
      </Dialog>

      {/* 2. Add / Edit Campus */}
      <Dialog isOpen={modalType === "CAMPUS"} onClose={() => { setModalType(null); setEditingId(null); }} title={editingId ? "Edit Campus" : "Add Campus"} description="Provision or update a college campus branch.">
        <form onSubmit={handleSaveCampus} className="space-y-3 text-xs">
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
            <Button type="button" variant="outline" size="sm" onClick={() => { setModalType(null); setEditingId(null); }}>Cancel</Button>
            <Button type="submit" size="sm" isLoading={createCampusMutation.isPending || updateCampusMutation.isPending}>{editingId ? "Save Changes" : "Create Campus"}</Button>
          </div>
        </form>
      </Dialog>

      {/* 3. Add / Edit Program */}
      <Dialog isOpen={modalType === "PROGRAM"} onClose={() => { setModalType(null); setEditingId(null); }} title={editingId ? "Edit Degree Program" : "Add Degree Program"} description="Create or update an accredited degree program (e.g. B.Tech).">
        <form onSubmit={handleSaveProgram} className="space-y-3 text-xs">
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
            <Button type="button" variant="outline" size="sm" onClick={() => { setModalType(null); setEditingId(null); }}>Cancel</Button>
            <Button type="submit" size="sm" isLoading={createProgramMutation.isPending || updateProgramMutation.isPending}>{editingId ? "Save Changes" : "Create Program"}</Button>
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

      {/* 5. Add / Edit Semester */}
      <Dialog isOpen={modalType === "SEMESTER"} onClose={() => { setModalType(null); setEditingId(null); }} title={editingId ? "Edit Semester" : "Add Semester"} description="Schedule or update a semester term for a batch.">
        <form onSubmit={handleSaveSemester} className="space-y-3 text-xs">
          {!editingId && (
            <div>
              <label className="font-semibold block mb-1">Batch</label>
              <select value={semBatchId} onChange={(e) => setSemBatchId(e.target.value)} className="w-full h-8 rounded-lg border border-input bg-background px-2 text-xs">
                {(batches || []).map((b) => (<option key={b.id} value={b.id}>{b.name} ({b.program?.name})</option>))}
              </select>
            </div>
          )}
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
            <Button type="button" variant="outline" size="sm" onClick={() => { setModalType(null); setEditingId(null); }}>Cancel</Button>
            <Button type="submit" size="sm" isLoading={createSemesterMutation.isPending || updateSemesterMutation.isPending}>{editingId ? "Save Changes" : "Create Semester"}</Button>
          </div>
        </form>
      </Dialog>

      {/* 6. Add / Edit Section */}
      <Dialog isOpen={modalType === "SECTION"} onClose={() => { setModalType(null); setEditingId(null); }} title={editingId ? "Edit Section" : "Add Section"} description="Create or update a student section for a semester.">
        <form onSubmit={handleSaveSection} className="space-y-3 text-xs">
          {!editingId && (
            <div>
              <label className="font-semibold block mb-1">Semester</label>
              <select value={secSemId} onChange={(e) => setSecSemId(e.target.value)} className="w-full h-8 rounded-lg border border-input bg-background px-2 text-xs">
                {(semesters || []).map((s) => (<option key={s.id} value={s.id}>Sem {s.number} ({s.academicYear})</option>))}
              </select>
            </div>
          )}
          <div>
            <label className="font-semibold block mb-1">Section Name</label>
            <Input placeholder="e.g. A" value={secName} onChange={(e) => setSecName(e.target.value)} required />
          </div>
          <div>
            <label className="font-semibold block mb-1">Capacity</label>
            <Input type="number" value={secCapacity} onChange={(e) => setSecCapacity(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button type="button" variant="outline" size="sm" onClick={() => { setModalType(null); setEditingId(null); }}>Cancel</Button>
            <Button type="submit" size="sm" isLoading={createSectionMutation.isPending || updateSectionMutation.isPending}>{editingId ? "Save Changes" : "Create Section"}</Button>
          </div>
        </form>
      </Dialog>

      {/* 7. Add / Edit Subject */}
      <Dialog isOpen={modalType === "SUBJECT"} onClose={() => { setModalType(null); setEditingId(null); }} title={editingId ? "Edit Subject" : "Add Subject"} description="Add or update a course subject in the curriculum catalog.">
        <form onSubmit={handleSaveSubject} className="space-y-3 text-xs">
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
          <div className="grid grid-cols-2 gap-2 items-center">
            <div>
              <label className="font-semibold block mb-1">Semester Number</label>
              <Input type="number" min="1" max="16" value={subSemNumber} onChange={(e) => setSubSemNumber(e.target.value)} required />
            </div>
            <label className="flex items-center gap-2 pt-4 cursor-pointer">
              <input
                type="checkbox"
                checked={subIsElective}
                onChange={(e) => setSubIsElective(e.target.checked)}
                className="rounded border-input text-primary"
              />
              <span className="font-semibold">Elective Subject</span>
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button type="button" variant="outline" size="sm" onClick={() => { setModalType(null); setEditingId(null); }}>Cancel</Button>
            <Button type="submit" size="sm" isLoading={createSubjectMutation.isPending || updateSubjectMutation.isPending}>{editingId ? "Save Changes" : "Create Subject"}</Button>
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

      {/* 10. Manual Student Enrollment (POST /subject-offerings/:id/enrollments) */}
      <Dialog
        isOpen={!!enrollOfferingId}
        onClose={() => setEnrollOfferingId(null)}
        title={`Enroll Students — ${enrollOfferingLabel}`}
        description="Manually add elective or transfer students into this subject offering."
      >
        <form onSubmit={handleEnrollStudents} className="space-y-3 text-xs">
          <div className="max-h-60 overflow-y-auto border border-border rounded-xl divide-y divide-border">
            {((Array.isArray(studentsRaw) ? studentsRaw : (studentsRaw as any)?.items) || []).map((st: any) => {
              const checked = selectedStudentIds.includes(st.id);
              return (
                <label key={st.id} className="flex items-center justify-between p-2.5 hover:bg-muted/30 cursor-pointer">
                  <div>
                    <span className="font-semibold text-foreground">{st.user?.firstName} {st.user?.lastName}</span>
                    <span className="ml-2 font-mono text-[11px] text-muted-foreground">{st.rollNumber}</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedStudentIds((prev) => [...prev, st.id]);
                      else setSelectedStudentIds((prev) => prev.filter((id) => id !== st.id));
                    }}
                    className="rounded"
                  />
                </label>
              );
            })}
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <span className="text-muted-foreground">{selectedStudentIds.length} selected</span>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setEnrollOfferingId(null)}>Cancel</Button>
              <Button type="submit" size="sm" isLoading={enrollStudentsMutation.isPending} disabled={selectedStudentIds.length === 0}>
                Enroll Selected
              </Button>
            </div>
          </div>
        </form>
      </Dialog>

      {/* 11. Faculty Availability (PUT /timetable/teachers/:id/availability) */}
      <Dialog
        isOpen={modalType === "AVAILABILITY"}
        onClose={() => setModalType(null)}
        title="Configure Faculty Availability"
        description="Set preferred teaching hours so the timetable scheduler flags unavailability clashes."
      >
        <form onSubmit={handleSaveAvailability} className="space-y-3 text-xs">
          <div>
            <label className="font-semibold block mb-1">Faculty Member</label>
            <select
              value={availTeacherId}
              onChange={(e) => setAvailTeacherId(e.target.value)}
              className="w-full h-8 rounded-lg border border-input bg-background px-2 text-xs"
            >
              {((Array.isArray(teachers) ? teachers : (teachers as any)?.items) || []).map((t: any) => (
                <option key={t.id} value={t.id}>{t.user?.firstName} {t.user?.lastName} ({t.employeeId})</option>
              ))}
            </select>
          </div>
          <div className="space-y-2 max-h-52 overflow-y-auto">
            {availWindows.map((win, idx) => (
              <div key={idx} className="grid grid-cols-4 gap-2 items-center">
                <select
                  value={win.dayOfWeek}
                  onChange={(e) =>
                    setAvailWindows((prev) =>
                      prev.map((w, i) => (i === idx ? { ...w, dayOfWeek: e.target.value as DayOfWeek } : w))
                    )
                  }
                  className="h-8 rounded-lg border border-input bg-background px-2 text-xs"
                >
                  {(["MON", "TUE", "WED", "THU", "FRI", "SAT"] as DayOfWeek[]).map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                <Input
                  value={win.startTime}
                  onChange={(e) =>
                    setAvailWindows((prev) => prev.map((w, i) => (i === idx ? { ...w, startTime: e.target.value } : w)))
                  }
                  className="h-8"
                />
                <Input
                  value={win.endTime}
                  onChange={(e) =>
                    setAvailWindows((prev) => prev.map((w, i) => (i === idx ? { ...w, endTime: e.target.value } : w)))
                  }
                  className="h-8"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-8 text-rose-600"
                  onClick={() => setAvailWindows((prev) => prev.filter((_, i) => i !== idx))}
                  disabled={availWindows.length <= 1}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="text-xs"
            onClick={() => setAvailWindows((prev) => [...prev, { dayOfWeek: "TUE", startTime: "09:00", endTime: "17:00" }])}
          >
            + Add Window
          </Button>
          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button type="button" variant="outline" size="sm" onClick={() => setModalType(null)}>Cancel</Button>
            <Button type="submit" size="sm" isLoading={savingAvail}>Save Availability</Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
