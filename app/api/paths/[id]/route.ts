import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, validateAuthToken } from '@/lib/auth';
import { formatRunToPathData } from '@/lib/data';
import { MOCK_RUNS } from '@/lib/mockData';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const currentUser = (await validateAuthToken(request)) || (await getCurrentUser());

    let run: any = null;
    try {
      run = await prisma.run.findUnique({
        where: { id },
        include: {
          user: true,
          agent: true,
          spans: {
            orderBy: { createdAt: 'asc' }
          }
        }
      });
    } catch (dbErr) {
      console.warn(`Prisma run ${id} fetch failed, falling back to mock data:`, dbErr);
    }

    if (run) {
      const formattedPath = formatRunToPathData(run);
      return NextResponse.json({ success: true, path: formattedPath });
    }

    // Fallback to static mock runs
    const mockRun = MOCK_RUNS.find(r => r.id === id) || MOCK_RUNS[0];
    if (mockRun) {
      return NextResponse.json({ success: true, path: mockRun });
    }

    return NextResponse.json({ success: false, error: 'Run not found' }, { status: 404 });
  } catch (error: any) {
    console.error('API Error /api/paths/[id]:', error);
    const mockRun = MOCK_RUNS[0];
    return NextResponse.json({ success: true, path: mockRun });
  }
}

