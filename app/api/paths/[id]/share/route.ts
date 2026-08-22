import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, validateAuthToken } from "@/lib/auth";
import crypto from "crypto";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const currentUser = (await validateAuthToken(request)) || (await getCurrentUser());
    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const run = await prisma.run.findUnique({
      where: { id },
    });

    if (!run) {
      return NextResponse.json({ success: false, error: "Run not found" }, { status: 404 });
    }

    if (run.userId !== currentUser.id && !run.isDemo) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    let shareToken = run.shareToken;
    if (!shareToken) {
      shareToken = "tr_share_" + crypto.randomUUID().replace(/-/g, "").substring(0, 16);
      await prisma.run.update({
        where: { id },
        data: { shareToken },
      });
    }

    const rawHost = process.env.NEXT_PUBLIC_APP_URL || "https://thepathflow.online/app";
    const shareUrl = rawHost + "/share/" + shareToken;

    return NextResponse.json({
      success: true,
      shareToken,
      shareUrl,
    });
  } catch (error: any) {
    console.error("API Error /api/paths/[id]/share POST:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const currentUser = (await validateAuthToken(request)) || (await getCurrentUser());
    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const run = await prisma.run.findUnique({
      where: { id },
    });

    if (!run) {
      return NextResponse.json({ success: false, error: "Run not found" }, { status: 404 });
    }

    if (run.userId !== currentUser.id && !run.isDemo) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    await prisma.run.update({
      where: { id },
      data: { shareToken: null },
    });

    return NextResponse.json({ success: true, message: "Share link revoked" });
  } catch (error: any) {
    console.error("API Error /api/paths/[id]/share DELETE:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
