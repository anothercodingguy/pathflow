'use client';

import React, { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ShieldCheck, CheckCircle2, XCircle, ArrowLeft, CreditCard, Smartphone } from "lucide-react";

function SimulatorContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get("orderId") || "PF_ORD_DEMO";
  const amountPaisa = parseInt(searchParams.get("amount") || "249900", 10);
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
    <div className="min-h-screen bg-[#08080A] text-white flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-[#121217] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-6">
        
        {/* PhonePe Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#5F259F] flex items-center justify-center font-bold text-white text-sm">
              पे
            </div>
            <div>
              <div className="font-bold text-sm text-white">PhonePe Standard Checkout</div>
              <div className="text-[10px] text-purple-400 font-mono font-semibold">SANDBOX UAT ENVIRONMENT</div>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-mono border border-emerald-500/20">
            TEST MODE
          </span>
        </div>

        {/* Order Details */}
        <div className="bg-white/5 rounded-xl p-4 space-y-2 border border-white/5 font-mono text-xs">
          <div className="flex justify-between text-zinc-400">
            <span>Merchant:</span>
            <span className="text-white font-semibold">PathFlow Inc.</span>
          </div>
          <div className="flex justify-between text-zinc-400">
            <span>Order Reference:</span>
            <span className="text-zinc-300 truncate max-w-[200px]">{orderId}</span>
          </div>
          <div className="flex justify-between text-zinc-400 pt-2 border-t border-white/5">
            <span>Total Payable:</span>
            <span className="text-white text-base font-bold font-sans">{amountINR}</span>
          </div>
        </div>

        {/* Mock Payment Options */}
        <div className="space-y-2 font-mono text-xs">
          <div className="text-[11px] text-zinc-400 uppercase font-semibold">Select Mock Payment Method:</div>
          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 flex items-center gap-2 cursor-pointer font-sans text-xs">
              <Smartphone className="w-4 h-4" />
              <span>UPI / QR</span>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-zinc-400 flex items-center gap-2 font-sans text-xs">
              <CreditCard className="w-4 h-4" />
              <span>Cards / NetBanking</span>
            </div>
          </div>
        </div>

        {/* Simulation Actions */}
        <div className="space-y-3 pt-2">
          <button
            onClick={handleSuccess}
            className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-900/20 font-sans"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Simulate Payment Success (200 OK)</span>
          </button>

          <button
            onClick={handleFailure}
            className="w-full py-2.5 px-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer font-sans"
          >
            <XCircle className="w-4 h-4" />
            <span>Simulate Payment Failure / Decline</span>
          </button>

          <button
            onClick={handleCancel}
            className="w-full py-2 text-zinc-500 hover:text-zinc-300 text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer font-mono"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Cancel & Return to PathFlow</span>
          </button>
        </div>

        {/* Security Footer */}
        <div className="text-center pt-2 text-[10px] text-zinc-500 font-mono flex items-center justify-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
          <span>256-Bit SSL Encrypted Standard Gateway</span>
        </div>

      </div>
    </div>
  );
}

export default function CheckoutSimulatorPage() {
  return (
    <Suspense fallback={<div className="p-8 text-white">Loading Simulator...</div>}>
      <SimulatorContent />
    </Suspense>
  );
}
