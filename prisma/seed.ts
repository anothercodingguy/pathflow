import { PrismaClient } from '@prisma/client';
import { MOCK_PATHS, MOCK_LEADERBOARDS } from '../lib/data';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting PathFlow Database Seed...');

  await prisma.kudos.deleteMany();
  await prisma.span.deleteMany();
  await prisma.run.deleteMany();
  await prisma.segment.deleteMany();
  await prisma.agent.deleteMany();
  await prisma.user.deleteMany();

  const seg1 = await prisma.segment.create({
    data: {
      id: 'browser-login',
      name: 'Browser Login & Session Handling',
      description: 'Headless browser authentication and cookie session state handling',
      maxBudgetUsd: 0.05,
    },
  });

  const seg2 = await prisma.segment.create({
    data: {
      id: 'json-parsing',
      name: 'Strict Schema JSON Parsing',
      description: 'Validate complex structured outputs against strict JSON schema specs',
      maxBudgetUsd: 0.02,
    },
  });

  for (const p of MOCK_PATHS) {
    const user = await prisma.user.upsert({
      where: { username: p.user.username },
      update: {},
      create: {
        username: p.user.username,
        name: p.user.name,
        email: `${p.user.username}@pathflow.ai`,
        avatarUrl: p.user.avatar,
      },
    });

    const agent = await prisma.agent.create({
      data: {
        name: p.agent.name,
        framework: p.agent.framework,
        modelFamily: p.modelFamily,
      },
    });

    const run = await prisma.run.create({
      data: {
        id: p.id,
        title: p.title,
        status: p.status.toLowerCase(),
        wallClockMs: p.durationMs,
        totalTokens: p.tokens,
        promptTokens: Math.floor(p.tokens * 0.3),
        completionTokens: Math.floor(p.tokens * 0.7),
        actionVelocityTps: p.tps,
        totalCostUsd: p.cost,
        totalToolCalls: p.spans.length,
        dagDepth: p.elevationDepth,
        isPublic: true,
        kudosCount: p.reactions.useful + p.reactions.efficient,
        userId: user.id,
        agentId: agent.id,
        segmentId: p.id === 'path-1' ? seg2.id : seg1.id,
      },
    });

    for (const s of p.spans) {
      await prisma.span.create({
        data: {
          id: s.id,
          runId: run.id,
          spanId: s.spanId,
          parentSpanId: s.parentSpanId,
          name: s.name,
          type: s.type,
          status: s.status,
          latencyMs: s.latencyMs,
          tokens: s.tokens,
          cost: s.cost,
          rawInput: s.rawInput,
          rawOutput: s.rawOutput,
        },
      });
    }
  }

  console.log('✅ Seed completed successfully! All PathFlow schema models populated.');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
