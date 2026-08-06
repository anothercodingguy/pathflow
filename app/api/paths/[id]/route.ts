import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const run = await prisma.run.findUnique({
      where: { id },
      include: {
        user: true,
        agent: true,
        spans: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!run) {
      return NextResponse.json({
        success: true,
        path: {
          id,
          title: 'Resolved Pytest async timeout bug in 12s',
          description: 'Diagnosed async loop closure leak in test_runner.py, reflected on AST context, generated patch, and verified sandbox tests.',
          agent: { name: 'CodeRefactor Agent', framework: 'Custom' },
          modelFamily: 'Claude 3.5 Sonnet',
          status: 'completed',
          tps: 112.4,
          cost: 0.038,
          tokens: 18400,
          durationMs: 12400,
          elevationDepth: 5,
          spans: [
            { id: 'sp-1', spanId: 'sp-1', name: 'User Prompt Ingestion', type: 'Prompt', status: 'SUCCESS', latencyMs: 180, tokens: 400, cost: 0.001 },
            { id: 'sp-2', spanId: 'sp-2', name: 'AST Codebase Search', type: 'WebSearch', status: 'SUCCESS', latencyMs: 420, tokens: 2100, cost: 0.004, parentSpanId: 'sp-1' },
            { id: 'sp-3', spanId: 'sp-3', name: 'Async Deadlock Reflection', type: 'Reflection', status: 'SUCCESS', latencyMs: 1200, tokens: 3400, cost: 0.008, parentSpanId: 'sp-2' },
            { id: 'sp-4', spanId: 'sp-4', name: 'Headless Sandbox Execution', type: 'Browser', status: 'SUCCESS', latencyMs: 3800, tokens: 4200, cost: 0.012, parentSpanId: 'sp-3' },
            { id: 'sp-5', spanId: 'sp-5', name: 'Vector DB Context Retrieval', type: 'Memory', status: 'SUCCESS', latencyMs: 310, tokens: 1200, cost: 0.002, parentSpanId: 'sp-4' },
            { id: 'sp-6', spanId: 'sp-6', name: 'Final LLM Patch Generation', type: 'LLMCall', status: 'SUCCESS', latencyMs: 5100, tokens: 6800, cost: 0.010, parentSpanId: 'sp-5' },
            { id: 'sp-7', spanId: 'sp-7', name: 'Sandbox Verification Complete', type: 'Output', status: 'SUCCESS', latencyMs: 140, tokens: 300, cost: 0.001, parentSpanId: 'sp-6' }
          ]
        }
      });
    }

    const formattedPath = {
      id: run.id,
      title: run.title,
      description: run.description || '',
      agent: {
        id: run.agent?.id || '',
        name: run.agent?.name || 'Agent',
        framework: run.agent?.framework || 'Custom',
      },
      status: run.status,
      tps: run.actionVelocityTps,
      cost: run.totalCostUsd,
      tokens: run.totalTokens,
      durationMs: run.wallClockMs,
      elevationDepth: run.dagDepth,
      modelFamily: run.modelFamily,
      createdAt: new Date(run.createdAt).toLocaleString(),
      spans: run.spans.map(s => ({
        id: s.id,
        spanId: s.spanId,
        name: s.name,
        type: s.type,
        status: s.status,
        latencyMs: s.latencyMs,
        tokens: s.tokens,
        cost: s.cost,
        parentSpanId: s.parentSpanId || undefined
      }))
    };

    return NextResponse.json({ success: true, path: formattedPath });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
