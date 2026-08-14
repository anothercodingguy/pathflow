import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { PLANS, PlanId } from "@/lib/plans";
import { generateMerchantOrderId, initiatePhonePePayment } from "@/lib/phonepe";

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
    const merchantOrderId = generateMerchantOrderId();

    // Create internal order record in database first
    const internalOrder = await prisma.order.create({
      data: {
        userId: user.id,
        plan: planConfig.id,
        amount: amountPaisa,
        currency: "INR",
        status: "PENDING",
        provider: "PHONEPE",
        merchantOrderId: merchantOrderId,
      },
    });

    const host = process.env.NEXT_PUBLIC_APP_URL || "https://thepathflow.online";
    const redirectUrl = `${host}/app/settings/billing/verify?orderId=${encodeURIComponent(merchantOrderId)}`;

    const paymentResult = await initiatePhonePePayment({
      merchantOrderId,
      amountPaisa,
      redirectUrl,
      userEmail: user.email,
      userName: user.name,
    });

    return NextResponse.json({
      success: true,
      orderId: merchantOrderId,
      checkoutUrl: paymentResult.redirectUrl,
      plan: planConfig.id,
      amountINR: planConfig.priceINR,
      currency: "INR",
    });
  } catch (error: any) {
    console.error("[API Billing Create Order Error]:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to initiate payment." },
      { status: 500 }
    );
  }
}
