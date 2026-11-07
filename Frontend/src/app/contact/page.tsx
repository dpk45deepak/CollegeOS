"use client";

import React from "react";
import Link from "next/link";
import { GraduationCap, ArrowLeft, MapPin, Phone, Mail, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ContactPage() {
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
            Contact & Campus Coordinates
          </h1>
          <p className="text-base text-muted-foreground leading-relaxed">
            Reach out to our registrar, admissions desk, or student welfare offices.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl border border-border bg-card space-y-4">
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-brand-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm text-foreground">Campus Address</h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Bhupani-Lalpur Road, Faridabad, Haryana 121002, India
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Phone className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm text-foreground">Phone Helpline</h4>
                <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                  +91 (0129) 2201088, +91 9205574510
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-purple-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm text-foreground">Official Communications</h4>
                <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                  info@satyug.edu.in, registrar@satyug.edu.in
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm text-foreground">Administrative Working Hours</h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Monday – Saturday: 9:00 AM – 4:30 PM (Closed on Gazetted Holidays)
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl border border-border bg-card space-y-3">
            <h3 className="font-bold text-base text-foreground">Send an Inquiry</h3>
            <p className="text-xs text-muted-foreground">
              For admissions, corporate training partnerships, or academic inquiries, our helpdesk responds within 1 business day.
            </p>
            <div className="pt-2">
              <Link href="/login">
                <Button size="sm" className="w-full text-xs">
                  Login to College OS Portal
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

