import React from 'react';
import { getPathById, MOCK_PATHS } from '@/lib/data';
import TraceInspector from '@/components/TraceInspector';
import { notFound } from 'next/navigation';

export function generateStaticParams() {
  return MOCK_PATHS.map((path) => ({
    id: path.id,
  }));
}

interface PathInspectorPageProps {
  params: Promise<{ id: string }>;
}

export default async function PathInspectorPage({ params }: PathInspectorPageProps) {
  const { id } = await params;
  const path = getPathById(id);

  if (!path) {
    notFound();
  }

  return <TraceInspector run={path as any} />;
}
