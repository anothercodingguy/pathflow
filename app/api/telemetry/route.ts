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
    const title = body.title || body.name || 'OpenTelemetry Ingested Trace';
    const spans = body.spans || [];

    const defaultAgent = await prisma.agent.findFirst({ where: { userId: user.id } });

    const totalTokens = body.tokens || (spans.length > 0 ? spans.reduce((acc: number, s: any) => acc + (s.tokens || 1000), 0) : 12400);
    const totalCostUsd = body.cost || (spans.length > 0 ? spans.reduce((acc: number, s: any) => acc + (s.cost || 0.002), 0) : 0.02);
    const durationMs = body.durationMs || (spans.length > 0 ? spans.reduce((acc: number, s: any) => acc + (s.latencyMs || 200), 0) : 5200);
    const tps = parseFloat((totalTokens / Math.max(0.1, durationMs / 1000)).toFixed(1));

    const run = await prisma.run.create({
      data: {
        userId: user.id,
        agentId: defaultAgent?.id,
        title: title,
        description: 'Ingested via PathFlow OpenTelemetry Collector Protocol',
        status: body.status || 'completed',
        modelFamily: body.modelFamily || 'Claude 3.5 Sonnet',
        wallClockMs: durationMs,
        totalTokens: totalTokens,
        totalCostUsd: totalCostUsd,
        actionVelocityTps: tps,
        dagDepth: spans.length > 0 ? spans.length : 3,
        spans: spans.length > 0 ? {
          create: spans.map((s: any, idx: number) => ({
            spanId: s.spanId || `span_${idx + 1}`,
            parentSpanId: s.parentSpanId || (idx > 0 ? spans[idx - 1].spanId : null),
            name: s.name || `Step ${idx + 1}`,
            type: s.type || 'LLMCall',
            status: s.status || 'SUCCESS',
            latencyMs: s.latencyMs || 400,
            tokens: s.tokens || 1000,
            cost: s.cost || 0.002,
            rawInput: s.rawInput ? JSON.stringify(s.rawInput, null, 2) : undefined,
            rawOutput: s.rawOutput ? JSON.stringify(s.rawOutput, null, 2) : undefined,
          }))
        } : undefined
      }
    });

    return NextResponse.json({
      success: true,
      runId: run.id,
      message: 'Telemetry successfully ingested into PathFlow database.',
    });
  } catch (err: any) {
    console.error('Error in /api/telemetry:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
