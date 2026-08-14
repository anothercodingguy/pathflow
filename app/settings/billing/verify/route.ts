import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkPhonePeOrderStatus } from "@/lib/phonepe";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const merchantOrderId = searchParams.get("orderId");

    if (!merchantOrderId) {
      return NextResponse.redirect(new URL("/settings/billing?status=error&msg=missing_order", request.url));
    }

    const order = await prisma.order.findUnique({
      where: { merchantOrderId },
      include: { user: true },
    });

    if (!order) {
      return NextResponse.redirect(new URL("/settings/billing?status=error&msg=order_not_found", request.url));
    }

    // Idempotency: If already success, redirect to success
    if (order.status === "SUCCESS") {
      return NextResponse.redirect(new URL(`/settings/billing?status=success&plan=${order.plan}`, request.url));
    }

    // Check with PhonePe
    const phonePeStatus = await checkPhonePeOrderStatus(merchantOrderId);
    const isCompleted = phonePeStatus.state === "COMPLETED";
    const isFailed = phonePeStatus.state === "FAILED";
    const amountMatches = phonePeStatus.amount === order.amount;

    if (isCompleted && amountMatches) {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      await prisma.$transaction([
        prisma.order.update({
          where: { id: order.id },
          data: {
            status: "SUCCESS",
            paidAt: now,
            paymentDetails: JSON.stringify(phonePeStatus.paymentDetails || {}),
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

      return NextResponse.redirect(new URL(`/settings/billing?status=success&plan=${order.plan}`, request.url));
    } else if (isFailed) {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: "FAILED",
          errorMessage: "Payment failed at gateway.",
        },
      });

      return NextResponse.redirect(new URL(`/settings/billing?status=failed&orderId=${merchantOrderId}`, request.url));
    } else {
      return NextResponse.redirect(new URL(`/settings/billing?status=pending&orderId=${merchantOrderId}`, request.url));
    }
  } catch (error: any) {
    console.error("[Billing Verify Redirect Error]:", error);
    return NextResponse.redirect(new URL("/settings/billing?status=error", request.url));
  }
}
