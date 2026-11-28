"use client";

import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { specialistApi } from "@/lib/api/specialist";
import { feesApi } from "@/services/api/fees.api";
import { academicApi } from "@/services/api/academic.api";
import { reportsApi } from "@/services/api/reports.api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { CreditCard, Download, IndianRupee, PlusCircle, Receipt, RotateCcw } from "lucide-react";

export default function AccountantDashboardPage() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [manualFeeId, setManualFeeId] = useState<string>("");
  const [manualAmount, setManualAmount] = useState<string>("");
  const [manualMode, setManualMode] = useState<string>("CASH");
  const [adjustFeeId, setAdjustFeeId] = useState<string>("");
  const [discountAmt, setDiscountAmt] = useState<string>("");
  const [adjustReason, setAdjustReason] = useState<string>("");
  const [refundPaymentId, setRefundPaymentId] = useState<string>("");
  const [refundAmount, setRefundAmount] = useState<string>("");
  const [refundReason, setRefundReason] = useState<string>("");
  const [feeSearch, setFeeSearch] = useState<string>("");

  // Fee Structures & Batch Assignment state
  const [structName, setStructName] = useState("");
  const [structYear, setStructYear] = useState("2026-27");
  const [structProgramId, setStructProgramId] = useState("");
  const [structBatchId, setStructBatchId] = useState("");
  const [tuitionAmt, setTuitionAmt] = useState("45000");
  const [examFeeAmt, setExamFeeAmt] = useState("5000");
  const [assignStructureId, setAssignStructureId] = useState("");
  const [assignBatchId, setAssignBatchId] = useState("");
  const [assignDueDate, setAssignDueDate] = useState("");
  const [receiptData, setReceiptData] = useState<any | null>(null);

  const {
    data: feeRes,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["accountant-fees", statusFilter],
    queryFn: () => specialistApi.listAllFees({ status: statusFilter || undefined, limit: 50 }),
  });

  const { data: refundRes } = useQuery({
    queryKey: ["accountant-refunds"],
    queryFn: () => specialistApi.listFeeRefunds({ limit: 30 }),
  });

  const { data: structures = [] } = useQuery({
    queryKey: ["accountant-fee-structures"],
    queryFn: () => feesApi.listStructures(),
  });

  const { data: programs = [] } = useQuery({
    queryKey: ["accountant-programs"],
    queryFn: () => academicApi.listPrograms().catch(() => []),
  });

  const { data: batches = [] } = useQuery({
    queryKey: ["accountant-batches"],
    queryFn: () => academicApi.listBatches().catch(() => []),
  });

  const recordManual = useMutation({
    mutationFn: () =>
      feesApi.recordManualPayment(manualFeeId, {
        amount: Number(manualAmount),
        mode: manualMode,
      }),
    onSuccess: () => {
      toast.success("Counter payment recorded & receipt issued");
      setManualFeeId("");
      setManualAmount("");
      qc.invalidateQueries({ queryKey: ["accountant-fees"] });
    },
    onError: (err: any) => toast.error(err?.message || "Failed to record payment"),
  });

  const adjustFee = useMutation({
    mutationFn: () =>
      feesApi.adjustFee(adjustFeeId, {
        discount: Number(discountAmt),
        reason: adjustReason.trim(),
      }),
    onSuccess: () => {
      toast.success("Fee adjustment saved & audited");
      setAdjustFeeId("");
      setDiscountAmt("");
      setAdjustReason("");
      qc.invalidateQueries({ queryKey: ["accountant-fees"] });
    },
    onError: (err: any) => toast.error(err?.message || "Adjustment failed"),
  });

  const issueRefundMutation = useMutation({
    mutationFn: () =>
      feesApi.issueRefund(refundPaymentId, {
        amount: Number(refundAmount),
        reason: refundReason.trim(),
      }),
    onSuccess: () => {
      toast.success("Refund processed & ledger updated");
      setRefundPaymentId("");
      setRefundAmount("");
      setRefundReason("");
      qc.invalidateQueries({ queryKey: ["accountant-fees"] });
      qc.invalidateQueries({ queryKey: ["accountant-refunds"] });
    },
    onError: (err: any) => toast.error(err?.message || "Refund failed"),
  });

  const createStructureMutation = useMutation({
    mutationFn: () =>
      feesApi.createStructure({
        name: structName.trim(),
        academicYear: structYear.trim(),
        programId: structProgramId || undefined,
        batchId: structBatchId || undefined,
        components: [
          { name: "Tuition Fee", amount: Number(tuitionAmt) || 0 },
          ...(Number(examFeeAmt) > 0 ? [{ name: "Examination & Lab Fee", amount: Number(examFeeAmt) }] : []),
        ],
      }),
    onSuccess: () => {
      toast.success("Fee structure created");
      setStructName("");
      qc.invalidateQueries({ queryKey: ["accountant-fee-structures"] });
    },
    onError: (err: any) => toast.error(err?.message || "Failed to create fee structure"),
  });

  const assignStructureMutation = useMutation({
    mutationFn: () =>
      feesApi.assignStructure(assignStructureId, {
        batchId: assignBatchId,
        dueDate: new Date(assignDueDate).toISOString(),
      }),
    onSuccess: () => {
      toast.success("Fee structure assigned to batch");
      setAssignStructureId("");
      setAssignBatchId("");
      qc.invalidateQueries({ queryKey: ["accountant-fees"] });
    },
    onError: (err: any) => toast.error(err?.message || "Failed to assign fee structure"),
  });

  const openReceipt = async (paymentId: string) => {
    try {
      const data = await feesApi.getReceiptAdmin(paymentId);
      setReceiptData(data);
    } catch (err: any) {
      toast.error(err?.message || "Failed to load receipt");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  if (isError) {
    return <ErrorState title="Accounts Ledger Unavailable" onRetry={() => refetch()} />;
  }

  const fees = (feeRes?.items ?? []).filter((f: any) => {
    if (!feeSearch.trim()) return true;
    const q = feeSearch.toLowerCase();
    const name = `${f.student?.user?.firstName || ""} ${f.student?.user?.lastName || ""}`.toLowerCase();
    return name.includes(q) || (f.student?.rollNumber || "").toLowerCase().includes(q);
  });
  const refundablePayments = (feeRes?.items ?? []).flatMap((f: any) =>
    (f.payments || [])
      .filter((p: any) => p.status === "SUCCESS" || p.status === "PARTIALLY_REFUNDED")
      .map((p: any) => ({ ...p, student: f.student })),
  );
  const refunds = refundRes?.items ?? [];
  const totalOutstanding = fees.reduce((s: number, f: any) => s + Number(f.outstanding ?? 0), 0);
  const totalCollected = fees.reduce((s: number, f: any) => s + Number(f.amountPaid ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">
            Finance, Fee Ledger &amp; Refunds
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Manage student fee accounts, counter payments, audited adjustments, and refunds.
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5 text-xs"
          onClick={() =>
            reportsApi.downloadCsv("fees").catch((err: any) =>
              toast.error(err?.message || "Failed to export fee CSV"),
            )
          }
        >
          <Download className="h-3.5 w-3.5" /> Export Fee Ledger CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-5">
            <span className="text-xs text-muted-foreground">Total Records Loaded</span>
            <div className="text-2xl font-bold mt-1">{feeRes?.meta?.total ?? fees.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <span className="text-xs text-muted-foreground">Collected (Current View)</span>
            <div className="text-2xl font-bold mt-1 text-emerald-600">
              ₹{Math.round(totalCollected).toLocaleString("en-IN")}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <span className="text-xs text-muted-foreground">Outstanding (Current View)</span>
            <div className="text-2xl font-bold mt-1 text-rose-600">
              ₹{Math.round(totalOutstanding).toLocaleString("en-IN")}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="ledger">
        <TabsList>
          <TabsTrigger value="ledger">Student Fee Ledger</TabsTrigger>
          <TabsTrigger value="structures">Structures &amp; Assign ({structures.length})</TabsTrigger>
          <TabsTrigger value="counter">Counter Payment / Adjustment</TabsTrigger>
          <TabsTrigger value="refunds">Refunds ({refunds.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="ledger" className="mt-4 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Input
              placeholder="Search student name or roll no..."
              value={feeSearch}
              onChange={(e) => setFeeSearch(e.target.value)}
              className="w-64 h-9 text-xs"
            />
            <select
              aria-label="Filter fee status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 rounded-xl border border-border bg-card px-3 text-xs"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">PENDING</option>
              <option value="PARTIAL">PARTIAL</option>
              <option value="OVERDUE">OVERDUE</option>
              <option value="PAID">PAID</option>
            </select>
          </div>

          <Card>
            <CardContent className="pt-5 overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="py-2 pr-3">Student</th>
                    <th className="py-2 pr-3">Fee Head</th>
                    <th className="py-2 pr-3">Net Payable</th>
                    <th className="py-2 pr-3">Paid</th>
                    <th className="py-2 pr-3">Outstanding</th>
                    <th className="py-2 pr-3">Status</th>
                    <th className="py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {fees.map((f: any) => (
                    <tr key={f.id} className="border-b border-border/50">
                      <td className="py-2.5 pr-3">
                        <div className="font-semibold">
                          {f.student?.user?.firstName} {f.student?.user?.lastName}
                        </div>
                        <div className="text-[10px] text-muted-foreground">{f.student?.rollNumber}</div>
                      </td>
                      <td className="py-2.5 pr-3">{f.feeStructure?.name || "Fee"}</td>
                      <td className="py-2.5 pr-3">₹{Number(f.netPayable ?? f.amountDue).toLocaleString("en-IN")}</td>
                      <td className="py-2.5 pr-3">₹{Number(f.amountPaid).toLocaleString("en-IN")}</td>
                      <td className="py-2.5 pr-3 font-semibold">₹{Number(f.outstanding ?? 0).toLocaleString("en-IN")}</td>
                      <td className="py-2.5 pr-3">
                        <Badge variant={f.outstanding > 0 ? "destructive" : "default"}>
                          {f.computedStatus || f.status}
                        </Badge>
                      </td>
                      <td className="py-2.5 flex gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-[11px]"
                          onClick={() => {
                            setManualFeeId(f.id);
                            setManualAmount(String(Math.max(1, Math.round(f.outstanding ?? 0))));
                          }}
                        >
                          Counter Pay
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-[11px]"
                          onClick={() => setAdjustFeeId(f.id)}
                        >
                          Adjust
                        </Button>
                        {f.payments?.find((p: any) => p.status === "SUCCESS" || p.status === "PARTIALLY_REFUNDED") && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-[11px] gap-1"
                            onClick={() => openReceipt(f.payments.find((p: any) => p.status === "SUCCESS" || p.status === "PARTIALLY_REFUNDED").id)}
                          >
                            <Receipt className="h-3 w-3" /> Receipt
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="structures" className="mt-4 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <PlusCircle className="h-4 w-4 text-brand-600" /> Create Fee Structure
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <Input placeholder="Structure Title (e.g. B.Tech Sem 5 Fee)" value={structName} onChange={(e) => setStructName(e.target.value)} />
                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder="Academic Year (2026-27)" value={structYear} onChange={(e) => setStructYear(e.target.value)} />
                  <select value={structProgramId} onChange={(e) => setStructProgramId(e.target.value)} className="h-9 rounded-xl border border-border bg-background px-2">
                    <option value="">All Programs</option>
                    {programs.map((p) => <option key={p.id} value={p.id}>{p.code} — {p.name}</option>)}
                  </select>
                </div>
                <select value={structBatchId} onChange={(e) => setStructBatchId(e.target.value)} className="w-full h-9 rounded-xl border border-border bg-background px-2">
                  <option value="">Optional Target Batch...</option>
                  {batches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
                <div className="grid grid-cols-2 gap-2">
                  <Input type="number" placeholder="Tuition Fee (INR)" value={tuitionAmt} onChange={(e) => setTuitionAmt(e.target.value)} />
                  <Input type="number" placeholder="Exam/Lab Fee (INR)" value={examFeeAmt} onChange={(e) => setExamFeeAmt(e.target.value)} />
                </div>
                <Button className="w-full text-xs" disabled={!structName.trim() || !structYear.trim()} isLoading={createStructureMutation.isPending} onClick={() => createStructureMutation.mutate()}>
                  Save Fee Structure
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Assign Fee Structure to Batch</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <select value={assignStructureId} onChange={(e) => setAssignStructureId(e.target.value)} className="w-full h-9 rounded-xl border border-border bg-background px-2">
                  <option value="">Select Fee Structure...</option>
                  {structures.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.academicYear})</option>)}
                </select>
                <select value={assignBatchId} onChange={(e) => setAssignBatchId(e.target.value)} className="w-full h-9 rounded-xl border border-border bg-background px-2">
                  <option value="">Select Target Batch...</option>
                  {batches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
                <Input type="date" value={assignDueDate} onChange={(e) => setAssignDueDate(e.target.value)} />
                <Button className="w-full text-xs" disabled={!assignStructureId || !assignBatchId || !assignDueDate} isLoading={assignStructureMutation.isPending} onClick={() => assignStructureMutation.mutate()}>
                  Assign Invoices to Batch
                </Button>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Configured Fee Structures ({structures.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              {structures.map((s) => (
                <div key={s.id} className="flex items-center justify-between rounded-xl border border-border p-3">
                  <div>
                    <div className="font-semibold">{s.name} ({s.academicYear})</div>
                    <div className="text-muted-foreground">
                      {(s.components || []).map((c) => `${c.name}: ₹${Number(c.amount).toLocaleString("en-IN")}`).join(" • ")}
                    </div>
                  </div>
                  <Badge variant="outline">{s.program?.code || s.batch?.name || "General"}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="counter" className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-emerald-600" /> Record Counter Payment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <select
                value={manualFeeId}
                onChange={(e) => setManualFeeId(e.target.value)}
                className="w-full h-9 rounded-xl border border-border bg-background px-3 text-xs"
              >
                <option value="">Select Student Fee Account...</option>
                {fees
                  .filter((f: any) => Number(f.outstanding ?? 0) > 0)
                  .map((f: any) => (
                    <option key={f.id} value={f.id}>
                      {f.student?.rollNumber} — {f.student?.user?.firstName} (Due ₹{Math.round(f.outstanding)})
                    </option>
                  ))}
              </select>
              <Input
                type="number"
                placeholder="Amount (INR)"
                value={manualAmount}
                onChange={(e) => setManualAmount(e.target.value)}
              />
              <select
                value={manualMode}
                onChange={(e) => setManualMode(e.target.value)}
                className="w-full h-9 rounded-xl border border-border bg-background px-3 text-xs"
              >
                <option value="CASH">Cash Counter</option>
                <option value="DD">Demand Draft</option>
                <option value="NEFT">Bank Transfer / NEFT</option>
              </select>
              <Button
                className="w-full text-xs"
                disabled={!manualFeeId || !manualAmount}
                isLoading={recordManual.isPending}
                onClick={() => recordManual.mutate()}
              >
                Record Payment &amp; Issue Receipt
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <IndianRupee className="h-4 w-4 text-brand-600" /> Audited Fee Waiver / Discount
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <select
                value={adjustFeeId}
                onChange={(e) => setAdjustFeeId(e.target.value)}
                className="w-full h-9 rounded-xl border border-border bg-background px-3 text-xs"
              >
                <option value="">Select Student Fee Account...</option>
                {fees.map((f: any) => (
                  <option key={f.id} value={f.id}>
                    {f.student?.rollNumber} — {f.student?.user?.firstName} ({f.feeStructure?.name})
                  </option>
                ))}
              </select>
              <Input
                type="number"
                placeholder="Discount Amount (INR)"
                value={discountAmt}
                onChange={(e) => setDiscountAmt(e.target.value)}
              />
              <Input
                placeholder="Audit reason (min 5 chars)"
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
              />
              <Button
                className="w-full text-xs"
                disabled={!adjustFeeId || !discountAmt || adjustReason.trim().length < 5}
                isLoading={adjustFee.isPending}
                onClick={() => adjustFee.mutate()}
              >
                Apply Audited Adjustment
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="refunds" className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <RotateCcw className="h-4 w-4 text-rose-600" /> Issue Payment Refund
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <select
                value={refundPaymentId}
                onChange={(e) => setRefundPaymentId(e.target.value)}
                className="w-full h-9 rounded-xl border border-border bg-background px-3 text-xs"
              >
                <option value="">Select Verified Payment Receipt...</option>
                {refundablePayments.map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.receiptNo || p.id.slice(0, 8)} — {p.student?.rollNumber} (₹{Number(p.amount).toLocaleString("en-IN")})
                  </option>
                ))}
              </select>
              <Input
                type="number"
                placeholder="Refund Amount (INR)"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
              />
              <Input
                placeholder="Refund reason (min 5 chars)"
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
              />
              <Button
                className="w-full text-xs"
                disabled={!refundPaymentId || !refundAmount || refundReason.trim().length < 5}
                isLoading={issueRefundMutation.isPending}
                onClick={() => issueRefundMutation.mutate()}
              >
                Process Refund
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <RotateCcw className="h-4 w-4 text-indigo-600" /> Processed Refunds History
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              {refunds.length === 0 ? (
                <p className="text-muted-foreground">No refunds processed yet.</p>
              ) : (
                refunds.map((r: any) => (
                  <div key={r.id} className="flex items-center justify-between border-b border-border/50 py-2">
                    <div>
                      <div className="font-semibold">
                        {r.payment?.studentFee?.student?.user?.firstName}{" "}
                        {r.payment?.studentFee?.student?.user?.lastName} ({r.payment?.studentFee?.student?.rollNumber})
                      </div>
                      <div className="text-muted-foreground">
                        Receipt {r.payment?.receiptNo || "—"} • Reason: {r.reason}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">₹{Number(r.amount).toLocaleString("en-IN")}</div>
                      <Badge variant="outline">{r.status}</Badge>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog
        isOpen={!!receiptData}
        onClose={() => setReceiptData(null)}
        title={`Verified Receipt — ${receiptData?.receiptNo || ""}`}
        description="Official institutional payment receipt ledger record."
      >
        {receiptData && (
          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-2 rounded-xl border border-border p-3 bg-muted/30">
              <div><span className="text-muted-foreground">Student:</span> <strong>{receiptData.student?.user?.firstName} {receiptData.student?.user?.lastName}</strong></div>
              <div><span className="text-muted-foreground">Roll No:</span> <strong className="font-mono">{receiptData.student?.rollNumber}</strong></div>
              <div><span className="text-muted-foreground">Fee Head:</span> <strong>{receiptData.fee?.name || "Tuition"}</strong></div>
              <div><span className="text-muted-foreground">Gateway:</span> <strong className="uppercase">{receiptData.gateway}</strong></div>
              <div><span className="text-muted-foreground">Status:</span> <strong>{receiptData.status}</strong></div>
              <div><span className="text-muted-foreground">Amount:</span> <strong className="text-emerald-600">₹{Number(receiptData.amount).toLocaleString("en-IN")}</strong></div>
            </div>
            <div className="flex justify-end">
              <Button size="sm" variant="outline" onClick={() => setReceiptData(null)}>Close</Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
