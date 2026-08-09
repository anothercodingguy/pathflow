import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const agents = await prisma.agent.findMany({
      include: {
        runs: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true,
            title: true,
            status: true,
            wallClockMs: true,
            totalCostUsd: true,
            totalTokens: true,
            qualityScore: true,
            createdAt: true,
          },
        },
      },
    });

    const formattedAgents = agents.map((agent) => {
      const runs = agent.runs || [];
      const totalRuns = runs.length;

      // To get accurate stats, query all runs for this agent
      const successCount = runs.filter(r => r.status === 'completed').length;
      const successRate = totalRuns > 0 ? Math.round((successCount / totalRuns) * 100) : 0;
      const avgLatency = totalRuns > 0 ? Math.round(runs.reduce((a, r) => a + r.wallClockMs, 0) / totalRuns) : 0;
      const avgCost = totalRuns > 0 ? runs.reduce((a, r) => a + r.totalCostUsd, 0) / totalRuns : 0;
      const totalCost = runs.reduce((a, r) => a + r.totalCostUsd, 0);
      const avgTokens = totalRuns > 0 ? Math.round(runs.reduce((a, r) => a + r.totalTokens, 0) / totalRuns) : 0;
      const qualityRuns = runs.filter(r => r.qualityScore != null);
      const avgQuality = qualityRuns.length > 0
        ? Math.round(qualityRuns.reduce((a, r) => a + (r.qualityScore || 0), 0) / qualityRuns.length)
        : null;

      return {
        id: agent.id,
        name: agent.name,
        framework: agent.framework,
        modelFamily: agent.modelFamily,
        description: agent.description,
        runs: totalRuns,
        successRate,
        avgLatency,
        avgCost: Math.round(avgCost * 1000) / 1000,
        totalCost: Math.round(totalCost * 1000) / 1000,
        avgTokens,
        avgQuality,
        recentRuns: runs.map(r => ({
          id: r.id,
          title: r.title,
          status: r.status,
          wallClockMs: r.wallClockMs,
          totalCostUsd: r.totalCostUsd,
          createdAt: r.createdAt.toISOString(),
        })),
      };
    });

    // Sort by run count descending
    formattedAgents.sort((a, b) => b.runs - a.runs);

    return NextResponse.json({ success: true, agents: formattedAgents });
  } catch (error: any) {
    console.error('API Error /api/v1/agents:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
