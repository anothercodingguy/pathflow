import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const webhooks = await prisma.alertWebhook.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, webhooks });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, type, url, triggers, minCostUsd, minSeverity } = body;

    if (!name || !url) {
      return NextResponse.json({ success: false, error: "Name and URL are required" }, { status: 400 });
    }

    const webhook = await prisma.alertWebhook.create({
      data: {
        userId: user.id,
        name,
        type: type || "SLACK",
        url,
        triggers: triggers || "CRITICAL_DETECTIONS,HIGH_COST,ERROR_SPIKE",
        minCostUsd: minCostUsd ? parseFloat(minCostUsd) : 0.50,
        minSeverity: minSeverity || "CRITICAL",
        enabled: true,
      },
    });

    return NextResponse.json({ success: true, webhook });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ success: false, error: "Webhook ID required" }, { status: 400 });
    }

    await prisma.alertWebhook.deleteMany({
      where: { id, userId: user.id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
