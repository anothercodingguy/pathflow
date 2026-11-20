'use client';

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Check, ArrowRight, ShieldCheck, AlertCircle, CheckCircle2, Clock, CreditCard, RefreshCw, ArrowLeft, Mail, Loader2 } from "lucide-react";
import { PageShell } from "@/components/ui/Page";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card, CardHeader, TableWrap, th, theadRow } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { InlineError } from "@/components/ui/States";
import { PLANS, PlanId } from "@/lib/plans";

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
  // Why the plan could not be loaded: 'signin' = not signed in (demo workspace
  // or expired session), 'error' = the request failed. null = loaded fine.
  const [loadProblem, setLoadProblem] = useState<'signin' | 'error' | null>(null);

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
          setLoadProblem(null);
          return;
        }
      }
      // Do not pretend the account is on the Free plan when we could not read it.
      setBillingData(null);
      setLoadProblem(res.status === 401 ? 'signin' : 'error');
    } catch (err: any) {
      console.error("Failed to fetch billing info:", err);
      setBillingData(null);
      setLoadProblem('error');
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

  // null until the plan has really been loaded from the server.
  const currentPlan = billingData?.currentPlan ?? null;
  const planName = currentPlan?.name ?? "your new plan";
  const shownPlans = [PLANS.FREE, PLANS.PRO, PLANS.TEAM];

  return (
    <PageShell className="font-sans">

      <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-line pb-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <ButtonLink href="/settings" size="sm">
            <ArrowLeft aria-hidden /> Settings
          </ButtonLink>
          <h1 className="text-lg font-semibold tracking-tight text-ink">Billing &amp; plans</h1>
        </div>
        <Badge tone="accent">
          <CreditCard className="size-3" aria-hidden />
          Billed in INR, one payment per month
        </Badge>
      </header>

      {/* Status banners (set by the ?status= query parameter after checkout) */}
      {statusParam === "success" && (
        <div role="status" className="flex items-start gap-3 rounded-lg border border-ok/30 bg-ok/10 p-3.5">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-ok" aria-hidden />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-ink">Payment Successful! Plan Activated.</p>
            <p className="text-xs leading-relaxed text-ink-2">
              Thank you for subscribing to PathFlow {planName}. Your account limits have been instantly updated and verified server-side.
            </p>
          </div>
        </div>
      )}

      {statusParam === "failed" && (
        <div role="alert" className="flex items-start gap-3 rounded-lg border border-bad/30 bg-bad/10 p-3.5">
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-bad" aria-hidden />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-ink">Payment declined or cancelled</p>
            <p className="text-xs leading-relaxed text-ink-2">
              The transaction was not completed and you have not been charged. You can try again below.
            </p>
          </div>
        </div>
      )}

      {statusParam === "cancelled" && (
        <div role="status" className="flex items-start gap-3 rounded-lg border border-line bg-surface p-3.5">
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-ink-3" aria-hidden />
          <p className="text-xs leading-relaxed text-ink-2">Checkout was cancelled. Nothing was charged.</p>
        </div>
      )}

      {statusParam === "pending" && (
        <div role="status" className="flex items-start gap-3 rounded-lg border border-warn/30 bg-warn/10 p-3.5">
          <Clock className="mt-0.5 size-4 shrink-0 text-warn" aria-hidden />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-ink">Payment pending verification</p>
            <p className="text-xs leading-relaxed text-ink-2">
              Your payment is currently being processed by your bank. We will automatically update your subscription as soon as the gateway confirmation arrives.
            </p>
          </div>
        </div>
      )}

      {errorMsg && <InlineError>{errorMsg}</InlineError>}

      {loadProblem === 'error' && (
        <InlineError onRetry={fetchBillingInfo}>
          Your plan and payment history could not be loaded. Nothing below reflects your account until this works.
        </InlineError>
      )}

      {loadProblem === 'signin' && (
        <div role="note" className="flex flex-wrap items-center gap-3 rounded-lg border border-line bg-surface p-3.5 text-xs text-ink-2">
          <AlertCircle className="size-4 shrink-0 text-ink-3" aria-hidden />
          <span className="min-w-0 flex-1 basis-56">
            Billing belongs to a signed-in account. You are not signed in (the demo workspace has no plan), so plans are shown for reference only.
          </span>
          <ButtonLink href="/login?callbackUrl=/app/settings/billing" variant="primary" size="sm">Sign in</ButtonLink>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">

        {/* Left column: current plan */}
        <div className="space-y-4 lg:col-span-4">
          <Card className="space-y-4 p-4" aria-busy={loading}>
            <div className="flex items-start justify-between gap-2 border-b border-line pb-3">
              <div>
                <h2 className="font-mono text-2xs font-semibold uppercase tracking-wide text-ink-3">Current plan</h2>
                {loading ? (
                  <div className="mt-1.5 h-6 w-24 animate-pulse rounded bg-tint/10" />
                ) : (
                  <p className="text-xl font-semibold tracking-tight text-ink">{currentPlan ? currentPlan.name : "Not available"}</p>
                )}
              </div>
              {currentPlan && <Badge tone={currentPlan.status === "ACTIVE" ? "ok" : "warn"}>{currentPlan.status}</Badge>}
            </div>

            {currentPlan ? (
              <dl className="divide-y divide-line font-mono text-xs">
                <div className="flex justify-between gap-3 py-1.5">
                  <dt className="text-ink-3">Price</dt>
                  <dd className="font-semibold text-ink">{currentPlan.displayPrice} {currentPlan.id !== "FREE" ? "/ month" : ""}</dd>
                </div>
                <div className="flex justify-between gap-3 py-1.5">
                  <dt className="text-ink-3">Monthly runs</dt>
                  <dd className="font-semibold text-ink">{currentPlan.limits.runsPerMonth.toLocaleString()}</dd>
                </div>
                <div className="flex justify-between gap-3 py-1.5">
                  <dt className="text-ink-3">Trace retention</dt>
                  <dd className="font-semibold text-ink">{currentPlan.limits.retentionDays} days</dd>
                </div>
                <div className="flex justify-between gap-3 py-1.5">
                  <dt className="text-ink-3">Root cause (rule-based)</dt>
                  <dd className={currentPlan.limits.aiRootCause ? "font-semibold text-ok" : "text-ink-3"}>
                    {currentPlan.limits.aiRootCause ? "Included" : "Not included"}
                  </dd>
                </div>
                {currentPlan.expiresAt && (
                  <div className="flex justify-between gap-3 py-1.5">
                    <dt className="text-ink-3">Renews on</dt>
                    <dd className="font-semibold text-ink">
                      {new Date(currentPlan.expiresAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                    </dd>
                  </div>
                )}
              </dl>
            ) : !loading ? (
              <p className="text-xs leading-relaxed text-ink-2">
                {loadProblem === 'signin' ? "Sign in to see the plan on your account." : "The plan on your account could not be loaded."}
              </p>
            ) : (
              <div className="space-y-2" aria-hidden>
                <div className="h-3 w-full animate-pulse rounded bg-tint/10" />
                <div className="h-3 w-4/5 animate-pulse rounded bg-tint/10" />
                <div className="h-3 w-3/5 animate-pulse rounded bg-tint/10" />
              </div>
            )}

            <div className="space-y-1 rounded-md border border-line bg-inset p-3">
              <p className="flex items-center gap-1.5 text-2xs font-semibold text-ink-2">
                <ShieldCheck className="size-3.5 text-ok" aria-hidden />
                Transparent Subscription Billing
              </p>
              <p className="text-2xs leading-relaxed text-ink-2">
                PathFlow billing uses one-time monthly payments with seamless manual renewal reminders. No hidden recurring auto-debits without your explicit approval.
              </p>
            </div>
          </Card>

          <Card className="space-y-2 p-4">
            <h2 className="text-xs font-semibold text-ink">Need a custom plan or GST invoice?</h2>
            <p className="text-2xs leading-relaxed text-ink-2">
              Email us with your company GSTIN and billing address for standard tax invoices.
            </p>
            <a
              href="mailto:support@thepathflow.online?subject=PathFlow%20Invoice%20Inquiry"
              className="inline-flex items-center gap-1 pt-1 font-mono text-2xs font-semibold text-accent-ink hover:underline"
            >
              <Mail className="size-3" aria-hidden />
              Contact billing support
            </a>
          </Card>
        </div>

        {/* Right column: plans and history */}
        <div className="space-y-4 lg:col-span-8">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-sm font-semibold text-ink">Plans</h2>
            <span className="font-mono text-2xs text-ink-3">Prices in Indian Rupees (INR)</span>
          </div>

          {/* Plan cards come from lib/plans.ts, the same file the server uses for prices. */}
          <ul className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {shownPlans.map((plan) => {
              const isCurrent = currentPlan?.id === plan.id;
              const canBuyHere = plan.id === "PRO";
              return (
                <li
                  key={plan.id}
                  className={`relative flex flex-col justify-between rounded-lg border bg-surface p-4 ${
                    plan.popular ? "border-accent/60" : isCurrent ? "border-line-strong" : "border-line"
                  }`}
                >
                  {plan.popular && (
                    <span className="absolute -top-2.5 left-4 rounded bg-accent-strong px-2 py-0.5 font-mono text-2xs font-semibold uppercase tracking-wide text-white">
                      Recommended
                    </span>
                  )}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-semibold text-ink">{plan.name}</h3>
                      {isCurrent && <Badge tone="accent">Current</Badge>}
                    </div>
                    <p className="text-2xl font-bold tracking-tight text-ink">
                      {plan.displayPrice}
                      {plan.interval && <span className="ml-1 font-mono text-xs font-normal text-ink-2">{plan.interval}</span>}
                    </p>
                    <p className="text-xs leading-relaxed text-ink-2">{plan.description}</p>
                    <ul className="space-y-2 border-t border-line pt-3 font-mono text-2xs text-ink-2">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-1.5">
                          <Check className="mt-0.5 size-3 shrink-0 text-ok" aria-hidden />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="pt-4">
                    {isCurrent ? (
                      <Button className="w-full" disabled>Current plan</Button>
                    ) : plan.id === "FREE" ? (
                      <Button className="w-full" disabled>Included</Button>
                    ) : canBuyHere ? (
                      <Button
                        variant="primary"
                        className="w-full"
                        onClick={() => handleInitiateCheckout(plan.id)}
                        disabled={upgradingPlan === plan.id || loading || loadProblem === 'signin'}
                      >
                        {upgradingPlan === plan.id ? (
                          <>
                            <Loader2 className="animate-spin" aria-hidden /> Opening checkout…
                          </>
                        ) : loadProblem === 'signin' ? (
                          "Sign in to upgrade"
                        ) : (
                          <>
                            Upgrade to {plan.name} <ArrowRight aria-hidden />
                          </>
                        )}
                      </Button>
                    ) : (
                      <Button className="w-full" disabled>Coming soon</Button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>

          {/* Payment history */}
          <Card className="overflow-hidden">
            <CardHeader
              title="Payment history"
              actions={
                <Button variant="ghost" size="icon" onClick={fetchBillingInfo} aria-label="Refresh payment history" disabled={loading}>
                  <RefreshCw className={loading ? "animate-spin" : ""} aria-hidden />
                </Button>
              }
            />

            {billingData?.orders && billingData.orders.length > 0 ? (
              <TableWrap label="Payment history table">
                <table className="w-full min-w-[560px] border-collapse text-left font-mono text-2xs">
                  <thead>
                    <tr className={theadRow}>
                      <th scope="col" className={th}>Date</th>
                      <th scope="col" className={th}>Order ID</th>
                      <th scope="col" className={th}>Plan</th>
                      <th scope="col" className={th}>Amount</th>
                      <th scope="col" className={th}>Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {billingData.orders.map((ord) => (
                      <tr key={ord.id} className="text-ink-2 hover:bg-tint/[0.03]">
                        <td className="whitespace-nowrap px-3 py-2.5">
                          {new Date(ord.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </td>
                        <td className="max-w-[180px] truncate px-3 py-2.5 font-semibold text-ink">{ord.merchantOrderId}</td>
                        <td className="px-3 py-2.5">{ord.plan}</td>
                        <td className="px-3 py-2.5 font-semibold tabular-nums">₹{ord.amountINR.toLocaleString("en-IN")}</td>
                        <td className="px-3 py-2.5">
                          <Badge tone={ord.status === "SUCCESS" ? "ok" : ord.status === "FAILED" ? "bad" : "warn"}>{ord.status}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableWrap>
            ) : (
              <p className="px-4 py-8 text-center text-xs text-ink-3">
                {loading
                  ? "Loading payment history…"
                  : loadProblem === 'signin'
                    ? "Sign in to see your payments."
                    : loadProblem === 'error'
                      ? "Payment history could not be loaded."
                      : "No payments yet."}
              </p>
            )}
          </Card>
        </div>
      </div>
    </PageShell>
  );
}

export default function BillingPage() {
  return (
    <Suspense fallback={<div role="status" className="p-8 font-sans text-xs text-ink-2">Loading billing…</div>}>
      <BillingContent />
    </Suspense>
  );
}
