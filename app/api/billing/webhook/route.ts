import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkPhonePeOrderStatus } from "@/lib/phonepe";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const merchantOrderId = body?.data?.merchantOrderId || body?.merchantOrderId;

    if (!merchantOrderId) {
      return NextResponse.json({ success: false, error: "Missing merchantOrderId" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { merchantOrderId },
      include: { user: true },
    });

    if (!order) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }

    if (order.status === "SUCCESS") {
      return NextResponse.json({ success: true, message: "Order already processed" });
    }

    const phonePeStatus = await checkPhonePeOrderStatus(merchantOrderId);
    if (phonePeStatus.state === "COMPLETED" && phonePeStatus.amount === order.amount) {
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
    } else if (phonePeStatus.state === "FAILED") {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: "FAILED",
          errorMessage: "Webhook received failure state",
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[Webhook Error]:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
