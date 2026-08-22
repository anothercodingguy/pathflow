import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, validateAuthToken } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const user = (await validateAuthToken(request)) || (await getCurrentUser());
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const runId = searchParams.get("runId");

    if (runId) {
      const evaluation = await prisma.evaluation.findFirst({
        where: {
          runId,
          run: { userId: user.id }
        },
      });
      return NextResponse.json({ success: true, evaluation });
    }

    const evaluations = await prisma.evaluation.findMany({
      where: {
        run: { userId: user.id }
      },
      orderBy: { updatedAt: "desc" },
      take: 50,
      include: {
        run: {
          select: {
            id: true,
            title: true,
            modelFamily: true,
            status: true,
          },
        },
      },
    });

    const totalEvals = evaluations.length;
    const thumbsUp = evaluations.filter((e) => e.thumbs === "UP").length;
    const thumbsDown = evaluations.filter((e) => e.thumbs === "DOWN").length;
    const avgScore = totalEvals > 0 ? Math.round(evaluations.reduce((a, b) => a + (b.score || 0), 0) / totalEvals) : 0;

    return NextResponse.json({
      success: true,
      stats: {
        totalEvals,
        thumbsUp,
        thumbsDown,
        avgScore,
      },
      evaluations,
    });
  } catch (error: any) {
    console.error("API Error /api/v1/evals GET:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = (await validateAuthToken(request)) || (await getCurrentUser());
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { runId, score, thumbs, hallucinationScore, faithfulnessScore, toxicityScore, notes, evaluator } = body;

    if (!runId) {
      return NextResponse.json({ success: false, error: "runId is required" }, { status: 400 });
    }

    const run = await prisma.run.findFirst({
      where: {
        id: runId,
        OR: [
          { userId: user.id },
          { isDemo: true }
        ]
      }
    });

    if (!run) {
      return NextResponse.json({ success: false, error: "Run not found" }, { status: 404 });
    }

    const evaluation = await prisma.evaluation.upsert({
      where: { runId },
      update: {
        score: score !== undefined ? parseInt(score, 10) : undefined,
        thumbs: thumbs || undefined,
        hallucinationScore: hallucinationScore !== undefined ? parseInt(hallucinationScore, 10) : undefined,
        faithfulnessScore: faithfulnessScore !== undefined ? parseInt(faithfulnessScore, 10) : undefined,
        toxicityScore: toxicityScore !== undefined ? parseInt(toxicityScore, 10) : undefined,
        notes: notes !== undefined ? notes : undefined,
        evaluator: evaluator || user.name || "Human Reviewer",
      },
      create: {
        runId,
        score: score !== undefined ? parseInt(score, 10) : 85,
        thumbs: thumbs || "UP",
        hallucinationScore: hallucinationScore !== undefined ? parseInt(hallucinationScore, 10) : 0,
        faithfulnessScore: faithfulnessScore !== undefined ? parseInt(faithfulnessScore, 10) : 95,
        toxicityScore: toxicityScore !== undefined ? parseInt(toxicityScore, 10) : 0,
        notes: notes || "",
        evaluator: evaluator || user.name || "Human Reviewer",
      },
    });

    if (score !== undefined) {
      await prisma.run.update({
        where: { id: runId },
        data: { qualityScore: parseInt(score, 10) },
      }).catch(() => {});
    }

    return NextResponse.json({ success: true, evaluation });
  } catch (error: any) {
    console.error("API Error /api/v1/evals POST:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
