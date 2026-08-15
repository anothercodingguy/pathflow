import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { PLANS, PlanId } from "@/lib/plans";
import { generateReceiptId, createRazorpayOrder } from "@/lib/razorpay";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Please sign in to upgrade." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const planInput = (body.plan || "").toUpperCase() as PlanId;

    const planConfig = PLANS[planInput];
    if (!planConfig || planConfig.id === "FREE" || planConfig.id === "ENTERPRISE") {
      return NextResponse.json(
        { success: false, error: "Invalid plan selected for online checkout." },
        { status: 400 }
      );
    }

    // Amount in paisa is strictly server-side determined
    const amountPaisa = planConfig.pricePaisa;
    const receipt = generateReceiptId();

    const paymentResult = await createRazorpayOrder({
      amountPaisa,
      receipt,
      currency: "INR",
      notes: {
        userId: user.id,
        userEmail: user.email,
        plan: planConfig.id,
      },
      userEmail: user.email,
      userName: user.name,
    });

    // Create internal order record in database
    await prisma.order.create({
      data: {
        userId: user.id,
        plan: planConfig.id,
        amount: amountPaisa,
        currency: "INR",
        status: "PENDING",
        provider: "RAZORPAY",
        merchantOrderId: paymentResult.orderId,
        providerOrderId: paymentResult.orderId,
      },
    });

    return NextResponse.json({
      success: true,
      orderId: paymentResult.orderId,
      keyId: paymentResult.keyId,
      amount: amountPaisa,
      amountINR: planConfig.priceINR,
      currency: "INR",
      plan: planConfig.id,
      planName: planConfig.name,
      user: {
        name: user.name,
        email: user.email,
      },
      checkoutUrl: (paymentResult as any).checkoutUrl || undefined,
      mode: paymentResult.mode,
    });
  } catch (error: any) {
    console.error("[API Billing Create Order Error]:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to initiate payment." },
      { status: 500 }
    );
  }
}
