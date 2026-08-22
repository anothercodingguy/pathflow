import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, validateAuthToken } from '@/lib/auth';
import { formatRunToPathData } from '@/lib/data';

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
        spans: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!run) {
      return NextResponse.json({ success: false, error: 'Run not found' }, { status: 404 });
    }

    // Authorization: User owns run, run is public demo, or run has share token
    const isOwner = currentUser && run.userId === currentUser.id;
    if (!isOwner && !run.isDemo && !run.shareToken) {
      return NextResponse.json({ success: false, error: 'Run not found' }, { status: 404 });
    }

    const formattedPath = formatRunToPathData(run);
    return NextResponse.json({ success: true, path: formattedPath });
  } catch (error: any) {
    console.error('API Error /api/paths/[id]:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
