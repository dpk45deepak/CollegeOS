"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { studentApi } from "@/lib/api/student";
import { placementsApi, CompanyItem, JobItem, JobApplicationItem } from "@/services/api/placements.api";
import { useAuthStore } from "@/lib/auth/authStore";
import {
  Briefcase,
  Sparkles,
  MapPin,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  Building,
  Plus,
  Users,
  Award,
  Layers,
  ChevronRight,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

export default function StudentPlacementsPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const roleKeys = user?.roleKeys || [];
  const isOfficerOrAdmin =
    user?.role === "PLACEMENT_OFFICER" ||
    user?.role === "ADMIN" ||
    roleKeys.includes("PLACEMENT_OFFICER") ||
    roleKeys.includes("COLLEGE_ADMIN") ||
    roleKeys.includes("SUPER_ADMIN");
  const [activeTab, setActiveTab] = useState<"student" | "officer">(isOfficerOrAdmin ? "officer" : "student");
  React.useEffect(() => {
    if (isOfficerOrAdmin) setActiveTab("officer");
  }, [isOfficerOrAdmin]);

  // Student Openings
  const { data: drives, isLoading, error, refetch } = useQuery({
    queryKey: ["student_placements"],
    queryFn: () => studentApi.getPlacements(),
  });

  // Officer Data: Companies & Jobs
  const { data: companies, refetch: refetchCompanies } = useQuery({
    queryKey: ["officer_companies"],
    queryFn: () => placementsApi.listCompanies(),
    enabled: isOfficerOrAdmin && activeTab === "officer",
  });

  const { data: jobs, isLoading: jobsLoading, refetch: refetchJobs } = useQuery({
    queryKey: ["officer_jobs"],
    queryFn: () => placementsApi.listJobs(),
    enabled: isOfficerOrAdmin && activeTab === "officer",
  });

  // Officer Modals State
  const [isCreateCompanyOpen, setIsCreateCompanyOpen] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [companyIndustry, setCompanyIndustry] = useState("Technology");

  const [isCreateJobOpen, setIsCreateJobOpen] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [jobCtc, setJobCtc] = useState<number>(1200000);
  const [jobLocation, setJobLocation] = useState("Gurugram / Hybrid");
  const [jobSkills, setJobSkills] = useState("React, TypeScript, Node.js");
  const [jobMinCgpa, setJobMinCgpa] = useState<number>(7.0);

  const [isDriveOpen, setIsDriveOpen] = useState(false);
  const [driveJobId, setDriveJobId] = useState("");
  const [driveDate, setDriveDate] = useState("2026-11-20");
  const [driveVenue, setDriveVenue] = useState("Auditorium Hall B");

  // Mutations
  const createCompanyMutation = useMutation({
    mutationFn: () =>
      placementsApi.createCompany({
        name: companyName,
        website: companyWebsite || undefined,
        industry: companyIndustry,
      }),
    onSuccess: () => {
      toast.success("Recruitment partner company added!");
      setIsCreateCompanyOpen(false);
      setCompanyName("");
      setCompanyWebsite("");
      refetchCompanies();
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to register company");
    },
  });

  const createJobMutation = useMutation({
    mutationFn: () =>
      placementsApi.createJob({
        companyId: selectedCompanyId,
        title: jobTitle,
        ctc: Number(jobCtc),
        location: jobLocation,
        requiredSkills: (jobSkills || "").split(",").map((s) => s.trim()).filter(Boolean),
        minCgpa: Number(jobMinCgpa),
        maxBacklogs: 0,
        deadline: new Date(Date.now() + 14 * 86400000).toISOString(),
      }),
    onSuccess: () => {
      toast.success("Job opening published across student portals!");
      setIsCreateJobOpen(false);
      setJobTitle("");
      refetchJobs();
      queryClient.invalidateQueries({ queryKey: ["student_placements"] });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to post job");
    },
  });

  const createDriveMutation = useMutation({
    mutationFn: () =>
      placementsApi.createDrive({
        jobId: driveJobId,
        driveDate,
        venue: driveVenue,
      }),
    onSuccess: () => {
      toast.success("Campus recruitment drive scheduled!");
      setIsDriveOpen(false);
      queryClient.invalidateQueries({ queryKey: ["student_placements"] });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to schedule drive");
    },
  });

  const [appliedDriveId, setAppliedDriveId] = useState<string | null>(null);
  const applyMutation = useMutation({
    mutationFn: (id: string) => studentApi.applyPlacement(id),
    onSuccess: (_, id) => {
      setAppliedDriveId(id);
      toast.success("Application submitted successfully!");
      queryClient.invalidateQueries({ queryKey: ["student_placements"] });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to submit job application.");
    },
  });

  const respondOfferMutation = useMutation({
    mutationFn: ({ offerId, decision }: { offerId: string; decision: "ACCEPT" | "DECLINE" }) =>
      studentApi.respondPlacementOffer(offerId, decision),
    onSuccess: (_, vars) => {
      toast.success(vars.decision === "ACCEPT" ? "Placement offer accepted!" : "Placement offer declined.");
      queryClient.invalidateQueries({ queryKey: ["student_placements"] });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to update offer response.");
    },
  });

  const withdrawMutation = useMutation({
    mutationFn: (applicationId: string) => studentApi.withdrawPlacement(applicationId),
    onSuccess: () => {
      toast.success("Application withdrawn.");
      queryClient.invalidateQueries({ queryKey: ["student_placements"] });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to withdraw application.");
    },
  });

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border">
        <div>
          <h1 className="text-xl font-bold text-foreground">
            Corporate Relations & Placement Cell
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Recruiting company onboarding, student eligibility matching, campus drives, and verified offers.
          </p>
        </div>

        {isOfficerOrAdmin && (
          <div className="flex items-center bg-muted/60 p-1 rounded-xl border border-border">
            <button
              onClick={() => setActiveTab("officer")}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === "officer"
                  ? "bg-background text-foreground shadow-sm font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Officer Console
            </button>
            <button
              onClick={() => setActiveTab("student")}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === "student"
                  ? "bg-background text-foreground shadow-sm font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Student Openings
            </button>
          </div>
        )}
      </div>

      {/* OFFICER CONSOLE VIEW */}
      {isOfficerOrAdmin && activeTab === "officer" && (
        <div className="space-y-6">
          {/* Quick Action Cards Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="p-4 border border-border hover:border-brand-500/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950 flex items-center justify-center shrink-0">
                  <Building className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Partner Companies</h3>
                  <p className="text-[11px] text-muted-foreground">Register hiring partner or MNC</p>
                </div>
              </div>
              <Button
                size="sm"
                className="w-full mt-3 text-xs gap-1"
                onClick={() => setIsCreateCompanyOpen(true)}
              >
                <Plus className="h-3.5 w-3.5" /> Onboard Company
              </Button>
            </Card>

            <Card className="p-4 border border-border hover:border-brand-500/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 flex items-center justify-center shrink-0">
                  <Briefcase className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Post Job Opening</h3>
                  <p className="text-[11px] text-muted-foreground">Set CTC, skills & CGPA cutoffs</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-3 text-xs gap-1"
                onClick={() => setIsCreateJobOpen(true)}
              >
                <Plus className="h-3.5 w-3.5" /> Create Opening
              </Button>
            </Card>

            <Card className="p-4 border border-border hover:border-brand-500/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950 flex items-center justify-center shrink-0">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Schedule Drive</h3>
                  <p className="text-[11px] text-muted-foreground">On-campus or virtual test drive</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-3 text-xs gap-1"
                onClick={() => setIsDriveOpen(true)}
              >
                <Plus className="h-3.5 w-3.5" /> Plan Drive
              </Button>
            </Card>
          </div>

          {/* Active Job Openings Ledger */}
          <Card>
            <CardHeader className="p-5 pb-3 border-b border-border flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold">Published Placement Openings</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Live recruitment pipelines and applicant cohorts managed by TPO.
                </p>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {jobsLoading ? (
                <div className="p-6 space-y-2">
                  <Skeleton className="h-12 w-full rounded-lg" />
                  <Skeleton className="h-12 w-full rounded-lg" />
                </div>
              ) : !jobs || jobs.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground">
                  No corporate openings configured yet. Click &quot;Create Opening&quot; above to publish roles.
                </div>
              ) : (
                <div className="divide-y divide-border text-xs">
                  {jobs.map((job) => (
                    <div key={job.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/30 transition-colors">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-foreground text-sm">{job.title}</span>
                          <span className="text-[10px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950 px-2 py-0.5 rounded font-mono font-bold">
                            ₹{(Number(job.ctc || 0) / 100000).toFixed(1)} LPA
                          </span>
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-1 flex items-center gap-3">
                          <span>{job.company?.name || "Corporate Partner"}</span>
                          <span>•</span>
                          <span>Location: {job.location || "On-site"}</span>
                          <span>•</span>
                          <span>Cutoff: {job.minCgpa || 6.0} CGPA</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground text-[11px] bg-muted px-2 py-1 rounded">
                          {job._count?.applications || 0} Applicants
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setDriveJobId(job.id);
                            setIsDriveOpen(true);
                          }}
                          className="text-xs h-8"
                        >
                          Schedule Drive
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* STUDENT VIEW */}
      {(!isOfficerOrAdmin || activeTab === "student") && (
        <div className="space-y-6">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-28 w-full rounded-2xl" />
              <Skeleton className="h-56 w-full rounded-xl" />
            </div>
          ) : error || !drives ? (
            <ErrorState
              message="Could not load campus placement drives. Please verify server connection."
              onRetry={refetch}
            />
          ) : drives.length === 0 ? (
            <div className="p-8 text-center rounded-2xl border-2 border-dashed border-border bg-card/50 text-xs text-muted-foreground space-y-2">
              <Briefcase className="w-8 h-8 mx-auto text-muted-foreground/60" />
              <p className="font-semibold text-foreground">No active placement drives currently scheduled.</p>
              <p>New recruitment drives and corporate openings will appear here as corporate relations announces them.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {drives.map((item) => {
                const isApplied =
                  appliedDriveId === item.id ||
                  ["APPLIED", "SHORTLISTED", "INTERVIEW", "OFFERED", "ACCEPTED", "REJECTED"].includes(item.status);
                const canWithdraw =
                  Boolean((item as any).applicationId) &&
                  ["APPLIED", "SHORTLISTED"].includes(item.status);
                const latestOffer = (item as any).offers?.find((o: any) => o.status === "ISSUED") || (item as any).offers?.[0];
                const canRespondOffer = item.status === "OFFERED" && Boolean(latestOffer?.id);
                const todayIso = new Date().toISOString().split("T")[0];
                const isClosingToday = !!item.deadline && item.deadline === todayIso;

                return (
                  <Card key={item.id} className="flex flex-col justify-between hover:shadow-md transition-shadow">
                    <CardHeader className="p-5 pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 truncate">
                          <Building className="h-3.5 w-3.5 text-brand-500 shrink-0" />
                          {item.company}
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 shrink-0">
                          <Sparkles className="h-3 w-3" />
                          {item.matchScore}% Match
                        </span>
                      </div>

                      <CardTitle className="text-sm font-bold text-foreground mt-2">
                        {item.role}
                      </CardTitle>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-base font-extrabold text-emerald-600 font-mono">
                          {item.ctc}
                        </span>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {item.location}
                        </span>
                      </div>
                    </CardHeader>

                    <CardContent className="p-5 pt-0 space-y-3">
                      {/* Skill compatibility chips */}
                      <div className="space-y-1">
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                          Required Stack:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {(item.requiredSkills || []).map((skill, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] px-2 py-0.5 rounded bg-muted text-foreground border border-border"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Hiring Rounds (shown only if rounds exist) */}
                      {(item.rounds || []).length > 0 && (
                        <div className="p-2.5 rounded-xl bg-muted/40 border border-border/70 text-[11px] space-y-1">
                          <span className="font-semibold text-muted-foreground block text-[10px] uppercase">
                            Hiring Process
                          </span>
                          {(item.rounds || []).map((r, i) => (
                            <div key={i} className="flex items-center justify-between text-muted-foreground">
                              <span>{i + 1}. {r.name}</span>
                              <span className="font-mono text-[10px]">{r.date}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="pt-2 border-t border-border flex items-center justify-between gap-2 text-xs flex-wrap">
                        {isClosingToday ? (
                          <span className="text-[10px] font-bold text-rose-600 flex items-center gap-1">
                            <Clock className="h-3 w-3" /> Closes Tonight!
                          </span>
                        ) : (
                          <span className="text-[10px] text-muted-foreground">
                            {item.deadline ? `Deadline: ${formatDate(item.deadline)}` : "Rolling Applications"}
                          </span>
                        )}

                        <div className="flex items-center gap-1.5 flex-wrap">
                          {canRespondOffer ? (
                            <>
                              <Button
                                size="sm"
                                disabled={respondOfferMutation.isPending}
                                onClick={() =>
                                  respondOfferMutation.mutate({ offerId: latestOffer.id, decision: "ACCEPT" })
                                }
                                className="text-xs h-8 bg-emerald-600 hover:bg-emerald-700 text-white"
                              >
                                Accept Offer
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={respondOfferMutation.isPending}
                                onClick={() =>
                                  respondOfferMutation.mutate({ offerId: latestOffer.id, decision: "DECLINE" })
                                }
                                className="text-xs h-8 text-rose-600"
                              >
                                Decline
                              </Button>
                            </>
                          ) : (
                            <>
                              {canWithdraw && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={withdrawMutation.isPending}
                                  onClick={() => withdrawMutation.mutate((item as any).applicationId)}
                                  className="text-xs h-8"
                                >
                                  Withdraw
                                </Button>
                              )}
                              <Button
                                size="sm"
                                disabled={isApplied || (item as any).eligible === false || applyMutation.isPending}
                                onClick={() => applyMutation.mutate(item.id)}
                                className="text-xs h-8"
                              >
                                {isApplied ? item.status || "Applied" : (item as any).eligible === false ? "Ineligible" : "1-Click Apply"}
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: ONBOARD COMPANY */}
      <Dialog
        isOpen={isCreateCompanyOpen}
        onClose={() => setIsCreateCompanyOpen(false)}
        title="Onboard Corporate Recruitment Partner"
        description="Register a new employer to participate in campus placement drives."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createCompanyMutation.mutate();
          }}
          className="space-y-4"
        >
          <div>
            <label className="text-xs font-medium text-foreground block mb-1">Company Name</label>
            <Input
              type="text"
              placeholder="e.g. Google India / Deloitte USI"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">Industry Sector</label>
              <select
                value={companyIndustry}
                onChange={(e) => setCompanyIndustry(e.target.value)}
                className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs"
              >
                <option value="Technology">Technology & Cloud</option>
                <option value="Finance">Fintech / Banking</option>
                <option value="Consulting">Strategy & Consulting</option>
                <option value="Automotive">Automotive & Core Eng</option>
                <option value="Healthcare">Health & Biotech</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">Careers / Website URL</label>
              <Input
                type="url"
                placeholder="https://careers.google.com"
                value={companyWebsite}
                onChange={(e) => setCompanyWebsite(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsCreateCompanyOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={createCompanyMutation.isPending || !companyName.trim()}
              isLoading={createCompanyMutation.isPending}
            >
              Onboard Partner
            </Button>
          </div>
        </form>
      </Dialog>

      {/* MODAL 2: CREATE JOB OPENING */}
      <Dialog
        isOpen={isCreateJobOpen}
        onClose={() => setIsCreateJobOpen(false)}
        title="Publish Campus Job Opening"
        description="Create an eligible position with automated backlog guards and CGPA filtering."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createJobMutation.mutate();
          }}
          className="space-y-4"
        >
          <div>
            <label className="text-xs font-medium text-foreground block mb-1">Recruiting Company</label>
            <select
              value={selectedCompanyId}
              onChange={(e) => setSelectedCompanyId(e.target.value)}
              className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs"
              required
            >
              <option value="">Select Employer...</option>
              {(companies || []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.industry || "General"})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-foreground block mb-1">Job Role / Title</label>
            <Input
              type="text"
              placeholder="e.g. Associate Software Engineer - Cloud"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">Annual CTC (₹)</label>
              <Input
                type="number"
                min={0}
                placeholder="1200000"
                value={jobCtc || ""}
                onChange={(e) => setJobCtc(Math.max(0, Number(e.target.value)))}
                required
              />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">Min CGPA</label>
              <Input
                type="number"
                step="0.1"
                min={0}
                max={10}
                value={jobMinCgpa}
                onChange={(e) => setJobMinCgpa(Math.min(10, Math.max(0, Number(e.target.value))))}
                required
              />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">Location</label>
              <Input
                type="text"
                value={jobLocation}
                onChange={(e) => setJobLocation(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-foreground block mb-1">Required Skills (Comma-separated)</label>
            <Input
              type="text"
              placeholder="React, Next.js, TypeScript, PostgreSQL"
              value={jobSkills}
              onChange={(e) => setJobSkills(e.target.value)}
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsCreateJobOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={createJobMutation.isPending || !jobTitle.trim() || !selectedCompanyId}
              isLoading={createJobMutation.isPending}
            >
              Publish Job Opening
            </Button>
          </div>
        </form>
      </Dialog>

      {/* MODAL 3: SCHEDULE CAMPUS DRIVE */}
      <Dialog
        isOpen={isDriveOpen}
        onClose={() => {
          setIsDriveOpen(false);
          setDriveJobId("");
        }}
        title="Schedule Campus Placement Drive"
        description="Notify shortlisted candidates and reserve campus auditorium or lab venue."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!driveJobId) {
              toast.error("Please select a job opening for this placement drive.");
              return;
            }
            createDriveMutation.mutate();
          }}
          className="space-y-4"
        >
          <div>
            <label className="text-xs font-medium text-foreground block mb-1">Target Job Opening</label>
            <select
              value={driveJobId}
              onChange={(e) => setDriveJobId(e.target.value)}
              className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs"
              required
            >
              <option value="">Select Job Opening...</option>
              {(jobs || []).map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title} — {j.company?.name || "Partner"}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-foreground block mb-1">Drive Date</label>
            <Input
              type="date"
              value={driveDate}
              onChange={(e) => setDriveDate(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-xs font-medium text-foreground block mb-1">Drive Venue / Online Link</label>
            <Input
              type="text"
              placeholder="e.g. Main Auditorium Hall B or Microsoft Teams"
              value={driveVenue}
              onChange={(e) => setDriveVenue(e.target.value)}
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => { setIsDriveOpen(false); setDriveJobId(""); }}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={createDriveMutation.isPending || !driveDate || !driveJobId}
              isLoading={createDriveMutation.isPending}
            >
              Schedule Drive
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
