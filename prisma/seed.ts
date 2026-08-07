import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding PathFlow Production Database with Real-Time Circuit Breaker Traces...');

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
      passwordHash: 'admin_secret_hash_9942',
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

  // 1. RUN WITH REAL-TIME CIRCUIT BREAKER TRIPPED ($2.00 Budget Cap Enforcement)
  const breakerRun = await prisma.run.create({
    data: {
      id: 'path-breaker-1',
      userId: user.id,
      agentId: codeAgent.id,
      title: 'Rogue Recursive Refactoring Agent (Interrupted by Circuit Breaker)',
      description: 'Agent entered an infinite loop repeatedly attempting to re-parse AST. PathFlow Real-Time Circuit Breaker killed rogue tool call loop at hard $2.00 cap, saving $198.00 USD.',
      status: 'breaker_tripped',
      modelFamily: 'Claude 3.5 Sonnet',
      wallClockMs: 8400,
      totalTokens: 68400,
      promptTokens: 20000,
      completionTokens: 48400,
      actionVelocityTps: 182.4,
      totalCostUsd: 2.00,
      totalToolCalls: 12,
      dagDepth: 6,
      breakerTriggered: true,
      breakerReason: 'HARD_BUDGET_CAP_EXCEEDED: Hard per-task limit capped at $2.00 USD (Current spend attempted: $2.04 USD). Interrupted runaway loop at iteration #10.',
      maxBudgetUsd: 2.00,
      maxSteps: 10,
      spans: {
        create: [
          {
            spanId: 'br_span_01',
            name: 'Prompt Ingestion & Target Selection',
            type: 'Prompt',
            status: 'SUCCESS',
            latencyMs: 140,
            tokens: 1200,
            cost: 0.0024,
            rawInput: JSON.stringify({ prompt: "Refactor all async handlers in legacy monolith codebase", max_budget: "$2.00" }, null, 2)
          },
          {
            spanId: 'br_span_02',
            parentSpanId: 'br_span_01',
            name: 'AST Recursive Analysis (Iteration #1)',
            type: 'LLMCall',
            status: 'SUCCESS',
            latencyMs: 820,
            tokens: 12400,
            cost: 0.24,
            rawOutput: JSON.stringify({ status: "incomplete", next_action: "re-parse" }, null, 2)
          },
          {
            spanId: 'br_span_03',
            parentSpanId: 'br_span_02',
            name: 'Rogue Loop Execution (Iterations #2-#9)',
            type: 'LLMCall',
            status: 'SUCCESS',
            latencyMs: 5800,
            tokens: 48000,
            cost: 1.56,
            rawOutput: JSON.stringify({ status: "repeating_loop_detected", tool_invocations: 8 }, null, 2)
          },
          {
            spanId: 'br_span_04',
            parentSpanId: 'br_span_03',
            name: 'PathFlow Circuit Breaker Hard Kill Interception',
            type: 'LLMCall',
            status: 'KILLED',
            latencyMs: 1640,
            tokens: 6800,
            cost: 0.20,
            rawInput: JSON.stringify({ event: "CIRCUIT_BREAKER_INTERRUPT", current_spend: "$2.00", limit: "$2.00" }, null, 2),
            rawOutput: JSON.stringify({ error: "PathFlowCircuitBreakerError: HARD_BUDGET_CAP_EXCEEDED. Execution terminated immediately before further token burn." }, null, 2),
            diagnosticTag: 'CIRCUIT_BREAKER_KILL',
            diagnosticSummary: 'HARD_BUDGET_CAP_EXCEEDED: PathFlow active circuit breaker interrupted execution at $2.00 limit. Saved an estimated $198.00 in runaway LLM API costs.'
          }
        ]
      }
    }
  });

  // 2. RUN WITH PAIN-SPECIFIC DIAGNOSTIC (Bad Tool Schema Failure)
  const schemaDiagRun = await prisma.run.create({
    data: {
      id: 'path-schema-fail',
      userId: user.id,
      agentId: codeAgent.id,
      title: 'PostgreSQL DB Migration Tool Execution',
      description: 'Agent failed when calling database schema generator due to malformed JSON tool parameters.',
      status: 'failed',
      modelFamily: 'Claude 3.5 Sonnet',
      wallClockMs: 4100,
      totalTokens: 14200,
      actionVelocityTps: 110.0,
      totalCostUsd: 0.028,
      totalToolCalls: 2,
      dagDepth: 3,
      spans: {
        create: [
          {
            spanId: 'sc_span_01',
            name: 'Ingest Migration Request',
            type: 'Prompt',
            status: 'SUCCESS',
            latencyMs: 200,
            tokens: 1200,
            cost: 0.0024
          },
          {
            spanId: 'sc_span_02',
            parentSpanId: 'sc_span_01',
            name: 'Execute PostgreSQL Schema Tool Call',
            type: 'CodeExec',
            status: 'FAILED',
            latencyMs: 3900,
            tokens: 13000,
            cost: 0.0256,
            rawInput: JSON.stringify({ tool: "apply_prisma_migration", args: { migration_name: null } }, null, 2),
            rawOutput: JSON.stringify({ error: "ValidationError: Field 'migration_name' expected string, received null." }, null, 2),
            diagnosticTag: 'BAD_TOOL_SCHEMA',
            diagnosticSummary: 'BAD_TOOL_SCHEMA: Agent generated invalid tool invocation payload. Required field "migration_name" was null.'
          }
        ]
      }
    }
  });

  // 3. RUN WITH PAIN-SPECIFIC DIAGNOSTIC (Vector DB Retrieval Miss)
  const vectorDiagRun = await prisma.run.create({
    data: {
      id: 'path-vector-miss',
      userId: user.id,
      agentId: browserAgent.id,
      title: 'Customer Support Knowledge Base RAG Search',
      description: 'Agent returned empty response due to zero vector embeddings matching customer query threshold.',
      status: 'failed',
      modelFamily: 'GPT-4o',
      wallClockMs: 3200,
      totalTokens: 9800,
      actionVelocityTps: 95.0,
      totalCostUsd: 0.019,
      totalToolCalls: 1,
      dagDepth: 3,
      spans: {
        create: [
          {
            spanId: 'vc_span_01',
            name: 'Customer Support Query',
            type: 'Prompt',
            status: 'SUCCESS',
            latencyMs: 180,
            tokens: 800,
            cost: 0.0016
          },
          {
            spanId: 'vc_span_02',
            parentSpanId: 'vc_span_01',
            name: 'Pinecone Vector DB Retrieval',
            type: 'Memory',
            status: 'FAILED',
            latencyMs: 3020,
            tokens: 9000,
            cost: 0.0174,
            rawInput: JSON.stringify({ query_vector: [0.012, -0.045, 0.89], min_similarity: 0.85 }, null, 2),
            rawOutput: JSON.stringify({ matches: [], top_k: 0 }, null, 2),
            diagnosticTag: 'VECTOR_RETRIEVAL_EMPTY',
            diagnosticSummary: 'VECTOR_RETRIEVAL_EMPTY: Similarity search in namespace "kb_support" returned 0 context documents above similarity score 0.85.'
          }
        ]
      }
    }
  });

  // 4. Standard Successful Traces
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
      maxBudgetUsd: 5.00,
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
            cost: 0.0036
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

  console.log('✅ Seeded runs:', breakerRun.id, schemaDiagRun.id, vectorDiagRun.id, run1.id);
  console.log('🎉 Database seeding with PathFlow Circuit Breakers completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
