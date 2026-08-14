import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { PLANS, getPlanConfig } from "@/lib/plans";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        orders: {
          orderBy: { createdAt: "desc" },
          take: 20,
        },
        subscriptions: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
    });

    if (!dbUser) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const currentPlanConfig = getPlanConfig(dbUser.plan);

    return NextResponse.json({
      success: true,
      currentPlan: {
        id: currentPlanConfig.id,
        name: currentPlanConfig.name,
        displayPrice: currentPlanConfig.displayPrice,
        status: dbUser.planStatus,
        startedAt: dbUser.planStartedAt,
        expiresAt: dbUser.planExpiresAt,
        limits: currentPlanConfig.limits,
        features: currentPlanConfig.features,
      },
      orders: dbUser.orders.map((o) => ({
        id: o.id,
        merchantOrderId: o.merchantOrderId,
        plan: o.plan,
        amountINR: o.amount / 100,
        currency: o.currency,
        status: o.status,
        createdAt: o.createdAt,
        paidAt: o.paidAt,
        errorMessage: o.errorMessage,
      })),
      subscriptions: dbUser.subscriptions.map((s) => ({
        id: s.id,
        plan: s.plan,
        status: s.status,
        amountINR: s.amount / 100,
        startDate: s.startDate,
        endDate: s.endDate,
      })),
    });
  } catch (error: any) {
    console.error("[Billing History Error]:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
