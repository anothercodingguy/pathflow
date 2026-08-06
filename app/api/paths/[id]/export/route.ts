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
        spans: true
      }
    });

    const traceId = `pf_trace_${id.replace(/[^a-zA-Z0-9]/g, '')}`;

    // Standard OpenTelemetry JSON Export Schema
    const otelPayload = {
      resourceSpans: [
        {
          resource: {
            attributes: [
              { key: 'service.name', value: run?.agent?.name || 'PathFlow-Agent' },
              { key: 'telemetry.sdk.name', value: 'PathFlow-Python-SDK' },
              { key: 'telemetry.sdk.language', value: 'python' },
              { key: 'agent.model_family', value: run?.modelFamily || 'Claude 3.5 Sonnet' }
            ]
          },
          scopeSpans: [
            {
              scope: { name: 'pathflow.tracer', version: '1.0.0' },
              spans: (run?.spans || []).map(span => ({
                traceId,
                spanId: span.spanId,
                parentSpanId: span.parentSpanId || undefined,
                name: span.name,
                kind: 1, // SPAN_KIND_INTERNAL
                startTimeUnixNano: `${Date.now() - span.latencyMs}000000`,
                endTimeUnixNano: `${Date.now()}000000`,
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
        'Content-Disposition': `attachment; filename="pathflow-trace-${id}.json"`
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
