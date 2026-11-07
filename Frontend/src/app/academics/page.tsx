"use client";

import React from "react";
import Link from "next/link";
import { GraduationCap, ArrowLeft, BookOpen, Layers, Award } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AcademicsPublicPage() {
  const programs = [
    { name: "Computer Science & Engineering", degree: "B.Tech (4 Years)", seats: 120, spec: "AI & ML, Cloud, Full-Stack" },
    { name: "Electronics & Communication", degree: "B.Tech (4 Years)", seats: 60, spec: "VLSI, Embedded Systems, IoT" },
    { name: "Mechanical Engineering", degree: "B.Tech (4 Years)", seats: 60, spec: "Robotics, Automation, CAD/CAM" },
    { name: "Civil Engineering", degree: "B.Tech (4 Years)", seats: 30, spec: "Structural Engineering, Smart Cities" },
    { name: "Master of Business Administration", degree: "MBA (2 Years)", seats: 60, spec: "Finance, Marketing, Analytics" },
    { name: "Bachelor of Business Administration", degree: "BBA (3 Years)", seats: 60, spec: "Management & Entrepreneurship" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-extrabold text-base tracking-tight text-foreground">
            <GraduationCap className="h-6 w-6 text-brand-600" />
            <span>Satyug Darshan Institute</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button size="sm" variant="outline" className="text-xs">ERP Portal Login</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-16 space-y-12">
        <div className="space-y-4">
          <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Home
          </Link>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Academic Programs & Departments
          </h1>
          <p className="text-base text-muted-foreground leading-relaxed">
            Rigorous undergraduate and postgraduate degree curricula affiliated to J.C. Bose UST, YMCA and accredited under National Board of Accreditation guidelines.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {programs.map((p, idx) => (
            <div key={idx} className="p-6 rounded-2xl border border-border bg-card space-y-3 hover:border-brand-500/50 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950 px-2 py-0.5 rounded">
                  {p.degree}
                </span>
                <span className="text-xs text-muted-foreground">{p.seats} Seats</span>
              </div>
              <h3 className="text-base font-bold text-foreground">{p.name}</h3>
              <p className="text-xs text-muted-foreground">
                Specializations: <strong>{p.spec}</strong>
              </p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

