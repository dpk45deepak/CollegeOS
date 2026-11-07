"use client";

import React from "react";
import Link from "next/link";
import { GraduationCap, ArrowLeft, CheckCircle2, Calendar, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdmissionsPage() {
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
            Admissions & Counseling 2026–2027
          </h1>
          <p className="text-base text-muted-foreground leading-relaxed">
            Transparent merit-based admission guidelines for B.Tech, MBA, and BBA programs.
          </p>
        </div>

        <div className="space-y-6">
          <div className="p-6 rounded-2xl border border-border bg-card space-y-3">
            <h3 className="font-bold text-base text-foreground">Eligibility Criteria for B.Tech</h3>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Passed 10+2 examination with Physics and Mathematics as compulsory subjects along with Chemistry / Biotechnology / Biology / Computer Science.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Minimum 45% marks (40% in case of candidates belonging to reserved category) in the above subjects taken together.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Valid JEE Main rank card for centralized Haryana State Technical Education Society (HSTES) counseling.</span>
              </li>
            </ul>
          </div>

          <div className="p-6 rounded-2xl border border-border bg-card space-y-3">
            <h3 className="font-bold text-base text-foreground">Scholarship & Fee Concession Quotas</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Merit scholarships are automatically awarded to candidates scoring &gt;85% in 10+2 examinations. State government Post-Matric and merit-cum-means financial assistance schemes are fully supported.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

