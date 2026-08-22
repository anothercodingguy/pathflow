import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, validateAuthToken } from '@/lib/auth';
import { formatRunToPathData } from '@/lib/data';

export async function GET(request: Request) {
  try {
    const currentUser = (await validateAuthToken(request)) || (await getCurrentUser());
    if (!currentUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';
    const status = searchParams.get('status') || '';
    const agent = searchParams.get('agent') || '';
    const env = searchParams.get('env') || '';
    const project = searchParams.get('project') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 200);

    const andConditions: any[] = [
      {
        OR: [
          { userId: currentUser.id },
          { isDemo: true }
        ]
      }
    ];

    if (status && status !== 'ALL') {
      andConditions.push({ status: status.toLowerCase() });
    }
    if (agent) {
      andConditions.push({ agent: { name: { contains: agent } } });
    }
    if (env && env !== 'ALL') {
      andConditions.push({ env });
    }
    if (project && project !== 'ALL') {
      andConditions.push({ project });
    }
    if (q) {
      andConditions.push({
        OR: [
          { title: { contains: q } },
          { description: { contains: q } },
          { modelFamily: { contains: q } },
          { id: { contains: q } },
        ]
      });
    }

    const where = { AND: andConditions };

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
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const currentUser = (await validateAuthToken(request)) || (await getCurrentUser());
    if (!currentUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, modelFamily, durationMs, tokens, cost, tps, spans } = body;

    let agent = await prisma.agent.findFirst({ where: { userId: currentUser.id } });
    if (!agent) {
      agent = await prisma.agent.create({
        data: {
          userId: currentUser.id,
          name: 'Custom Agent',
          framework: 'Custom',
          modelFamily: modelFamily || 'Claude 3.5 Sonnet',
        }
      });
    }

    const run = await prisma.run.create({
      data: {
        userId: currentUser.id,
        agentId: agent.id,
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
            spanId: s.spanId || ('sp_' + Date.now() + '_' + idx),
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
    console.error('API Error POST /api/paths:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
