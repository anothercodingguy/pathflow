import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateAuthToken, getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const user = (await validateAuthToken(request)) || (await getCurrentUser());
  if (!user) {
    return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }

  const { searchParams } = new URL(request.url);
  const runId = searchParams.get("runId");

  const responseStream = new TransformStream();
  const writer = responseStream.writable.getWriter();
  const encoder = new TextEncoder();

  let isActive = true;

  request.signal.addEventListener("abort", () => {
    isActive = false;
    writer.close().catch(() => {});
  });

  const sendEvent = async (event: string, data: any) => {
    if (!isActive) return;
    try {
      const message = 'event: ' + event + '\ndata: ' + JSON.stringify(data) + '\n\n';
      await writer.write(encoder.encode(message));
    } catch {
      isActive = false;
    }
  };

  (async () => {
    try {
      await sendEvent("connected", { timestamp: Date.now() });

      let lastChecked = new Date(Date.now() - 5000);

      for (let i = 0; i < 40; i++) {
        if (!isActive) break;

        if (runId) {
          const run = await prisma.run.findFirst({
            where: { id: runId, userId: user.id },
            include: { spans: true, detections: true, evaluation: true },
          });
          if (run) {
            await sendEvent("run_update", {
              runId: run.id,
              status: run.status,
              wallClockMs: run.wallClockMs,
              totalTokens: run.totalTokens,
              totalCostUsd: run.totalCostUsd,
              spansCount: run.spans.length,
              spans: run.spans,
              detections: run.detections,
              evaluation: run.evaluation,
            });
          }
        } else {
          const recentRuns = await prisma.run.findMany({
            where: {
              userId: user.id,
              updatedAt: { gte: lastChecked }
            },
            include: { agent: true, spans: true },
            orderBy: { updatedAt: "desc" },
            take: 5,
          });

          if (recentRuns.length > 0) {
            await sendEvent("runs_batch", {
              count: recentRuns.length,
              runs: recentRuns.map((r) => ({
                id: r.id,
                title: r.title,
                status: r.status,
                agentName: r.agent?.name,
                wallClockMs: r.wallClockMs,
                totalTokens: r.totalTokens,
                totalCostUsd: r.totalCostUsd,
                spansCount: r.spans.length,
                updatedAt: r.updatedAt,
              })),
            });
          }
          lastChecked = new Date();
        }

        await new Promise((res) => setTimeout(res, 1500));
      }

      await sendEvent("done", { complete: true });
    } catch (err: any) {
      console.error("[SSE Stream Error]:", err);
    } finally {
      if (isActive) {
        writer.close().catch(() => {});
      }
    }
  })();

  return new Response(responseStream.readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
