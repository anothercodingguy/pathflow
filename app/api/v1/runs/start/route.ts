import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const runId = `run_${Date.now()}`;
    
    return NextResponse.json({
      success: true,
      run_id: runId,
      message: 'PathFlow run telemetry session initialized.',
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
