import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const body = await req.json();
    const { type, title, description, priority, email } = body;

    if (!title || !description) {
      return NextResponse.json(
        { success: false, error: 'Title and description are required' },
        { status: 400 }
      );
    }

    const senderEmail = email || user?.email || 'anonymous@pathflow.dev';

    console.log(`[PathFlow Feedback Received] Type: ${type} | Priority: ${priority} | From: ${senderEmail} | Title: ${title}`);

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Feedback received! Thank you for helping shape PathFlow.',
      feedbackId: `fb_${Date.now()}`,
      receivedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('Error submitting feedback:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to submit feedback' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  return NextResponse.json({
    success: true,
    categories: ['FEATURE_REQUEST', 'BUG_REPORT', 'FRAMEWORK_INTEGRATION', 'GENERAL_FEEDBACK'],
  });
}
