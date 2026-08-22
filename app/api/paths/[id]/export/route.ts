import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, validateAuthToken } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const currentUser = (await validateAuthToken(request)) || (await getCurrentUser());

    const run = await prisma.run.findUnique({
      where: { id },
      include: {
        user: true,
        agent: true,
        spans: true
      }
    });

    if (!run) {
      return NextResponse.json({ success: false, error: 'Run not found' }, { status: 404 });
    }

    const isOwner = currentUser && run.userId === currentUser.id;
    if (!isOwner && !run.isDemo) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const traceId = 'pf_trace_' + id.replace(/[^a-zA-Z0-9]/g, '');

    const otelPayload = {
      resourceSpans: [
        {
          resource: {
            attributes: [
              { key: 'service.name', value: run.agent?.name || 'PathFlow-Agent' },
              { key: 'telemetry.sdk.name', value: 'PathFlow-Python-SDK' },
              { key: 'telemetry.sdk.language', value: 'python' },
              { key: 'agent.model_family', value: run.modelFamily || 'Claude 3.5 Sonnet' }
            ]
          },
          scopeSpans: [
            {
              scope: { name: 'pathflow.tracer', version: '1.0.0' },
              spans: (run.spans || []).map(span => ({
                traceId,
                spanId: span.spanId,
                parentSpanId: span.parentSpanId || undefined,
                name: span.name,
                kind: 1,
                startTimeUnixNano: (Date.now() - span.latencyMs) + '000000',
                endTimeUnixNano: Date.now() + '000000',
                attributes: [
                  { key: 'pathflow.span_type', value: span.type },
                  { key: 'pathflow.tokens', value: span.tokens },
                  { key: 'pathflow.cost_usd', value: span.cost },
                  { key: 'pathflow.status', value: span.status }
                ],
                status: { code: span.status === 'SUCCESS' ? 1 : 2 }
              }))
            }
          ]
        }
      ]
    };

    return new NextResponse(JSON.stringify(otelPayload, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': 'attachment; filename="pathflow-trace-' + id + '.json"'
      }
    });
  } catch (error: any) {
    console.error('API Error /api/paths/[id]/export:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
