import { prisma } from "@/lib/prisma";

export interface BudgetCheckResult {
  allowed: boolean;
  warning: boolean;
  currentSpendUsd: number;
  monthlyLimitUsd: number;
  percentUsed: number;
  circuitBreakerActive: boolean;
  message?: string;
}

/**
 * Check if a project run is within budget limits
 */
export async function checkProjectBudget(project: string = "default", userId?: string): Promise<BudgetCheckResult> {
  try {
    const where: any = { project };
    if (userId) where.userId = userId;

    let budget = await prisma.projectBudget.findFirst({ where });
    if (!budget && userId) {
      budget = await prisma.projectBudget.create({
        data: {
          userId,
          project,
          monthlyLimitUsd: 50.0,
          alertThresholdPct: 80,
          circuitBreaker: false,
          currentSpendUsd: 0.0,
        },
      });
    }

    if (!budget) {
      return {
        allowed: true,
        warning: false,
        currentSpendUsd: 0,
        monthlyLimitUsd: 50,
        percentUsed: 0,
        circuitBreakerActive: false,
      };
    }

    // Compute actual spend in last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const runWhere: any = {
      createdAt: { gte: thirtyDaysAgo },
      project,
    };
    if (userId) runWhere.userId = userId;

    const runs = await prisma.run.findMany({
      where: runWhere,
      select: { totalCostUsd: true },
    });

    const currentSpend = runs.reduce((acc, r) => acc + r.totalCostUsd, 0);
    const limit = budget.monthlyLimitUsd || 50.0;
    const percentUsed = Math.round((currentSpend / limit) * 100);

    const isExceeded = currentSpend >= limit;
    const isWarning = percentUsed >= (budget.alertThresholdPct || 80);
    const isBlocked = isExceeded && budget.circuitBreaker;

    return {
      allowed: !isBlocked,
      warning: isWarning,
      currentSpendUsd: currentSpend,
      monthlyLimitUsd: limit,
      percentUsed,
      circuitBreakerActive: isBlocked,
      message: isBlocked
        ? `Monthly budget of $${limit} exceeded. Circuit breaker active.`
        : isWarning
        ? `Project has utilized ${percentUsed}% of its monthly $${limit} budget.`
        : undefined,
    };
  } catch (error) {
    console.error("[Budget Check Error]:", error);
    return {
      allowed: true,
      warning: false,
      currentSpendUsd: 0,
      monthlyLimitUsd: 50,
      percentUsed: 0,
      circuitBreakerActive: false,
    };
  }
}
