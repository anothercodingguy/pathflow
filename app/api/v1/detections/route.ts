import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { formatRunToPathData } from '@/lib/data';
import { runDetections } from '@/lib/detections';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const runId = searchParams.get('runId') || '';
    const type = searchParams.get('type') || '';
    const severity = searchParams.get('severity') || '';

    // If runId is provided, run detections on-demand for that trace
    if (runId) {
      const run = await prisma.run.findUnique({
        where: { id: runId },
        include: { agent: true, spans: { orderBy: { createdAt: 'asc' } } }
      });
      if (!run) {
        return NextResponse.json({ success: false, error: 'Run not found' }, { status: 404 });
      }

      const pathData = formatRunToPathData(run);
      let detections = runDetections(pathData);

      if (type) detections = detections.filter(d => d.type === type);
      if (severity) detections = detections.filter(d => d.severity === severity);

      return NextResponse.json({ success: true, runId, count: detections.length, detections });
    }

    // Otherwise, run detections across all recent runs
    const runs = await prisma.run.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { agent: true, spans: { orderBy: { createdAt: 'asc' } } }
    });

    const allDetections: Array<{ runId: string; runTitle: string; runStatus: string; detection: any }> = [];

    for (const run of runs) {
      const pathData = formatRunToPathData(run);
      const detections = runDetections(pathData);
      detections.forEach(d => {
        if ((!type || d.type === type) && (!severity || d.severity === severity)) {
          allDetections.push({
            runId: run.id,
            runTitle: run.title,
            runStatus: run.status,
            detection: d,
          });
        }
      });
    }

    // Sort by severity
    const severityOrder: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3, INFO: 4 };
    allDetections.sort((a, b) => (severityOrder[a.detection.severity] || 5) - (severityOrder[b.detection.severity] || 5));

    return NextResponse.json({
      success: true,
      count: allDetections.length,
      detections: allDetections,
    });
  } catch (error: any) {
    console.error('API Error /api/v1/detections:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
