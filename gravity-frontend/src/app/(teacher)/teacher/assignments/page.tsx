"use client";

import React, { useState } from "react";
import {
  FileText,
  Plus,
  Clock,
  CheckCircle2,
  Upload,
  User,
  Sparkles,
  Search,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";

export default function TeacherAssignmentsPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isGradeOpen, setIsGradeOpen] = useState(false);
  const [activeSubmission, setActiveSubmission] = useState<{
    id: string;
    studentName: string;
    roll: string;
    title: string;
    submittedAt: string;
  } | null>(null);

  const [marks, setMarks] = useState("28");
  const [feedback, setFeedback] = useState("Solid B+ tree implementation. Good edge case handling.");

  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("CS601");
  const [deadline, setDeadline] = useState("");
  const [maxMarks, setMaxMarks] = useState("30");

  const handleGrade = (sub: {
    id: string;
    studentName: string;
    roll: string;
    title: string;
    submittedAt: string;
  }) => {
    setActiveSubmission(sub);
    setIsGradeOpen(true);
  };

  const handleSaveGrade = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Grade saved for ${activeSubmission?.studentName}: ${marks}/${maxMarks}`);
    setIsGradeOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border">
        <div>
          <h1 className="text-xl font-bold text-foreground">
            Course Deliverables & Evaluation Queue
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Create lab assignments, evaluate submissions, and publish rubric scores.
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => setIsCreateOpen(true)}
          className="text-xs gap-1.5 shadow-sm"
        >
          <Plus className="h-4 w-4" /> Create New Assignment
        </Button>
      </div>

      {/* Submissions Queue Table */}
      <Card>
        <CardHeader className="p-4 pb-2 border-b border-border">
          <CardTitle className="text-sm font-bold flex items-center justify-between">
            <span>Pending Evaluation Queue (CS601 & CS606)</span>
            <span className="text-xs font-normal text-muted-foreground">
              60 submissions awaiting review
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] font-semibold border-b border-border">
              <tr>
                <th className="p-3 pl-4">Student</th>
                <th className="p-3">Assignment Title</th>
                <th className="p-3">Submission Timestamp</th>
                <th className="p-3">Status</th>
                <th className="p-3 pr-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[
                {
                  id: "sub_1",
                  studentName: "Deepak Kumar",
                  roll: "21CS042",
                  title: "B+ Tree Indexing & Query Cost Optimization",
                  submittedAt: "Oct 8, 04:30 PM",
                  status: "Pending Grade",
                },
                {
                  id: "sub_2",
                  studentName: "Ananya Patel",
                  roll: "21CS002",
                  title: "B+ Tree Indexing & Query Cost Optimization",
                  submittedAt: "Oct 8, 06:12 PM",
                  status: "Pending Grade",
                },
                {
                  id: "sub_3",
                  studentName: "Aarav Sharma",
                  roll: "21CS001",
                  title: "B+ Tree Indexing & Query Cost Optimization",
                  submittedAt: "Oct 7, 09:20 PM",
                  status: "Graded (29/30)",
                },
              ].map((sub) => (
                <tr key={sub.id} className="hover:bg-muted/20">
                  <td className="p-3 pl-4">
                    <div className="font-semibold text-foreground">{sub.studentName}</div>
                    <div className="text-[10px] font-mono text-muted-foreground">{sub.roll}</div>
                  </td>
                  <td className="p-3 font-medium text-foreground">{sub.title}</td>
                  <td className="p-3 text-muted-foreground font-mono">{sub.submittedAt}</td>
                  <td className="p-3">
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        sub.status.includes("Graded")
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                          : "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                      }`}
                    >
                      {sub.status}
                    </span>
                  </td>
                  <td className="p-3 pr-4 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleGrade(sub)}
                      className="text-xs h-8"
                    >
                      {sub.status.includes("Graded") ? "Edit Marks" : "Grade Submission"}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Create Assignment Modal Dialog */}
      <Dialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Publish Course Assignment"
        description="Configure rubric, upload question specs, and set submission deadline."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            alert("Assignment published successfully to student portal!");
            setIsCreateOpen(false);
          }}
          className="space-y-4 text-xs"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-foreground block mb-1">Subject</label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs"
              >
                <option value="CS601">CS601: DBMS</option>
                <option value="CS606">CS606: DBMS Lab</option>
                <option value="CS401">CS401: DSA</option>
              </select>
            </div>
            <div>
              <label className="font-semibold text-foreground block mb-1">Max Marks</label>
              <Input
                type="number"
                value={maxMarks}
                onChange={(e) => setMaxMarks(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-foreground block">Assignment Title</label>
            <Input
              placeholder="e.g. Relational Calculus & Complex Joins"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-foreground block">Submission Deadline</label>
            <input
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs"
              required
            />
          </div>

          <div className="border border-dashed border-border rounded-lg p-4 text-center bg-muted/20">
            <Upload className="h-6 w-6 text-muted-foreground mx-auto mb-1" />
            <span className="font-semibold text-foreground">Attach Problem Specification (PDF)</span>
            <input type="file" className="mt-2 text-[10px]" />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" type="submit">
              Publish to Students
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Grade Submission Modal Dialog */}
      <Dialog
        isOpen={isGradeOpen}
        onClose={() => setIsGradeOpen(false)}
        title={activeSubmission ? `Evaluate: ${activeSubmission.studentName}` : "Grade Submission"}
        description={activeSubmission?.title}
      >
        <form onSubmit={handleSaveGrade} className="space-y-4 text-xs">
          <div className="p-3 rounded-lg bg-muted/40 border border-border flex items-center justify-between">
            <span>Roll Number: <strong>{activeSubmission?.roll}</strong></span>
            <span className="text-brand-600 font-semibold cursor-pointer hover:underline">
              View Submitted PDF
            </span>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-foreground block">Marks Awarded (out of 30)</label>
            <Input
              type="number"
              value={marks}
              onChange={(e) => setMarks(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-foreground block">Evaluation Remarks & Feedback</label>
            <textarea
              rows={3}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="w-full rounded-lg border border-input bg-background p-2.5 text-xs text-foreground focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setIsGradeOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" type="submit">
              Save Grade & Notify Student
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
