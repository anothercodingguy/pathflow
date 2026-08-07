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
    const currentCost = parseFloat(body.current_cost_usd || body.currentCostUsd || 0.0);
    const stepCount = parseInt(body.step_count || body.stepCount || 1, 10);
    const spanData = body.span;

    if (!runId) {
      return NextResponse.json({ success: false, error: 'Missing run_id' }, { status: 400 });
    }

    const run = await prisma.run.findUnique({ where: { id: runId } });
    if (!run) {
      return NextResponse.json({ success: true, tripped: false, message: 'Run not found, continuing' });
    }

    let tripped = false;
    let tripReason = '';

    // Check 1: Max Budget Cap
    if (run.maxBudgetUsd && currentCost >= run.maxBudgetUsd) {
      tripped = true;
      tripReason = `HARD_BUDGET_CAP_EXCEEDED: Capped at $${run.maxBudgetUsd.toFixed(2)} USD (Current: $${currentCost.toFixed(3)} USD)`;
    }

    // Check 2: Max Steps Loop Breaker
    if (!tripped && run.maxSteps && stepCount > run.maxSteps) {
      tripped = true;
      tripReason = `MAX_STEPS_LOOP_DETECTED: Exceeded limit of ${run.maxSteps} iterations (Current step: ${stepCount})`;
    }

    if (tripped) {
      // Mark run in DB as tripped
      await prisma.run.update({
        where: { id: runId },
        data: {
          status: 'breaker_tripped',
          breakerTriggered: true,
          breakerReason: tripReason,
          totalCostUsd: currentCost
        }
      });
    }

    // Save the span if provided
    if (spanData) {
      await prisma.span.create({
        data: {
          runId: run.id,
          spanId: spanData.spanId || `sp_${Date.now()}_${stepCount}`,
          parentSpanId: spanData.parentSpanId || null,
          name: spanData.name || `Step ${stepCount}`,
          type: spanData.type || 'LLMCall',
          status: tripped ? 'KILLED' : (spanData.status || 'SUCCESS'),
          latencyMs: spanData.latencyMs || 250,
          tokens: spanData.tokens || 500,
          cost: spanData.cost || 0.001,
          rawInput: spanData.rawInput ? JSON.stringify(spanData.rawInput, null, 2) : undefined,
          rawOutput: spanData.rawOutput ? JSON.stringify(spanData.rawOutput, null, 2) : undefined,
          diagnosticTag: tripped ? 'CIRCUIT_BREAKER_KILL' : (spanData.diagnosticTag || undefined),
          diagnosticSummary: tripped ? tripReason : (spanData.diagnosticSummary || undefined)
        }
      });
    }

    return NextResponse.json({
      success: true,
      tripped: tripped,
      reason: tripReason,
      run_id: runId
    });
  } catch (err: any) {
    console.error('Error in /api/v1/runs/step:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
