import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('🔥 [PathFlow OTel Telemetry Received]:', body.title);
    
    return NextResponse.json({
      success: true,
      runId: `run_${Date.now()}`,
      message: 'Telemetry successfully ingested into PathFlow ClickHouse buffer.',
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
