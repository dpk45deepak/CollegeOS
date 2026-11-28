"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { specialistApi } from "@/lib/api/specialist";
import { apiClient } from "@/lib/api/client";
import { feesApi } from "@/services/api/fees.api";
import { useAIStore } from "@/stores/useAIStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Users,
  CalendarCheck2,
  CreditCard,
  Award,
  Clock,
  Receipt,
  MessageSquare,
  FileText,
  GraduationCap,
} from "lucide-react";

export default function ParentDashboardPage() {
  const qc = useQueryClient();
  const { setSelectedStudentId } = useAIStore();
  const [selectedWardId, setSelectedWardId] = useState<string>("");
  const [receiptData, setReceiptData] = useState<any | null>(null);
  const [loadingReceiptId, setLoadingReceiptId] = useState<string | null>(null);
  const [selectedGateway, setSelectedGateway] = useState<"mock" | "razorpay" | "stripe">(
    (process.env.NEXT_PUBLIC_PAYMENT_GATEWAY as "mock" | "razorpay" | "stripe") || "mock"
  );
  const [pendingPayOrder, setPendingPayOrder] = useState<{
    paymentId: string;
    amount: number;
    feeName: string;
    gateway: string;
    gatewayRef?: string;
    checkoutUrl?: string;
    clientPayload?: Record<string, unknown>;
  } | null>(null);

  const startPayMutation = useMutation({
    mutationFn: async (fee: { id: string; amount: number; name: string }) => {
      const order = await feesApi.startPayment(fee.id, { gateway: selectedGateway, amount: fee.amount });
      return { ...order, amount: fee.amount, feeName: fee.name, gateway: selectedGateway };
    },
    onSuccess: (order) => {
      setPendingPayOrder({
        paymentId: order.paymentId,
        amount: order.amount,
        feeName: order.feeName,
        gateway: order.gateway,
        gatewayRef: order.gatewayRef,
        checkoutUrl: order.checkoutUrl,
        clientPayload: order.clientPayload,
      });
    },
    onError: (err: any) => toast.error(err?.message || "Could not initiate ward fee payment"),
  });

  const settlePayMutation = useMutation({
    mutationFn: async ({ paymentId, success }: { paymentId: string; success: boolean }) =>
      specialistApi.completeMockPayment(paymentId, success),
    onSuccess: (res, vars) => {
      setPendingPayOrder(null);
      if (vars.success) {
        toast.success(`Payment settled! Receipt ${res?.receiptNo || ""} issued.`);
      } else {
        toast.info("Payment marked as failed.");
      }
      qc.invalidateQueries({ queryKey: ["ward-fees", selectedWardId] });
    },
    onError: (err: any) => toast.error(err?.message || "Payment settlement failed"),
  });

  const {
    data: wards = [],
    isLoading: wardsLoading,
    isError: wardsError,
    refetch: refetchWards,
  } = useQuery({
    queryKey: ["parent-wards"],
    queryFn: () => specialistApi.getParentWards(),
  });

  useEffect(() => {
    if (wards.length > 0 && !selectedWardId) {
      setSelectedWardId(wards[0].id);
    }
  }, [wards, selectedWardId]);

  useEffect(() => {
    setSelectedStudentId(selectedWardId || undefined);
  }, [selectedWardId, setSelectedStudentId]);

  const activeWard = wards.find((w) => w.id === selectedWardId) || wards[0];

  const { data: attendanceReport } = useQuery({
    queryKey: ["ward-attendance", activeWard?.id],
    queryFn: () => apiClient<any>("/students/me/attendance", { params: { studentId: activeWard!.id } }),
    enabled: !!activeWard?.id,
  });

  const { data: timetableSlots = [] } = useQuery({
    queryKey: ["ward-timetable", activeWard?.id],
    queryFn: () => apiClient<any[]>("/students/me/timetable", { params: { studentId: activeWard!.id } }),
    enabled: !!activeWard?.id,
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ["ward-assignments", activeWard?.id],
    queryFn: () => apiClient<any[]>("/students/me/assignments", { params: { studentId: activeWard!.id } }),
    enabled: !!activeWard?.id,
  });

  const { data: exams = [] } = useQuery({
    queryKey: ["ward-exams", activeWard?.id],
    queryFn: () => apiClient<any[]>("/students/me/exams", { params: { studentId: activeWard!.id } }),
    enabled: !!activeWard?.id,
  });

  const { data: results = [] } = useQuery({
    queryKey: ["ward-results", activeWard?.id],
    queryFn: () => apiClient<any[]>("/students/me/results", { params: { studentId: activeWard!.id } }),
    enabled: !!activeWard?.id,
  });

  const { data: fees = [] } = useQuery({
    queryKey: ["ward-fees", activeWard?.id],
    queryFn: () => apiClient<any[]>("/students/me/fees", { params: { studentId: activeWard!.id } }),
    enabled: !!activeWard?.id,
  });

  const { data: wardCalendar } = useQuery({
    queryKey: ["ward-attendance-calendar", activeWard?.id],
    queryFn: () => apiClient<any>("/students/me/attendance/calendar", { params: { studentId: activeWard!.id } }),
    enabled: !!activeWard?.id,
  });

  const handleOpenReceipt = async (paymentId: string) => {
    setLoadingReceiptId(paymentId);
    try {
      const data = await feesApi.getReceipt(paymentId);
      setReceiptData(data);
    } catch (err: any) {
      toast.error(err?.message || "Could not load fee receipt");
    } finally {
      setLoadingReceiptId(null);
    }
  };

  if (wardsLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (wardsError) {
    return <ErrorState title="Could Not Load Ward Information" onRetry={() => refetchWards()} />;
  }

  if (wards.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="No Linked Wards Found"
        description="Your guardian account does not have any linked student profiles yet. Contact college administration to link your ward."
      />
    );
  }

  const totalOutstanding = fees.reduce((acc: number, f: any) => acc + Number(f.outstanding ?? 0), 0);
  const overallPct = attendanceReport?.overall?.percentage ?? 0;
  const threshold = attendanceReport?.threshold ?? 75;
  const subjectAtt: any[] = attendanceReport?.subjects ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">
            Parent / Guardian Portal
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Monitor attendance, assignments, upcoming exams, published results, and fee receipts for your ward.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            aria-label="Select ward"
            value={activeWard?.id || ""}
            onChange={(e) => setSelectedWardId(e.target.value)}
            className="h-9 rounded-xl border border-border bg-card px-3 text-xs font-semibold"
          >
            {wards.map((w) => (
              <option key={w.id} value={w.id}>
                {w.user.firstName} {w.user.lastName} ({w.rollNumber})
              </option>
            ))}
          </select>
          <Link href="/student/complaints">
            <Button size="sm" variant="outline" className="gap-1.5 text-xs">
              <FileText className="h-3.5 w-3.5" /> Complaints &amp; Support
            </Button>
          </Link>
          <Link href="/messages">
            <Button size="sm" variant="outline" className="gap-1.5 text-xs">
              <MessageSquare className="h-3.5 w-3.5" /> Message Faculty
            </Button>
          </Link>
        </div>
      </div>

      {/* Ward Summary Banner */}
      {activeWard && (
        <Card>
          <CardContent className="pt-5 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold">
                {activeWard.user.firstName} {activeWard.user.lastName}
              </h2>
              <p className="text-xs text-muted-foreground">
                Roll: {activeWard.rollNumber} • {activeWard.program?.code || "Program"}{" "}
                {activeWard.department?.code || ""} •{" "}
                {activeWard.semester ? `Semester ${activeWard.semester.number}` : ""}{" "}
                {activeWard.section ? `• Section ${activeWard.section.name}` : ""}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">CGPA: {activeWard.cgpa ?? "N/A"}</Badge>
              <Badge variant={overallPct >= threshold ? "default" : "destructive"}>
                Attendance: {overallPct}%
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Overall Attendance</span>
              <CalendarCheck2 className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold mt-2">{overallPct}%</div>
            <p className="text-[11px] text-muted-foreground mt-1">Minimum required: {threshold}%</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Assignments &amp; Exams</span>
              <FileText className="h-4 w-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-bold mt-2">{assignments.length} / {exams.length}</div>
            <p className="text-[11px] text-muted-foreground mt-1">Coursework / Upcoming papers</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Published Exam Results</span>
              <Award className="h-4 w-4 text-brand-600" />
            </div>
            <div className="text-2xl font-bold mt-2">{results.length}</div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {results.filter((r: any) => r.passed).length} passed subjects
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Outstanding Fee Balance</span>
              <CreditCard className="h-4 w-4 text-amber-600" />
            </div>
            <div className="text-2xl font-bold mt-2">
              ₹{Math.round(totalOutstanding).toLocaleString("en-IN")}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Across {fees.length} semester fee record(s)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Subject-wise Attendance Breakdown */}
      {subjectAtt.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarCheck2 className="h-4 w-4 text-emerald-600" />
              Subject-Wise Attendance Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            {subjectAtt.map((s: any) => {
              const pct = s.percentage ?? 0;
              return (
                <div key={s.subjectId} className="rounded-xl border border-border p-3 space-y-1">
                  <div className="flex items-center justify-between font-semibold">
                    <span className="truncate pr-2">{s.subjectName || s.subjectId}</span>
                    <Badge variant={pct < threshold ? "destructive" : "outline"}>{pct}%</Badge>
                  </div>
                  <div className="text-muted-foreground">
                    Attended {s.attended} / {s.total} sessions • {s.health}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Ward Monthly Attendance Calendar */}
      {wardCalendar && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarCheck2 className="h-4 w-4 text-brand-600" />
              Attendance Calendar — {wardCalendar.monthName} {wardCalendar.year}
            </CardTitle>
            <span className="text-xs font-mono text-muted-foreground">
              {wardCalendar.stats?.attended ?? 0}/{wardCalendar.stats?.totalClasses ?? 0} sessions ({wardCalendar.stats?.percentage ?? 0}%)
            </span>
          </CardHeader>
          <CardContent>
            {Object.keys(wardCalendar.dailyBreakdown || {}).length === 0 ? (
              <p className="text-xs text-muted-foreground">No attendance sessions marked for your ward this month yet.</p>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 text-xs">
                {Object.values(wardCalendar.dailyBreakdown as Record<string, any>).map((d: any) => (
                  <div
                    key={d.date}
                    className={`rounded-lg border p-2 ${
                      d.absent > 0 && d.attended === 0
                        ? "border-rose-300 bg-rose-50/40 dark:bg-rose-950/20"
                        : "border-emerald-300 bg-emerald-50/40 dark:bg-emerald-950/20"
                    }`}
                  >
                    <div className="font-mono font-bold text-foreground">Day {d.day}</div>
                    <div className="text-[10px] text-muted-foreground">
                      P:{d.attended} A:{d.absent} L:{d.late}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Ward Fees & Receipts + Timetable / Assignments / Exams */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Receipt className="h-4 w-4 text-amber-600" />
              Fee Ledger &amp; Verified Receipts
            </CardTitle>
            <select
              aria-label="Fee payment gateway"
              value={selectedGateway}
              onChange={(e) => setSelectedGateway(e.target.value as "mock" | "razorpay" | "stripe")}
              className="h-8 rounded-lg border border-border bg-background px-2 text-[11px] font-medium"
            >
              <option value="mock">Sandbox Gateway</option>
              <option value="razorpay">Razorpay</option>
              <option value="stripe">Stripe</option>
            </select>
          </CardHeader>
          <CardContent className="space-y-3">
            {fees.length === 0 ? (
              <p className="text-xs text-muted-foreground">No fee records assigned.</p>
            ) : (
              fees.map((f: any) => (
                <div key={f.id} className="rounded-xl border border-border p-3 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{f.feeStructure?.name || "Semester Fee"}</span>
                    <Badge variant={f.outstanding > 0 ? "destructive" : "default"}>
                      {f.computedStatus || f.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center text-muted-foreground">
                    <span>Paid: ₹{Number(f.amountPaid || 0).toLocaleString("en-IN")}</span>
                    <div className="flex items-center gap-2">
                      <span>Due: ₹{Number(f.outstanding || 0).toLocaleString("en-IN")}</span>
                      {Number(f.outstanding ?? 0) > 0 && (
                        <Button
                          size="sm"
                          className="h-6 px-2.5 text-[10px]"
                          isLoading={startPayMutation.isPending}
                          onClick={() =>
                            startPayMutation.mutate({
                              id: f.id,
                              amount: Number(f.outstanding),
                              name: f.feeStructure?.name || "Semester Fee",
                            })
                          }
                        >
                          Pay Due
                        </Button>
                      )}
                    </div>
                  </div>
                  {f.payments?.filter((p: any) => p.status === "SUCCESS").length > 0 && (
                    <div className="pt-2 border-t border-border/50 space-y-1.5">
                      {f.payments
                        .filter((p: any) => p.status === "SUCCESS")
                        .map((p: any) => (
                          <div key={p.id} className="flex items-center justify-between text-[11px] gap-2">
                            <span className="font-mono">{p.receiptNo || p.id.slice(0, 8)}</span>
                            <span>₹{Number(p.amount).toLocaleString("en-IN")}</span>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 px-2 text-[10px]"
                              isLoading={loadingReceiptId === p.id}
                              onClick={() => handleOpenReceipt(p.id)}
                            >
                              View Receipt
                            </Button>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-brand-600" />
              Timetable, Coursework &amp; Exams
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase">
                Weekly Lectures ({timetableSlots.length})
              </h3>
              {timetableSlots.slice(0, 5).map((s: any) => (
                <div key={s.id} className="flex items-center justify-between text-xs py-1.5 border-b border-border/50">
                  <span className="font-medium">
                    {s.dayOfWeek} • {s.subjectOffering?.subject?.code} {s.subjectOffering?.subject?.name}
                  </span>
                  <span className="font-mono text-muted-foreground">
                    {String(Math.floor(s.startMinute / 60)).padStart(2, "0")}:
                    {String(s.startMinute % 60).padStart(2, "0")} ({s.room?.code || "TBA"})
                  </span>
                </div>
              ))}
            </div>

            {assignments.length > 0 && (
              <div className="space-y-1.5">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase">
                  Coursework Deadlines ({assignments.length})
                </h3>
                {assignments.slice(0, 4).map((a: any) => (
                  <div key={a.id} className="flex items-center justify-between text-xs py-1">
                    <span className="truncate pr-2">{a.title}</span>
                    <span className="text-muted-foreground font-mono shrink-0">
                      {a.dueAt ? new Date(a.dueAt).toLocaleDateString() : ""}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {exams.length > 0 && (
              <div className="space-y-1.5">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1">
                  <GraduationCap className="h-3.5 w-3.5" /> Upcoming Exams ({exams.length})
                </h3>
                {exams.slice(0, 4).map((ex: any) => (
                  <div key={ex.id} className="flex items-center justify-between text-xs py-1">
                    <span>{ex.subjectOffering?.subject?.code} • {ex.title}</span>
                    <span className="text-muted-foreground font-mono">
                      {new Date(ex.scheduledAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {results.length > 0 && (
              <div className="space-y-1.5">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase">Latest Grades</h3>
                {results.slice(0, 5).map((r: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between text-xs py-1">
                    <span>{r.exam?.subjectOffering?.subject?.name || r.exam?.title}</span>
                    <span className="font-semibold">
                      {Number(r.marksObtained)}/{Number(r.exam?.maxMarks)} ({r.grade})
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Verified Fee Receipt Modal */}
      <Dialog
        isOpen={!!receiptData}
        onClose={() => setReceiptData(null)}
        title={`Official Fee Receipt — ${receiptData?.receiptNo || ""}`}
        description="Verified ledger receipt issued by the institution accounts office."
      >
        {receiptData && (
          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-2 rounded-xl border border-border p-3 bg-muted/30">
              <div><span className="text-muted-foreground">Student:</span> <strong>{receiptData.student?.user?.firstName} {receiptData.student?.user?.lastName}</strong></div>
              <div><span className="text-muted-foreground">Roll No:</span> <strong className="font-mono">{receiptData.student?.rollNumber}</strong></div>
              <div><span className="text-muted-foreground">Fee Head:</span> <strong>{receiptData.fee?.name || "Tuition"}</strong></div>
              <div><span className="text-muted-foreground">Gateway:</span> <strong className="uppercase">{receiptData.gateway}</strong></div>
              <div><span className="text-muted-foreground">Paid At:</span> <strong>{receiptData.paidAt ? new Date(receiptData.paidAt).toLocaleString() : "—"}</strong></div>
              <div><span className="text-muted-foreground">Amount Paid:</span> <strong className="text-emerald-600">₹{Number(receiptData.amount).toLocaleString("en-IN")}</strong></div>
            </div>
            <div className="flex justify-end">
              <Button size="sm" variant="outline" onClick={() => setReceiptData(null)}>Close</Button>
            </div>
          </div>
        )}
      </Dialog>

      {/* Parent Fee Payment Confirmation Modal */}
      <Dialog
        isOpen={!!pendingPayOrder}
        onClose={() => setPendingPayOrder(null)}
        title={`Complete Payment — ${pendingPayOrder?.feeName || "Ward Fee"}`}
        description="Confirm guardian fee settlement via institutional payment gateway."
      >
        {pendingPayOrder && (
          <div className="space-y-4 text-xs">
            <div className="p-3 rounded-xl border border-border bg-muted/30 flex items-center justify-between">
              <span>Payable Amount ({pendingPayOrder.gateway.toUpperCase()}):</span>
              <strong className="text-base font-mono text-foreground">
                ₹{pendingPayOrder.amount.toLocaleString("en-IN")}
              </strong>
            </div>
            {pendingPayOrder.gatewayRef && (
              <div className="text-[11px] text-muted-foreground font-mono">
                Gateway Ref: {pendingPayOrder.gatewayRef}
              </div>
            )}
            <div className="flex flex-wrap justify-end gap-2">
              {pendingPayOrder.checkoutUrl && pendingPayOrder.gateway !== "mock" && (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => window.open(pendingPayOrder.checkoutUrl, "_blank", "noopener,noreferrer")}
                >
                  Open Hosted Checkout
                </Button>
              )}
              {pendingPayOrder.clientPayload && (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    toast.info(`Razorpay order ${String(pendingPayOrder.clientPayload?.orderId || pendingPayOrder.gatewayRef)} ready. Complete payment on student portal or Razorpay widget.`);
                    setPendingPayOrder(null);
                  }}
                >
                  Continue Razorpay Order
                </Button>
              )}
              {pendingPayOrder.gateway === "mock" && (
                <>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={settlePayMutation.isPending}
                    onClick={() => settlePayMutation.mutate({ paymentId: pendingPayOrder.paymentId, success: false })}
                  >
                    Cancel / Simulate Fail
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    isLoading={settlePayMutation.isPending}
                    onClick={() => settlePayMutation.mutate({ paymentId: pendingPayOrder.paymentId, success: true })}
                  >
                    Confirm &amp; Settle Fee
                  </Button>
                </>
              )}
              {pendingPayOrder.gateway !== "mock" && (
                <Button type="button" size="sm" variant="outline" onClick={() => setPendingPayOrder(null)}>
                  Close
                </Button>
              )}
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
