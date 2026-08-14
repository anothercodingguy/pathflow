import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { formatRunToPathData } from '@/lib/data';

export async function GET(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';
    const status = searchParams.get('status') || '';
    const agent = searchParams.get('agent') || '';
    const env = searchParams.get('env') || '';
    const project = searchParams.get('project') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 200);

    const where: any = {};
    const userIds = currentUser ? [currentUser.id] : [];
    const defaultAdmin = await prisma.user.findFirst({
      where: { OR: [{ apiKey: 'pf_live_suyash_secret_9942' }, { email: 'admin@pathflow.dev' }] }
    });
    if (defaultAdmin && !userIds.includes(defaultAdmin.id)) {
      userIds.push(defaultAdmin.id);
    }
    if (userIds.length > 0) {
      where.OR = [
        { userId: { in: userIds } },
        { isDemo: true }
      ];
    }
    if (status && status !== 'ALL') {
      where.status = status.toLowerCase();
    }
    if (agent) {
      where.agent = { name: { contains: agent } };
    }
    if (env && env !== 'ALL') {
      where.env = env;
    }
    if (project && project !== 'ALL') {
      where.project = project;
    }
    if (q) {
      where.OR = [
        { title: { contains: q } },
        { description: { contains: q } },
        { modelFamily: { contains: q } },
        { id: { contains: q } },
      ];
    }

    const [runs, total] = await Promise.all([
      prisma.run.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: true,
          agent: true,
          spans: {
            orderBy: { createdAt: 'asc' }
          }
        }
      }),
      prisma.run.count({ where })
    ]);

    const formattedPaths = runs.map(formatRunToPathData);

    return NextResponse.json({
      success: true,
      count: formattedPaths.length,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      paths: formattedPaths
    });
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
