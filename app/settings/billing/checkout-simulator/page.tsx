'use client';

import React, { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle2, XCircle, ArrowLeft, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/Button";

function SimulatorContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get("orderId") || "order_rzp_mock";
  const amountPaisa = parseInt(searchParams.get("amount") || "199900", 10);
  const amountINR = (amountPaisa / 100).toLocaleString("en-IN", { style: "currency", currency: "INR" });

  const handleSuccess = () => {
    router.push(`/settings/billing/verify?orderId=${encodeURIComponent(orderId)}`);
  };

  const handleFailure = () => {
    router.push(`/settings/billing?status=failed&orderId=${encodeURIComponent(orderId)}`);
  };

  const handleCancel = () => {
    router.push("/settings/billing?status=cancelled");
  };

  return (
    <div className="flex min-h-[calc(100dvh-2.75rem)] items-center justify-center bg-canvas p-4 font-sans text-ink">
      <div className="w-full max-w-md space-y-5 rounded-xl border-2 border-dashed border-warn/50 bg-surface p-5 shadow-2xl">

        {/* This page is a stand-in for the payment provider. It must be impossible to mistake for a real checkout. */}
        <div role="note" className="flex items-start gap-2.5 rounded-md border border-warn/40 bg-warn/10 p-3">
          <FlaskConical className="mt-0.5 size-4 shrink-0 text-warn" aria-hidden />
          <div className="space-y-0.5">
            <h1 className="text-sm font-semibold text-ink">Test checkout simulator</h1>
            <p className="text-xs leading-relaxed text-ink-2">
              This is not a real payment page. No card or bank details are collected and no money moves. The buttons below only tell PathFlow how a payment would have ended.
            </p>
          </div>
        </div>

        <dl className="space-y-2 rounded-md border border-line bg-inset p-3.5 font-mono text-xs">
          <div className="flex justify-between gap-3">
            <dt className="text-ink-3">Test order ID</dt>
            <dd className="min-w-0 truncate text-ink-2">{orderId}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-3 border-t border-line pt-2">
            <dt className="text-ink-3">Simulated amount</dt>
            <dd className="font-sans text-base font-semibold text-ink">{amountINR}</dd>
          </div>
        </dl>

        <div className="space-y-2.5">
          <Button variant="primary" size="lg" className="w-full" onClick={handleSuccess}>
            <CheckCircle2 aria-hidden />
            Simulate a successful payment
          </Button>

          <Button variant="danger" size="lg" className="w-full" onClick={handleFailure}>
            <XCircle aria-hidden />
            Simulate a failed payment
          </Button>

          <Button variant="ghost" className="w-full" onClick={handleCancel}>
            <ArrowLeft aria-hidden />
            Cancel and return to billing
          </Button>
        </div>

        <p className="text-center font-mono text-2xs text-ink-3">Simulator · no real payment</p>
      </div>
    </div>
  );
}

export default function CheckoutSimulatorPage() {
  return (
    <Suspense fallback={<div role="status" className="p-8 font-sans text-xs text-ink-2">Loading test simulator…</div>}>
      <SimulatorContent />
    </Suspense>
  );
}
