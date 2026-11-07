"use client";

import React from "react";
import Link from "next/link";
import { GraduationCap, ShieldCheck, Award, ArrowLeft, ArrowRight, Building2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top Navigation */}
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
            About Satyug Darshan Institute of Engineering & Technology
          </h1>
          <p className="text-base text-muted-foreground leading-relaxed">
            Approved by AICTE, New Delhi, affiliated to J.C. Bose University of Science and Technology, YMCA, Faridabad, and accredited by NAAC.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl border border-border bg-card space-y-2">
            <ShieldCheck className="h-8 w-8 text-brand-600 mb-2" />
            <h3 className="font-bold text-base">Academic Excellence</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Outcome-Based Education (OBE) curriculum designed with industry leadership to ensure graduate employability.
            </p>
          </div>
          <div className="p-6 rounded-2xl border border-border bg-card space-y-2">
            <Award className="h-8 w-8 text-emerald-600 mb-2" />
            <h3 className="font-bold text-base">NAAC Accredited</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Recognized for high-standard academic facilities, advanced laboratories, research centers, and qualified faculty.
            </p>
          </div>
          <div className="p-6 rounded-2xl border border-border bg-card space-y-2">
            <Users className="h-8 w-8 text-purple-600 mb-2" />
            <h3 className="font-bold text-base">Global Alumni Network</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Graduates successfully placed in leading Fortune 500 multinationals and premier research institutions worldwide.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-muted/20 p-8 space-y-4">
          <h2 className="text-xl font-bold">Our Vision & Mission</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            To emerge as a premier center of technical education and ethical learning, fostering innovation, scientific temper, and human values. We are committed to developing holistic engineering professionals equipped with cutting-edge analytical tools and ethical responsibility.
          </p>
        </div>
      </main>
    </div>
  );
}

