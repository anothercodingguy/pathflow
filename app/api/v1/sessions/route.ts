import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateAuthToken } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const user = await validateAuthToken(request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId") || searchParams.get("id");

    if (sessionId) {
      // Get all turns in this session for the authenticated user
      const runs = await prisma.run.findMany({
        where: {
          userId: user.id,
          OR: [
            { sessionId },
            { id: sessionId },
          ],
        },
        include: {
          agent: true,
          spans: { orderBy: { createdAt: "asc" } },
          detections: true,
          evaluation: true,
        },
        orderBy: { createdAt: "asc" },
      });

      return NextResponse.json({ success: true, sessionId, turns: runs });
    }

    // Aggregate sessions for authenticated user
    const allRuns = await prisma.run.findMany({
      where: { userId: user.id },
      include: { agent: true, spans: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const sessionsMap = new Map<string, {
      sessionId: string;
      agentName: string;
      modelFamily: string;
      turnCount: number;
      totalTokens: number;
      totalCostUsd: number;
      totalDurationMs: number;
      status: string;
      lastActiveAt: Date;
      previewPrompt: string;
    }>();

    for (const run of allRuns) {
      const sId = run.sessionId || ("session_" + run.id.substring(0, 8));
      if (!sessionsMap.has(sId)) {
        let preview = run.title;
        try {
          if (run.input) {
            const parsed = JSON.parse(run.input);
            preview = parsed.query || parsed.prompt || parsed.input || run.title;
          }
        } catch {}

        sessionsMap.set(sId, {
          sessionId: sId,
          agentName: run.agent?.name || "Agent",
          modelFamily: run.modelFamily,
          turnCount: 1,
          totalTokens: run.totalTokens,
          totalCostUsd: run.totalCostUsd,
          totalDurationMs: run.wallClockMs,
          status: run.status,
          lastActiveAt: run.createdAt,
          previewPrompt: typeof preview === "string" ? preview.substring(0, 100) : run.title,
        });
      } else {
        const item = sessionsMap.get(sId)!;
        item.turnCount += 1;
        item.totalTokens += run.totalTokens;
        item.totalCostUsd += run.totalCostUsd;
        item.totalDurationMs += run.wallClockMs;
        if (run.status === "failed") item.status = "failed";
      }
    }

    const sessions = Array.from(sessionsMap.values());

    return NextResponse.json({
      success: true,
      count: sessions.length,
      sessions,
    });
  } catch (error: any) {
    console.error("API Error /api/v1/sessions:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
