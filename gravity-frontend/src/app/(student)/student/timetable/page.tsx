"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { studentApi } from "@/lib/api/student";
import { TimetableSlot } from "@/types";
import {
  CalendarDays,
  Clock,
  MapPin,
  User,
  Sparkles,
  ChevronRight,
  Filter,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] as const;

export default function StudentTimetablePage() {
  const { data: slots, isLoading } = useQuery({
    queryKey: ["student_timetable"],
    queryFn: () => studentApi.getTimetable(),
  });

  const [activeDay, setActiveDay] = useState<(typeof DAYS)[number]>("Monday");

  if (isLoading || !slots) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-14 w-full rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Skeleton className="h-96 rounded-xl" />
          <Skeleton className="h-96 rounded-xl" />
          <Skeleton className="h-96 rounded-xl" />
          <Skeleton className="h-96 rounded-xl" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </div>
    );
  }

  // Active / next class simulation (Monday 10:15 AM)
  const currentSlotId = "slot_1"; // 09:00 - 10:15 CS601
  const nextSlotId = "slot_2"; // 10:30 - 11:45 CS602

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border">
        <div>
          <h1 className="text-xl font-bold text-foreground">
            Academic Timetable
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            B.Tech Computer Science & Engineering • Semester 6 (Section 6A)
          </p>
        </div>

        {/* Mobile Day Selector Tabs */}
        <div className="flex md:hidden gap-1 overflow-x-auto pb-1 no-scrollbar">
          {DAYS.map((day) => (
            <button
              key={day}
              onClick={() => setActiveDay(day)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                activeDay === day
                  ? "bg-brand-600 text-white"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {day}
            </button>
          ))}
        </div>
      </div>

      {/* Live Status Banner */}
      <div className="p-3.5 rounded-xl border border-brand-200 dark:border-brand-800 bg-brand-50/50 dark:bg-brand-950/30 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2.5">
          <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" />
          <span className="font-semibold text-foreground">
            Upcoming Next: <strong>Operating Systems Internals (CS602)</strong> in Room <strong>LT-204</strong>
          </span>
        </div>
        <span className="text-[11px] font-mono text-brand-700 dark:text-brand-300 font-semibold bg-brand-100 dark:bg-brand-900/60 px-2 py-0.5 rounded">
          Starts 10:30 AM
        </span>
      </div>

      {/* Desktop Weekly Schedule Grid (Hidden on Mobile) */}
      <div className="hidden md:grid md:grid-cols-5 gap-3">
        {DAYS.map((day) => {
          const daySlots = slots.filter((s) => s.day === day);
          const isToday = day === "Monday";

          return (
            <div
              key={day}
              className={`rounded-2xl border p-3 flex flex-col space-y-3 ${
                isToday
                  ? "border-brand-300 dark:border-brand-800 bg-card shadow-sm ring-1 ring-brand-500/20"
                  : "border-border bg-card/50"
              }`}
            >
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <span className="text-xs font-bold text-foreground">{day}</span>
                {isToday && (
                  <span className="text-[9px] font-bold uppercase bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300 px-1.5 py-0.2 rounded">
                    Today
                  </span>
                )}
              </div>

              <div className="space-y-2.5 flex-1">
                {daySlots.length === 0 ? (
                  <div className="text-center py-10 text-[11px] text-muted-foreground">
                    No classes scheduled
                  </div>
                ) : (
                  daySlots.map((slot) => {
                    const isCurrent = slot.id === currentSlotId;
                    const isNext = slot.id === nextSlotId;

                    return (
                      <div
                        key={slot.id}
                        className={`p-3 rounded-xl border text-xs transition-all relative ${
                          isNext
                            ? "bg-brand-50/80 dark:bg-brand-950/60 border-brand-400 shadow-xs"
                            : isCurrent
                            ? "bg-emerald-50/60 dark:bg-emerald-950/40 border-emerald-300"
                            : "bg-background border-border hover:border-brand-200"
                        }`}
                      >
                        {isNext && (
                          <span className="absolute -top-1.5 right-2 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-brand-600 text-white">
                            Next Class
                          </span>
                        )}

                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-mono">
                          <Clock className="h-3 w-3" />
                          <span>{slot.startTime}</span>
                        </div>

                        <div className="font-bold text-foreground mt-1 text-xs">
                          {slot.subjectCode}
                        </div>
                        <div className="text-[11px] text-muted-foreground truncate font-medium">
                          {slot.subjectName}
                        </div>

                        <div className="mt-2 pt-2 border-t border-border/60 flex items-center justify-between text-[10px] text-muted-foreground">
                          <span className="flex items-center gap-1 font-semibold text-foreground">
                            <MapPin className="h-3 w-3 text-brand-500" />
                            {slot.room}
                          </span>
                          <span className="truncate max-w-[80px]">
                            {slot.instructor}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile Timeline Schedule (Only shown on mobile) */}
      <div className="md:hidden space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          {activeDay}&apos;s Timeline
        </h3>
        {slots
          .filter((s) => s.day === activeDay)
          .map((slot, index) => {
            const isNext = slot.id === nextSlotId;
            return (
              <div
                key={slot.id}
                className={`p-4 rounded-xl border flex gap-3 text-xs ${
                  isNext
                    ? "bg-brand-50 dark:bg-brand-950/40 border-brand-400 shadow-sm"
                    : "bg-card border-border"
                }`}
              >
                <div className="flex flex-col items-center justify-center pr-3 border-r border-border shrink-0 font-mono text-[11px]">
                  <span className="font-bold text-foreground">{slot.startTime}</span>
                  <span className="text-[10px] text-muted-foreground">{slot.endTime}</span>
                </div>
                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground">{slot.subjectCode}</span>
                    <span className="text-[10px] font-medium bg-muted px-2 py-0.5 rounded">
                      {slot.type}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-foreground">{slot.subjectName}</p>
                  <p className="text-[11px] text-muted-foreground flex items-center gap-3 pt-1">
                    <span className="flex items-center gap-1 text-brand-600 font-semibold">
                      <MapPin className="h-3 w-3" /> {slot.room}
                    </span>
                    <span>• {slot.instructor}</span>
                  </p>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
