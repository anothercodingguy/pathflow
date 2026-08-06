import React from 'react';
import TraceDiff from '@/components/TraceDiff';

interface ComparePageProps {
  searchParams: Promise<{ left?: string; right?: string }>;
}

export default async function ComparePage({ searchParams }: ComparePageProps) {
  const { left, right } = await searchParams;

  return <TraceDiff initialLeftId={left} initialRightId={right} />;
}
