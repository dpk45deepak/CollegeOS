"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { campusApi, ClubItem, CampusEventItem } from "@/services/api/campus.api";
import { useAuthStore } from "@/lib/auth/authStore";
import {
  Calendar,
  Users,
  Sparkles,
  MapPin,
  Clock,
  Plus,
  ArrowRight,
  Award,
  Layers,
  Heart,
  Music,
  Code,
  Compass,
  Pencil,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

export default function CampusLifePage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const roleKeys = user?.roleKeys || [];
  const canManageEvents =
    user?.role === "ADMIN" ||
    roleKeys.includes("COLLEGE_ADMIN") ||
    roleKeys.includes("SUPER_ADMIN");

  const [activeTab, setActiveTab] = useState<"events" | "clubs">("events");

  // Query clubs and events
  const { data: clubs, isLoading: clubsLoading, refetch: refetchClubs } = useQuery({
    queryKey: ["campus_clubs"],
    queryFn: () => campusApi.listClubs(),
  });

  const { data: events, isLoading: eventsLoading, refetch: refetchEvents } = useQuery({
    queryKey: ["campus_events"],
    queryFn: () => campusApi.listEvents(),
  });

  // Modal states
  const [isCreateClubOpen, setIsCreateClubOpen] = useState(false);
  const [clubName, setClubName] = useState("");
  const [clubDesc, setClubDesc] = useState("");

  const [isCreateEventOpen, setIsCreateEventOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [eventTitle, setEventTitle] = useState("");
  const [eventDesc, setEventDesc] = useState("");
  const [eventVenue, setEventVenue] = useState("");
  const [eventClubId, setEventClubId] = useState("");
  const [eventStartsAt, setEventStartsAt] = useState(new Date().toISOString().slice(0, 16));

  const createClubMutation = useMutation({
    mutationFn: () => campusApi.createClub({ name: clubName, description: clubDesc }),
    onSuccess: () => {
      toast.success("Student club registered successfully!");
      setIsCreateClubOpen(false);
      setClubName("");
      setClubDesc("");
      refetchClubs();
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to create club");
    },
  });

  const saveEventMutation = useMutation({
    mutationFn: () => {
      if (editingEventId) {
        return campusApi.updateEvent(editingEventId, {
          title: eventTitle.trim(),
          description: eventDesc || undefined,
          venue: eventVenue || undefined,
          startsAt: new Date(eventStartsAt).toISOString(),
        });
      }
      return campusApi.createEvent({
        title: eventTitle.trim(),
        description: eventDesc || undefined,
        venue: eventVenue || undefined,
        clubId: eventClubId || undefined,
        startsAt: new Date(eventStartsAt).toISOString(),
      });
    },
    onSuccess: () => {
      toast.success(editingEventId ? "Campus event updated!" : "Campus event published successfully!");
      setIsCreateEventOpen(false);
      setEditingEventId(null);
      setEventTitle("");
      setEventDesc("");
      setEventVenue("");
      refetchEvents();
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to save event");
    },
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl border border-border bg-gradient-to-r from-card to-brand-50/20 dark:to-brand-950/20 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
              Student Activities & Extracurriculars
            </span>
            <span className="text-[10px] bg-brand-100 text-brand-800 dark:bg-brand-950 dark:text-brand-200 px-2 py-0.5 rounded-full font-bold">
              Campus Life
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-foreground mt-0.5">
            Clubs, Societies & Cultural Calendar
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Explore technical hackathons, cultural festivals, sports tournaments, and student-led chapters.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {canManageEvents && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCreateClubOpen(true)}
                className="text-xs gap-1"
              >
                <Plus className="h-3.5 w-3.5" /> New Club
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setEditingEventId(null);
                  setEventTitle("");
                  setEventDesc("");
                  setEventVenue("");
                  setEventClubId("");
                  setEventStartsAt(new Date().toISOString().slice(0, 16));
                  setIsCreateEventOpen(true);
                }}
                className="text-xs gap-1"
              >
                <Plus className="h-3.5 w-3.5" /> Plan Event
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center gap-3 border-b border-border pb-2">
        <button
          onClick={() => setActiveTab("events")}
          className={`text-xs font-bold pb-2 -mb-2 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === "events"
              ? "border-brand-600 text-brand-600 dark:text-brand-400"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Calendar className="h-4 w-4" /> Upcoming Events ({(events || []).length})
        </button>
        <button
          onClick={() => setActiveTab("clubs")}
          className={`text-xs font-bold pb-2 -mb-2 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === "clubs"
              ? "border-brand-600 text-brand-600 dark:text-brand-400"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Users className="h-4 w-4" /> Student Societies & Chapters ({(clubs || []).length})
        </button>
      </div>

      {/* EVENTS TAB */}
      {activeTab === "events" && (
        <div>
          {eventsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Skeleton className="h-44 rounded-xl" />
              <Skeleton className="h-44 rounded-xl" />
              <Skeleton className="h-44 rounded-xl" />
            </div>
          ) : !events || events.length === 0 ? (
            <div className="p-12 text-center border rounded-2xl bg-card border-dashed">
              <Calendar className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-60" />
              <div className="text-sm font-semibold text-foreground">No Upcoming Campus Events</div>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                Check back soon or propose an activity with your student chapter president.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {events.map((evt) => (
                <Card key={evt.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="p-5 pb-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-brand-50 text-brand-700 dark:bg-brand-950 px-2 py-0.5 rounded">
                        {evt.club?.name || "Campus Wide"}
                      </span>
                      <span className="text-[11px] text-muted-foreground font-mono">
                        {formatDate(evt.startsAt)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-2">
                      <CardTitle className="text-sm font-bold text-foreground">
                        {evt.title}
                      </CardTitle>
                      {canManageEvents && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          aria-label="Edit event"
                          onClick={() => {
                            setEditingEventId(evt.id);
                            setEventTitle(evt.title || "");
                            setEventDesc(evt.description || "");
                            setEventVenue(evt.venue || "");
                            setEventClubId(evt.clubId || "");
                            setEventStartsAt(evt.startsAt ? new Date(evt.startsAt).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16));
                            setIsCreateEventOpen(true);
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="p-5 pt-0 space-y-3">
                    {evt.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {evt.description}
                      </p>
                    )}
                    {evt.venue && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 text-brand-500 shrink-0" />
                        <span>Venue: {evt.venue}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CLUBS TAB */}
      {activeTab === "clubs" && (
        <div>
          {clubsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Skeleton className="h-36 rounded-xl" />
              <Skeleton className="h-36 rounded-xl" />
              <Skeleton className="h-36 rounded-xl" />
            </div>
          ) : !clubs || clubs.length === 0 ? (
            <div className="p-12 text-center border rounded-2xl bg-card border-dashed">
              <Users className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-60" />
              <div className="text-sm font-semibold text-foreground">No Registered Societies Yet</div>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                Student chapters will be listed here once accredited by Dean of Student Affairs.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {clubs.map((c) => (
                <Card key={c.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="p-5 pb-2">
                    <div className="h-10 w-10 rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950 flex items-center justify-center mb-2">
                      <Code className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-sm font-bold text-foreground">{c.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-5 pt-0 space-y-2">
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {c.description || "Student-led university community dedicated to innovation and skill building."}
                    </p>
                    <div className="pt-2 text-[11px] text-muted-foreground">
                      Organized Events: <strong className="text-foreground">{c._count?.events || 0}</strong>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL: CREATE CLUB */}
      <Dialog
        isOpen={isCreateClubOpen}
        onClose={() => setIsCreateClubOpen(false)}
        title="Accredit Student Society or Chapter"
        description="Register an official student body under the office of student affairs."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createClubMutation.mutate();
          }}
          className="space-y-4"
        >
          <div>
            <label className="text-xs font-medium text-foreground block mb-1">Society Name</label>
            <Input
              type="text"
              placeholder="e.g. Google Developer Student Club (GDSC)"
              value={clubName}
              onChange={(e) => setClubName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-xs font-medium text-foreground block mb-1">Aims & Description</label>
            <textarea
              rows={3}
              placeholder="e.g. Fostering practical software engineering, cloud workshops, and community hackathons."
              value={clubDesc}
              onChange={(e) => setClubDesc(e.target.value)}
              className="w-full rounded-lg border border-input bg-background p-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsCreateClubOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={createClubMutation.isPending || !clubName.trim()}
              isLoading={createClubMutation.isPending}
            >
              Accredit Club
            </Button>
          </div>
        </form>
      </Dialog>

      {/* MODAL: CREATE / EDIT EVENT */}
      <Dialog
        isOpen={isCreateEventOpen}
        onClose={() => {
          setIsCreateEventOpen(false);
          setEditingEventId(null);
        }}
        title={editingEventId ? "Update Campus Event" : "Schedule Campus Activity or Event"}
        description="Publish or reschedule event details on the student activity calendar."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveEventMutation.mutate();
          }}
          className="space-y-4"
        >
          <div>
            <label className="text-xs font-medium text-foreground block mb-1">Event Title</label>
            <Input
              type="text"
              placeholder="e.g. Annual Technical Fest 'Genesis 2026'"
              value={eventTitle}
              onChange={(e) => setEventTitle(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">Hosting Society</label>
              <select
                value={eventClubId}
                onChange={(e) => setEventClubId(e.target.value)}
                className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs"
              >
                <option value="">Campus Wide</option>
                {(clubs || []).map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-foreground block mb-1">Date & Time</label>
              <Input
                type="datetime-local"
                value={eventStartsAt}
                onChange={(e) => setEventStartsAt(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-foreground block mb-1">Venue / Auditorium</label>
            <Input
              type="text"
              placeholder="e.g. Mechanical Seminar Hall A"
              value={eventVenue}
              onChange={(e) => setEventVenue(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-foreground block mb-1">Description & Agenda</label>
            <textarea
              rows={3}
              placeholder="Event details, registration guidelines, and schedule..."
              value={eventDesc}
              onChange={(e) => setEventDesc(e.target.value)}
              className="w-full rounded-lg border border-input bg-background p-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setIsCreateEventOpen(false);
                setEditingEventId(null);
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={saveEventMutation.isPending || !eventTitle.trim()}
              isLoading={saveEventMutation.isPending}
            >
              {editingEventId ? "Save Changes" : "Publish Event"}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}

