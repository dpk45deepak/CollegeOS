"use client";

function formatRoom(r: any): string {
  if (!r) return "Room Assigned";
  if (typeof r === "string") return r;
  return r.code || r.number || "Room Assigned";
}
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { studentApi } from "@/lib/api/student";
import { useAuthStore } from "@/lib/auth/authStore";
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
import { ErrorState } from "@/components/ui/error-state";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] as const;

export default function StudentTimetablePage() {
  const { user } = useAuthStore();
  const { data: slots, isLoading, error, refetch } = useQuery({
    queryKey: ["student_timetable"],
    queryFn: () => studentApi.getTimetable(),
  });

  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;
  const currentDayName = dayNames[new Date().getDay()];
  const defaultDay = (DAYS as readonly string[]).includes(currentDayName)
    ? (currentDayName as (typeof DAYS)[number])
    : "Monday";

  const [activeDay, setActiveDay] = useState<(typeof DAYS)[number]>(defaultDay);

  if (isLoading) {
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

  if (error || !slots) {
    return (
      <ErrorState
        message="Could not load timetable schedule. Please check server connection."
        onRetry={refetch}
      />
    );
  }

  const todaySlots = slots.filter((s) => s.day === defaultDay);
  const nextSlot = todaySlots[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border">
        <div>
          <h1 className="text-xl font-bold text-foreground">
            Academic Timetable
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Verified Institutional Section Timetable {user?.rollNumber ? `• Student ID: ${user.rollNumber}` : ""}
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
          <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
          <span className="font-semibold text-foreground">
            {nextSlot ? (
              <>
                Next Lecture ({defaultDay}): <strong>{nextSlot.subjectName} ({nextSlot.subjectCode})</strong> in Room <strong>{formatRoom(nextSlot.room)}</strong>
              </>
            ) : (
              "No further lecture sessions scheduled for today."
            )}
          </span>
        </div>
        {nextSlot && (
          <span className="text-[11px] font-mono text-brand-700 dark:text-brand-300 font-semibold bg-brand-100 dark:bg-brand-900/60 px-2 py-0.5 rounded">
            Starts {nextSlot.startTime}
          </span>
        )}
      </div>

      {/* Desktop Weekly Schedule Grid (Hidden on Mobile) */}
      <div className="hidden md:grid md:grid-cols-5 gap-3">
        {DAYS.map((day) => {
          const daySlots = slots.filter((s) => s.day === day);
          const isToday = day === defaultDay;

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
                  daySlots.map((slot, idx) => {
                    const isNext = isToday && idx === 0;

                    return (
                      <div
                        key={slot.id || idx}
                        className={`p-3 rounded-xl border text-xs transition-all relative ${
                          isNext
                            ? "bg-brand-50/80 dark:bg-brand-950/60 border-brand-400 shadow-xs"
                            : "bg-background border-border hover:border-brand-200"
                        }`}
                      >
                        {isNext && (
                          <span className="absolute -top-1.5 right-2 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-brand-600 text-white">
                            Upcoming
                          </span>
                        )}

                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-mono">
                          <Clock className="h-3 w-3" />
                          <span>{slot.startTime} - {slot.endTime}</span>
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
                            {formatRoom(slot.room)}
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
        {slots.filter((s) => s.day === activeDay).length === 0 ? (
          <div className="p-8 text-center border rounded-xl border-dashed border-border text-muted-foreground text-xs">
            No classes scheduled for {activeDay}.
          </div>
        ) : (
          slots
            .filter((s) => s.day === activeDay)
            .map((slot, index) => {
              return (
                <div
                  key={slot.id || index}
                  className="p-4 rounded-xl border flex gap-3 text-xs bg-card border-border"
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
                        <MapPin className="h-3 w-3" /> {formatRoom(slot.room)}
                      </span>
                      <span>• {slot.instructor}</span>
                    </p>
                  </div>
                </div>
              );
            })
        )}
      </div>
    </div>
  );
}
