import React from 'react';
import TraceHeroInspector from '@/components/TraceHeroInspector';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';

interface RunInspectorPageProps {
  params: Promise<{ id: string }>;
}

export default async function RunInspectorPage({ params }: RunInspectorPageProps) {
  const { id } = await params;

  // Direct database query for real production trace details
  const run = await prisma.run.findUnique({
    where: { id },
    include: {
      user: true,
      agent: true,
      spans: {
        orderBy: { createdAt: 'asc' }
      }
    }
  });

  if (!run) {
    // Check fallback for default path IDs (e.g. path-1, path-2, path-3)
    const fallbackRun = await prisma.run.findFirst({
      include: {
        user: true,
        agent: true,
        spans: { orderBy: { createdAt: 'asc' } }
      }
    });

    if (!fallbackRun) {
      notFound();
    }

    const formattedFallback = {
      id: fallbackRun.id,
      title: fallbackRun.title,
      description: fallbackRun.description || '',
      agent: {
        id: fallbackRun.agent?.id || '',
        name: fallbackRun.agent?.name || 'Agent',
        framework: fallbackRun.agent?.framework || 'Custom',
      },
      status: fallbackRun.status.toUpperCase(),
      tps: fallbackRun.actionVelocityTps,
      cost: fallbackRun.totalCostUsd,
      tokens: fallbackRun.totalTokens,
      durationMs: fallbackRun.wallClockMs,
      elevationDepth: fallbackRun.dagDepth,
      modelFamily: fallbackRun.modelFamily,
      createdAt: new Date(fallbackRun.createdAt).toLocaleString(),
      spans: fallbackRun.spans.map(s => ({
        id: s.id,
        spanId: s.spanId,
        name: s.name,
        type: s.type,
        status: s.status,
        latencyMs: s.latencyMs,
        tokens: s.tokens,
        cost: s.cost,
        rawInput: s.rawInput || undefined,
        rawOutput: s.rawOutput || undefined,
        parentSpanId: s.parentSpanId || undefined
      }))
    };

    return <TraceHeroInspector run={formattedFallback as any} />;
  }

  const formattedRun = {
    id: run.id,
    title: run.title,
    description: run.description || '',
    agent: {
      id: run.agent?.id || '',
      name: run.agent?.name || 'Agent',
      framework: run.agent?.framework || 'Custom',
    },
    status: run.status.toUpperCase(),
    tps: run.actionVelocityTps,
    cost: run.totalCostUsd,
    tokens: run.totalTokens,
    durationMs: run.wallClockMs,
    elevationDepth: run.dagDepth,
    modelFamily: run.modelFamily,
    createdAt: new Date(run.createdAt).toLocaleString(),
    spans: run.spans.map(s => ({
      id: s.id,
      spanId: s.spanId,
      name: s.name,
      type: s.type,
      status: s.status,
      latencyMs: s.latencyMs,
      tokens: s.tokens,
      cost: s.cost,
      rawInput: s.rawInput || undefined,
      rawOutput: s.rawOutput || undefined,
      parentSpanId: s.parentSpanId || undefined
    }))
  };

  return <TraceHeroInspector run={formattedRun as any} />;
}
