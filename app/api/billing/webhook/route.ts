import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || "rzp_webhook_secret_demo";

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-razorpay-signature");

    if (signature && webhookSecret && !webhookSecret.includes("demo")) {
      const expectedSignature = crypto
        .createHmac("sha256", webhookSecret)
        .update(rawBody)
        .digest("hex");

      if (expectedSignature !== signature) {
        return NextResponse.json({ success: false, error: "Invalid signature" }, { status: 400 });
      }
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event;
    const paymentEntity = payload?.payload?.payment?.entity;
    const orderId = paymentEntity?.order_id || payload?.payload?.order?.entity?.id;

    if (!orderId) {
      return NextResponse.json({ success: true, message: "Ignored event without order_id" });
    }

    const order = await prisma.order.findUnique({
      where: { merchantOrderId: orderId },
      include: { user: true },
    });

    if (!order) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }

    if (order.status === "SUCCESS") {
      return NextResponse.json({ success: true, message: "Order already processed" });
    }

    if (event === "payment.captured" || event === "order.paid") {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      await prisma.$transaction([
        prisma.order.update({
          where: { id: order.id },
          data: {
            status: "SUCCESS",
            paidAt: now,
            paymentDetails: JSON.stringify(paymentEntity || {}),
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
    } else if (event === "payment.failed") {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: "FAILED",
          errorMessage: paymentEntity?.error_description || "Payment failed via webhook",
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[Razorpay Webhook Error]:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
