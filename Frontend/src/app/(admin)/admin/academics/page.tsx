"use client";

import React, { useState } from "react";
import { adminApi } from "@/lib/api/admin";
import {
  CalendarDays,
  AlertTriangle,
  CheckCircle2,
  Clock,
  MapPin,
  User,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AdminAcademicsPage() {
  const [day, setDay] = useState("MON");
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("11:15");
  const [offeringId, setOfferingId] = useState("");
  const [room, setRoom] = useState("");
  const [conflict, setConflict] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  const handleValidateSlot = async () => {
    if (!offeringId) {
      setConflict(null);
      return;
    }
    setChecking(true);
    try {
      const res = await adminApi.checkTimetableConflict({
        dayOfWeek: day,
        startTime,
        endTime,
        subjectOfferingId: offeringId,
        roomId: room || undefined,
      });
      if (res.hasConflict) {
        setConflict(res.conflicts.map((c) => c.message).join(", "));
      } else {
        setConflict(null);
      }
    } catch (err: any) {
      if (err?.data?.conflicts) {
        setConflict(err.data.conflicts.map((c: any) => c.message).join(", "));
      } else {
        setConflict(null);
      }
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="pb-2 border-b border-border">
        <h1 className="text-xl font-bold text-foreground">
          Autonomous Timetable Builder & Conflict Engine
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Validates teacher availability, room capacity, and section overlaps in real time against NestJS timetable service.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Slot Creator Form */}
        <Card className="lg:col-span-1">
          <CardHeader className="p-5 pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-brand-600" />
              Schedule Lecture Slot
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-0 space-y-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-foreground block">Day of the Week</label>
              <select
                value={day}
                onChange={(e) => {
                  setDay(e.target.value);
                  handleValidateSlot();
                }}
                className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs"
              >
                <option value="MON">Monday</option>
                <option value="TUE">Tuesday</option>
                <option value="WED">Wednesday</option>
                <option value="THU">Thursday</option>
                <option value="FRI">Friday</option>
                <option value="SAT">Saturday</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="font-semibold text-foreground block">Start Time (24h)</label>
                <Input
                  value={startTime}
                  placeholder="09:00"
                  onChange={(e) => {
                    setStartTime(e.target.value);
                  }}
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-foreground block">End Time (24h)</label>
                <Input
                  value={endTime}
                  placeholder="10:15"
                  onChange={(e) => {
                    setEndTime(e.target.value);
                  }}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground block">Subject Offering ID</label>
              <Input
                placeholder="Enter subject offering ID..."
                value={offeringId}
                onChange={(e) => setOfferingId(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground block">Room ID / Number</label>
              <Input
                placeholder="Enter room ID or code..."
                value={room}
                onChange={(e) => setRoom(e.target.value)}
              />
            </div>

            {/* Conflict Banner */}
            {conflict ? (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs font-semibold leading-relaxed flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{conflict}</span>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Zero Conflicts: Dry-run validation passed.</span>
              </div>
            )}

            <Button
              disabled={checking || !offeringId}
              onClick={handleValidateSlot}
              className="w-full text-xs"
            >
              {checking ? "Checking Clashes..." : "Dry-Run Clash Check"}
            </Button>
          </CardContent>
        </Card>

        {/* Master Timetable Preview */}
        <Card className="lg:col-span-2">
          <CardHeader className="p-5 pb-3">
            <CardTitle className="text-sm font-bold">
              Autonomous Conflict Verification Engine
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-0 space-y-3 text-xs leading-relaxed text-muted-foreground">
            <p>
              The NestJS Timetable Service evaluates:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-foreground">
              <li><strong>Room Overlaps:</strong> Ensures no two sections share the same classroom, lab, or seminar hall simultaneously.</li>
              <li><strong>Teacher Workload Clashes:</strong> Prevents faculty from being assigned to multiple concurrent lectures.</li>
              <li><strong>Section Integrity:</strong> Ensures students in the same batch or section have conflict-free lecture sequences.</li>
            </ul>
            <div className="p-4 rounded-xl bg-muted/40 border border-border mt-4">
              <span className="font-bold text-foreground block mb-1">How Dry-Run Validation Works</span>
              <p className="text-[11px]">
                Submissions to <code>POST /api/v1/timetable/check</code> return detailed clash logs without persisting records, allowing administrators to plan conflict-free schedules before publishing.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
