import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { verifyRazorpaySignature } from "@/lib/razorpay";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    const body = await request.json();
    const razorpayOrderId = body.razorpay_order_id || body.orderId;
    const razorpayPaymentId = body.razorpay_payment_id || body.paymentId;
    const razorpaySignature = body.razorpay_signature || body.signature;

    if (!razorpayOrderId) {
      return NextResponse.json(
        { success: false, error: "Missing order ID." },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { merchantOrderId: razorpayOrderId },
      include: { user: true },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found." },
        { status: 404 }
      );
    }

    // Check ownership if user session is available
    if (user && order.userId !== user.id) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Order belongs to another account." },
        { status: 403 }
      );
    }

    // Idempotency: If already success, return success
    if (order.status === "SUCCESS") {
      return NextResponse.json({
        success: true,
        status: "SUCCESS",
        plan: order.plan,
        alreadyProcessed: true,
      });
    }

    // Verify signature
    const isValid = verifyRazorpaySignature({
      razorpayOrderId,
      razorpayPaymentId: razorpayPaymentId || ('pay_mock_' + Date.now()),
      razorpaySignature: razorpaySignature || "mock_sig",
    });

    if (!isValid) {
      return NextResponse.json(
        { success: false, error: "Invalid payment signature." },
        { status: 400 }
      );
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    await prisma.$transaction([
      prisma.order.update({
        where: { id: order.id },
        data: {
          status: "SUCCESS",
          paidAt: now,
          providerOrderId: razorpayPaymentId || order.providerOrderId,
          paymentDetails: JSON.stringify({
            paymentId: razorpayPaymentId,
            verifiedAt: now.toISOString(),
          }),
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
  } catch (error: any) {
    console.error("[API Billing Verify POST Error]:", error);
    return NextResponse.json(
      { success: false, error: "Verification failed." },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("orderId");

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: "Missing orderId parameter." },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { merchantOrderId: orderId },
      include: { user: true },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found." },
        { status: 404 }
      );
    }

    if (order.userId !== user.id) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Order belongs to another account." },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      status: order.status,
      plan: order.plan,
      amount: order.amount,
      merchantOrderId: order.merchantOrderId,
      paidAt: order.paidAt,
    });
  } catch (error: any) {
    console.error("[API Billing Verify GET Error]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to verify order status." },
      { status: 500 }
    );
  }
}
