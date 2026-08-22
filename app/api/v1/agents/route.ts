import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateAuthToken } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const user = await validateAuthToken(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const agents = await prisma.agent.findMany({
      where: { userId: user.id },
      include: {
        runs: {
          where: { userId: user.id },
          orderBy: { createdAt: 'desc' },
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
      const allRuns = agent.runs || [];
      const totalRuns = allRuns.length;

      const successCount = allRuns.filter(r => r.status === 'completed').length;
      const successRate = totalRuns > 0 ? Math.round((successCount / totalRuns) * 100) : 0;
      const avgLatency = totalRuns > 0 ? Math.round(allRuns.reduce((a, r) => a + r.wallClockMs, 0) / totalRuns) : 0;
      const avgCost = totalRuns > 0 ? allRuns.reduce((a, r) => a + r.totalCostUsd, 0) / totalRuns : 0;
      const totalCost = allRuns.reduce((a, r) => a + r.totalCostUsd, 0);
      const avgTokens = totalRuns > 0 ? Math.round(allRuns.reduce((a, r) => a + r.totalTokens, 0) / totalRuns) : 0;
      const qualityRuns = allRuns.filter(r => r.qualityScore != null);
      const avgQuality = qualityRuns.length > 0
        ? Math.round(qualityRuns.reduce((a, r) => a + (r.qualityScore || 0), 0) / qualityRuns.length)
        : null;

      const recentRuns = allRuns.slice(0, 5).map(r => ({
        id: r.id,
        title: r.title,
        status: r.status,
        wallClockMs: r.wallClockMs,
        totalCostUsd: r.totalCostUsd,
        createdAt: r.createdAt.toISOString(),
      }));

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
        recentRuns,
      };
    });

    formattedAgents.sort((a, b) => b.runs - a.runs);

    return NextResponse.json({ success: true, agents: formattedAgents });
  } catch (error: any) {
    console.error('API Error /api/v1/agents:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
