import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { formatRunToPathData } from '@/lib/data';
import { runDetections } from '@/lib/detections';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const runId = body.runId || body.run_id;

    if (!runId) {
      return NextResponse.json({ success: false, error: 'runId is required' }, { status: 400 });
    }

    const run = await prisma.run.findUnique({
      where: { id: runId },
      include: {
        agent: true,
        spans: { orderBy: { createdAt: 'asc' } },
      }
    });

    if (!run) {
      return NextResponse.json({ success: false, error: 'Run not found' }, { status: 404 });
    }

    const pathData = formatRunToPathData(run);
    const detections = runDetections(pathData);

    // Build structured investigation analysis
    const isFailed = run.status === 'failed';
    const hasDetections = detections.length > 0;
    const failedSpans = (run.spans || []).filter(s => s.status === 'FAILED');
    const totalCost = run.totalCostUsd;
    const totalDuration = run.wallClockMs;
    const totalTokens = run.totalTokens;

    // Rule-based root cause analysis
    let rootCause = '';
    const evidence: string[] = [];
    let impact = '';
    let recommendation = '';
    let confidence = 0;

    // Observed facts
    const observed: string[] = [
      `Run status: ${run.status.toUpperCase()}`,
      `Duration: ${(totalDuration / 1000).toFixed(1)}s`,
      `Total tokens: ${totalTokens.toLocaleString()}`,
      `Total cost: $${totalCost.toFixed(3)}`,
      `Spans: ${run.spans.length}`,
      `Failed spans: ${failedSpans.length}`,
      `Detections: ${detections.length}`,
    ];

    // Inferred conclusions
    const inferred: string[] = [];
    const suggested: string[] = [];

    if (isFailed) {
      // Find root cause from failed spans
      const firstFailure = failedSpans[0];
      if (firstFailure) {
        rootCause = `The run failed because "${firstFailure.name}" encountered a ${firstFailure.errorType || 'runtime'} error: ${firstFailure.errorMessage || firstFailure.diagnosticSummary || 'Unknown error'}.`;
        evidence.push(`First failure: ${firstFailure.name} (${firstFailure.type})`);
        evidence.push(`Error: ${firstFailure.errorMessage || firstFailure.diagnosticSummary || 'Unknown'}`);
        confidence = 78;

        if (firstFailure.retryCount > 0) {
          evidence.push(`Retried ${firstFailure.retryCount} times before failing`);
          inferred.push(`The retry mechanism was unable to recover from the error after ${firstFailure.retryCount} attempts.`);
          confidence = 85;
        }
      }

      // Check for tool loop causing failure
      const toolLoopDetection = detections.find(d => d.type === 'TOOL_LOOP');
      if (toolLoopDetection) {
        rootCause = `The agent entered a tool selection loop, repeatedly calling the same tool. ${rootCause}`;
        evidence.push(toolLoopDetection.description);
        inferred.push('The planner failed to recognize that previous tool calls already returned sufficient data.');
        suggested.push('Add a result-sufficiency check before invoking the tool again.');
        confidence = Math.max(confidence, 87);
      }

      // Check for error propagation
      const errorPropDetection = detections.find(d => d.type === 'ERROR_PROPAGATION');
      if (errorPropDetection) {
        inferred.push('A failure in an upstream dependency cascaded to downstream operations.');
        suggested.push('Add error isolation — failed upstream steps should not always block downstream execution.');
      }

      // Check for retry issues
      const retryDetection = detections.find(d => d.type === 'EXCESSIVE_RETRY');
      if (retryDetection) {
        inferred.push('Excessive retries consumed significant time without resolving the underlying issue.');
        suggested.push('Implement exponential backoff with jitter, or add a circuit breaker to fail fast.');
      }
    } else {
      // Successful but possibly problematic
      if (detections.length > 0) {
        const criticalDetections = detections.filter(d => d.severity === 'CRITICAL' || d.severity === 'HIGH');
        if (criticalDetections.length > 0) {
          rootCause = `While the run completed successfully, ${criticalDetections.length} significant issue(s) were detected that may impact reliability and cost.`;
          criticalDetections.forEach(d => {
            evidence.push(d.description);
            inferred.push(d.impact);
            suggested.push(d.recommendation);
          });
          confidence = 72;
        } else {
          rootCause = 'The run completed successfully with minor optimization opportunities.';
          detections.forEach(d => {
            evidence.push(d.description);
            suggested.push(d.recommendation);
          });
          confidence = 65;
        }
      } else {
        rootCause = 'The run completed successfully with no significant issues detected.';
        confidence = 90;
      }
    }

    // Calculate impact
    const unnecessaryCost = detections.reduce((sum, d) => {
      const costMatch = d.impact.match(/\$([0-9.]+)/);
      return sum + (costMatch ? parseFloat(costMatch[1]) : 0);
    }, 0);
    const unnecessaryLatency = detections.reduce((sum, d) => {
      const latencyMatch = d.impact.match(/([0-9.]+)s/);
      return sum + (latencyMatch ? parseFloat(latencyMatch[1]) : 0);
    }, 0);

    if (unnecessaryCost > 0 || unnecessaryLatency > 0) {
      impact = `Estimated waste: ${unnecessaryLatency > 0 ? `+${unnecessaryLatency.toFixed(1)}s latency` : ''}${unnecessaryCost > 0 ? ` +$${unnecessaryCost.toFixed(4)} cost` : ''}`;
    } else {
      impact = isFailed ? 'Run failed to produce output.' : 'No significant waste detected.';
    }

    recommendation = suggested.length > 0
      ? suggested[0]
      : isFailed
        ? 'Investigate the root cause error and add appropriate error handling.'
        : 'No immediate action required.';

    // Save investigation to database
    const investigation = await prisma.investigation.create({
      data: {
        runId,
        rootCause,
        evidence: JSON.stringify(evidence),
        impact,
        recommendation,
        confidence,
        observed: JSON.stringify(observed),
        inferred: JSON.stringify(inferred),
        suggested: JSON.stringify(suggested),
        status: 'COMPLETED',
      }
    });

    return NextResponse.json({
      success: true,
      investigation: {
        id: investigation.id,
        runId: investigation.runId,
        rootCause: investigation.rootCause,
        evidence,
        impact: investigation.impact,
        recommendation: investigation.recommendation,
        confidence: investigation.confidence,
        observed,
        inferred,
        suggested,
        detections: detections.map(d => ({
          type: d.type,
          severity: d.severity,
          title: d.title,
          description: d.description,
          impact: d.impact,
          recommendation: d.recommendation,
        })),
        status: investigation.status,
        createdAt: investigation.createdAt,
      },
    });
  } catch (error: any) {
    console.error('API Error /api/v1/investigations:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const runId = searchParams.get('runId') || '';

    const where: any = {};
    if (runId) where.runId = runId;

    const investigations = await prisma.investigation.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({
      success: true,
      count: investigations.length,
      investigations: investigations.map(inv => ({
        ...inv,
        evidence: inv.evidence ? JSON.parse(inv.evidence) : [],
        observed: inv.observed ? JSON.parse(inv.observed) : [],
        inferred: inv.inferred ? JSON.parse(inv.inferred) : [],
        suggested: inv.suggested ? JSON.parse(inv.suggested) : [],
      })),
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
