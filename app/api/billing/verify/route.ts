import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkPhonePeOrderStatus } from "@/lib/phonepe";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const merchantOrderId = searchParams.get("orderId");

    if (!merchantOrderId) {
      return NextResponse.json(
        { success: false, error: "Missing orderId parameter." },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { merchantOrderId },
      include: { user: true },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found." },
        { status: 404 }
      );
    }

    // Idempotency: If already successfully processed, return existing state
    if (order.status === "SUCCESS") {
      return NextResponse.json({
        success: true,
        status: "SUCCESS",
        plan: order.plan,
        amount: order.amount,
        merchantOrderId: order.merchantOrderId,
        alreadyProcessed: true,
      });
    }

    // Authoritative Server-to-Server Verification with PhonePe
    const phonePeStatus = await checkPhonePeOrderStatus(merchantOrderId);

    // Verify status and amount
    const isCompleted = phonePeStatus.state === "COMPLETED";
    const isFailed = phonePeStatus.state === "FAILED";
    const amountMatches = phonePeStatus.amount === order.amount;

    if (isCompleted && amountMatches) {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days access

      // Transactional Idempotent Activation
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

      return NextResponse.json({
        success: true,
        status: "SUCCESS",
        plan: order.plan,
        amount: order.amount,
        merchantOrderId: order.merchantOrderId,
      });
    } else if (isFailed) {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: "FAILED",
          errorMessage: "Payment failed at gateway.",
        },
      });

      return NextResponse.json({
        success: false,
        status: "FAILED",
        error: "Payment was not successful.",
        merchantOrderId: order.merchantOrderId,
      });
    } else {
      // Pending state
      return NextResponse.json({
        success: false,
        status: "PENDING",
        message: "Payment is still processing.",
        merchantOrderId: order.merchantOrderId,
      });
    }
  } catch (error: any) {
    console.error("[API Billing Verify Error]:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to verify order status." },
      { status: 500 }
    );
  }
}
