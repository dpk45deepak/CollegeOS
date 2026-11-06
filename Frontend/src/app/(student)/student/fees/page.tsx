"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { studentApi } from "@/lib/api/student";
import {
  CreditCard,
  CheckCircle2,
  Download,
  AlertCircle,
  Receipt,
  ShieldCheck,
  Calendar,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function StudentFeesPage() {
  const queryClient = useQueryClient();
  const { data: feeData, isLoading, error, refetch } = useQuery({
    queryKey: ["student_fees"],
    queryFn: () => studentApi.getFees(),
  });

  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);


  const handleDownloadReceipt = (tx: any) => {
    const receiptHtml = `<!DOCTYPE html>
<html>
<head>
  <title>Fee Payment e-Receipt - ${tx.receiptNo}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #111; max-width: 600px; margin: auto; }
    .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 16px; margin-bottom: 24px; }
    .title { font-size: 18px; font-weight: 800; text-transform: uppercase; }
    .sub { font-size: 12px; color: #555; margin-top: 4px; }
    .box { border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin-bottom: 20px; }
    .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; font-size: 13px; }
    .row:last-child { border-bottom: none; }
    .total { font-size: 16px; font-weight: bold; color: #10b981; }
  </style>
</head>
<body>
  <div class="header">
    <div class="title">Satyug Darshan Institute of Engineering & Technology</div>
    <div class="sub">Official Tuition & Academic Fee Payment e-Receipt</div>
  </div>
  <div class="box">
    <div class="row"><span>Receipt Number:</span><strong>${tx.receiptNo}</strong></div>
    <div class="row"><span>Transaction Date:</span><span>${formatDate(tx.date)}</span></div>
    <div class="row"><span>Payment Method:</span><span>${tx.method}</span></div>
    <div class="row"><span>Payment Status:</span><strong style="color:#10b981;">VERIFIED / SUCCESS</strong></div>
    <div class="row total"><span>Amount Paid:</span><span>₹${Number(tx.amount || 0).toLocaleString("en-IN")}</span></div>
  </div>
  <div style="font-size:11px;color:#888;text-align:center;">This is a computer-generated institutional receipt valid for official clearance.</div>
</body>
</html>`;
    const blob = new Blob([receiptHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, "_blank");
    if (!win) {
      const a = document.createElement("a");
      a.href = url;
      a.download = `Receipt_${tx.receiptNo}.html`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
  };

  const payMutation = useMutation({
    mutationFn: (amount: number) => studentApi.payFee(amount),
    onSuccess: () => {
      setPaymentSuccess(true);
      setTimeout(() => {
        setIsPayModalOpen(false);
        setPaymentSuccess(false);
        queryClient.invalidateQueries({ queryKey: ["student_fees"] });
      }, 1500);
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  if (error || !feeData) {
    return (
      <ErrorState
        message="Could not load fee ledger details. Please verify your connection or contact the accounts office."
        onRetry={refetch}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Fee Status Banner */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Bursar & Accounts Office
          </span>
          <h1 className="text-2xl font-extrabold text-foreground mt-0.5">
            Semester {feeData.semester} Fee Ledger
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Academic Session: {feeData.academicYear} • Next Due Date: <strong>{formatDate(feeData.dueDate)}</strong>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-3.5 rounded-2xl bg-muted/40 border border-border text-left">
            <span className="text-[10px] text-muted-foreground uppercase font-bold block">
              Pending Balance
            </span>
            <span className="text-xl font-extrabold text-amber-600 font-mono">
              {formatCurrency(feeData.pendingAmount)}
            </span>
          </div>

          {feeData.pendingAmount > 0 && (
            <Button
              onClick={() => setIsPayModalOpen(true)}
              className="text-xs gap-1.5 shadow-md shadow-brand-500/20 py-5"
            >
              <CreditCard className="h-4 w-4" /> Pay Balance Now
            </Button>
          )}
        </div>
      </div>

      {/* Fee Breakdown & Transaction History Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Breakdown Card */}
        <Card>
          <CardHeader className="p-5 pb-3">
            <CardTitle className="text-sm font-bold">
              Fee Structure Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-0 space-y-2">
            <div className="divide-y divide-border text-xs">
              {((feeData.breakdown || [])).map((item, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between">
                  <span className="text-foreground">{item.head}</span>
                  <span className="font-mono font-semibold text-foreground">
                    {formatCurrency(item.amount)}
                  </span>
                </div>
              ))}
              <div className="pt-3 flex items-center justify-between font-bold text-sm">
                <span>Total Semester Fee</span>
                <span className="font-mono">{formatCurrency(feeData.totalAmount)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transactions & Receipts */}
        <Card>
          <CardHeader className="p-5 pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Receipt className="h-4 w-4 text-brand-600" />
              Payment History & Official Receipts
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-0 space-y-3">
            {(!feeData.transactions || feeData.transactions.length === 0) ? (<div className="p-4 text-center text-xs text-muted-foreground">No online payment transactions recorded yet.</div>) : feeData.transactions.map((tx) => (
              <div
                key={tx.id}
                className="p-3 rounded-xl border border-border bg-muted/20 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-semibold text-foreground flex items-center gap-2">
                    <span>{formatCurrency(tx.amount)}</span>
                    <span className="text-[10px] text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.2 rounded font-bold">
                      {tx.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    {tx.method} • {formatDate(tx.date)}
                  </div>
                  <div className="text-[10px] font-mono text-muted-foreground">
                    Receipt: {tx.receiptNo}
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadReceipt(tx)}
                  className="text-[11px] gap-1 h-8"
                >
                  <Download className="h-3 w-3" /> Receipt
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Pay Modal Dialog */}
      <Dialog
        isOpen={isPayModalOpen}
        onClose={() => setIsPayModalOpen(false)}
        title="Complete Institutional Fee Payment"
        description="Encrypted banking gateway simulation with zero saved sensitive card credentials."
      >
        <div className="space-y-4">
          {paymentSuccess ? (
            <div className="text-center py-6 space-y-2">
              <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto" />
              <h4 className="text-sm font-bold">Payment Processed Successfully!</h4>
              <p className="text-xs text-muted-foreground">
                Your receipt REC-2026-9812 has been generated and clearance synced with academics.
              </p>
            </div>
          ) : (
            <>
              <div className="p-4 rounded-xl bg-brand-50/50 dark:bg-brand-950/20 border border-brand-200 dark:border-brand-800 flex items-center justify-between text-xs">
                <span>Amount to Pay:</span>
                <span className="text-lg font-extrabold text-foreground font-mono">
                  {formatCurrency(feeData.pendingAmount)}
                </span>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground">Payment Method</label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-3 rounded-lg border border-brand-500 bg-card font-semibold text-center cursor-pointer">
                    UPI / QR Code
                  </div>
                  <div className="p-3 rounded-lg border border-border bg-card text-muted-foreground text-center cursor-pointer">
                    Net Banking
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-muted-foreground pt-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>PCI-DSS Compliant • 256-Bit SSL Campus Gateway</span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => setIsPayModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  isLoading={payMutation.isPending}
                  onClick={() => payMutation.mutate(feeData.pendingAmount)}
                >
                  Confirm ₹12,500 Payment
                </Button>
              </div>
            </>
          )}
        </div>
      </Dialog>
    </div>
  );
}
