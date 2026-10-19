"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import {
  Sparkles,
  ArrowRight,
  Clock,
  Briefcase,
  Award,
  Users,
  CheckCircle2,
  Star,
  Play,
  CalendarCheck2,
  AlertTriangle,
  GraduationCap,
  TrendingUp,
  ShieldCheck,
  Menu,
  X,
  Layers,
  DollarSign,
  Building2,
  QrCode,
  BadgeCheck,
  FileText,
  ChevronRight,
} from "lucide-react";

export default function LandingPage() {
  const { setTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedModuleCategory, setSelectedModuleCategory] = useState("All");
  const [activeTrackingTab, setActiveTrackingTab] = useState("attendance");

  // Lock this page to light mode by default as requested
  useEffect(() => {
    setTheme("light");
  }, [setTheme]);

  const moduleCategories = [
    "All",
    "Academics",
    "Operations",
    "Administration",
    "Student Life",
  ];

  const erpModules = [
    {
      id: "attendance-engine",
      category: "Academics",
      title: "Smart Attendance & Safe-Bunk Engine",
      description:
        "Real-time biometric and faculty classroom attendance logging with automated 75% regulatory warning alerts and smart bunk prediction.",
      metrics: "Live Sync • Instant Alert • 75% Guard",
      badge: "Core Academic",
      bgClass: "bg-[var(--primary)]",
      icon: CalendarCheck2,
      link: "/student/attendance",
    },
    {
      id: "timetable-scheduling",
      category: "Academics",
      title: "Conflict-Free Dynamic Timetables",
      description:
        "Automated classroom scheduling, faculty workload distribution, lab batch partitioning, and instant lecture substitution alerts.",
      metrics: "Zero Clashes • Room Allocator • Lab Batches",
      badge: "Automation",
      bgClass: "bg-[var(--secondary)]",
      icon: Clock,
      link: "/student/timetable",
    },
    {
      id: "exam-grading",
      category: "Academics",
      title: "Examination, Moderation & CGPA Grading",
      description:
        "Internal assessments, practical scores moderation, automated credit weighting, SGPA calculation, and downloadable official grade cards.",
      metrics: "Credit Transcripts • Moderation • Grade Cards",
      badge: "Evaluation",
      bgClass: "bg-[var(--accent-purple)]",
      icon: Award,
      link: "/student/exams",
    },
    {
      id: "tpo-placements",
      category: "Operations",
      title: "Training & Placement Cell (TPO) Hub",
      description:
        "Automated candidate shortlisting based on CGPA and zero-backlog criteria, company drive registrations, and tier-1 offer analytics.",
      metrics: "Backlog Guard • Drive Pipeline • Tier Analytics",
      badge: "Careers",
      bgClass: "bg-[var(--accent-mint)]",
      icon: Briefcase,
      link: "/student/placements",
    },
    {
      id: "fees-accounts",
      category: "Operations",
      title: "Digital Fees, Dues & Online Receipts",
      description:
        "Semester tuition invoices, online payment gateway with instant receipt generation, installment schedules, and automated no-dues clearance.",
      metrics: "Instant Receipts • Dues Clearance • Ledger Sync",
      badge: "Finance",
      bgClass: "bg-[var(--secondary)]",
      icon: DollarSign,
      link: "/student/fees",
    },
    {
      id: "gatepass-grievance",
      category: "Student Life",
      title: "Digital Gate Pass & Student Grievance",
      description:
        "Warden-verified digital out-passes with QR security verification at campus gates, plus confidential grievance ticket routing directly to HOD/Dean.",
      metrics: "QR Gate Scan • Parental SMS • 24h Triage",
      badge: "Campus Life",
      bgClass: "bg-[var(--primary)]",
      icon: QrCode,
      link: "/student/gatepass",
    },
  ];

  const filteredModules =
    selectedModuleCategory === "All"
      ? erpModules
      : erpModules.filter((m) => m.category === selectedModuleCategory);

  return (
    <div className="edu-platform always-light min-h-screen bg-[var(--bg-cream)] text-[var(--text)] flex flex-col font-sans selection:bg-[#98ff98]/50">
      {/* 1. Header & Navigation Bar (Light Mode Always, No Dark Toggle) */}
      <nav className="fixed top-4 left-4 right-4 z-50">
        <div className="clay-card px-6 py-3.5 max-w-6xl mx-auto bg-[var(--bg)]">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 cursor-pointer group">
              <div className="w-10 h-10 rounded-xl bg-[var(--primary)] border-3 border-[var(--text)] flex items-center justify-center shadow-[2px_2px_0_var(--text)] group-hover:scale-105 transition-transform">
                <GraduationCap className="w-5 h-5 text-[var(--text)]" />
              </div>
              <div className="flex flex-col items-start leading-none">
                <span className="text-xl font-bold font-display text-[var(--text)] tracking-tight">
                  CollegeOS
                </span>
                <span className="text-[10px] font-bold text-[var(--cta-dark)] uppercase tracking-wider">
                  Campus ERP
                </span>
              </div>
              <span className="hidden sm:inline-block text-[11px] font-bold bg-[var(--accent-mint)] border-2 border-[var(--text)] px-2 py-0.5 rounded-full shadow-[1px_1px_0_var(--text)] ml-1">
                v2.6
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center gap-7">
              <a
                href="#modules"
                className="text-sm font-bold text-[var(--text-muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
              >
                ERP Modules
              </a>
              <a
                href="#preview"
                className="text-sm font-bold text-[var(--text-muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
              >
                System Preview
              </a>
              <a
                href="#features"
                className="text-sm font-bold text-[var(--text-muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
              >
                Architecture
              </a>
              <a
                href="#portals"
                className="text-sm font-bold text-[var(--text-muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
              >
                Role Portals
              </a>
              <a
                href="#standards"
                className="text-sm font-bold text-[var(--text-muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
              >
                Core Standards
              </a>
            </div>

            {/* Desktop Actions (No Dark Toggle) */}
            <div className="hidden md:flex items-center gap-2.5">
              <Link href="/login">
                <button className="px-3.5 py-2 text-xs font-bold rounded-xl border-2 border-[var(--text)] bg-[var(--accent-mint)]/40 hover:bg-[var(--accent-mint)] text-[var(--text)] shadow-[2px_2px_0_var(--text)] transition-transform active:translate-x-[1px] active:translate-y-[1px] cursor-pointer">
                  Institutional Login
                </button>
              </Link>
              <Link href="/student/dashboard">
                <button className="btn-primary text-xs py-2 px-4 shadow-[2px_2px_0_var(--text)]">
                  Launch Student Hub
                </button>
              </Link>
            </div>

            {/* Mobile Hamburger Button (No Dark Toggle) */}
            <div className="flex items-center gap-2 md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="w-10 h-10 rounded-xl bg-[var(--secondary)] border-3 border-[var(--text)] flex items-center justify-center cursor-pointer shadow-[2px_2px_0_var(--text)]"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? (
                  <X className="w-5 h-5 text-[var(--text)]" />
                ) : (
                  <Menu className="w-5 h-5 text-[var(--text)]" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile dropdown */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 pt-4 border-t-3 border-[var(--border)] flex flex-col gap-3">
              <a
                href="#modules"
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-bold py-1 text-[var(--text)]"
              >
                ERP Modules
              </a>
              <a
                href="#preview"
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-bold py-1 text-[var(--text)]"
              >
                System Preview
              </a>
              <a
                href="#features"
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-bold py-1 text-[var(--text)]"
              >
                Architecture
              </a>
              <a
                href="#portals"
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-bold py-1 text-[var(--text)]"
              >
                Role Portals
              </a>
              <a
                href="#standards"
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-bold py-1 text-[var(--text)]"
              >
                Core Standards
              </a>
              <div className="flex gap-2 pt-2">
                <Link href="/login" className="flex-1">
                  <button className="btn-secondary w-full text-xs py-2">
                    Log In
                  </button>
                </Link>
                <Link href="/student/dashboard" className="flex-1">
                  <button className="btn-primary w-full text-xs py-2">
                    Student Hub
                  </button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* 2. Hero Section with Live Student ERP Preview Card */}
      <section className="pt-28 sm:pt-36 pb-12 sm:pb-20 px-4 bg-[var(--bg-cream)] overflow-hidden relative">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-10 sm:gap-14 items-center">
            {/* Left Content Column */}
            <div className="text-center lg:text-left">
              {/* Announcement Pill */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--accent-mint)] border-3 border-[var(--text)] text-sm font-bold mb-6 shadow-[3px_3px_0_var(--text)]">
                <span className="w-2.5 h-2.5 rounded-full bg-[var(--cta)] animate-ping" />
                <span className="w-2.5 h-2.5 rounded-full bg-[var(--cta)] -ml-4.5" />
                <span>Next-Gen Campus Intelligence • CollegeOS ERP</span>
              </div>

              {/* Display Headline */}
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold font-display text-[var(--text)] mb-6 leading-[1.12]">
                The Unified Campus<br />
                <span className="text-[var(--cta)] underline decoration-wavy decoration-[var(--primary)]">
                  Operating System
                </span>
                <br />
                For Higher Education.
              </h1>

              {/* Subtitle */}
              <p className="text-lg sm:text-xl text-[var(--text-muted)] mb-8 max-w-lg mx-auto lg:mx-0 leading-relaxed font-semibold">
                Replace fragmented legacy campus tools with a single, high-clarity ERP. Unifying real-time attendance, conflict-free scheduling, AI academic advising, fee management, and campus placements.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-10">
                <Link href="/student/dashboard">
                  <button className="btn-primary text-base py-3 px-7">
                    Launch Student Portal
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </button>
                </Link>
                <Link href="/login">
                  <button className="btn-secondary text-base py-3 px-7">
                    Institutional Sign In
                  </button>
                </Link>
              </div>

              {/* Institutional Metrics Strip */}
              <div className="flex gap-8 sm:gap-12 justify-center lg:justify-start">
                <div className="text-center lg:text-left">
                  <div className="text-3xl font-bold font-display text-[var(--text)]">
                    99.8%
                  </div>
                  <div className="text-sm font-bold text-[var(--text-muted)]">
                    Attendance Precision
                  </div>
                </div>
                <div className="text-center lg:text-left">
                  <div className="text-3xl font-bold font-display text-[var(--text)]">
                    6 Roles
                  </div>
                  <div className="text-sm font-bold text-[var(--text-muted)]">
                    Unified Ecosystem
                  </div>
                </div>
                <div className="text-center lg:text-left">
                  <div className="text-3xl font-bold font-display text-[var(--text)]">
                    &lt; 24h
                  </div>
                  <div className="text-sm font-bold text-[var(--text-muted)]">
                    Grievance Triage
                  </div>
                </div>
              </div>
            </div>

            {/* Right Live Preview: Student ERP Live Status Card */}
            <div className="relative mx-auto w-full max-w-md lg:max-w-none">
              {/* Main Clay Card */}
              <div className="clay-card p-6 sm:p-7 bg-[var(--bg)] relative z-10 shadow-[8px_8px_0_var(--edu-border)]">
                {/* Header profile row */}
                <div className="flex items-center justify-between pb-4 border-b-2 border-[var(--border)] mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-[var(--secondary)] border-3 border-[var(--text)] flex items-center justify-center shadow-[2px_2px_0_var(--text)] font-bold text-lg font-display">
                      OS
                    </div>
                    <div>
                      <div className="font-bold font-display text-base text-[var(--text)]">
                        Student Workspace Preview
                      </div>
                      <div className="text-xs font-bold text-[var(--text-muted)]">
                        B.Tech • Computer Science & Engineering
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold bg-[var(--accent-mint)] border border-[var(--text)] px-2.5 py-1 rounded-full text-[var(--text)] shadow-[1px_1px_0_var(--text)]">
                    Active Session
                  </span>
                </div>

                {/* Live Attendance Metric Widget */}
                <div className="mb-4 p-4 rounded-2xl bg-[var(--bg-cream)] border-2 border-[var(--text)]">
                  <div className="flex justify-between items-center text-sm mb-2 font-bold font-display">
                    <span className="text-[var(--text-muted)] flex items-center gap-1.5">
                      <CalendarCheck2 className="w-4 h-4 text-[var(--cta-dark)]" />
                      Cumulative Attendance
                    </span>
                    <span className="text-[var(--cta-dark)] text-base">84.6%</span>
                  </div>
                  <div className="h-3.5 bg-[var(--border)] rounded-full border-2 border-[var(--text)] overflow-hidden p-[2px]">
                    <div className="h-full w-[84.6%] bg-[var(--cta)] rounded-full transition-all duration-500" />
                  </div>
                  <div className="flex justify-between items-center mt-2 text-[11px] font-bold">
                    <span className="text-[var(--text-muted)]">Mandatory Cutoff: 75%</span>
                    <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                      Safe Bunks: +4 Available
                    </span>
                  </div>
                </div>

                {/* Today's Schedule & Clearance Status */}
                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="p-3 rounded-xl bg-[var(--accent-mint)]/40 border-2 border-[var(--text)]">
                    <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase">
                      Upcoming Lecture
                    </div>
                    <div className="text-xs font-bold text-[var(--text)] truncate mt-0.5">
                      Distributed Systems
                    </div>
                    <div className="text-[10px] font-semibold text-[var(--text-muted)]">
                      10:30 AM • Hall LH-204
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-[var(--accent-purple)]/50 border-2 border-[var(--text)]">
                    <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase">
                      Exam Eligibility
                    </div>
                    <div className="text-xs font-bold text-emerald-700 mt-0.5 flex items-center gap-1">
                      <BadgeCheck className="w-3.5 h-3.5" /> Dues Cleared
                    </div>
                    <div className="text-[10px] font-semibold text-[var(--text-muted)]">
                      Hall Ticket Active
                    </div>
                  </div>
                </div>

                <Link href="/student/dashboard" className="block w-full">
                  <button className="w-full btn-primary text-sm py-3.5">
                    Open Student Workspace
                    <Play className="w-4 h-4 ml-2 fill-current" />
                  </button>
                </Link>
              </div>

              {/* Floating Decorative Badges */}
              <div className="absolute -top-5 -right-5 z-20 w-18 h-18 rounded-2xl bg-[var(--primary)] border-3 border-[var(--text)] flex items-center justify-center shadow-[4px_4px_0_var(--text)] animate-bounce duration-1000">
                <span className="text-2xl select-none">🎓</span>
              </div>
              <div className="absolute -bottom-5 -left-5 z-20 w-16 h-16 rounded-2xl bg-[var(--accent-purple)] border-3 border-[var(--text)] flex items-center justify-center shadow-[4px_4px_0_var(--text)]">
                <span className="text-2xl select-none">📊</span>
              </div>
              <div className="absolute top-1/2 -right-8 z-20 w-14 h-14 rounded-full bg-[var(--accent-mint)] border-3 border-[var(--text)] flex items-center justify-center shadow-[3px_3px_0_var(--text)]">
                <span className="text-xl select-none">⚡</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Core CollegeOS ERP Modules Section */}
      <section id="modules" className="py-14 sm:py-24 px-4 bg-[var(--bg)] border-y-3 border-border">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-10 sm:mb-14">
            <span className="inline-block px-5 py-2 rounded-full bg-[var(--secondary)] border-3 border-[var(--text)] text-sm font-bold font-display mb-4 shadow-[3px_3px_0_var(--text)]">
              Academic & Administrative Suite
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold font-display text-[var(--text)] mb-4">
              Engineered for Every Campus Workflow
            </h2>
            <p className="text-lg text-[var(--text-muted)] max-w-2xl mx-auto font-semibold">
              From classroom attendance registers to placement drives, CollegeOS consolidates entire campus operations into one responsive platform.
            </p>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center justify-center gap-2.5 mt-8">
              {moduleCategories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedModuleCategory(category)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold border-2 border-[var(--text)] transition-all cursor-pointer ${
                    selectedModuleCategory === category
                      ? "bg-[var(--cta)] text-white shadow-[2px_2px_0_var(--text)]"
                      : "bg-[var(--bg-cream)] text-[var(--text)] hover:bg-[var(--secondary)]"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* ERP Modules Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredModules.map((module) => {
              const Icon = module.icon;
              return (
                <div
                  key={module.id}
                  className="clay-card p-6 cursor-pointer bg-[var(--bg)] flex flex-col justify-between group hover:scale-[1.01]"
                >
                  <div>
                    {/* Top Row: Icon + Badge */}
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div
                        className={`w-14 h-14 rounded-2xl border-3 border-[var(--text)] flex items-center justify-center flex-shrink-0 shadow-[2px_2px_0_var(--text)] ${module.bgClass}`}
                      >
                        <Icon className="w-7 h-7 text-[var(--text)]" />
                      </div>
                      <div className="px-3 py-1 rounded-full bg-[var(--secondary)]/40 border-2 border-[var(--text)] text-xs font-bold font-display shadow-[1px_1px_0_var(--text)]">
                        {module.badge}
                      </div>
                    </div>

                    {/* Title & Description */}
                    <h3 className="font-bold font-display text-xl text-[var(--text)] mb-2 group-hover:text-[var(--cta-dark)] transition-colors">
                      {module.title}
                    </h3>
                    <p className="text-xs font-semibold text-[var(--text-muted)] leading-relaxed mb-4">
                      {module.description}
                    </p>
                  </div>

                  {/* Metadata Row */}
                  <div className="pt-4 border-t-2 border-[var(--border)]">
                    <div className="text-[11px] font-bold text-[var(--text-muted)] flex items-center justify-between">
                      <span>{module.metrics}</span>
                    </div>

                    <Link href={module.link} className="block mt-4">
                      <button className="w-full btn-secondary text-xs py-2.5 flex items-center justify-center gap-1.5">
                        Access Module
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-center mt-12">
            <Link href="/student/dashboard">
              <button className="btn-secondary text-base py-3 px-8">
                Explore All Campus Features
                <ArrowRight className="w-5 h-5 ml-2" />
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* 4. Interactive Live Progress Tracking Preview */}
      <section id="preview" className="py-14 sm:py-24 px-4 bg-[var(--bg-cream)]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <span className="inline-block px-5 py-2 rounded-full bg-[var(--accent-purple)] border-3 border-[var(--text)] text-sm font-bold font-display mb-4 shadow-[3px_3px_0_var(--text)]">
              Verified Architecture & Workflow Preview
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold font-display text-[var(--text)] mb-4">
              Real-Time Academic Progress Tracking
            </h2>
            <p className="text-lg text-[var(--text-muted)] max-w-2xl mx-auto font-semibold">
              Live schema models for attendance compliance, academic rubrics, placement eligibility, and verified AI Copilot advisories.
            </p>

            {/* Preview Tabs */}
            <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
              {[
                { id: "attendance", label: "Safe Bunk & Attendance", icon: CalendarCheck2 },
                { id: "assignments", label: "Academic Assignments", icon: FileText },
                { id: "placements", label: "Placement Matching", icon: Briefcase },
                { id: "ai", label: "Autonomous AI Copilot", icon: Sparkles },
              ].map((tab) => {
                const TabIcon = tab.icon;
                const isActive = activeTrackingTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTrackingTab(tab.id)}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold font-display border-3 border-[var(--text)] transition-all cursor-pointer ${
                      isActive
                        ? "bg-[var(--cta)] text-white shadow-[4px_4px_0_var(--text)] translate-x-[1px] translate-y-[1px]"
                        : "bg-[var(--bg)] text-[var(--text)] shadow-[4px_4px_0_var(--text)] hover:bg-[var(--secondary)]"
                    }`}
                  >
                    <TabIcon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interactive Screen Preview Container */}
          <div className="clay-card p-6 sm:p-8 md:p-10 bg-[var(--bg)] max-w-4xl mx-auto shadow-[8px_8px_0_var(--edu-border)]">
            <div className="mb-6 p-3 rounded-xl bg-amber-500/10 border-2 border-amber-500/30 text-amber-900 text-xs font-bold text-center">
              Illustrated sample preview for institutional evaluation • Production operates directly on authorized campus PostgreSQL database
            </div>
            {activeTrackingTab === "attendance" && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b-2 border-[var(--border)]">
                  <div>
                    <span className="text-xs font-bold text-amber-700 bg-amber-100 border border-amber-400 px-3 py-1 rounded-full">
                      Attendance Alert Threshold
                    </span>
                    <h3 className="text-2xl font-bold font-display text-[var(--text)] mt-2">
                      Database Management Systems (CS601)
                    </h3>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-black font-display text-rose-500">
                      71.1%
                    </div>
                    <div className="text-xs font-bold text-[var(--text-muted)]">
                      Minimum required: 75%
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-2xl bg-[var(--primary)]/30 border-3 border-[var(--text)]">
                    <div className="text-xs font-bold text-[var(--text-muted)] mb-1">
                      Attended Classes
                    </div>
                    <div className="text-2xl font-bold font-display text-[var(--text)]">
                      32 / 45
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-[var(--accent-mint)]/40 border-3 border-[var(--text)]">
                    <div className="text-xs font-bold text-[var(--text-muted)] mb-1">
                      Recovery Needed
                    </div>
                    <div className="text-2xl font-bold font-display text-[var(--cta-dark)]">
                      +3 Classes
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-[var(--secondary)]/40 border-3 border-[var(--text)]">
                    <div className="text-xs font-bold text-[var(--text-muted)] mb-1">
                      Safe Bunks Left
                    </div>
                    <div className="text-2xl font-bold font-display text-[var(--text)]">
                      0 Available
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[var(--bg-cream)] border-2 border-[var(--text)] flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm font-semibold text-[var(--text)] leading-relaxed">
                    <strong>College AI Advice:</strong> Attending Monday&apos;s 10:00 AM lecture and Wednesday&apos;s lab will lift your DBMS attendance to <strong>75.5%</strong>, ensuring full mid-term exam eligibility.
                  </p>
                </div>
              </div>
            )}

            {activeTrackingTab === "assignments" && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b-2 border-[var(--border)]">
                  <div>
                    <span className="text-xs font-bold text-[var(--cta-dark)] bg-[var(--accent-mint)] border border-[var(--cta)] px-3 py-1 rounded-full">
                      Active Deadline
                    </span>
                    <h3 className="text-2xl font-bold font-display text-[var(--text)] mt-2">
                      B+ Tree Indexing & Query Cost Optimizer
                    </h3>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold font-display text-[var(--text)]">
                      Due Oct 10
                    </div>
                    <div className="text-xs font-bold text-rose-500">
                      28 Hours Remaining
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-[var(--bg)] border-3 border-[var(--text)] shadow-[3px_3px_0_var(--text)]">
                    <h4 className="font-bold font-display text-sm text-[var(--text)] mb-2">
                      Rubrics & Submission Checklist
                    </h4>
                    <ul className="space-y-2 text-xs font-bold text-[var(--text-muted)]">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[var(--cta)]" />
                        Algorithm complexity documented (O(log n))
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[var(--cta)]" />
                        Unit test suites passing with 100% coverage
                      </li>
                      <li className="flex items-center gap-2 text-amber-600">
                        <Clock className="w-4 h-4" />
                        Benchmarking against Hash Index pending
                      </li>
                    </ul>
                  </div>

                  <div className="p-4 rounded-2xl bg-[var(--accent-purple)]/30 border-3 border-[var(--text)] shadow-[3px_3px_0_var(--text)] flex flex-col justify-between">
                    <div>
                      <div className="text-xs font-bold text-[var(--text-muted)] mb-1">
                        Automated AI Pre-Checker
                      </div>
                      <div className="text-sm font-bold text-[var(--text)]">
                        No formatting syntax errors detected in submission package.
                      </div>
                    </div>
                    <Link href="/student/assignments">
                      <button className="btn-primary text-xs py-2 w-full mt-4">
                        Submit Assignment
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {activeTrackingTab === "placements" && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b-2 border-[var(--border)]">
                  <div>
                    <span className="text-xs font-bold text-[var(--text)] bg-[var(--secondary)] border border-[var(--text)] px-3 py-1 rounded-full">
                      High Match Tier
                    </span>
                    <h3 className="text-2xl font-bold font-display text-[var(--text)] mt-2">
                      Campus Placement Drive: Top Tier Hiring
                    </h3>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-black font-display text-[var(--cta-dark)]">
                      96% Match
                    </div>
                    <div className="text-xs font-bold text-[var(--text-muted)]">
                      Eligibility verified
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-2xl bg-[var(--accent-mint)]/40 border-3 border-[var(--text)]">
                    <div className="text-xs font-bold text-[var(--text-muted)]">
                      Backlogs
                    </div>
                    <div className="text-xl font-bold font-display text-[var(--text)]">
                      0 Active
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-[var(--primary)]/30 border-3 border-[var(--text)]">
                    <div className="text-xs font-bold text-[var(--text-muted)]">
                      Cumulative CGPA
                    </div>
                    <div className="text-xl font-bold font-display text-[var(--text)]">
                      8.74 / 10
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-[var(--secondary)]/40 border-3 border-[var(--text)]">
                    <div className="text-xs font-bold text-[var(--text-muted)]">
                      Package Range
                    </div>
                    <div className="text-xl font-bold font-display text-[var(--cta-dark)]">
                      11.5 - 18 LPA
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTrackingTab === "ai" && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b-2 border-[var(--border)]">
                  <div className="w-12 h-12 rounded-2xl bg-[var(--accent-purple)] border-3 border-[var(--text)] flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-[var(--text)]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold font-display text-[var(--text)]">
                      Apex College AI Copilot
                    </h3>
                    <p className="text-xs font-bold text-[var(--text-muted)]">
                      Grounded in university regulations, syllabus documents & campus notices
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="p-3.5 rounded-2xl bg-[var(--secondary)]/30 border-2 border-[var(--text)] text-xs font-bold text-[var(--text)]">
                    👤 <em>&quot;Can I get medical leave compensation for last Friday&apos;s OS lab?&quot;</em>
                  </div>
                  <div className="p-4 rounded-2xl bg-[var(--bg)] border-3 border-[var(--text)] text-xs font-semibold text-[var(--text)] leading-relaxed shadow-[3px_3px_0_var(--text)]">
                    🤖 <strong>AI Copilot:</strong> Yes! Under University Academic Regulation §4.2, submit your medical prescription to the HOD office within <strong>7 days</strong>. I have already filled out the preliminary leave compensation request for you!
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 5. Architectural Advantages & Campus Security */}
      <section id="features" className="py-14 sm:py-24 px-4 bg-[var(--bg-cream)] border-t-3 border-border">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <span className="inline-block px-5 py-2 rounded-full bg-[var(--primary)] border-3 border-[var(--text)] text-sm font-bold font-display mb-4 shadow-[3px_3px_0_var(--text)]">
              Campus Architecture
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold font-display text-[var(--text)] mb-4">
              Everything Your Institution Needs
            </h2>
            <p className="text-lg text-[var(--text-muted)] max-w-2xl mx-auto font-semibold">
              Built specifically for engineering colleges and autonomous universities to ensure flawless compliance and speed.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1 */}
            <div className="soft-clay p-7 text-center cursor-pointer hover:scale-105 transition-transform bg-[var(--bg)]">
              <div className="w-16 h-16 rounded-2xl border-3 border-[var(--text)] flex items-center justify-center mx-auto mb-5 bg-[var(--primary)] shadow-[3px_3px_0_var(--text)]">
                <ShieldCheck className="w-8 h-8 text-[var(--text)]" />
              </div>
              <h3 className="font-bold font-display text-xl text-[var(--text)] mb-2">
                Enterprise RBAC
              </h3>
              <p className="text-sm font-semibold text-[var(--text-muted)] leading-relaxed">
                Dedicated permission silos for Students, Faculty, HODs, Exam Officers, and Administrators.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="soft-clay p-7 text-center cursor-pointer hover:scale-105 transition-transform bg-[var(--bg)]">
              <div className="w-16 h-16 rounded-2xl border-3 border-[var(--text)] flex items-center justify-center mx-auto mb-5 bg-[var(--secondary)] shadow-[3px_3px_0_var(--text)]">
                <Sparkles className="w-8 h-8 text-[var(--text)]" />
              </div>
              <h3 className="font-bold font-display text-xl text-[var(--text)] mb-2">
                Grounded AI Copilot
              </h3>
              <p className="text-sm font-semibold text-[var(--text-muted)] leading-relaxed">
                Trained on university ordinances, course catalogs, exam rules, and syllabus circulars.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="soft-clay p-7 text-center cursor-pointer hover:scale-105 transition-transform bg-[var(--bg)]">
              <div className="w-16 h-16 rounded-2xl border-3 border-[var(--text)] flex items-center justify-center mx-auto mb-5 bg-[var(--accent-purple)] shadow-[3px_3px_0_var(--text)]">
                <Layers className="w-8 h-8 text-[var(--text)]" />
              </div>
              <h3 className="font-bold font-display text-xl text-[var(--text)] mb-2">
                Real-Time Data Sync
              </h3>
              <p className="text-sm font-semibold text-[var(--text-muted)] leading-relaxed">
                Zero overnight batch delays. Marks entry, attendance logs, and fee clearance update instantly.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="soft-clay p-7 text-center cursor-pointer hover:scale-105 transition-transform bg-[var(--bg)]">
              <div className="w-16 h-16 rounded-2xl border-3 border-[var(--text)] flex items-center justify-center mx-auto mb-5 bg-[var(--accent-mint)] shadow-[3px_3px_0_var(--text)]">
                <Building2 className="w-8 h-8 text-[var(--text)]" />
              </div>
              <h3 className="font-bold font-display text-xl text-[var(--text)] mb-2">
                Audit Compliance
              </h3>
              <p className="text-sm font-semibold text-[var(--text-muted)] leading-relaxed">
                1-click automated exports for NAAC, NBA, and regulatory university accreditation committees.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Institutional Role Portals Section */}
      <section id="portals" className="py-14 sm:py-24 px-4 bg-[var(--bg)] border-t-3 border-border">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <span className="inline-block px-5 py-2 rounded-full bg-[var(--secondary)] border-3 border-[var(--text)] text-sm font-bold font-display mb-4 shadow-[3px_3px_0_var(--text)]">
              Integrated Campus Ecosystem
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold font-display text-[var(--text)] mb-4">
              Explore Institutional Portals
            </h2>
            <p className="text-lg text-[var(--text-muted)] max-w-2xl mx-auto font-semibold">
              Tailored workspaces for students, faculty, department heads, and campus administrators.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Student */}
            <div className="clay-card p-6 bg-[var(--bg)] flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-[var(--accent-mint)] border-3 border-[var(--text)] flex items-center justify-center mb-4 shadow-[2px_2px_0_var(--text)]">
                  <GraduationCap className="w-6 h-6 text-[var(--text)]" />
                </div>
                <h3 className="font-bold font-display text-xl text-[var(--text)] mb-1">
                  Student Portal
                </h3>
                <p className="text-xs font-semibold text-[var(--text-muted)] leading-relaxed mb-4">
                  Track attendance, exam timetables, calculate safe bunks, submit assignments, and apply for placements.
                </p>
              </div>
              <Link href="/student/dashboard">
                <button className="btn-primary w-full text-xs py-2.5">
                  Launch Student Hub
                </button>
              </Link>
            </div>

            {/* Teacher */}
            <div className="clay-card p-6 bg-[var(--bg)] flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-[var(--primary)] border-3 border-[var(--text)] flex items-center justify-center mb-4 shadow-[2px_2px_0_var(--text)]">
                  <Users className="w-6 h-6 text-[var(--text)]" />
                </div>
                <h3 className="font-bold font-display text-xl text-[var(--text)] mb-1">
                  Teacher Portal
                </h3>
                <p className="text-xs font-semibold text-[var(--text-muted)] leading-relaxed mb-4">
                  1-click class attendance, rubric generation, grading pipelines, and broadcast alerts to course batches.
                </p>
              </div>
              <Link href="/teacher/dashboard">
                <button className="btn-peach w-full text-xs py-2.5">
                  Launch Faculty Hub
                </button>
              </Link>
            </div>

            {/* HOD */}
            <div className="clay-card p-6 bg-[var(--bg)] flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-[var(--accent-purple)] border-3 border-[var(--text)] flex items-center justify-center mb-4 shadow-[2px_2px_0_var(--text)]">
                  <TrendingUp className="w-6 h-6 text-[var(--text)]" />
                </div>
                <h3 className="font-bold font-display text-xl text-[var(--text)] mb-1">
                  HOD Operations
                </h3>
                <p className="text-xs font-semibold text-[var(--text-muted)] leading-relaxed mb-4">
                  Department intelligence, faculty workload balancing, grievance tickets triage, and course pass-rates.
                </p>
              </div>
              <Link href="/hod/dashboard">
                <button className="btn-purple w-full text-xs py-2.5">
                  Launch HOD Desk
                </button>
              </Link>
            </div>

            {/* Admin */}
            <div className="clay-card p-6 bg-[var(--bg)] flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-[var(--secondary)] border-3 border-[var(--text)] flex items-center justify-center mb-4 shadow-[2px_2px_0_var(--text)]">
                  <ShieldCheck className="w-6 h-6 text-[var(--text)]" />
                </div>
                <h3 className="font-bold font-display text-xl text-[var(--text)] mb-1">
                  Admin & Triage
                </h3>
                <p className="text-xs font-semibold text-[var(--text-muted)] leading-relaxed mb-4">
                  Role assignments, campus broadcasts, knowledge base vector indexing, and AI observability dashboards.
                </p>
              </div>
              <Link href="/admin/dashboard">
                <button className="btn-secondary w-full text-xs py-2.5">
                  Launch Admin Desk
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Institutional Pillars & System Capabilities */}
      <section id="standards" className="py-14 sm:py-24 px-4 bg-[var(--bg-cream)] border-t-3 border-[var(--text)]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <span className="inline-block px-5 py-2 rounded-full bg-[var(--accent-mint)] border-3 border-[var(--text)] text-sm font-bold font-display mb-4 shadow-[3px_3px_0_var(--text)]">
              Core Standards
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold font-display text-[var(--text)] mb-4">
              Institutional Pillars & Compliance
            </h2>
            <p className="text-lg text-[var(--text-muted)] max-w-2xl mx-auto font-semibold">
              Engineered to meet statutory accreditation guidelines, strict data partitioning, and real-time operational reliability.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Pillar 1 */}
            <div className="clay-card p-7 bg-[var(--bg)] flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl border-3 border-[var(--text)] bg-[var(--primary)] flex items-center justify-center text-lg font-bold mb-5 shadow-[2px_2px_0_var(--text)]">
                  <CalendarCheck2 className="w-6 h-6 text-[var(--text)]" />
                </div>
                <h3 className="font-bold font-display text-xl text-[var(--text)] mb-3">
                  75% Attendance Guard
                </h3>
                <p className="text-sm font-semibold text-[var(--text-muted)] mb-6 leading-relaxed">
                  Configurable statutory threshold calculations with real-time safe-bunk forecasting. Any attendance corrections require faculty submission, HOD approval, and an immutable audit trail.
                </p>
              </div>
              <div className="pt-4 border-t-2 border-[var(--border)] text-xs font-bold text-[var(--cta-dark)] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Statutory Policy Enforcement</span>
              </div>
            </div>

            {/* Pillar 2 */}
            <div className="clay-card p-7 bg-[var(--bg)] flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl border-3 border-[var(--text)] bg-[var(--accent-purple)] flex items-center justify-center text-lg font-bold mb-5 shadow-[2px_2px_0_var(--text)]">
                  <ShieldCheck className="w-6 h-6 text-[var(--text)]" />
                </div>
                <h3 className="font-bold font-display text-xl text-[var(--text)] mb-3">
                  Multi-Tenant Security
                </h3>
                <p className="text-sm font-semibold text-[var(--text-muted)] mb-6 leading-relaxed">
                  Every database record is partitioned by college code with role-based access control. Sensitive records, student grades, and financial ledgers are completely isolated across tenant boundaries.
                </p>
              </div>
              <div className="pt-4 border-t-2 border-[var(--border)] text-xs font-bold text-[var(--cta-dark)] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Zero Cross-Tenant Leakage</span>
              </div>
            </div>

            {/* Pillar 3 */}
            <div className="clay-card p-7 bg-[var(--bg)] flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl border-3 border-[var(--text)] bg-[var(--accent-mint)] flex items-center justify-center text-lg font-bold mb-5 shadow-[2px_2px_0_var(--text)]">
                  <Sparkles className="w-6 h-6 text-[var(--text)]" />
                </div>
                <h3 className="font-bold font-display text-xl text-[var(--text)] mb-3">
                  Grounded AI Intelligence
                </h3>
                <p className="text-sm font-semibold text-[var(--text-muted)] mb-6 leading-relaxed">
                  Vector retrieval using pgvector queries only authorized institutional handbooks, ordinances, and course syllabi. Model responses feature traceable source citations and verifiable academic metrics.
                </p>
              </div>
              <div className="pt-4 border-t-2 border-[var(--border)] text-xs font-bold text-[var(--cta-dark)] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Traceable Document Citations</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Institutional Call-to-Action */}
      <section className="py-14 sm:py-24 px-4 bg-[var(--secondary)] border-y-3 border-border">
        <div className="max-w-4xl mx-auto text-center">
          <div className="clay-card p-8 sm:p-14 bg-[var(--bg)] shadow-[8px_8px_0_var(--edu-border)]">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold font-display text-[var(--text)] mb-4">
              Modernize Your Campus with CollegeOS
            </h2>
            <p className="text-lg text-[var(--text-muted)] mb-8 max-w-xl mx-auto font-semibold">
              Join autonomous institutes and modern colleges experiencing unified, zero-friction academic operations.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link href="/student/dashboard">
                <button className="btn-primary text-base px-8 py-3.5">
                  Launch Student Hub
                  <ArrowRight className="w-5 h-5 ml-2" />
                </button>
              </Link>
              <Link href="/login">
                <button className="btn-secondary text-base px-8 py-3.5">
                  Institutional Sign In
                </button>
              </Link>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 text-sm font-bold text-[var(--text-muted)]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[var(--cta)]" />
                <span>Zero legacy software lag</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[var(--cta)]" />
                <span>NAAC & AICTE audit-ready</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[var(--cta)]" />
                <span>Instant multi-role access</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 9. Institutional Campus Footer */}
      <footer className="py-12 sm:py-16 px-4 bg-[var(--bg-cream)]">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-10 sm:gap-12 mb-12">
            {/* Brand column */}
            <div className="lg:col-span-2">
              <Link href="/" className="flex items-center gap-2.5 mb-4 cursor-pointer">
                <div className="w-10 h-10 rounded-xl bg-[var(--primary)] border-3 border-[var(--text)] flex items-center justify-center shadow-[2px_2px_0_var(--text)]">
                  <GraduationCap className="w-5 h-5 text-[var(--text)]" />
                </div>
                <div className="flex flex-col items-start leading-none">
                  <span className="text-xl font-bold font-display text-[var(--text)]">
                    CollegeOS
                  </span>
                  <span className="text-[10px] font-bold text-[var(--cta-dark)] uppercase tracking-wider">
                    Campus ERP
                  </span>
                </div>
              </Link>
              <p className="text-sm font-semibold text-[var(--text-muted)] mb-6 max-w-xs leading-relaxed">
                The modern, approachable, and AI-grounded operating system for higher education institutions, autonomous universities, and engineering campuses.
              </p>
            </div>

            {/* Links 1: ERP Modules */}
            <div>
              <h4 className="font-bold font-display text-base text-[var(--text)] mb-4">
                Core Modules
              </h4>
              <ul className="space-y-2.5 text-sm font-semibold text-[var(--text-muted)]">
                <li>
                  <Link href="/student/attendance" className="hover:text-[var(--text)] transition-colors">
                    Attendance & Safe Bunk
                  </Link>
                </li>
                <li>
                  <Link href="/student/timetable" className="hover:text-[var(--text)] transition-colors">
                    Dynamic Timetable
                  </Link>
                </li>
                <li>
                  <Link href="/student/exams" className="hover:text-[var(--text)] transition-colors">
                    Examinations & Grades
                  </Link>
                </li>
                <li>
                  <Link href="/student/placements" className="hover:text-[var(--text)] transition-colors">
                    Placement & TPO Cell
                  </Link>
                </li>
                <li>
                  <Link href="/student/fees" className="hover:text-[var(--text)] transition-colors">
                    Fees & Online Dues
                  </Link>
                </li>
                <li>
                  <Link href="/student/gatepass" className="hover:text-[var(--text)] transition-colors">
                    QR Gate Passes
                  </Link>
                </li>
              </ul>
            </div>

            {/* Links 2: Role Portals */}
            <div>
              <h4 className="font-bold font-display text-base text-[var(--text)] mb-4">
                Role Portals
              </h4>
              <ul className="space-y-2.5 text-sm font-semibold text-[var(--text-muted)]">
                <li>
                  <Link href="/student/dashboard" className="hover:text-[var(--text)] transition-colors">
                    Student Hub
                  </Link>
                </li>
                <li>
                  <Link href="/teacher/dashboard" className="hover:text-[var(--text)] transition-colors">
                    Faculty Portal
                  </Link>
                </li>
                <li>
                  <Link href="/hod/dashboard" className="hover:text-[var(--text)] transition-colors">
                    HOD Operations
                  </Link>
                </li>
                <li>
                  <Link href="/admin/dashboard" className="hover:text-[var(--text)] transition-colors">
                    Admin Operations
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="hover:text-[var(--text)] transition-colors">
                    Institutional Sign In
                  </Link>
                </li>
              </ul>
            </div>

            {/* Links 3: Governance & Support */}
            <div>
              <h4 className="font-bold font-display text-base text-[var(--text)] mb-4">
                Governance
              </h4>
              <ul className="space-y-2.5 text-sm font-semibold text-[var(--text-muted)]">
                <li>
                  <Link href="/student/complaints" className="hover:text-[var(--text)] transition-colors">
                    Grievance Redressal
                  </Link>
                </li>
                <li>
                  <a href="#" className="hover:text-[var(--text)] transition-colors">
                    AICTE & NAAC Reports
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-[var(--text)] transition-colors">
                    Campus Security & RBAC
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-[var(--text)] transition-colors">
                    IT Helpdesk
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Copyright Row */}
          <div className="pt-8 border-t-3 border-[var(--border)] flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm font-bold text-[var(--text-muted)]">
              © 2026 CollegeOS ERP. All institutional rights reserved.
            </p>
            <div className="flex items-center gap-6 text-sm font-bold text-[var(--text-muted)]">
              <a href="#" className="hover:text-[var(--text)] transition-colors cursor-pointer">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-[var(--text)] transition-colors cursor-pointer">
                Academic Regulations
              </a>
              <a href="#" className="hover:text-[var(--text)] transition-colors cursor-pointer">
                Campus SSO
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
