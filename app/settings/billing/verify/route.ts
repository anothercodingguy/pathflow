import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("orderId");

    if (!orderId) {
      return NextResponse.redirect(new URL("/settings/billing?status=failed&msg=missing_order", request.url));
    }

    const order = await prisma.order.findUnique({
      where: { merchantOrderId: orderId },
      include: { user: true },
    });

    if (!order) {
      return NextResponse.redirect(new URL("/settings/billing?status=failed&msg=order_not_found", request.url));
    }

    if (user && order.userId !== user.id) {
      return NextResponse.redirect(new URL("/settings/billing?status=failed&msg=unauthorized_order", request.url));
    }

    // Idempotency: If already success, redirect to success
    if (order.status === "SUCCESS") {
      return NextResponse.redirect(new URL('/settings/billing?status=success&plan=' + order.plan, request.url));
    }

    // Test / Sandbox simulation mode: Activate if in test environment
    const keySecret = process.env.RAZORPAY_KEY_SECRET || "rzp_test_secret_sandbox_key";
    const isSandbox = !keySecret || keySecret.includes("sandbox_key") || keySecret.includes("test");

    if (isSandbox) {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      await prisma.$transaction([
        prisma.order.update({
          where: { id: order.id },
          data: {
            status: "SUCCESS",
            paidAt: now,
            paymentDetails: JSON.stringify({ verified: true, provider: "RAZORPAY_SANDBOX" }),
          },
        }),
        prisma.user.update({
          where: { id: order.userId },
          data: {
            plan: order.plan,
            planStatus: "ACTIVE",
            planStartedAt: now,
            planExpiresAt: expiresAt,
          },
        }),
        prisma.subscription.create({
          data: {
            userId: order.userId,
            plan: order.plan,
            status: "ACTIVE",
            billingCycle: "MONTHLY",
            amount: order.amount,
            currency: order.currency,
            merchantOrderId: order.merchantOrderId,
            startDate: now,
            endDate: expiresAt,
          },
        }),
      ]);

      return NextResponse.redirect(new URL('/settings/billing?status=success&plan=' + order.plan, request.url));
    }

    return NextResponse.redirect(new URL('/settings/billing?status=pending&orderId=' + orderId, request.url));
  } catch (error: any) {
    console.error("[Billing Verify Redirect Error]:", error);
    return NextResponse.redirect(new URL("/settings/billing?status=failed", request.url));
  }
}
