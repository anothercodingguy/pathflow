import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { formatRunToPathData } from '@/lib/data';

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
        spans: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!run) {
      return NextResponse.json({ success: false, error: 'Run not found' }, { status: 404 });
    }

    const formattedPath = formatRunToPathData(run);

    return NextResponse.json({ success: true, path: formattedPath });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
