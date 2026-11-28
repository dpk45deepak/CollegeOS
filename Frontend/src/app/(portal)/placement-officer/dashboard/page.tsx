"use client";

import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { placementsApi } from "@/services/api/placements.api";
import { specialistApi } from "@/lib/api/specialist";
import { reportsApi } from "@/services/api/reports.api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { toast } from "sonner";
import { Briefcase, Building2, Calendar, Download, Plus, Users } from "lucide-react";

export default function PlacementOfficerDashboardPage() {
  const qc = useQueryClient();
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [jobSearch, setJobSearch] = useState<string>("");
  const [stageFilter, setStageFilter] = useState<string>("");
  const [offerCtc, setOfferCtc] = useState<string>("600000");

  // Create Company state
  const [companyModalOpen, setCompanyModalOpen] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [companyIndustry, setCompanyIndustry] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");

  // Create Job state
  const [jobModalOpen, setJobModalOpen] = useState(false);
  const [jobCompanyId, setJobCompanyId] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [jobSkills, setJobSkills] = useState("");
  const [jobMinCgpa, setJobMinCgpa] = useState("6.5");
  const [jobCtc, setJobCtc] = useState("650000");
  const [jobLocation, setJobLocation] = useState("");

  // Create Drive state
  const [driveModalOpen, setDriveModalOpen] = useState(false);
  const [driveJobId, setDriveJobId] = useState("");
  const [driveDate, setDriveDate] = useState("");
  const [driveVenue, setDriveVenue] = useState("");

  const { data: jobs = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["tpo-jobs"],
    queryFn: () => placementsApi.listJobs(),
  });

  const { data: companies = [] } = useQuery({
    queryKey: ["tpo-companies"],
    queryFn: () => placementsApi.listCompanies(),
  });

  const { data: drives = [] } = useQuery({
    queryKey: ["tpo-drives"],
    queryFn: () => placementsApi.listDrives(),
  });

  const { data: applicants = [] } = useQuery({
    queryKey: ["tpo-applicants", selectedJobId],
    queryFn: () => specialistApi.listJobApplications(selectedJobId),
    enabled: !!selectedJobId,
  });

  const createCompany = useMutation({
    mutationFn: () =>
      placementsApi.createCompany({
        name: companyName.trim(),
        industry: companyIndustry.trim() || undefined,
        website: companyWebsite.trim() || undefined,
      }),
    onSuccess: (created) => {
      toast.success(`Registered partner company: ${created.name}`);
      setCompanyModalOpen(false);
      setCompanyName("");
      setCompanyIndustry("");
      setCompanyWebsite("");
      qc.invalidateQueries({ queryKey: ["tpo-companies"] });
    },
    onError: (err: any) => toast.error(err?.message || "Failed to register company"),
  });

  const createJob = useMutation({
    mutationFn: () =>
      placementsApi.createJob({
        companyId: jobCompanyId,
        title: jobTitle.trim(),
        requiredSkills: jobSkills.split(",").map((s) => s.trim()).filter(Boolean),
        minCgpa: jobMinCgpa ? Number(jobMinCgpa) : undefined,
        ctc: jobCtc ? Number(jobCtc) : undefined,
        location: jobLocation.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success("Job posting published to eligible students");
      setJobModalOpen(false);
      setJobTitle("");
      setJobSkills("");
      qc.invalidateQueries({ queryKey: ["tpo-jobs"] });
    },
    onError: (err: any) => toast.error(err?.message || "Failed to create job posting"),
  });

  const createDrive = useMutation({
    mutationFn: () =>
      placementsApi.createDrive({
        jobId: driveJobId,
        driveDate: new Date(driveDate).toISOString(),
        venue: driveVenue.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success("Campus drive scheduled");
      setDriveModalOpen(false);
      setDriveDate("");
      setDriveVenue("");
      qc.invalidateQueries({ queryKey: ["tpo-drives"] });
    },
    onError: (err: any) => toast.error(err?.message || "Failed to schedule drive"),
  });

  const updateStatus = useMutation({
    mutationFn: ({ appId, status }: { appId: string; status: string }) =>
      specialistApi.updateJobApplicationStatus(appId, status),
    onSuccess: () => {
      toast.success("Application stage updated");
      qc.invalidateQueries({ queryKey: ["tpo-applicants", selectedJobId] });
    },
    onError: (err: any) => toast.error(err?.message || "Update failed"),
  });

  const scheduleInterview = useMutation({
    mutationFn: (appId: string) =>
      specialistApi.scheduleJobInterview(appId, {
        scheduledAt: new Date(Date.now() + 2 * 86_400_000).toISOString(),
        mode: "ONLINE",
        round: 1,
      }),
    onSuccess: () => {
      toast.success("Interview scheduled");
      qc.invalidateQueries({ queryKey: ["tpo-applicants", selectedJobId] });
    },
    onError: (err: any) => toast.error(err?.message || "Shortlist candidate before scheduling interview"),
  });

  const issueOffer = useMutation({
    mutationFn: (appId: string) => specialistApi.issueJobOffer(appId, Number(offerCtc)),
    onSuccess: () => {
      toast.success("Offer letter issued");
      qc.invalidateQueries({ queryKey: ["tpo-applicants", selectedJobId] });
    },
    onError: (err: any) => toast.error(err?.message || "Candidate must be in INTERVIEW stage first"),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  if (isError) {
    return <ErrorState title="TPO Console Unavailable" onRetry={() => refetch()} />;
  }

  const filteredJobs = jobs.filter((job: any) => {
    if (!jobSearch.trim()) return true;
    const q = jobSearch.toLowerCase();
    return (
      (job.title || "").toLowerCase().includes(q) ||
      (job.company?.name || "").toLowerCase().includes(q)
    );
  });

  const filteredApplicants = applicants.filter((app: any) =>
    stageFilter ? app.status === stageFilter : true,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">
            Training &amp; Placement Office (TPO)
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Register hiring partners, publish eligible roles, shortlist candidates, and manage campus drives.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => setCompanyModalOpen(true)}>
            <Building2 className="h-3.5 w-3.5" /> Add Company
          </Button>
          <Button size="sm" className="gap-1.5 text-xs" onClick={() => setJobModalOpen(true)}>
            <Plus className="h-3.5 w-3.5" /> Post Job
          </Button>
          <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => setDriveModalOpen(true)}>
            <Calendar className="h-3.5 w-3.5" /> Schedule Drive
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 text-xs"
            onClick={() =>
              reportsApi.downloadCsv("placements").catch((err: any) =>
                toast.error(err?.message || "Failed to export placement CSV"),
              )
            }
          >
            <Download className="h-3.5 w-3.5" /> Export CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="space-y-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-brand-600" />
              Active Job Postings ({filteredJobs.length})
            </CardTitle>
            <Input
              placeholder="Search jobs by role or company..."
              value={jobSearch}
              onChange={(e) => setJobSearch(e.target.value)}
              className="h-8 text-xs"
            />
          </CardHeader>
          <CardContent className="space-y-2.5 max-h-[480px] overflow-y-auto">
            {filteredJobs.length === 0 ? (
              <p className="text-xs text-muted-foreground py-6 text-center">No matching job postings found.</p>
            ) : (
              filteredJobs.map((job: any) => (
                <div
                  key={job.id}
                  onClick={() => setSelectedJobId(job.id)}
                  className={`rounded-xl border p-3 text-xs cursor-pointer transition-colors ${
                    selectedJobId === job.id ? "border-brand-600 bg-brand-50/40 dark:bg-brand-950/30" : "border-border hover:bg-muted/40"
                  }`}
                >
                  <div className="flex items-center justify-between font-semibold">
                    <span>{job.title}</span>
                    <Badge variant="outline">{job.company?.name || "Partner"}</Badge>
                  </div>
                  <div className="text-muted-foreground mt-1">
                    Min CGPA: {job.minCgpa ?? "Any"} • Skills: {(job.requiredSkills || []).slice(0, 4).join(", ") || "Open"}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="space-y-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4 text-emerald-600" />
                Applicant Pipeline {selectedJobId ? `(${filteredApplicants.length})` : ""}
              </CardTitle>
              {selectedJobId && (
                <select
                  aria-label="Filter applicant stage"
                  value={stageFilter}
                  onChange={(e) => setStageFilter(e.target.value)}
                  className="h-8 rounded-lg border border-border bg-card px-2 text-xs"
                >
                  <option value="">All Stages</option>
                  <option value="APPLIED">APPLIED</option>
                  <option value="SHORTLISTED">SHORTLISTED</option>
                  <option value="INTERVIEW">INTERVIEW</option>
                  <option value="OFFERED">OFFERED</option>
                  <option value="ACCEPTED">ACCEPTED</option>
                  <option value="REJECTED">REJECTED</option>
                </select>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {!selectedJobId ? (
              <p className="text-xs text-muted-foreground py-6 text-center">
                Select a job posting on the left to review applicants, schedule interviews, and issue offers.
              </p>
            ) : filteredApplicants.length === 0 ? (
              <p className="text-xs text-muted-foreground py-6 text-center">No applications in this view.</p>
            ) : (
              <>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground">Default Offer CTC (INR):</span>
                  <Input
                    type="number"
                    value={offerCtc}
                    onChange={(e) => setOfferCtc(e.target.value)}
                    className="w-36 h-8 text-xs"
                  />
                </div>
                {filteredApplicants.map((app: any) => (
                  <div key={app.id} className="rounded-xl border border-border p-3 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-semibold">
                          {app.student?.user?.firstName} {app.student?.user?.lastName}
                        </span>{" "}
                        <span className="text-muted-foreground">({app.student?.rollNumber})</span>
                      </div>
                      <Badge>{app.status}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-[11px]"
                        onClick={() => updateStatus.mutate({ appId: app.id, status: "SHORTLISTED" })}
                      >
                        Shortlist
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-[11px]"
                        onClick={() => scheduleInterview.mutate(app.id)}
                      >
                        Schedule Interview
                      </Button>
                      <Button
                        size="sm"
                        className="h-7 text-[11px]"
                        onClick={() => issueOffer.mutate(app.id)}
                      >
                        Issue Offer
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-[11px] text-rose-600"
                        onClick={() => updateStatus.mutate({ appId: app.id, status: "REJECTED" })}
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Scheduled Placement Drives ({drives.length})</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          {drives.length === 0 ? (
            <p className="text-muted-foreground col-span-full">No campus drives scheduled yet.</p>
          ) : (
            drives.map((d: any) => (
              <div key={d.id} className="rounded-xl border border-border p-3 space-y-1">
                <div className="font-semibold">{d.job?.title || "Campus Drive"}</div>
                <div className="text-muted-foreground">
                  {new Date(d.driveDate).toLocaleDateString()} • {d.venue || "Campus Hall"}
                </div>
                <Badge variant="outline">{d.status}</Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Register Company Dialog */}
      <Dialog
        isOpen={companyModalOpen}
        onClose={() => setCompanyModalOpen(false)}
        title="Register Hiring Partner Company"
        description="Add a recruiting organization before publishing job roles."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!companyName.trim()) return;
            createCompany.mutate();
          }}
          className="space-y-3 text-xs"
        >
          <Input placeholder="Company Name *" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
          <Input placeholder="Industry (e.g. FinTech, Software)" value={companyIndustry} onChange={(e) => setCompanyIndustry(e.target.value)} />
          <Input placeholder="Website URL" value={companyWebsite} onChange={(e) => setCompanyWebsite(e.target.value)} />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setCompanyModalOpen(false)}>Cancel</Button>
            <Button type="submit" size="sm" isLoading={createCompany.isPending}>Save Company</Button>
          </div>
        </form>
      </Dialog>

      {/* Post Job Dialog */}
      <Dialog
        isOpen={jobModalOpen}
        onClose={() => setJobModalOpen(false)}
        title="Create Placement Job Posting"
        description="Define skill tags and eligibility thresholds for matching."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!jobCompanyId || !jobTitle.trim()) {
              toast.error("Company and role title are required");
              return;
            }
            createJob.mutate();
          }}
          className="space-y-3 text-xs"
        >
          <select
            value={jobCompanyId}
            onChange={(e) => setJobCompanyId(e.target.value)}
            className="w-full h-9 rounded-xl border border-border bg-background px-3 text-xs"
            required
          >
            <option value="">Select Registered Company *</option>
            {companies.map((c: any) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <Input placeholder="Role Title (e.g. Software Engineer) *" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} required />
          <Input placeholder="Required Skills (comma-separated, e.g. react,typescript,sql)" value={jobSkills} onChange={(e) => setJobSkills(e.target.value)} />
          <div className="grid grid-cols-2 gap-2">
            <Input type="number" step="0.1" placeholder="Min CGPA" value={jobMinCgpa} onChange={(e) => setJobMinCgpa(e.target.value)} />
            <Input type="number" placeholder="Annual CTC (INR)" value={jobCtc} onChange={(e) => setJobCtc(e.target.value)} />
          </div>
          <Input placeholder="Location (e.g. Bengaluru / Hybrid)" value={jobLocation} onChange={(e) => setJobLocation(e.target.value)} />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setJobModalOpen(false)}>Cancel</Button>
            <Button type="submit" size="sm" isLoading={createJob.isPending}>Publish Role</Button>
          </div>
        </form>
      </Dialog>

      {/* Schedule Drive Dialog */}
      <Dialog
        isOpen={driveModalOpen}
        onClose={() => setDriveModalOpen(false)}
        title="Schedule Campus Placement Drive"
        description="Assign drive date and venue for an active job posting."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!driveJobId || !driveDate) return;
            createDrive.mutate();
          }}
          className="space-y-3 text-xs"
        >
          <select
            value={driveJobId}
            onChange={(e) => setDriveJobId(e.target.value)}
            className="w-full h-9 rounded-xl border border-border bg-background px-3 text-xs"
            required
          >
            <option value="">Select Active Job Posting *</option>
            {jobs.map((j: any) => (
              <option key={j.id} value={j.id}>{j.title} — {j.company?.name}</option>
            ))}
          </select>
          <Input type="datetime-local" value={driveDate} onChange={(e) => setDriveDate(e.target.value)} required />
          <Input placeholder="Venue (e.g. Auditorium Block B)" value={driveVenue} onChange={(e) => setDriveVenue(e.target.value)} />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setDriveModalOpen(false)}>Cancel</Button>
            <Button type="submit" size="sm" isLoading={createDrive.isPending}>Schedule Drive</Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
