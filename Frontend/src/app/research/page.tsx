"use client";

import React from "react";
import Link from "next/link";
import { GraduationCap, ArrowLeft, Cpu, Globe, BookOpen, Award } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ResearchPage() {
  const centers = [
    { title: "Center for Artificial Intelligence & Data Science", focus: "Applied Machine Learning, Computer Vision, Edge Computing" },
    { title: "Advanced Robotics & Automation Cell", focus: "Industrial Mechatronics, Autonomous Guided Vehicles" },
    { title: "Renewable Energy & Smart Grid Laboratory", focus: "Solar Photovoltaic Optimization, Microgrid Management" },
    { title: "Material Testing & Structural Mechanics", focus: "Concrete Technology, Non-destructive Evaluation" },
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

      <main className="max-w-4xl mx-auto px-4 py-16 space-y-12">
        <div className="space-y-4">
          <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Home
          </Link>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Research & Innovation Centers
          </h1>
          <p className="text-base text-muted-foreground leading-relaxed">
            Interdisciplinary research initiatives, patent filings, and industry-sponsored laboratory centers of excellence.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {centers.map((c, i) => (
            <div key={i} className="p-6 rounded-2xl border border-border bg-card space-y-2 hover:border-brand-500/50 transition-colors">
              <Cpu className="h-6 w-6 text-brand-600 mb-1" />
              <h3 className="font-bold text-sm text-foreground">{c.title}</h3>
              <p className="text-xs text-muted-foreground">Focus Areas: {c.focus}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

