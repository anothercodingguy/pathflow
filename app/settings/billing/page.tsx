'use client';

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { 
  Check, 
  ArrowRight, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  CreditCard, 
  Sparkles, 
  Zap, 
  Layers, 
  RefreshCw,
  ExternalLink,
  ArrowLeft,
  Building2
} from "lucide-react";
import { PLANS, PlanId, getPlanConfig } from "@/lib/plans";

interface BillingData {
  currentPlan: {
    id: PlanId;
    name: string;
    displayPrice: string;
    status: string;
    startedAt: string | null;
    expiresAt: string | null;
    limits: any;
    features: string[];
  };
  orders: Array<{
    id: string;
    merchantOrderId: string;
    plan: string;
    amountINR: number;
    currency: string;
    status: string;
    createdAt: string;
    paidAt: string | null;
    errorMessage: string | null;
  }>;
  subscriptions: Array<any>;
}

function BillingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session } = useSession();

  const [loading, setLoading] = useState(true);
  const [upgradingPlan, setUpgradingPlan] = useState<string | null>(null);
  const [billingData, setBillingData] = useState<BillingData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const statusParam = searchParams.get("status");
  const planParam = searchParams.get("plan");
  const orderIdParam = searchParams.get("orderId");

  const fetchBillingInfo = async () => {
    try {
      setLoading(true);
      const apiBase = typeof window !== 'undefined' && window.location.pathname.startsWith('/app') ? '/app' : '';
      const res = await fetch(`${apiBase}/api/billing/history`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setBillingData(data);
        }
      }
    } catch (err: any) {
      console.error("Failed to fetch billing info:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBillingInfo();
  }, [statusParam]);

  // Handle direct upgrade trigger from query param (e.g. ?plan=pro from marketing site or login redirect)
  useEffect(() => {
    if (planParam && (planParam.toLowerCase() === "pro" || planParam.toLowerCase() === "team")) {
      const targetPlan = planParam.toUpperCase() as PlanId;
      // Auto-trigger initiate only if not already on that plan
      if (billingData && billingData.currentPlan.id !== targetPlan && !upgradingPlan) {
        handleInitiateCheckout(targetPlan);
      }
    }
  }, [planParam, billingData?.currentPlan?.id]);

  const loadRazorpayScript = () => {
    return new Promise<boolean>((resolve) => {
      if (typeof window !== "undefined" && (window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleInitiateCheckout = async (planId: PlanId) => {
    if (planId === "FREE" || planId === "ENTERPRISE") return;
    try {
      setUpgradingPlan(planId);
      setErrorMsg(null);
      
      const apiBase = typeof window !== 'undefined' && window.location.pathname.startsWith('/app') ? '/app' : '';
      const res = await fetch(`${apiBase}/api/billing/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId }),
      });

      const data = await res.json();
      if (data.success) {
        // If in test simulation mode without live Razorpay keys, redirect to simulated checkout
        if (data.checkoutUrl && (!data.keyId || data.keyId.includes("sandbox_key") || data.keyId.includes("free_sandbox"))) {
          window.location.href = data.checkoutUrl;
          return;
        }

        // Try opening Razorpay modal
        const isLoaded = await loadRazorpayScript();
        if (isLoaded && typeof (window as any).Razorpay !== "undefined") {
          const rzp = new (window as any).Razorpay({
            key: data.keyId,
            amount: data.amount,
            currency: data.currency || "INR",
            name: "PathFlow",
            description: `PathFlow ${data.planName || data.plan} Subscription`,
            order_id: data.orderId,
            prefill: {
              name: data.user?.name || "Developer",
              email: data.user?.email || "developer@pathflow.dev",
            },
            theme: {
              color: "#3B82F6",
            },
            handler: async function (response: any) {
              try {
                setUpgradingPlan(planId);
                const verifyRes = await fetch(`${apiBase}/api/billing/verify`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature: response.razorpay_signature,
                  }),
                });
                const verifyData = await verifyRes.json();
                if (verifyData.success) {
                  router.push("/settings/billing?status=success");
                  fetchBillingInfo();
                } else {
                  setErrorMsg(verifyData.error || "Payment verification failed.");
                }
              } catch (err: any) {
                setErrorMsg("Verification request failed.");
              } finally {
                setUpgradingPlan(null);
              }
            },
            modal: {
              ondismiss: function () {
                setUpgradingPlan(null);
              },
            },
          });
          rzp.open();
        } else if (data.checkoutUrl) {
          window.location.href = data.checkoutUrl;
        } else {
          router.push(`/settings/billing/checkout-simulator?orderId=${data.orderId}&amount=${data.amount}`);
        }
      } else {
        setErrorMsg(data.error || "Unable to initiate payment checkout.");
        setUpgradingPlan(null);
      }
    } catch (err: any) {
      console.error("Checkout initiation error:", err);
      setErrorMsg(err?.message || "Failed to connect to payment gateway.");
      setUpgradingPlan(null);
    }
  };

  const currentPlan = billingData?.currentPlan || {
    id: "FREE" as PlanId,
    name: "Free",
    displayPrice: "₹0",
    status: "ACTIVE",
    startedAt: null,
    expiresAt: null,
    limits: PLANS.FREE.limits,
    features: PLANS.FREE.features,
  };

  return (
    <div className="w-full min-h-[calc(100vh-2.5rem)] bg-[#08080A] px-4 py-4 space-y-6 font-sans text-xs">
      
      {/* Top Breadcrumb Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1E1E24] pb-3">
        <div className="flex items-center gap-3">
          <Link 
            href="/settings" 
            className="flex items-center gap-1.5 text-zinc-400 hover:text-white transition-colors font-mono text-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Settings</span>
          </Link>
          <span className="text-zinc-600">/</span>
          <h1 className="text-sm font-semibold text-white uppercase tracking-wider font-mono">
            Billing & Subscriptions
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono text-[11px] font-semibold flex items-center gap-1.5">
            <CreditCard className="w-3.5 h-3.5 text-blue-400" />
            <span>INR Billing (One-Time Monthly)</span>
          </span>
        </div>
      </div>

      {/* Status Alert Banners */}
      {statusParam === "success" && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3 text-emerald-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-semibold text-sm">Payment Successful! Plan Activated.</div>
            <p className="text-xs text-emerald-400/90 leading-relaxed font-mono">
              Thank you for subscribing to PathFlow {currentPlan.name}. Your account limits have been instantly updated and verified server-side.
            </p>
          </div>
        </div>
      )}

      {statusParam === "failed" && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3 text-red-300">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-semibold text-sm">Payment Declined or Cancelled</div>
            <p className="text-xs text-red-400/90 leading-relaxed font-mono">
              The transaction was not completed. You have not been charged. You can retry with UPI, Credit/Debit Card, or NetBanking below.
            </p>
          </div>
        </div>
      )}

      {statusParam === "pending" && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-amber-300">
          <Clock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-semibold text-sm">Payment Pending Verification</div>
            <p className="text-xs text-amber-400/90 leading-relaxed font-mono">
              Your payment is currently being processed by your bank. We will automatically update your subscription as soon as the gateway confirmation arrives.
            </p>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-2 font-mono">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Grid: Current Plan & Plan Upgrade Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Current Active Plan & Usage Details */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-[#121217] border border-white/[0.08] rounded-2xl p-5 space-y-4">
            
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-400 font-semibold block">
                  Current Plan
                </span>
                <span className="text-xl font-bold text-white tracking-tight">
                  {currentPlan.name}
                </span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-mono text-[11px] font-bold border border-emerald-500/20">
                {currentPlan.status}
              </span>
            </div>

            <div className="space-y-2 text-xs font-mono text-zinc-300">
              <div className="flex justify-between py-1 border-b border-white/[0.03]">
                <span className="text-zinc-500">Price:</span>
                <span className="text-white font-semibold">{currentPlan.displayPrice} {currentPlan.id !== "FREE" ? "/ month" : ""}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/[0.03]">
                <span className="text-zinc-500">Monthly Runs:</span>
                <span className="text-white font-semibold">{currentPlan.limits.runsPerMonth.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/[0.03]">
                <span className="text-zinc-500">Trace Retention:</span>
                <span className="text-white font-semibold">{currentPlan.limits.retentionDays} Days</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/[0.03]">
                <span className="text-zinc-500">AI Root Cause:</span>
                <span className={currentPlan.limits.aiRootCause ? "text-emerald-400 font-semibold" : "text-zinc-500"}>
                  {currentPlan.limits.aiRootCause ? "Enabled" : "Disabled"}
                </span>
              </div>
              {currentPlan.expiresAt && (
                <div className="flex justify-between py-1 border-b border-white/[0.03]">
                  <span className="text-zinc-500">Renews On:</span>
                  <span className="text-blue-400 font-semibold">
                    {new Date(currentPlan.expiresAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                </div>
              )}
            </div>

            {/* Transparent Billing Note */}
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
              <div className="flex items-center gap-1.5 text-zinc-300 font-semibold text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Transparent Subscription Billing</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                PathFlow billing uses one-time monthly payments with seamless manual renewal reminders. No hidden recurring auto-debits without your explicit approval.
              </p>
            </div>

          </div>

          {/* Quick Support Card */}
          <div className="bg-[#121217] border border-white/[0.08] rounded-2xl p-4 space-y-2 text-xs">
            <div className="font-semibold text-white">Need a custom plan or GST invoice?</div>
            <p className="text-zinc-400 text-[11px] leading-relaxed">
              Email us with your company GSTIN and billing address for standard tax invoices.
            </p>
            <a 
              href="mailto:support@thepathflow.online?subject=PathFlow%20Invoice%20Inquiry" 
              className="text-blue-400 hover:underline inline-flex items-center gap-1 text-[11px] font-mono font-semibold pt-1"
            >
              <span>Contact Billing Support</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Right Column: Available Plans Grid */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between pb-1">
            <h2 className="text-sm font-semibold text-white uppercase font-mono tracking-wider">
              Available Plans & Upgrades
            </h2>
            <span className="text-xs text-zinc-400 font-mono">Billed in Indian Rupees (INR)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Free Tier */}
            <div className={`rounded-2xl border p-4 flex flex-col justify-between ${currentPlan.id === "FREE" ? "bg-[#14141A] border-white/20" : "bg-[#121217] border-white/[0.08]"}`}>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-white text-sm">Free</span>
                  {currentPlan.id === "FREE" && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-white font-bold">CURRENT</span>
                  )}
                </div>
                <div className="text-2xl font-black text-white">₹0</div>
                <p className="text-zinc-400 text-[11px]">For personal testing and small prototypes.</p>
                <ul className="space-y-2 text-zinc-300 font-mono text-[11px] pt-2 border-t border-white/5">
                  <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-emerald-400" /> 1 Project</li>
                  <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-emerald-400" /> 500 runs / mo</li>
                  <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-emerald-400" /> 7-day retention</li>
                  <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-emerald-400" /> Core traces</li>
                </ul>
              </div>
              <div className="pt-4">
                <button 
                  disabled 
                  className="w-full py-2 rounded-xl bg-white/5 text-zinc-500 text-xs font-semibold cursor-not-allowed"
                >
                  {currentPlan.id === "FREE" ? "Active Plan" : "Included"}
                </button>
              </div>
            </div>

            {/* Pro Tier (Featured) */}
            <div className={`rounded-2xl border-2 p-4 flex flex-col justify-between relative shadow-xl ${currentPlan.id === "PRO" ? "bg-blue-950/20 border-blue-500" : "bg-[#121217] border-blue-500/50"}`}>
              <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-blue-600 text-white font-mono text-[9px] font-bold uppercase tracking-wider">
                RECOMMENDED
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-white text-sm">Pro</span>
                  {currentPlan.id === "PRO" && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold">CURRENT</span>
                  )}
                </div>
                <div className="text-2xl font-black text-white">
                  ₹1,999 <span className="text-xs text-zinc-400 font-mono font-normal">/ mo</span>
                </div>
                <p className="text-zinc-300 text-[11px]">For developers running production services.</p>
                <ul className="space-y-2 text-zinc-200 font-mono text-[11px] pt-2 border-t border-white/10">
                  <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-emerald-400" /> Unlimited projects</li>
                  <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-emerald-400" /> 10,000 runs / mo</li>
                  <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-emerald-400" /> 30-day retention</li>
                  <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-emerald-400" /> AI Root Cause</li>
                  <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-emerald-400" /> Git diff analysis</li>
                </ul>
              </div>
              <div className="pt-4">
                {currentPlan.id === "PRO" ? (
                  <button 
                    disabled 
                    className="w-full py-2 rounded-xl bg-blue-500/20 text-blue-300 text-xs font-semibold cursor-not-allowed"
                  >
                    Active Plan
                  </button>
                ) : (
                  <button 
                    onClick={() => handleInitiateCheckout("PRO")}
                    disabled={upgradingPlan === "PRO"}
                    className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-all shadow-md active:scale-[0.99] flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {upgradingPlan === "PRO" ? (
                      <span>Redirecting to Checkout...</span>
                    ) : (
                      <>
                        <span>Upgrade to Pro</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Team Tier */}
            <div className={`rounded-2xl border p-4 flex flex-col justify-between ${currentPlan.id === "TEAM" ? "bg-purple-950/20 border-purple-500" : "bg-[#121217] border-white/[0.08]"}`}>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-white text-sm">Team</span>
                  {currentPlan.id === "TEAM" && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold">CURRENT</span>
                  )}
                </div>
                <div className="text-2xl font-black text-white">
                  ₹7,999 <span className="text-xs text-zinc-400 font-mono font-normal">/ mo</span>
                </div>
                <p className="text-zinc-400 text-[11px]">For engineering teams debugging together.</p>
                <ul className="space-y-2 text-zinc-300 font-mono text-[11px] pt-2 border-t border-white/5">
                  <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-emerald-400" /> Everything in Pro</li>
                  <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-emerald-400" /> Shared workspace</li>
                  <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-emerald-400" /> 5 included seats</li>
                  <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-emerald-400" /> 90-day retention</li>
                  <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-emerald-400" /> Alert webhooks</li>
                </ul>
              </div>
              <div className="pt-4">
                <button 
                  disabled 
                  className="w-full py-2 rounded-xl bg-white/5 text-zinc-500 text-xs font-semibold cursor-not-allowed"
                >
                  Coming Soon
                </button>
              </div>
            </div>

          </div>

          {/* Payment Transaction History Table */}
          <div className="bg-[#121217] border border-white/[0.08] rounded-2xl p-5 space-y-3 mt-6">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-white text-xs font-mono uppercase tracking-wider">
                Payment History & Orders
              </h3>
              <button 
                onClick={fetchBillingInfo} 
                className="text-zinc-400 hover:text-white p-1 rounded transition-colors"
                title="Refresh order history"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            {billingData?.orders && billingData.orders.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-[11px] border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-zinc-500 uppercase text-[10px]">
                      <th className="py-2 px-3">Date</th>
                      <th className="py-2 px-3">Order ID</th>
                      <th className="py-2 px-3">Plan</th>
                      <th className="py-2 px-3">Amount</th>
                      <th className="py-2 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {billingData.orders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-white/[0.02] text-zinc-300">
                        <td className="py-2.5 px-3 text-zinc-400">
                          {new Date(ord.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-white truncate max-w-[180px]">
                          {ord.merchantOrderId}
                        </td>
                        <td className="py-2.5 px-3">{ord.plan}</td>
                        <td className="py-2.5 px-3 font-semibold">₹{ord.amountINR.toLocaleString("en-IN")}</td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${ord.status === "SUCCESS" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : ord.status === "FAILED" ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-amber-500/10 text-amber-400 border border-amber-500/20"}`}>
                            {ord.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-8 text-center text-zinc-500 font-mono text-xs">
                No past transactions recorded yet.
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}

export default function BillingPage() {
  return (
    <Suspense fallback={<div className="p-8 text-white font-mono text-xs">Loading billing dashboard...</div>}>
      <BillingContent />
    </Suspense>
  );
}
