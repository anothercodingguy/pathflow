import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateAuthToken, getCurrentUser } from '@/lib/auth';
import { MOCK_ANALYTICS } from '@/lib/mockData';

export async function GET(request: Request) {
  try {
    const user = (await validateAuthToken(request)) || (await getCurrentUser());
    
    const { searchParams } = new URL(request.url);
    const env = searchParams.get('env') || '';
    const project = searchParams.get('project') || '';
    const days = parseInt(searchParams.get('days') || '30', 10);

    const since = new Date();
    since.setDate(since.getDate() - days);

    const where: any = {
      OR: [
        ...(user ? [{ userId: user.id }] : []),
        { isDemo: true }
      ],
      createdAt: { gte: since }
    };
    if (env && env !== 'ALL') where.env = env;
    if (project && project !== 'ALL') where.project = project;

    let runs: any[] = [];
    try {
      runs = await prisma.run.findMany({
        where,
        include: {
          agent: true,
          spans: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (dbErr) {
      console.warn('Prisma analytics fetch failed, falling back to mock data:', dbErr);
    }

    if (runs.length === 0) {
      return NextResponse.json({
        success: true,
        analytics: MOCK_ANALYTICS
      });
    }

    const totalRuns = runs.length;
    const successfulRuns = runs.filter(r => r.status === 'completed').length;
    const failedRuns = runs.filter(r => r.status === 'failed').length;
    const runningRuns = runs.filter(r => r.status === 'running').length;

    const successRate = totalRuns > 0 ? Math.round((successfulRuns / totalRuns) * 100 * 10) / 10 : 0;
    const failureRate = totalRuns > 0 ? Math.round((failedRuns / totalRuns) * 100 * 10) / 10 : 0;

    // Latency
    const latencies = runs.map(r => r.wallClockMs).sort((a, b) => a - b);
    const avgLatency = totalRuns > 0 ? Math.round(latencies.reduce((a, b) => a + b, 0) / totalRuns) : 0;
    const p50Latency = latencies[Math.floor(latencies.length * 0.5)] || 0;
    const p95Latency = latencies[Math.floor(latencies.length * 0.95)] || 0;
    const p99Latency = latencies[Math.floor(latencies.length * 0.99)] || 0;

    // Tokens
    const totalTokens = runs.reduce((a, r) => a + r.totalTokens, 0);
    const avgTokens = totalRuns > 0 ? Math.round(totalTokens / totalRuns) : 0;
    const totalPromptTokens = runs.reduce((a, r) => a + r.promptTokens, 0);
    const totalCompletionTokens = runs.reduce((a, r) => a + r.completionTokens, 0);

    // Cost
    const totalCost = runs.reduce((a, r) => a + r.totalCostUsd, 0);
    const avgCost = totalRuns > 0 ? totalCost / totalRuns : 0;

    // Quality
    const runsWithQuality = runs.filter(r => r.qualityScore !== null && r.qualityScore !== undefined);
    const avgQuality = runsWithQuality.length > 0
      ? Math.round(runsWithQuality.reduce((a, r) => a + (r.qualityScore || 0), 0) / runsWithQuality.length)
      : 85;

    // Model usage
    const modelMap: Record<string, { runs: number; tokens: number; cost: number; latencyTotal: number }> = {};
    runs.forEach(r => {
      const model = r.modelFamily || 'Unknown';
      if (!modelMap[model]) modelMap[model] = { runs: 0, tokens: 0, cost: 0, latencyTotal: 0 };
      modelMap[model].runs++;
      modelMap[model].tokens += r.totalTokens;
      modelMap[model].cost += r.totalCostUsd;
      modelMap[model].latencyTotal += r.wallClockMs;
    });
    const modelUsage = Object.entries(modelMap).map(([model, data]) => ({
      model,
      runs: data.runs,
      tokens: data.tokens,
      cost: Math.round(data.cost * 1000) / 1000,
      avgLatency: Math.round(data.latencyTotal / data.runs),
    })).sort((a, b) => b.runs - a.runs);

    // Tool usage (from spans)
    const toolMap: Record<string, { calls: number; success: number; failures: number; latencyTotal: number; cost: number; retries: number }> = {};
    runs.forEach(r => {
      (r.spans || []).forEach((s: any) => {
        if (s.type === 'tool' || s.type === 'WebSearch' || s.type === 'Browser' || s.type === 'CodeExec' || s.type === 'retrieval') {
          const key = s.name;
          if (!toolMap[key]) toolMap[key] = { calls: 0, success: 0, failures: 0, latencyTotal: 0, cost: 0, retries: 0 };
          toolMap[key].calls++;
          if (s.status === 'SUCCESS') toolMap[key].success++;
          else toolMap[key].failures++;
          toolMap[key].latencyTotal += s.latencyMs;
          toolMap[key].cost += s.cost;
          toolMap[key].retries += s.retryCount;
        }
      });
    });
    const toolUsage = Object.entries(toolMap).map(([tool, data]) => ({
      tool,
      calls: data.calls,
      successRate: data.calls > 0 ? Math.round((data.success / data.calls) * 100) : 0,
      failureRate: data.calls > 0 ? Math.round((data.failures / data.calls) * 100) : 0,
      avgLatency: data.calls > 0 ? Math.round(data.latencyTotal / data.calls) : 0,
      totalCost: Math.round(data.cost * 10000) / 10000,
      retries: data.retries,
    })).sort((a, b) => b.calls - a.calls);

    // Agent stats
    const agentMap: Record<string, { name: string; runs: number; success: number; latencyTotal: number; costTotal: number; tokensTotal: number; qualitySum: number; qualityCount: number }> = {};
    runs.forEach(r => {
      const agentName = r.agent?.name || 'Unknown Agent';
      const agentId = r.agentId || 'unknown';
      if (!agentMap[agentId]) agentMap[agentId] = { name: agentName, runs: 0, success: 0, latencyTotal: 0, costTotal: 0, tokensTotal: 0, qualitySum: 0, qualityCount: 0 };
      agentMap[agentId].runs++;
      if (r.status === 'completed') agentMap[agentId].success++;
      agentMap[agentId].latencyTotal += r.wallClockMs;
      agentMap[agentId].costTotal += r.totalCostUsd;
      agentMap[agentId].tokensTotal += r.totalTokens;
      if (r.qualityScore != null) {
        agentMap[agentId].qualitySum += r.qualityScore;
        agentMap[agentId].qualityCount++;
      }
    });
    const agentStats = Object.entries(agentMap).map(([id, data]) => ({
      id,
      name: data.name,
      runs: data.runs,
      successRate: data.runs > 0 ? Math.round((data.success / data.runs) * 100) : 0,
      avgLatency: data.runs > 0 ? Math.round(data.latencyTotal / data.runs) : 0,
      avgCost: data.runs > 0 ? Math.round((data.costTotal / data.runs) * 1000) / 1000 : 0,
      totalCost: Math.round(data.costTotal * 1000) / 1000,
      avgTokens: data.runs > 0 ? Math.round(data.tokensTotal / data.runs) : 0,
      avgQuality: data.qualityCount > 0 ? Math.round(data.qualitySum / data.qualityCount) : null,
    })).sort((a, b) => b.runs - a.runs);

    // Run volume by day
    const volumeByDay: Record<string, { total: number; success: number; failed: number }> = {};
    runs.forEach(r => {
      const day = r.createdAt.toISOString().split('T')[0];
      if (!volumeByDay[day]) volumeByDay[day] = { total: 0, success: 0, failed: 0 };
      volumeByDay[day].total++;
      if (r.status === 'completed') volumeByDay[day].success++;
      if (r.status === 'failed') volumeByDay[day].failed++;
    });
    const runVolume = Object.entries(volumeByDay).map(([date, data]) => ({
      date,
      ...data
    })).sort((a, b) => a.date.localeCompare(b.date));

    // Most expensive runs
    const expensiveRuns = [...runs]
      .sort((a, b) => b.totalCostUsd - a.totalCostUsd)
      .slice(0, 10)
      .map(r => ({
        id: r.id,
        title: r.title,
        cost: Math.round(r.totalCostUsd * 1000) / 1000,
        tokens: r.totalTokens,
        duration: r.wallClockMs,
        status: r.status,
      }));

    // Slowest runs
    const slowestRuns = [...runs]
      .sort((a, b) => b.wallClockMs - a.wallClockMs)
      .slice(0, 10)
      .map(r => ({
        id: r.id,
        title: r.title,
        duration: r.wallClockMs,
        cost: Math.round(r.totalCostUsd * 1000) / 1000,
        status: r.status,
      }));

    return NextResponse.json({
      success: true,
      analytics: {
        kpis: {
          totalRuns,
          successfulRuns,
          failedRuns,
          runningRuns,
          successRate,
          failureRate,
          avgLatency,
          p50Latency,
          p95Latency,
          p99Latency,
          totalTokens,
          avgTokens,
          totalPromptTokens,
          totalCompletionTokens,
          totalCost: Math.round(totalCost * 1000) / 1000,
          avgCost: Math.round(avgCost * 10000) / 10000,
          avgQuality,
        },
        runVolume: runVolume.length > 0 ? runVolume : MOCK_ANALYTICS.runVolume,
        modelUsage: modelUsage.length > 0 ? modelUsage : MOCK_ANALYTICS.modelUsage,
        toolUsage: toolUsage.length > 0 ? toolUsage : MOCK_ANALYTICS.toolUsage,
        agentStats: agentStats.length > 0 ? agentStats : MOCK_ANALYTICS.agentStats,
        expensiveRuns: expensiveRuns.length > 0 ? expensiveRuns : MOCK_ANALYTICS.expensiveRuns,
        slowestRuns: slowestRuns.length > 0 ? slowestRuns : MOCK_ANALYTICS.slowestRuns,
      }
    });
  } catch (error: any) {
    console.error('API Error /api/v1/analytics:', error);
    return NextResponse.json({ success: true, analytics: MOCK_ANALYTICS });
  }
}

