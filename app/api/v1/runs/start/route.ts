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
    const title = body.title || 'Automated AI Agent Execution Trace';
    const modelFamily = body.model_family || body.modelFamily || 'Claude 3.5 Sonnet';

    // Find default agent or create one
    let agent = await prisma.agent.findFirst({
      where: { userId: user.id }
    });

    if (!agent) {
      agent = await prisma.agent.create({
        data: {
          userId: user.id,
          name: 'Python SDK Runner',
          framework: 'LangChain',
          modelFamily: modelFamily,
        }
      });
    }

    const maxBudgetUsd = body.max_budget_usd ? parseFloat(body.max_budget_usd) : null;
    const maxSteps = body.max_steps ? parseInt(body.max_steps, 10) : null;

    // Initialize pending Run record in database
    const run = await prisma.run.create({
      data: {
        userId: user.id,
        agentId: agent.id,
        title: title,
        description: 'Live trace telemetry captured via PathFlow Python SDK decorator',
        status: 'running',
        modelFamily: modelFamily,
        wallClockMs: 0,
        totalTokens: 0,
        actionVelocityTps: 0.0,
        totalCostUsd: 0.0,
        dagDepth: 1,
        maxBudgetUsd: maxBudgetUsd,
        maxSteps: maxSteps,
      }
    });

    return NextResponse.json({
      success: true,
      run_id: run.id,
      message: 'PathFlow run telemetry session initialized & persisted to database.',
    });
  } catch (err: any) {
    console.error('Error in /api/v1/runs/start:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
