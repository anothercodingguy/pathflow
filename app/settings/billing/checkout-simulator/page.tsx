'use client';

import React, { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ShieldCheck, CheckCircle2, XCircle, ArrowLeft, CreditCard, Smartphone } from "lucide-react";

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
    <div className="min-h-screen bg-canvas text-ink flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-surface border border-line rounded-2xl p-6 shadow-2xl space-y-6">
        
        {/* Checkout Header */}
        <div className="flex items-center justify-between border-b border-line pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center font-bold text-accent-ink text-sm">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-sm text-ink">Razorpay Standard Checkout</div>
              <div className="text-2xs text-accent-ink font-mono font-semibold">TEST ENVIRONMENT (FREE RAZORPAY)</div>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-ok text-2xs font-mono border border-emerald-500/20">
            TEST MODE
          </span>
        </div>

        {/* Order Details */}
        <div className="bg-tint/5 rounded-xl p-4 space-y-2 border border-line font-mono text-xs">
          <div className="flex justify-between text-ink-2">
            <span>Merchant:</span>
            <span className="text-ink font-semibold">PathFlow Technologies</span>
          </div>
          <div className="flex justify-between text-ink-2">
            <span>Razorpay Order ID:</span>
            <span className="text-ink-2 truncate max-w-[200px]">{orderId}</span>
          </div>
          <div className="flex justify-between text-ink-2 pt-2 border-t border-line">
            <span>Total Payable:</span>
            <span className="text-ink text-base font-bold font-sans">{amountINR}</span>
          </div>
        </div>

        {/* Mock Payment Options */}
        <div className="space-y-2 font-mono text-xs">
          <div className="text-2xs text-ink-2 uppercase font-semibold">Supported Payment Methods:</div>
          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-accent-ink flex items-center gap-2 cursor-pointer font-sans text-xs">
              <Smartphone className="w-4 h-4" />
              <span>UPI / QR / GPay</span>
            </div>
            <div className="p-3 rounded-xl bg-tint/5 border border-line text-ink-2 flex items-center gap-2 font-sans text-xs">
              <CreditCard className="w-4 h-4" />
              <span>Cards / NetBanking</span>
            </div>
          </div>
        </div>

        {/* Simulation Actions */}
        <div className="space-y-3 pt-2">
          <button
            onClick={handleSuccess}
            className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-blue-900/20 font-sans"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Simulate Razorpay Payment Success (200 OK)</span>
          </button>

          <button
            onClick={handleFailure}
            className="w-full py-2.5 px-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-bad border border-red-500/20 font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer font-sans"
          >
            <XCircle className="w-4 h-4" />
            <span>Simulate Payment Failure / Decline</span>
          </button>

          <button
            onClick={handleCancel}
            className="w-full py-2 text-ink-3 hover:text-ink text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer font-mono"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Cancel & Return to PathFlow</span>
          </button>
        </div>

        {/* Security Footer */}
        <div className="text-center pt-2 text-2xs text-ink-3 font-mono flex items-center justify-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-ink-2" />
          <span>Razorpay 256-Bit SSL Encrypted Checkout</span>
        </div>

      </div>
    </div>
  );
}

export default function CheckoutSimulatorPage() {
  return (
    <Suspense fallback={<div className="p-8 text-ink">Loading Checkout...</div>}>
      <SimulatorContent />
    </Suspense>
  );
}
