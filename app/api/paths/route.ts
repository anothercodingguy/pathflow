import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';
    const status = searchParams.get('status') || '';

    const where: any = {};
    if (currentUser) {
      const userIds = [currentUser.id];
      const defaultAdmin = await prisma.user.findFirst({
        where: { OR: [{ apiKey: 'pf_live_suyash_secret_9942' }, { email: 'admin@pathflow.dev' }] }
      });
      if (defaultAdmin && !userIds.includes(defaultAdmin.id)) {
        userIds.push(defaultAdmin.id);
      }
      where.userId = { in: userIds };
    }
    if (status && status !== 'ALL') {
      where.status = status.toLowerCase();
    }
    if (q) {
      where.OR = [
        { title: { contains: q } },
        { description: { contains: q } },
        { modelFamily: { contains: q } }
      ];
    }

    const runs = await prisma.run.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: true,
        agent: true,
        spans: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    const formattedPaths = runs.map(run => ({
      id: run.id,
      title: run.title,
      description: run.description || '',
      agent: {
        id: run.agent?.id || '',
        name: run.agent?.name || 'CodeRefactor Agent',
        framework: run.agent?.framework || 'Custom',
      },
      status: run.status.toUpperCase(),
      tps: run.actionVelocityTps,
      cost: run.totalCostUsd,
      tokens: run.totalTokens,
      durationMs: run.wallClockMs,
      elevationDepth: run.dagDepth,
      modelFamily: run.modelFamily,
      createdAt: new Date(run.createdAt).toLocaleString(),
      project: run.project || 'default',
      env: run.env || 'production',
      spans: run.spans.map(s => ({
        id: s.id,
        spanId: s.spanId,
        name: s.name,
        type: s.type,
        status: s.status,
        latencyMs: s.latencyMs,
        tokens: s.tokens,
        cost: s.cost,
        rawInput: s.rawInput,
        rawOutput: s.rawOutput,
        diagnosticTag: s.diagnosticTag || undefined,
        diagnosticSummary: s.diagnosticSummary || undefined,
        parentSpanId: s.parentSpanId || undefined
      }))
    }));

    return NextResponse.json({ success: true, count: formattedPaths.length, paths: formattedPaths });
  } catch (error: any) {
    console.error('API Error /api/paths:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description, modelFamily, durationMs, tokens, cost, tps, spans } = body;

    const defaultUser = await prisma.user.findFirst();
    const defaultAgent = await prisma.agent.findFirst();

    if (!defaultUser) {
      return NextResponse.json({ success: false, error: 'Database uninitialized' }, { status: 400 });
    }

    const run = await prisma.run.create({
      data: {
        userId: defaultUser.id,
        agentId: defaultAgent?.id,
        title: title || 'New Agent Execution Trace',
        description: description || 'Automated agent execution trace logged via API',
        modelFamily: modelFamily || 'Claude 3.5 Sonnet',
        wallClockMs: durationMs || 5000,
        totalTokens: tokens || 12000,
        totalCostUsd: cost || 0.02,
        actionVelocityTps: tps || 120.0,
        dagDepth: spans ? spans.length : 3,
        status: 'completed',
        spans: spans ? {
          create: spans.map((s: any, idx: number) => ({
            spanId: s.spanId || `sp_${Date.now()}_${idx}`,
            parentSpanId: s.parentSpanId || (idx > 0 ? spans[idx - 1].spanId : null),
            name: s.name || s.type || 'Step',
            type: s.type || 'LLMCall',
            status: s.status || 'SUCCESS',
            latencyMs: s.latencyMs || 500,
            tokens: s.tokens || 1000,
            cost: s.cost || 0.002,
            rawInput: s.rawInput ? JSON.stringify(s.rawInput, null, 2) : undefined,
            rawOutput: s.rawOutput ? JSON.stringify(s.rawOutput, null, 2) : undefined
          }))
        } : undefined
      },
      include: { user: true, agent: true, spans: true }
    });

    return NextResponse.json({ success: true, run });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
