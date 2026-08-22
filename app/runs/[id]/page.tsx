import React from 'react';
import TraceHeroInspector from '@/components/TraceHeroInspector';
import { prisma } from '@/lib/prisma';
import { formatRunToPathData } from '@/lib/data';
import { notFound } from 'next/navigation';

interface RunInspectorPageProps {
  params: Promise<{ id: string }>;
}

export default async function RunInspectorPage({ params }: RunInspectorPageProps) {
  const { id } = await params;

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
    notFound();
  }

  return <TraceHeroInspector run={formatRunToPathData(run)} />;
}
