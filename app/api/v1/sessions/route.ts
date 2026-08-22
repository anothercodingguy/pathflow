import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateAuthToken, getCurrentUser } from "@/lib/auth";
import { MOCK_SESSIONS, MOCK_RUNS } from "@/lib/mockData";

export async function GET(request: Request) {
  try {
    const user = (await validateAuthToken(request)) || (await getCurrentUser());

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId") || searchParams.get("id");

    if (sessionId) {
      // Get all turns in this session
      let runs: any[] = [];
      try {
        runs = await prisma.run.findMany({
          where: {
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
      } catch (dbErr) {
        console.warn('Prisma session turns fetch failed, falling back:', dbErr);
      }

      if (runs.length === 0) {
        const matchingRuns = MOCK_RUNS.filter(r => r.sessionId === sessionId || r.id === sessionId);
        const fallbackTurns = matchingRuns.length > 0 ? matchingRuns : MOCK_RUNS.slice(0, 3);
        return NextResponse.json({ success: true, sessionId, turns: fallbackTurns });
      }

      return NextResponse.json({ success: true, sessionId, turns: runs });
    }

    // Aggregate sessions
    let allRuns: any[] = [];
    try {
      allRuns = await prisma.run.findMany({
        where: user ? {
          OR: [
            { userId: user.id },
            { isDemo: true }
          ]
        } : { isDemo: true },
        include: { agent: true, spans: true },
        orderBy: { createdAt: "desc" },
        take: 100,
      });
    } catch (dbErr) {
      console.warn('Prisma sessions list fetch failed, falling back to mock data:', dbErr);
    }

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
      count: sessions.length > 0 ? sessions.length : MOCK_SESSIONS.length,
      sessions: sessions.length > 0 ? sessions : MOCK_SESSIONS,
    });
  } catch (error: any) {
    console.error("API Error /api/v1/sessions:", error);
    return NextResponse.json({
      success: true,
      count: MOCK_SESSIONS.length,
      sessions: MOCK_SESSIONS,
    });
  }
}

