import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateAuthToken } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const user = await validateAuthToken(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Invalid API key' }, { status: 401 });
    }

    const body = await request.json();
    const runId = body.run_id || body.runId;
    const spanData = body.span;

    if (!runId) {
      return NextResponse.json({ success: false, error: 'Missing run_id' }, { status: 400 });
    }

    const run = await prisma.run.findFirst({
      where: { id: runId, userId: user.id }
    });
    if (!run) {
      return NextResponse.json({ success: false, error: 'Run not found or unauthorized' }, { status: 404 });
    }

    if (spanData) {
      await prisma.span.create({
        data: {
          runId: run.id,
          spanId: spanData.spanId || ('sp_' + Date.now()),
          parentSpanId: spanData.parentSpanId || null,
          name: spanData.name || 'Span Step',
          type: spanData.type || 'LLMCall',
          status: spanData.status || 'SUCCESS',
          latencyMs: spanData.latencyMs || 250,
          tokens: spanData.tokens || 500,
          cost: spanData.cost || 0.001,
          rawInput: spanData.rawInput ? JSON.stringify(spanData.rawInput, null, 2) : undefined,
          rawOutput: spanData.rawOutput ? JSON.stringify(spanData.rawOutput, null, 2) : undefined,
          diagnosticTag: spanData.diagnosticTag || undefined,
          diagnosticSummary: spanData.diagnosticSummary || undefined
        }
      });
    }

    return NextResponse.json({
      success: true,
      run_id: runId
    });
  } catch (err: any) {
    console.error('Error in /api/v1/runs/step:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
