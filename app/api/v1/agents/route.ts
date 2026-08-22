import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateAuthToken, getCurrentUser } from '@/lib/auth';
import { MOCK_AGENTS } from '@/lib/mockData';

export async function GET(request: Request) {
  try {
    const user = (await validateAuthToken(request)) || (await getCurrentUser());

    let agents: any[] = [];
    try {
      agents = await prisma.agent.findMany({
        where: user ? {
          OR: [
            { userId: user.id },
            { id: { in: ['agent-code', 'agent-browser', 'agent-research', 'agent-support'] } }
          ]
        } : undefined,
        include: {
          runs: {
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
    } catch (dbErr) {
      console.warn('Prisma agents fetch failed, falling back to mock data:', dbErr);
    }

    if (agents.length === 0) {
      return NextResponse.json({ success: true, agents: MOCK_AGENTS });
    }

    const formattedAgents = agents.map((agent) => {
      const allRuns = agent.runs || [];
      const totalRuns = allRuns.length;

      const successCount = allRuns.filter((r: any) => r.status === 'completed').length;
      const successRate = totalRuns > 0 ? Math.round((successCount / totalRuns) * 100) : 0;
      const avgLatency = totalRuns > 0 ? Math.round(allRuns.reduce((a: number, r: any) => a + r.wallClockMs, 0) / totalRuns) : 0;
      const avgCost = totalRuns > 0 ? allRuns.reduce((a: number, r: any) => a + r.totalCostUsd, 0) / totalRuns : 0;
      const totalCost = allRuns.reduce((a: number, r: any) => a + r.totalCostUsd, 0);
      const avgTokens = totalRuns > 0 ? Math.round(allRuns.reduce((a: number, r: any) => a + r.totalTokens, 0) / totalRuns) : 0;
      const qualityRuns = allRuns.filter((r: any) => r.qualityScore != null);
      const avgQuality = qualityRuns.length > 0
        ? Math.round(qualityRuns.reduce((a: number, r: any) => a + (r.qualityScore || 0), 0) / qualityRuns.length)
        : null;

      const recentRuns = allRuns.slice(0, 5).map((r: any) => ({
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

    return NextResponse.json({ success: true, agents: formattedAgents.length > 0 ? formattedAgents : MOCK_AGENTS });
  } catch (error: any) {
    console.error('API Error /api/v1/agents:', error);
    return NextResponse.json({ success: true, agents: MOCK_AGENTS });
  }
}

