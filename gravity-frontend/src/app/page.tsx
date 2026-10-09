"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  BookOpen,
  Code,
  Palette,
  Database,
  Smartphone,
  Cloud,
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
} from "lucide-react";

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [activeTrackingTab, setActiveTrackingTab] = useState("attendance");

  const categories = [
    "All",
    "Web Development",
    "UI/UX Design",
    "Data Science",
    "Mobile Apps",
    "Cloud Architecture",
  ];

  const courses = [
    {
      id: "web-dev",
      category: "Web Development",
      title: "Web Development Bootcamp",
      instructor: "Sarah Chen",
      lessons: 48,
      duration: "24h",
      students: "12.5K",
      rating: "4.9",
      bgClass: "bg-peach",
      icon: Code,
    },
    {
      id: "uiux-design",
      category: "UI/UX Design",
      title: "UI/UX Design Mastery",
      instructor: "Mike Johnson",
      lessons: 36,
      duration: "18h",
      students: "8.2K",
      rating: "4.8",
      bgClass: "bg-blue",
      icon: Palette,
    },
    {
      id: "data-science",
      category: "Data Science",
      title: "Data Science with Python & AI",
      instructor: "Emily Davis",
      lessons: 52,
      duration: "30h",
      students: "15.3K",
      rating: "4.9",
      bgClass: "bg-purple",
      icon: Database,
    },
    {
      id: "mobile-apps",
      category: "Mobile Apps",
      title: "Mobile App Development",
      instructor: "Alex Kim",
      lessons: 42,
      duration: "22h",
      students: "9.8K",
      rating: "4.7",
      bgClass: "bg-mint",
      icon: Smartphone,
    },
    {
      id: "cloud-devops",
      category: "Cloud Architecture",
      title: "Cloud Infrastructure & DevOps",
      instructor: "David O'Connor",
      lessons: 40,
      duration: "20h",
      students: "11.1K",
      rating: "4.9",
      bgClass: "bg-peach",
      icon: Cloud,
    },
    {
      id: "ai-agents",
      category: "Data Science",
      title: "Autonomous AI Agents & LLMs",
      instructor: "Dr. Aris Thorne",
      lessons: 34,
      duration: "16h",
      students: "14.2K",
      rating: "5.0",
      bgClass: "bg-purple",
      icon: Sparkles,
    },
  ];

  const filteredCourses =
    selectedCategory === "All"
      ? courses
      : courses.filter((c) => c.category === selectedCategory);

  return (
    <div className="edu-platform min-h-screen bg-[var(--bg-cream)] text-[var(--text)] flex flex-col font-sans selection:bg-[#98ff98]/50">
      {/* 1. Header & Floating Navigation Bar */}
      <nav className="fixed top-4 left-4 right-4 z-50">
        <div className="clay-card px-6 py-3.5 max-w-6xl mx-auto bg-white">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 cursor-pointer group">
              <div className="w-10 h-10 rounded-xl bg-[var(--primary)] border-3 border-[var(--text)] flex items-center justify-center shadow-[2px_2px_0_var(--text)] group-hover:scale-105 transition-transform">
                <BookOpen className="w-5 h-5 text-[var(--text)]" />
              </div>
              <span className="text-xl font-bold font-display text-[var(--text)] tracking-tight">
                LearnHub
              </span>
              <span className="hidden sm:inline-block text-[11px] font-bold bg-[var(--accent-mint)] border-2 border-[var(--text)] px-2 py-0.5 rounded-full shadow-[1px_1px_0_var(--text)]">
                College OS
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center gap-7">
              <a
                href="#courses"
                className="text-sm font-bold text-[var(--text-muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
              >
                Courses
              </a>
              <a
                href="#demo"
                className="text-sm font-bold text-[var(--text-muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
              >
                Live Progress
              </a>
              <a
                href="#features"
                className="text-sm font-bold text-[var(--text-muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
              >
                Features
              </a>
              <a
                href="#portals"
                className="text-sm font-bold text-[var(--text-muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
              >
                Role Portals
              </a>
              <a
                href="#testimonials"
                className="text-sm font-bold text-[var(--text-muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
              >
                Reviews
              </a>
            </div>

            {/* Actions */}
            <div className="hidden md:flex items-center gap-3">
              <Link href="/login">
                <button className="px-4 py-2 text-sm font-bold text-[var(--text)] hover:text-[var(--cta-dark)] transition-colors cursor-pointer">
                  Log In
                </button>
              </Link>
              <Link href="/student/dashboard">
                <button className="btn-primary text-sm py-2 px-5">
                  Start Free
                </button>
              </Link>
            </div>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden w-10 h-10 rounded-xl bg-[var(--secondary)] border-3 border-[var(--text)] flex items-center justify-center cursor-pointer shadow-[2px_2px_0_var(--text)]"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5 text-[var(--text)]" />
              ) : (
                <Menu className="w-5 h-5 text-[var(--text)]" />
              )}
            </button>
          </div>

          {/* Mobile dropdown */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 pt-4 border-t-3 border-[var(--border)] flex flex-col gap-3">
              <a
                href="#courses"
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-bold py-1 text-[var(--text)]"
              >
                Courses
              </a>
              <a
                href="#demo"
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-bold py-1 text-[var(--text)]"
              >
                Live Progress
              </a>
              <a
                href="#features"
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-bold py-1 text-[var(--text)]"
              >
                Features
              </a>
              <a
                href="#portals"
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-bold py-1 text-[var(--text)]"
              >
                Role Portals
              </a>
              <div className="flex gap-2 pt-2">
                <Link href="/login" className="flex-1">
                  <button className="btn-secondary w-full text-xs py-2">
                    Log In
                  </button>
                </Link>
                <Link href="/student/dashboard" className="flex-1">
                  <button className="btn-primary w-full text-xs py-2">
                    Start Free
                  </button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* 2. Hero Section with Live Preview Float */}
      <section className="pt-28 sm:pt-36 pb-12 sm:pb-20 px-4 bg-[var(--bg-cream)] overflow-hidden relative">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-10 sm:gap-14 items-center">
            {/* Left Content Column */}
            <div className="text-center lg:text-left">
              {/* Announcement Pill */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--accent-mint)] border-3 border-[var(--text)] text-sm font-bold mb-6 shadow-[3px_3px_0_var(--text)]">
                <span className="w-2.5 h-2.5 rounded-full bg-[var(--cta)] animate-ping" />
                <span className="w-2.5 h-2.5 rounded-full bg-[var(--cta)] -ml-4.5" />
                <span>New: AI-Powered Learning Hub</span>
              </div>

              {/* Display Headline */}
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold font-display text-[var(--text)] mb-6 leading-[1.12]">
                Learn Anything,<br />
                <span className="text-[var(--cta)] underline decoration-wavy decoration-[var(--primary)]">
                  Anytime
                </span>
                ,<br />
                Anywhere!
              </h1>

              {/* Subtitle */}
              <p className="text-lg sm:text-xl text-[var(--text-muted)] mb-8 max-w-lg mx-auto lg:mx-0 leading-relaxed font-semibold">
                Join millions of learners worldwide. Access 10,000+ interactive courses, smart attendance tracking, and real-time academic AI assistance.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-10">
                <Link href="/student/dashboard">
                  <button className="btn-primary text-base py-3 px-7">
                    Start Learning Free
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </button>
                </Link>
                <a href="#courses">
                  <button className="btn-secondary text-base py-3 px-7">
                    Browse Courses
                  </button>
                </a>
              </div>

              {/* Social Proof Metric Strip */}
              <div className="flex gap-8 sm:gap-12 justify-center lg:justify-start">
                <div className="text-center lg:text-left">
                  <div className="text-3xl font-bold font-display text-[var(--text)]">
                    10K+
                  </div>
                  <div className="text-sm font-bold text-[var(--text-muted)]">
                    Courses
                  </div>
                </div>
                <div className="text-center lg:text-left">
                  <div className="text-3xl font-bold font-display text-[var(--text)]">
                    2M+
                  </div>
                  <div className="text-sm font-bold text-[var(--text-muted)]">
                    Students
                  </div>
                </div>
                <div className="text-center lg:text-left">
                  <div className="text-3xl font-bold font-display text-[var(--text)]">
                    500+
                  </div>
                  <div className="text-sm font-bold text-[var(--text-muted)]">
                    Instructors
                  </div>
                </div>
              </div>
            </div>

            {/* Right Live Preview Card Component */}
            <div className="relative mx-auto w-full max-w-md lg:max-w-none">
              {/* Main Clay Card */}
              <div className="clay-card p-6 sm:p-7 bg-white relative z-10 shadow-[8px_8px_0_var(--text)]">
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-14 h-14 rounded-2xl bg-[var(--secondary)] border-3 border-[var(--text)] flex items-center justify-center shadow-[2px_2px_0_var(--text)]">
                    <Code className="w-7 h-7 text-[var(--text)]" />
                  </div>
                  <div>
                    <div className="font-bold font-display text-lg text-[var(--text)]">
                      Web Development Bootcamp
                    </div>
                    <div className="text-xs font-bold text-[var(--text-muted)]">
                      12 lessons • 4h 30m remaining
                    </div>
                  </div>
                </div>

                {/* Progress Bar Widget */}
                <div className="mb-6 p-4 rounded-2xl bg-[var(--bg-cream)] border-2 border-[var(--text)]">
                  <div className="flex justify-between text-sm mb-2 font-bold font-display">
                    <span className="text-[var(--text-muted)]">Course Completion</span>
                    <span className="text-[var(--cta)]">65%</span>
                  </div>
                  <div className="h-3.5 bg-[var(--border)] rounded-full border-2 border-[var(--text)] overflow-hidden p-[2px]">
                    <div className="h-full w-[65%] bg-[var(--cta)] rounded-full transition-all duration-500" />
                  </div>
                </div>

                {/* Live Stats Row */}
                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="p-3 rounded-xl bg-[var(--accent-mint)]/40 border-2 border-[var(--text)]">
                    <div className="text-[11px] font-bold text-[var(--text-muted)]">
                      Current Module
                    </div>
                    <div className="text-xs font-bold text-[var(--text)] truncate">
                      Async State & APIs
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-[var(--accent-purple)]/50 border-2 border-[var(--text)]">
                    <div className="text-[11px] font-bold text-[var(--text-muted)]">
                      Next Quiz
                    </div>
                    <div className="text-xs font-bold text-[var(--text)]">
                      Full Score (100%)
                    </div>
                  </div>
                </div>

                <Link href="/student/dashboard" className="block w-full">
                  <button className="w-full btn-primary text-sm py-3.5">
                    Continue Learning
                    <Play className="w-4 h-4 ml-2 fill-current" />
                  </button>
                </Link>
              </div>

              {/* Floating Decorative Badges */}
              <div className="absolute -top-5 -right-5 z-20 w-20 h-20 rounded-2xl bg-[var(--primary)] border-3 border-[var(--text)] flex items-center justify-center shadow-[4px_4px_0_var(--text)] animate-bounce duration-1000">
                <span className="text-3xl select-none">🎯</span>
              </div>
              <div className="absolute -bottom-5 -left-5 z-20 w-16 h-16 rounded-2xl bg-[var(--accent-purple)] border-3 border-[var(--text)] flex items-center justify-center shadow-[4px_4px_0_var(--text)]">
                <span className="text-2xl select-none">📚</span>
              </div>
              <div className="absolute top-1/2 -right-8 z-20 w-14 h-14 rounded-full bg-[var(--accent-mint)] border-3 border-[var(--text)] flex items-center justify-center shadow-[4px_4px_0_var(--text)]">
                <span className="text-xl select-none">⭐</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Course Catalog Preview Grid Section */}
      <section id="courses" className="py-14 sm:py-24 px-4 bg-white border-y-3 border-[var(--text)]">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-10 sm:mb-14">
            <span className="inline-block px-5 py-2 rounded-full bg-[var(--secondary)] border-3 border-[var(--text)] text-sm font-bold font-display mb-4 shadow-[3px_3px_0_var(--text)]">
              Popular Courses
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold font-display text-[var(--text)] mb-4">
              Explore Top-Rated Courses
            </h2>
            <p className="text-lg text-[var(--text-muted)] max-w-2xl mx-auto font-semibold">
              Learn from industry experts and university faculty to gain real-world practical skills.
            </p>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center justify-center gap-2.5 mt-8">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold border-2 border-[var(--text)] transition-all cursor-pointer ${
                    selectedCategory === category
                      ? "bg-[var(--cta)] text-white shadow-[2px_2px_0_var(--text)]"
                      : "bg-[var(--bg-cream)] text-[var(--text)] hover:bg-[var(--secondary)]"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Course Cards Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => {
              const Icon = course.icon;
              return (
                <div
                  key={course.id}
                  className="clay-card p-6 cursor-pointer bg-white flex flex-col justify-between group hover:scale-[1.01]"
                >
                  <div>
                    {/* Top Row: Icon + Star Rating */}
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div
                        className={`w-14 h-14 rounded-2xl border-3 border-[var(--text)] flex items-center justify-center flex-shrink-0 shadow-[2px_2px_0_var(--text)] ${course.bgClass}`}
                      >
                        <Icon className="w-7 h-7 text-[var(--text)]" />
                      </div>
                      <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-[var(--cta)]/10 border-2 border-[var(--cta)] shadow-[1px_1px_0_var(--cta)]">
                        <Star className="w-4 h-4 text-[var(--cta)] fill-[var(--cta)]" />
                        <span className="text-sm font-bold font-display text-[var(--cta-dark)]">
                          {course.rating}
                        </span>
                      </div>
                    </div>

                    {/* Course Title & Author */}
                    <h3 className="font-bold font-display text-xl text-[var(--text)] mb-1 group-hover:text-[var(--cta-dark)] transition-colors">
                      {course.title}
                    </h3>
                    <p className="text-xs font-bold text-[var(--text-muted)] mb-4">
                      by {course.instructor}
                    </p>
                  </div>

                  {/* Metadata Tokens Row */}
                  <div className="pt-4 border-t-2 border-[var(--border)]">
                    <div className="flex flex-wrap items-center justify-between text-xs font-bold text-[var(--text-muted)] gap-2">
                      <span className="flex items-center gap-1.5">
                        <BookOpen className="w-4 h-4 text-[var(--text)]" />
                        {course.lessons} lessons
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-[var(--text)]" />
                        {course.duration}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-[var(--text)]" />
                        {course.students}
                      </span>
                    </div>

                    <Link href="/student/dashboard" className="block mt-4">
                      <button className="w-full btn-secondary text-xs py-2.5">
                        View Course Details
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
                View All 10,000+ Courses
                <ArrowRight className="w-5 h-5 ml-2" />
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* 4. Interactive Live Progress Tracking Demo */}
      <section id="demo" className="py-14 sm:py-24 px-4 bg-[var(--bg-cream)]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <span className="inline-block px-5 py-2 rounded-full bg-[var(--accent-purple)] border-3 border-[var(--text)] text-sm font-bold font-display mb-4 shadow-[3px_3px_0_var(--text)]">
              Interactive College OS Demo
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold font-display text-[var(--text)] mb-4">
              Real-Time Academic Progress Tracking
            </h2>
            <p className="text-lg text-[var(--text-muted)] max-w-2xl mx-auto font-semibold">
              Live tracking for attendance, assignment rubrics, placement eligibility, and smart AI Copilot advisories.
            </p>

            {/* Demo Tabs */}
            <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
              {[
                { id: "attendance", label: "Safe Bunk & Attendance", icon: CalendarCheck2 },
                { id: "assignments", label: "Smart Assignments", icon: BookOpen },
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
                        : "bg-white text-[var(--text)] shadow-[4px_4px_0_var(--text)] hover:bg-[var(--secondary)]"
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
          <div className="clay-card p-6 sm:p-8 md:p-10 bg-white max-w-4xl mx-auto shadow-[8px_8px_0_var(--text)]">
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
                    <strong>College AI Advice:</strong> Attending Monday&apos;s 10:00 AM lecture and Wednesday&apos;s lab will lift your DBMS attendance to <strong>75.5%</strong>, ensuring full mid-term eligibility.
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
                  <div className="p-4 rounded-2xl bg-white border-3 border-[var(--text)] shadow-[3px_3px_0_var(--text)]">
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
                        No formatting syntax errors detected.
                      </div>
                    </div>
                    <button className="btn-primary text-xs py-2 w-full mt-4">
                      Submit Assignment
                    </button>
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
                      TCS Prime & Google Summer Placement Drive
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
                      Package Tier
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
                      Grounded in university regulations, course curriculum & hostel notices
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="p-3.5 rounded-2xl bg-[var(--secondary)]/30 border-2 border-[var(--text)] text-xs font-bold text-[var(--text)]">
                    👤 <em>&quot;Can I get medical leave compensation for last Friday&apos;s OS lab?&quot;</em>
                  </div>
                  <div className="p-4 rounded-2xl bg-white border-3 border-[var(--text)] text-xs font-semibold text-[var(--text)] leading-relaxed shadow-[3px_3px_0_var(--text)]">
                    🤖 <strong>AI Copilot:</strong> Yes! Under Apex Academic Regulation §4.2, submit your hospital medical certificate to the HOD office within <strong>7 days</strong>. I have already filled out the preliminary grievance request ticket for you!
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 5. Why Choose Us / Value Proposition Features Grid */}
      <section id="features" className="py-14 sm:py-24 px-4 bg-[var(--bg-cream)] border-t-3 border-[var(--text)]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <span className="inline-block px-5 py-2 rounded-full bg-[var(--primary)] border-3 border-[var(--text)] text-sm font-bold font-display mb-4 shadow-[3px_3px_0_var(--text)]">
              Why Choose Us
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold font-display text-[var(--text)] mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-lg text-[var(--text-muted)] max-w-2xl mx-auto font-semibold">
              Built from the ground up to give college students and faculty an enjoyable, structured, high-clarity academic hub.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1 */}
            <div className="soft-clay p-7 text-center cursor-pointer hover:scale-105 transition-transform bg-white">
              <div className="w-16 h-16 rounded-2xl border-3 border-[var(--text)] flex items-center justify-center mx-auto mb-5 bg-[var(--primary)] shadow-[3px_3px_0_var(--text)]">
                <Clock className="w-8 h-8 text-[var(--text)]" />
              </div>
              <h3 className="font-bold font-display text-xl text-[var(--text)] mb-2">
                Learn at Your Pace
              </h3>
              <p className="text-sm font-semibold text-[var(--text-muted)] leading-relaxed">
                Access courses anytime, anywhere. Pause, rewind, and replay lessons and lab demonstrations as needed.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="soft-clay p-7 text-center cursor-pointer hover:scale-105 transition-transform bg-white">
              <div className="w-16 h-16 rounded-2xl border-3 border-[var(--text)] flex items-center justify-center mx-auto mb-5 bg-[var(--secondary)] shadow-[3px_3px_0_var(--text)]">
                <Briefcase className="w-8 h-8 text-[var(--text)]" />
              </div>
              <h3 className="font-bold font-display text-xl text-[var(--text)] mb-2">
                Expert Instructors
              </h3>
              <p className="text-sm font-semibold text-[var(--text-muted)] leading-relaxed">
                Learn from university professors and industry engineers with decades of real-world production experience.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="soft-clay p-7 text-center cursor-pointer hover:scale-105 transition-transform bg-white">
              <div className="w-16 h-16 rounded-2xl border-3 border-[var(--text)] flex items-center justify-center mx-auto mb-5 bg-[var(--accent-purple)] shadow-[3px_3px_0_var(--text)]">
                <Award className="w-8 h-8 text-[var(--text)]" />
              </div>
              <h3 className="font-bold font-display text-xl text-[var(--text)] mb-2">
                Recognized Certificates
              </h3>
              <p className="text-sm font-semibold text-[var(--text-muted)] leading-relaxed">
                Earn university-accredited certifications and digital badges that bolster your resume and LinkedIn profile.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="soft-clay p-7 text-center cursor-pointer hover:scale-105 transition-transform bg-white">
              <div className="w-16 h-16 rounded-2xl border-3 border-[var(--text)] flex items-center justify-center mx-auto mb-5 bg-[var(--accent-mint)] shadow-[3px_3px_0_var(--text)]">
                <Users className="w-8 h-8 text-[var(--text)]" />
              </div>
              <h3 className="font-bold font-display text-xl text-[var(--text)] mb-2">
                Community Support
              </h3>
              <p className="text-sm font-semibold text-[var(--text-muted)] leading-relaxed">
                Join active study rooms, chat with peers, ask questions, and share notes with thousands of fellow students.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Role Portals Exploration Section */}
      <section id="portals" className="py-14 sm:py-24 px-4 bg-white border-t-3 border-[var(--text)]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <span className="inline-block px-5 py-2 rounded-full bg-[var(--secondary)] border-3 border-[var(--text)] text-sm font-bold font-display mb-4 shadow-[3px_3px_0_var(--text)]">
              Integrated Campus Ecosystem
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold font-display text-[var(--text)] mb-4">
              Explore Institutional Portals
            </h2>
            <p className="text-lg text-[var(--text-muted)] max-w-2xl mx-auto font-semibold">
              Seamlessly tailored interfaces for students, faculty, department heads, and campus administration.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Student */}
            <div className="clay-card p-6 bg-white flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-[var(--accent-mint)] border-3 border-[var(--text)] flex items-center justify-center mb-4 shadow-[2px_2px_0_var(--text)]">
                  <GraduationCap className="w-6 h-6 text-[var(--text)]" />
                </div>
                <h3 className="font-bold font-display text-xl text-[var(--text)] mb-1">
                  Student Portal
                </h3>
                <p className="text-xs font-semibold text-[var(--text-muted)] leading-relaxed mb-4">
                  Track attendance, exam halls, calculate safe bunks, submit assignments, and prepare for placement rounds.
                </p>
              </div>
              <Link href="/student/dashboard">
                <button className="btn-primary w-full text-xs py-2.5">
                  Launch Student Hub
                </button>
              </Link>
            </div>

            {/* Teacher */}
            <div className="clay-card p-6 bg-white flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-[var(--primary)] border-3 border-[var(--text)] flex items-center justify-center mb-4 shadow-[2px_2px_0_var(--text)]">
                  <Users className="w-6 h-6 text-[var(--text)]" />
                </div>
                <h3 className="font-bold font-display text-xl text-[var(--text)] mb-1">
                  Teacher Portal
                </h3>
                <p className="text-xs font-semibold text-[var(--text-muted)] leading-relaxed mb-4">
                  1-click class attendance, rubric generation, grading pipelines, and broadcast alerts to your course batches.
                </p>
              </div>
              <Link href="/teacher/dashboard">
                <button className="btn-peach w-full text-xs py-2.5">
                  Launch Faculty Hub
                </button>
              </Link>
            </div>

            {/* HOD */}
            <div className="clay-card p-6 bg-white flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-[var(--accent-purple)] border-3 border-[var(--text)] flex items-center justify-center mb-4 shadow-[2px_2px_0_var(--text)]">
                  <TrendingUp className="w-6 h-6 text-[var(--text)]" />
                </div>
                <h3 className="font-bold font-display text-xl text-[var(--text)] mb-1">
                  HOD Operations
                </h3>
                <p className="text-xs font-semibold text-[var(--text-muted)] leading-relaxed mb-4">
                  Department intelligence, teacher workload balancing, grievance tickets triage, and course pass-rates.
                </p>
              </div>
              <Link href="/hod/dashboard">
                <button className="btn-purple w-full text-xs py-2.5">
                  Launch HOD Desk
                </button>
              </Link>
            </div>

            {/* Admin */}
            <div className="clay-card p-6 bg-white flex flex-col justify-between">
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

      {/* 7. Social Proof & Student Testimonials Section */}
      <section id="testimonials" className="py-14 sm:py-24 px-4 bg-[var(--bg-cream)] border-t-3 border-[var(--text)]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <span className="inline-block px-5 py-2 rounded-full bg-[var(--accent-mint)] border-3 border-[var(--text)] text-sm font-bold font-display mb-4 shadow-[3px_3px_0_var(--text)]">
              Student Stories
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold font-display text-[var(--text)] mb-4">
              What Our Students Say
            </h2>
            <p className="text-lg text-[var(--text-muted)] max-w-2xl mx-auto font-semibold">
              Read how LearnHub & College OS transformed everyday campus life for over 2 million learners.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Review 1 */}
            <div className="clay-card p-7 bg-white flex flex-col justify-between">
              <div>
                <div className="flex gap-1.5 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-5 h-5 text-amber-400 fill-amber-400"
                    />
                  ))}
                </div>
                <p className="text-sm font-semibold text-[var(--text-muted)] mb-6 leading-relaxed">
                  &quot;LearnHub helped me transition from traditional marketing to full-stack tech. The courses are structured like real engineering projects and the peer community is incredibly supportive!&quot;
                </p>
              </div>
              <div className="flex items-center gap-3.5 pt-4 border-t-2 border-[var(--border)]">
                <div className="w-12 h-12 rounded-xl border-3 border-[var(--text)] bg-[var(--primary)] flex items-center justify-center text-lg font-bold font-display shadow-[2px_2px_0_var(--text)]">
                  J
                </div>
                <div>
                  <div className="font-bold font-display text-base text-[var(--text)]">
                    Jessica Wang
                  </div>
                  <div className="text-xs font-bold text-[var(--text-muted)]">
                    Software Developer @ Stripe
                  </div>
                </div>
              </div>
            </div>

            {/* Review 2 */}
            <div className="clay-card p-7 bg-white flex flex-col justify-between">
              <div>
                <div className="flex gap-1.5 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-5 h-5 text-amber-400 fill-amber-400"
                    />
                  ))}
                </div>
                <p className="text-sm font-semibold text-[var(--text-muted)] mb-6 leading-relaxed">
                  &quot;The UI/UX design tracks were exactly what I needed. The claymorphism principles, tactile design systems, and Figma prototypes landed me my dream job just 3 months after completion!&quot;
                </p>
              </div>
              <div className="flex items-center gap-3.5 pt-4 border-t-2 border-[var(--border)]">
                <div className="w-12 h-12 rounded-xl border-3 border-[var(--text)] bg-[var(--secondary)] flex items-center justify-center text-lg font-bold font-display shadow-[2px_2px_0_var(--text)]">
                  D
                </div>
                <div>
                  <div className="font-bold font-display text-base text-[var(--text)]">
                    David Miller
                  </div>
                  <div className="text-xs font-bold text-[var(--text-muted)]">
                    UX Designer @ Figma Labs
                  </div>
                </div>
              </div>
            </div>

            {/* Review 3 */}
            <div className="clay-card p-7 bg-white flex flex-col justify-between">
              <div>
                <div className="flex gap-1.5 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-5 h-5 text-amber-400 fill-amber-400"
                    />
                  ))}
                </div>
                <p className="text-sm font-semibold text-[var(--text-muted)] mb-6 leading-relaxed">
                  &quot;The absolute best investment I&apos;ve made in my career. The Python & AI course gave me practical data pipeline skills that I rely upon every single day in production.&quot;
                </p>
              </div>
              <div className="flex items-center gap-3.5 pt-4 border-t-2 border-[var(--border)]">
                <div className="w-12 h-12 rounded-xl border-3 border-[var(--text)] bg-[var(--accent-purple)] flex items-center justify-center text-lg font-bold font-display shadow-[2px_2px_0_var(--text)]">
                  M
                </div>
                <div>
                  <div className="font-bold font-display text-base text-[var(--text)]">
                    Maria Garcia
                  </div>
                  <div className="text-xs font-bold text-[var(--text-muted)]">
                    Senior Data Analyst @ Spotify
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. High-Conversion Enrollment Call-to-Action (CTA) */}
      <section className="py-14 sm:py-24 px-4 bg-[var(--secondary)] border-y-3 border-[var(--text)]">
        <div className="max-w-4xl mx-auto text-center">
          <div className="clay-card p-8 sm:p-14 bg-white shadow-[8px_8px_0_var(--text)]">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold font-display text-[var(--text)] mb-4">
              Ready to Start Learning?
            </h2>
            <p className="text-lg text-[var(--text-muted)] mb-8 max-w-xl mx-auto font-semibold">
              Join over 2 million students and start your learning journey today. First 7 days are completely free!
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link href="/student/dashboard">
                <button className="btn-primary text-base px-8 py-3.5">
                  Start Free Trial
                  <ArrowRight className="w-5 h-5 ml-2" />
                </button>
              </Link>
              <Link href="/login">
                <button className="btn-secondary text-base px-8 py-3.5">
                  Explore Role Portals
                </button>
              </Link>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 text-sm font-bold text-[var(--text-muted)]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[var(--cta)]" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[var(--cta)]" />
                <span>Cancel anytime</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[var(--cta)]" />
                <span>Instant campus access</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 9. Comprehensive Playful Footer */}
      <footer className="py-12 sm:py-16 px-4 bg-[var(--bg-cream)]">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-10 sm:gap-12 mb-12">
            {/* Brand column */}
            <div className="lg:col-span-2">
              <Link href="/" className="flex items-center gap-2.5 mb-4 cursor-pointer">
                <div className="w-10 h-10 rounded-xl bg-[var(--primary)] border-3 border-[var(--text)] flex items-center justify-center shadow-[2px_2px_0_var(--text)]">
                  <BookOpen className="w-5 h-5 text-[var(--text)]" />
                </div>
                <span className="text-xl font-bold font-display text-[var(--text)]">
                  LearnHub
                </span>
              </Link>
              <p className="text-sm font-semibold text-[var(--text-muted)] mb-6 max-w-xs leading-relaxed">
                Empowering millions of learners and college campuses worldwide with approachable, high-quality, and AI-grounded educational software.
              </p>

              {/* Social Icon Pills */}
              <div className="flex gap-3">
                {["X", "FB", "IG", "YT"].map((social) => (
                  <button
                    key={social}
                    className="w-10 h-10 rounded-xl bg-white border-3 border-[var(--text)] flex items-center justify-center font-bold text-xs shadow-[2px_2px_0_var(--text)] hover:bg-[var(--secondary)] transition-colors cursor-pointer"
                  >
                    {social}
                  </button>
                ))}
              </div>
            </div>

            {/* Links 1: Courses */}
            <div>
              <h4 className="font-bold font-display text-base text-[var(--text)] mb-4">
                Courses
              </h4>
              <ul className="space-y-2.5 text-sm font-semibold text-[var(--text-muted)]">
                <li>
                  <a href="#courses" className="hover:text-[var(--text)] transition-colors">
                    Web Development
                  </a>
                </li>
                <li>
                  <a href="#courses" className="hover:text-[var(--text)] transition-colors">
                    UI/UX Design
                  </a>
                </li>
                <li>
                  <a href="#courses" className="hover:text-[var(--text)] transition-colors">
                    Data Science & AI
                  </a>
                </li>
                <li>
                  <a href="#courses" className="hover:text-[var(--text)] transition-colors">
                    Mobile Applications
                  </a>
                </li>
                <li>
                  <a href="#courses" className="hover:text-[var(--text)] transition-colors">
                    Cloud & DevOps
                  </a>
                </li>
              </ul>
            </div>

            {/* Links 2: Portals */}
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
                    HOD Desk
                  </Link>
                </li>
                <li>
                  <Link href="/admin/dashboard" className="hover:text-[var(--text)] transition-colors">
                    Admin Operations
                  </Link>
                </li>
                <li>
                  <Link href="/student/attendance" className="hover:text-[var(--text)] transition-colors">
                    Attendance Tracker
                  </Link>
                </li>
              </ul>
            </div>

            {/* Links 3: Company */}
            <div>
              <h4 className="font-bold font-display text-base text-[var(--text)] mb-4">
                Company
              </h4>
              <ul className="space-y-2.5 text-sm font-semibold text-[var(--text-muted)]">
                <li>
                  <a href="#" className="hover:text-[var(--text)] transition-colors">
                    About Us
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-[var(--text)] transition-colors">
                    Careers (We&apos;re hiring!)
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-[var(--text)] transition-colors">
                    Campus Partnerships
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-[var(--text)] transition-colors">
                    Security & Privacy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-[var(--text)] transition-colors">
                    Contact Support
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Copyright Row */}
          <div className="pt-8 border-t-3 border-[var(--border)] flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm font-bold text-[var(--text-muted)]">
              © 2026 LearnHub / College OS. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-sm font-bold text-[var(--text-muted)]">
              <a href="#" className="hover:text-[var(--text)] transition-colors cursor-pointer">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-[var(--text)] transition-colors cursor-pointer">
                Terms of Service
              </a>
              <a href="#" className="hover:text-[var(--text)] transition-colors cursor-pointer">
                Cookie Settings
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
