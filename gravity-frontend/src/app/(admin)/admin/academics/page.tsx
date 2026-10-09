"use client";

import React, { useState } from "react";
import {
  CalendarDays,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Clock,
  MapPin,
  User,
  Sparkles,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AdminAcademicsPage() {
  const [day, setDay] = useState("Monday");
  const [startTime, setStartTime] = useState("10:00 AM");
  const [endTime, setEndTime] = useState("11:15 AM");
  const [course, setCourse] = useState("CS601");
  const [section, setSection] = useState("6A");
  const [room, setRoom] = useState("LT-204");
  const [faculty, setFaculty] = useState("Dr. Vikram Sharma");

  // Conflict state
  const [conflict, setConflict] = useState<string | null>(null);

  const handleSimulateConflict = (testRoom: string, testFaculty: string) => {
    setRoom(testRoom);
    setFaculty(testFaculty);

    if (testRoom === "LT-204" && day === "Monday" && startTime === "10:00 AM") {
      setConflict(
        "⚠ Room Conflict: LT-204 is already allocated to ECE401 (Signals & Systems) on Monday 09:30 - 11:00 AM."
      );
    } else if (testFaculty === "Dr. Vikram Sharma" && day === "Monday" && startTime === "02:00 PM") {
      setConflict(
        "⚠ Faculty Conflict: Dr. Vikram Sharma is already assigned to CS606 Lab in Lab 3B at 02:00 PM."
      );
    } else {
      setConflict(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="pb-2 border-b border-border">
        <h1 className="text-xl font-bold text-foreground">
          Autonomous Timetable Builder & Conflict Engine
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Validates teacher availability, room capacity, and section overlaps in real time.
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
                onChange={(e) => setDay(e.target.value)}
                className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs"
              >
                <option value="Monday">Monday</option>
                <option value="Tuesday">Tuesday</option>
                <option value="Wednesday">Wednesday</option>
                <option value="Thursday">Thursday</option>
                <option value="Friday">Friday</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="font-semibold text-foreground block">Start Time</label>
                <select
                  value={startTime}
                  onChange={(e) => {
                    setStartTime(e.target.value);
                    handleSimulateConflict(room, faculty);
                  }}
                  className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs"
                >
                  <option value="09:00 AM">09:00 AM</option>
                  <option value="10:00 AM">10:00 AM</option>
                  <option value="11:30 AM">11:30 AM</option>
                  <option value="02:00 PM">02:00 PM</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-foreground block">End Time</label>
                <Input value={endTime} onChange={(e) => setEndTime(e.target.value)} />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground block">Course Code</label>
              <select
                value={course}
                onChange={(e) => setCourse(e.target.value)}
                className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs"
              >
                <option value="CS601">CS601: Database Management Systems</option>
                <option value="CS602">CS602: Operating Systems Internals</option>
                <option value="CS603">CS603: Machine Learning & Neural Nets</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground block">Assigned Faculty</label>
              <select
                value={faculty}
                onChange={(e) => handleSimulateConflict(room, e.target.value)}
                className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs"
              >
                <option value="Dr. Vikram Sharma">Dr. Vikram Sharma (Assoc. Prof)</option>
                <option value="Prof. Ananya Iyer">Prof. Ananya Iyer (Asst. Prof)</option>
                <option value="Dr. Alok Verma">Dr. Alok Verma (Professor)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground block">Lecture Hall / Room</label>
              <select
                value={room}
                onChange={(e) => handleSimulateConflict(e.target.value, faculty)}
                className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs"
              >
                <option value="LT-204">LT-204 (Capacity: 90)</option>
                <option value="LT-108">LT-108 (Capacity: 75)</option>
                <option value="Auditorium-2">Auditorium-2 (Capacity: 200)</option>
                <option value="Lab 3B">Lab 3B (Systems Lab)</option>
              </select>
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
                <span>Zero Conflicts: Room and teacher are fully available.</span>
              </div>
            )}

            <Button
              disabled={!!conflict}
              onClick={() => alert("Slot saved to master timetable!")}
              className="w-full text-xs"
            >
              Commit Slot to Database
            </Button>
          </CardContent>
        </Card>

        {/* Master Timetable Preview */}
        <Card className="lg:col-span-2">
          <CardHeader className="p-5 pb-3">
            <CardTitle className="text-sm font-bold">
              Current Semester 6 Master Schedule (Section 6A)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-0 space-y-3">
            {[
              { time: "09:00 - 10:15 AM", sub: "CS601 (DBMS)", room: "LT-204", fac: "Dr. Vikram Sharma" },
              { time: "10:30 - 11:45 AM", sub: "CS602 (OS Internals)", room: "LT-204", fac: "Prof. Ananya Iyer" },
              { time: "01:00 - 02:15 PM", sub: "CS603 (Machine Learning)", room: "Auditorium-2", fac: "Dr. Alok Verma" },
              { time: "02:30 - 04:30 PM", sub: "CS606 (DBMS Lab)", room: "Lab 3B", fac: "Dr. Vikram Sharma" },
            ].map((slot, i) => (
              <div
                key={i}
                className="p-3 rounded-xl border border-border bg-card flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono font-semibold text-muted-foreground w-36">
                    {slot.time}
                  </span>
                  <div>
                    <div className="font-bold text-foreground">{slot.sub}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {slot.room} • {slot.fac}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
                  Locked
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
