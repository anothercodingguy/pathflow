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
    const durationMs = body.wall_clock_ms || body.wallClockMs || 1200;
    const status = (body.status || 'completed').toLowerCase();
    const spansData = body.spans || [];

    const spansTokensSum = spansData.reduce((acc: number, s: any) => acc + (s.tokens || 0), 0);
    const spansCostSum = spansData.reduce((acc: number, s: any) => acc + (s.cost || 0), 0);

    const totalTokens = typeof body.total_tokens === 'number' ? body.total_tokens : (typeof body.totalTokens === 'number' ? body.totalTokens : spansTokensSum);
    const totalCostUsd = typeof body.total_cost_usd === 'number' ? body.total_cost_usd : (typeof body.totalCostUsd === 'number' ? body.totalCostUsd : spansCostSum);
    
    const durationSeconds = Math.max(0.1, durationMs / 1000);
    const actionVelocityTps = totalTokens > 0 ? parseFloat((totalTokens / durationSeconds).toFixed(1)) : 0.0;

    const project = body.project || 'default';
    const env = body.env || 'production';
    const runStatus = status === 'failed' ? 'failed' : 'completed';

    let existingRun = runId ? await prisma.run.findUnique({ where: { id: runId } }) : null;

    if (existingRun) {
      if (existingRun.userId !== user.id) {
        return NextResponse.json({ success: false, error: 'Forbidden: Run belongs to another account' }, { status: 403 });
      }

      await prisma.run.update({
        where: { id: runId },
        data: {
          wallClockMs: durationMs,
          totalTokens: totalTokens,
          totalCostUsd: totalCostUsd,
          actionVelocityTps: actionVelocityTps,
          status: runStatus,
          project: project,
          env: env,
          dagDepth: spansData.length > 0 ? spansData.length : 3,
        }
      });
    } else {
      let defaultAgent = await prisma.agent.findFirst({ where: { userId: user.id } });
      if (!defaultAgent) {
        defaultAgent = await prisma.agent.create({
          data: {
            userId: user.id,
            name: 'Python SDK Runner',
            framework: body.framework || 'Custom',
            modelFamily: body.model_family || 'Claude 3.5 Sonnet',
          }
        });
      }

      existingRun = await prisma.run.create({
        data: {
          id: runId || ('run_' + Date.now()),
          userId: user.id,
          agentId: defaultAgent.id,
          title: body.title || 'Automated AI Agent Execution Trace',
          description: 'Live trace telemetry captured via PathFlow Python SDK decorator',
          status: runStatus,
          modelFamily: body.model_family || 'Claude 3.5 Sonnet',
          wallClockMs: durationMs,
          totalTokens: totalTokens,
          totalCostUsd: totalCostUsd,
          actionVelocityTps: actionVelocityTps,
          project: project,
          env: env,
          dagDepth: spansData.length > 0 ? spansData.length : 3,
        }
      });
    }

    if (spansData.length > 0) {
      await prisma.span.deleteMany({ where: { runId: existingRun.id } });
      await prisma.span.createMany({
        data: spansData.map((s: any, idx: number) => ({
          runId: existingRun.id,
          spanId: s.spanId || s.id || ('span_' + (idx + 1)),
          parentSpanId: s.parentSpanId || (idx > 0 ? spansData[idx - 1].spanId || ('span_' + idx) : null),
          name: s.name || ('Step ' + (idx + 1) + ': ' + (s.type || 'LLMCall')),
          type: s.type || 'LLMCall',
          status: s.status || (status === 'failed' && idx === spansData.length - 1 ? 'FAILED' : 'SUCCESS'),
          latencyMs: s.latencyMs || Math.round(durationMs / Math.max(1, spansData.length)),
          tokens: typeof s.tokens === 'number' ? s.tokens : 0,
          cost: typeof s.cost === 'number' ? s.cost : 0.0,
          rawInput: s.rawInput ? (typeof s.rawInput === 'string' ? s.rawInput : JSON.stringify(s.rawInput, null, 2)) : undefined,
          rawOutput: s.rawOutput ? (typeof s.rawOutput === 'string' ? s.rawOutput : JSON.stringify(s.rawOutput, null, 2)) : undefined,
          diagnosticTag: s.diagnosticTag || s.diagnostic_tag || undefined,
          diagnosticSummary: s.diagnosticSummary || s.diagnostic_summary || undefined,
        }))
      });
    }

    return NextResponse.json({
      success: true,
      run_id: existingRun.id,
      message: 'PathFlow run telemetry session finalized & persisted to database.',
    });
  } catch (err: any) {
    console.error('Error in /api/v1/runs/finish:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
