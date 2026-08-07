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

    const totalTokens = body.total_tokens || body.totalTokens || (spansData.length > 0 ? spansData.reduce((acc: number, s: any) => acc + (s.tokens || 1000), 0) : 14200);
    const totalCostUsd = body.total_cost_usd || body.totalCostUsd || (spansData.length > 0 ? spansData.reduce((acc: number, s: any) => acc + (s.cost || 0.002), 0) : 0.024);
    
    const durationSeconds = Math.max(0.1, durationMs / 1000);
    const actionVelocityTps = parseFloat((totalTokens / durationSeconds).toFixed(1));

    const breakerTriggered = Boolean(body.breaker_triggered || body.breakerTriggered || status === 'breaker_tripped');
    const breakerReason = body.breaker_reason || body.breakerReason || (breakerTriggered ? 'Hard per-task limit enforced by PathFlow Circuit Breaker' : null);
    const runStatus = breakerTriggered ? 'breaker_tripped' : (status === 'failed' ? 'failed' : 'completed');

    // Try finding existing run by ID or create one if missing
    let existingRun = runId ? await prisma.run.findUnique({ where: { id: runId } }) : null;

    if (existingRun) {
      // Update existing run with finalized telemetry metrics
      await prisma.run.update({
        where: { id: runId },
        data: {
          wallClockMs: durationMs,
          totalTokens: totalTokens,
          totalCostUsd: totalCostUsd,
          actionVelocityTps: actionVelocityTps,
          status: runStatus,
          breakerTriggered: breakerTriggered,
          breakerReason: breakerReason,
          dagDepth: spansData.length > 0 ? spansData.length : 3,
        }
      });
    } else {
      // Create new run
      const defaultAgent = await prisma.agent.findFirst({ where: { userId: user.id } });
      existingRun = await prisma.run.create({
        data: {
          id: runId || `run_${Date.now()}`,
          userId: user.id,
          agentId: defaultAgent?.id,
          title: body.title || 'Automated AI Agent Execution Trace',
          description: 'Live trace telemetry captured via PathFlow Python SDK decorator',
          status: runStatus,
          modelFamily: body.model_family || 'Claude 3.5 Sonnet',
          wallClockMs: durationMs,
          totalTokens: totalTokens,
          totalCostUsd: totalCostUsd,
          actionVelocityTps: actionVelocityTps,
          breakerTriggered: breakerTriggered,
          breakerReason: breakerReason,
          dagDepth: spansData.length > 0 ? spansData.length : 3,
        }
      });
    }

    // Persist Spans into DB if provided
    if (spansData.length > 0) {
      await prisma.span.deleteMany({ where: { runId: existingRun.id } });
      await prisma.span.createMany({
        data: spansData.map((s: any, idx: number) => ({
          runId: existingRun!.id,
          spanId: s.spanId || s.id || `span_${idx + 1}`,
          parentSpanId: s.parentSpanId || (idx > 0 ? spansData[idx - 1].spanId || `span_${idx}` : null),
          name: s.name || `Step ${idx + 1}: ${s.type || 'LLMCall'}`,
          type: s.type || 'LLMCall',
          status: s.status || (runStatus === 'breaker_tripped' && idx === spansData.length - 1 ? 'KILLED' : (status === 'failed' && idx === spansData.length - 1 ? 'FAILED' : 'SUCCESS')),
          latencyMs: s.latencyMs || Math.round(durationMs / Math.max(1, spansData.length)),
          tokens: s.tokens || 1500,
          cost: s.cost || 0.003,
          rawInput: s.rawInput ? (typeof s.rawInput === 'string' ? s.rawInput : JSON.stringify(s.rawInput, null, 2)) : undefined,
          rawOutput: s.rawOutput ? (typeof s.rawOutput === 'string' ? s.rawOutput : JSON.stringify(s.rawOutput, null, 2)) : undefined,
          diagnosticTag: s.diagnosticTag || s.diagnostic_tag || undefined,
          diagnosticSummary: s.diagnosticSummary || s.diagnostic_summary || undefined,
        }))
      });
    } else {
      // Generate standard default span sequence if basic trace was logged
      await prisma.span.createMany({
        data: [
          {
            runId: existingRun.id,
            spanId: 'span_01',
            parentSpanId: null,
            name: 'Prompt Ingestion & Setup',
            type: 'Prompt',
            status: 'SUCCESS',
            latencyMs: Math.round(durationMs * 0.15),
            tokens: 1200,
            cost: 0.0024,
            rawInput: JSON.stringify({ trace_title: existingRun.title, status: status }, null, 2)
          },
          {
            runId: existingRun.id,
            spanId: 'span_02',
            parentSpanId: 'span_01',
            name: 'LLM Execution & Response',
            type: 'LLMCall',
            status: status === 'failed' ? 'FAILED' : 'SUCCESS',
            latencyMs: Math.round(durationMs * 0.85),
            tokens: totalTokens - 1200,
            cost: totalCostUsd - 0.0024,
            rawOutput: status === 'failed' ? JSON.stringify({ error: "Trace execution failed unexpectedly" }, null, 2) : JSON.stringify({ output: "Completed agent execution successfully." }, null, 2)
          }
        ]
      });
    }

    return NextResponse.json({
      success: true,
      run_id: existingRun.id,
      message: 'PathFlow run telemetry session finalized & persisted to database.',
    });
  } catch (err: any) {
    console.error('Error in /api/v1/runs/finish:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
