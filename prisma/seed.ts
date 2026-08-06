import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding PathFlow Production Database...');

  // Clean existing database records
  await prisma.span.deleteMany();
  await prisma.run.deleteMany();
  await prisma.agent.deleteMany();
  await prisma.user.deleteMany();

  // Create Primary Admin Developer User
  const user = await prisma.user.create({
    data: {
      email: 'admin@pathflow.dev',
      name: 'Suyash Developer',
      username: 'suyash',
      passwordHash: 'admin_secret_hash_9942', // Simple production hash
      apiKey: 'pf_live_suyash_secret_9942',
    },
  });

  console.log('✅ Created Developer Account:', user.email, '| API Key:', user.apiKey);

  // Create Primary Agent Frameworks
  const codeAgent = await prisma.agent.create({
    data: {
      userId: user.id,
      name: 'CodeRefactor Agent',
      framework: 'LangChain',
      modelFamily: 'Claude 3.5 Sonnet',
    },
  });

  const browserAgent = await prisma.agent.create({
    data: {
      userId: user.id,
      name: 'AutoBrowser Runner',
      framework: 'CrewAI',
      modelFamily: 'GPT-4o',
    },
  });

  // Seed Initial Traces
  const run1 = await prisma.run.create({
    data: {
      id: 'path-1',
      userId: user.id,
      agentId: codeAgent.id,
      title: 'Resolved Pytest async timeout bug in 12s',
      description: 'Diagnosed async loop closure leak in test_runner.py, reflected on AST context, generated patch, and verified sandbox tests.',
      status: 'completed',
      modelFamily: 'Claude 3.5 Sonnet',
      wallClockMs: 12400,
      totalTokens: 18400,
      promptTokens: 5000,
      completionTokens: 13400,
      actionVelocityTps: 112.4,
      totalCostUsd: 0.038,
      totalToolCalls: 4,
      dagDepth: 5,
      spans: {
        create: [
          {
            spanId: 'span_01',
            name: 'Prompt Ingestion & AST Parsing',
            type: 'Prompt',
            status: 'SUCCESS',
            latencyMs: 180,
            tokens: 800,
            cost: 0.0016,
            rawInput: JSON.stringify({ prompt: "Fix pytest timeout error in async handler test_auth_flow()", target: "tests/test_auth.py" }, null, 2),
            rawOutput: JSON.stringify({ parsedAST: { functions: ["test_auth_flow"], imports: ["pytest", "asyncio"] } }, null, 2)
          },
          {
            spanId: 'span_02',
            parentSpanId: 'span_01',
            name: 'SerpAPI Pytest Async Docs Search',
            type: 'WebSearch',
            status: 'SUCCESS',
            latencyMs: 420,
            tokens: 2400,
            cost: 0.0048,
            rawInput: JSON.stringify({ query: "pytest-asyncio fixture scope loop closed event loop leak fix" }, null, 2)
          },
          {
            spanId: 'span_03',
            parentSpanId: 'span_02',
            name: 'AST Loop Contention Reflection',
            type: 'Reflection',
            status: 'SUCCESS',
            latencyMs: 310,
            tokens: 1800,
            cost: 0.0036,
            rawInput: JSON.stringify({ hypothesis: "Event loop scope mismatch between function fixture and session pool" }, null, 2)
          },
          {
            spanId: 'span_04',
            parentSpanId: 'span_03',
            name: 'Playwright Sandbox Test Verification',
            type: 'Browser',
            status: 'SUCCESS',
            latencyMs: 1200,
            tokens: 3200,
            cost: 0.0064
          },
          {
            spanId: 'span_05',
            parentSpanId: 'span_04',
            name: 'VectorDB Long-Term Memory Recall',
            type: 'Memory',
            status: 'SUCCESS',
            latencyMs: 150,
            tokens: 1200,
            cost: 0.0024
          },
          {
            spanId: 'span_06',
            parentSpanId: 'span_05',
            name: 'Claude 3.5 Sonnet Patch Generator',
            type: 'LLMCall',
            status: 'SUCCESS',
            latencyMs: 3800,
            tokens: 6600,
            cost: 0.0132
          },
          {
            spanId: 'span_07',
            parentSpanId: 'span_06',
            name: 'Final Code Diff & Output',
            type: 'Output',
            status: 'SUCCESS',
            latencyMs: 650,
            tokens: 2400,
            cost: 0.0060
          }
        ]
      }
    }
  });

  const run2 = await prisma.run.create({
    data: {
      id: 'path-2',
      userId: user.id,
      agentId: browserAgent.id,
      title: 'Autonomous E-Commerce Checkout Pipeline',
      description: 'Extracted product specs, navigated checkout steps via headless browser, filled shipping forms, and executed payment authorization.',
      status: 'completed',
      modelFamily: 'GPT-4o',
      wallClockMs: 18200,
      totalTokens: 32100,
      promptTokens: 10000,
      completionTokens: 22100,
      actionVelocityTps: 145.2,
      totalCostUsd: 0.031,
      totalToolCalls: 5,
      dagDepth: 6,
      spans: {
        create: [
          {
            spanId: 'span_01',
            name: 'User Intent Parser',
            type: 'Prompt',
            status: 'SUCCESS',
            latencyMs: 210,
            tokens: 1200,
            cost: 0.0024
          },
          {
            spanId: 'span_02',
            parentSpanId: 'span_01',
            name: 'Playwright DOM Selector Agent',
            type: 'Browser',
            status: 'SUCCESS',
            latencyMs: 1850,
            tokens: 9400,
            cost: 0.0094
          },
          {
            spanId: 'span_03',
            parentSpanId: 'span_02',
            name: 'Checkout Form Auto-Fill',
            type: 'LLMCall',
            status: 'SUCCESS',
            latencyMs: 4200,
            tokens: 12800,
            cost: 0.0128
          },
          {
            spanId: 'span_04',
            parentSpanId: 'span_03',
            name: 'Stripe Sandbox Payment Exec',
            type: 'CodeExec',
            status: 'SUCCESS',
            latencyMs: 8900,
            tokens: 5200,
            cost: 0.0036
          },
          {
            spanId: 'span_05',
            parentSpanId: 'span_04',
            name: 'Confirmation Receipt Generator',
            type: 'Output',
            status: 'SUCCESS',
            latencyMs: 1040,
            tokens: 3500,
            cost: 0.0028
          }
        ]
      }
    }
  });

  const run3 = await prisma.run.create({
    data: {
      id: 'path-3',
      userId: user.id,
      agentId: codeAgent.id,
      title: 'Deep Research: Market Analysis Breakdown',
      description: 'Multi-step web search, reflection loops, memory retrieval, and document synthesis.',
      status: 'failed',
      modelFamily: 'Claude 3.5 Sonnet',
      wallClockMs: 42100,
      totalTokens: 94200,
      promptTokens: 30000,
      completionTokens: 64200,
      actionVelocityTps: 168.0,
      totalCostUsd: 0.142,
      totalToolCalls: 3,
      dagDepth: 8,
      spans: {
        create: [
          {
            spanId: 'span_01',
            name: 'Initial Research Prompt',
            type: 'Prompt',
            status: 'SUCCESS',
            latencyMs: 340,
            tokens: 14200,
            cost: 0.0284
          },
          {
            spanId: 'span_02',
            parentSpanId: 'span_01',
            name: 'ArXiv Paper Scraper',
            type: 'WebSearch',
            status: 'SUCCESS',
            latencyMs: 1200,
            tokens: 18400,
            cost: 0.0268
          },
          {
            spanId: 'span_03',
            parentSpanId: 'span_02',
            name: 'Hypothesis Verification Loop',
            type: 'Reflection',
            status: 'FAILED',
            latencyMs: 4200,
            tokens: 24000,
            cost: 0.0380,
            rawOutput: JSON.stringify({ error: "RateLimitError: 429 Too Many Requests from SerpAPI endpoint" }, null, 2)
          }
        ]
      }
    }
  });

  console.log('✅ Seeded initial runs:', run1.id, run2.id, run3.id);
  console.log('🎉 Production database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
