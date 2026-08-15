import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { checkProjectBudget } from "@/lib/budget";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const project = searchParams.get("project") || "default";

    const budgetStatus = await checkProjectBudget(project, user.id);
    const budgetRecord = await prisma.projectBudget.findFirst({
      where: { userId: user.id, project },
    });

    return NextResponse.json({
      success: true,
      budget: budgetRecord || {
        project,
        monthlyLimitUsd: 50.0,
        alertThresholdPct: 80,
        circuitBreaker: false,
        currentSpendUsd: budgetStatus.currentSpendUsd,
      },
      status: budgetStatus,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { project, monthlyLimitUsd, alertThresholdPct, circuitBreaker } = body;

    const targetProject = project || "default";
    const limit = monthlyLimitUsd !== undefined ? parseFloat(monthlyLimitUsd) : 50.0;
    const threshold = alertThresholdPct !== undefined ? parseInt(alertThresholdPct, 10) : 80;
    const cb = circuitBreaker !== undefined ? Boolean(circuitBreaker) : false;

    const existing = await prisma.projectBudget.findFirst({
      where: { userId: user.id, project: targetProject },
    });

    let budget;
    if (existing) {
      budget = await prisma.projectBudget.update({
        where: { id: existing.id },
        data: {
          monthlyLimitUsd: limit,
          alertThresholdPct: threshold,
          circuitBreaker: cb,
        },
      });
    } else {
      budget = await prisma.projectBudget.create({
        data: {
          userId: user.id,
          project: targetProject,
          monthlyLimitUsd: limit,
          alertThresholdPct: threshold,
          circuitBreaker: cb,
        },
      });
    }

    return NextResponse.json({ success: true, budget });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
