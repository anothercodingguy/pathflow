import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateAuthToken } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const user = await validateAuthToken(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const resourceSpans = body.resourceSpans || [];

    if (!Array.isArray(resourceSpans) || resourceSpans.length === 0) {
      return NextResponse.json({ partialSuccess: {} }, { status: 200 });
    }

    for (const rs of resourceSpans) {
      const serviceNameAttr = rs.resource?.attributes?.find((a: any) => a.key === "service.name" || a.key === "agent.name");
      const serviceName = serviceNameAttr?.value?.stringValue || "OpenTelemetry Agent";
      
      const scopeSpans = rs.scopeSpans || [];
      for (const ss of scopeSpans) {
        const otelSpans = ss.spans || [];
        if (otelSpans.length === 0) continue;

        const traceId = otelSpans[0].traceId || ('otel_' + Date.now());
        const runTitle = otelSpans[0].name || serviceName;
        
        let totalWallClockMs = 0;
        let totalTokens = 0;
        let totalCost = 0.0;
        const spansToCreate: any[] = [];

        for (const span of otelSpans) {
          const startNs = BigInt(span.startTimeUnixNano || "0");
          const endNs = BigInt(span.endTimeUnixNano || "0");
          const latencyMs = Number((endNs - startNs) / BigInt(1_000_000)) || 100;
          totalWallClockMs += latencyMs;

          let promptTokens = 0;
          let completionTokens = 0;
          let model = "Claude 3.5 Sonnet";
          let rawInput: any = null;
          let rawOutput: any = null;

          if (Array.isArray(span.attributes)) {
            for (const attr of span.attributes) {
              if (attr.key === "llm.usage.prompt_tokens" || attr.key === "gen_ai.usage.prompt_tokens") {
                promptTokens = attr.value?.intValue || 0;
              }
              if (attr.key === "llm.usage.completion_tokens" || attr.key === "gen_ai.usage.completion_tokens") {
                completionTokens = attr.value?.intValue || 0;
              }
              if (attr.key === "llm.model" || attr.key === "gen_ai.request.model") {
                model = attr.value?.stringValue || model;
              }
              if (attr.key === "llm.prompt" || attr.key === "input") {
                rawInput = attr.value?.stringValue;
              }
              if (attr.key === "llm.response" || attr.key === "output") {
                rawOutput = attr.value?.stringValue;
              }
            }
          }

          const spanTokens = promptTokens + completionTokens;
          totalTokens += spanTokens;
          const spanCost = (promptTokens * 0.000003) + (completionTokens * 0.000015);
          totalCost += spanCost;

          spansToCreate.push({
            spanId: span.spanId || ('sp_' + Date.now()),
            parentSpanId: span.parentSpanId || null,
            name: span.name || "OTel Step",
            type: span.name?.toLowerCase().includes("tool") ? "tool" : "LLMCall",
            status: span.status?.code === 2 ? "FAILED" : "SUCCESS",
            latencyMs: Math.max(1, latencyMs),
            tokens: spanTokens,
            cost: spanCost,
            model,
            rawInput: rawInput ? JSON.stringify(rawInput) : undefined,
            rawOutput: rawOutput ? JSON.stringify(rawOutput) : undefined,
          });
        }

        const existingRun = await prisma.run.findUnique({
          where: { id: traceId },
        });

        if (!existingRun) {
          await prisma.run.create({
            data: {
              id: traceId,
              userId: user.id,
              title: runTitle,
              modelFamily: "OpenTelemetry / OTLP",
              wallClockMs: Math.max(1, totalWallClockMs),
              totalTokens,
              totalCostUsd: totalCost,
              actionVelocityTps: 120.0,
              status: "completed",
              spans: {
                create: spansToCreate,
              },
            },
          });
        } else if (existingRun.userId === user.id) {
          for (const s of spansToCreate) {
            await prisma.span.create({
              data: {
                runId: existingRun.id,
                ...s,
              },
            });
          }
        }
      }
    }

    return NextResponse.json({ partialSuccess: {} }, { status: 200 });
  } catch (error: any) {
    console.error("[OTel Ingestion Error]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
