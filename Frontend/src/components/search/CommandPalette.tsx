"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUIStore } from "@/stores/useUIStore";
import {
  Search,
  X,
  BookOpen,
  CalendarCheck2,
  FileText,
  Briefcase,
  Gift,
  Bell,
  GraduationCap,
  Sparkles,
  ArrowRight,
  User,
  Clock,
  Receipt,
  MessageSquare,
} from "lucide-react";

interface SearchResult {
  category: string;
  items: {
    id: string;
    title: string;
    subtitle: string;
    href: string;
    icon: React.ElementType;
  }[];
}

const allSearchDatabase: SearchResult[] = [
  {
    category: "Academic Portals & Navigation",
    items: [
      { id: "nav1", title: "Student Academic Dashboard", subtitle: "Live attendance, timetable & course alerts", href: "/student/dashboard", icon: GraduationCap },
      { id: "nav2", title: "Attendance Intelligence", subtitle: "Lecture-wise records, percentage & shortage analysis", href: "/student/attendance", icon: CalendarCheck2 },
      { id: "nav3", title: "Lecture Timetable", subtitle: "Weekly class schedules, room allocations & timings", href: "/student/timetable", icon: Clock },
      { id: "nav4", title: "Course Assignments", subtitle: "Submit deliverables, view rubrics & evaluation scores", href: "/student/assignments", icon: FileText },
      { id: "nav5", title: "Examinations & Hall Ticket", subtitle: "Exam schedules, hall allocations & admit cards", href: "/student/exams", icon: CalendarCheck2 },
    ],
  },
  {
    category: "Campus Services & Student Life",
    items: [
      { id: "srv1", title: "Fee Dues & Payment Receipts", subtitle: "Semester fee ledger, online payments & receipts", href: "/student/fees", icon: Receipt },
      { id: "srv2", title: "Campus Placements & Drives", subtitle: "Corporate recruitment, eligibility & applications", href: "/student/placements", icon: Briefcase },
      { id: "srv3", title: "Scholarships & Financial Aid", subtitle: "Institutional grants, government schemes & aid", href: "/student/scholarships", icon: Gift },
      { id: "srv4", title: "Grievances & Helpdesk", subtitle: "Submit support tickets with automated SLA tracking", href: "/student/complaints", icon: FileText },
    ],
  },
  {
    category: "Institutional Knowledge & Bulletins",
    items: [
      { id: "doc1", title: "Approved Handbooks & Regulations", subtitle: "RAG-indexed institutional ordinances and policies", href: "/documents", icon: BookOpen },
      { id: "doc2", title: "Campus Circulars & Official Notices", subtitle: "Administrative announcements and circulars", href: "/notices", icon: Bell },
      { id: "doc3", title: "Direct Messaging", subtitle: "Verified channels with course faculty and advisors", href: "/messages", icon: MessageSquare },
    ],
  },
  {
    category: "Faculty & Administration",
    items: [
      { id: "fac1", title: "Faculty Classroom Attendance", subtitle: "Mark lecture attendance with live roster synchronization", href: "/teacher/attendance", icon: CalendarCheck2 },
      { id: "fac2", title: "Faculty Academic Dashboard", subtitle: "Assigned course offerings and student grading queue", href: "/teacher/dashboard", icon: GraduationCap },
      { id: "adm1", title: "Department HOD Overview", subtitle: "Department metrics, faculty and attendance monitoring", href: "/hod/dashboard", icon: GraduationCap },
      { id: "adm2", title: "Institutional Admin Dashboard", subtitle: "Multi-tenant configuration, users & academic operations", href: "/admin/dashboard", icon: GraduationCap },
    ],
  },
];

export function CommandPalette() {
  const router = useRouter();
  const { isCommandPaletteOpen, setCommandPaletteOpen, setCopilotOpen } = useUIStore();
  const [query, setQuery] = useState("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandPaletteOpen(!isCommandPaletteOpen);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isCommandPaletteOpen, setCommandPaletteOpen]);

  if (!isCommandPaletteOpen) return null;

  const filtered = allSearchDatabase
    .map((category) => ({
      ...category,
      items: category.items.filter(
        (item) =>
          item.title.toLowerCase().includes(query.toLowerCase()) ||
          item.subtitle.toLowerCase().includes(query.toLowerCase())
      ),
    }))
    .filter((category) => category.items.length > 0);

  const handleSelect = (href: string) => {
    setCommandPaletteOpen(false);
    setQuery("");
    router.push(href);
  };

  const handleAskAI = () => {
    setCommandPaletteOpen(false);
    setCopilotOpen(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:pt-20 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl rounded-2xl border border-border bg-background shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3 border-b border-border gap-3">
          <Search className="h-5 w-5 text-muted-foreground shrink-0" />
          <input
            type="text"
            placeholder="Type a subject, assignment, teacher, document, or command..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          {query ? (
            <button
              onClick={() => setQuery("")}
              className="p-1 rounded text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 rounded border border-border bg-muted text-[10px] font-mono text-muted-foreground">
              ESC
            </kbd>
          )}
        </div>

        {/* Quick Action: Ask AI */}
        {query && (
          <div className="px-3 pt-2">
            <button
              onClick={handleAskAI}
              className="w-full flex items-center justify-between p-2.5 rounded-lg bg-brand-50/70 dark:bg-brand-950/30 border border-brand-200/50 dark:border-brand-800/50 hover:bg-brand-100/60 transition-colors text-left"
            >
              <div className="flex items-center gap-2.5">
                <Sparkles className="h-4 w-4 text-brand-600 dark:text-brand-400 shrink-0 animate-pulse" />
                <span className="text-xs font-medium text-brand-700 dark:text-brand-300">
                  Ask AI Copilot: &quot;{query}&quot;
                </span>
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-brand-600 dark:text-brand-400" />
            </button>
          </div>
        )}

        {/* Search Results list */}
        <div className="max-h-[60vh] overflow-y-auto p-2 space-y-3">
          {filtered.length === 0 ? (
            <div className="py-10 text-center text-xs text-muted-foreground">
              No results found matching &quot;{query}&quot;. Try searching for &quot;DBMS&quot;, &quot;Exam&quot;, or &quot;Scholarship&quot;.
            </div>
          ) : (
            filtered.map((section) => (
              <div key={section.category}>
                <div className="px-2 py-1 text-[11px] font-semibold tracking-wider uppercase text-muted-foreground">
                  {section.category}
                </div>
                <div className="space-y-0.5 mt-0.5">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleSelect(item.href)}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl text-left hover:bg-muted/80 transition-colors group cursor-pointer"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground group-hover:bg-brand-50 group-hover:text-brand-600 dark:group-hover:bg-brand-950/60 dark:group-hover:text-brand-400 transition-colors shrink-0">
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="truncate">
                            <div className="text-xs font-semibold text-foreground group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors truncate">
                              {item.title}
                            </div>
                            <div className="text-[11px] text-muted-foreground truncate">
                              {item.subtitle}
                            </div>
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2" />
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-border bg-muted/20 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-3">
            <span>Navigation: <kbd className="font-mono">↑</kbd> <kbd className="font-mono">↓</kbd></span>
            <span>Select: <kbd className="font-mono">↵</kbd></span>
          </div>
          <span>Close: <kbd className="font-mono">ESC</kbd></span>
        </div>
      </div>
    </div>
  );
}
