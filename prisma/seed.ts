import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding PathFlow Database with comprehensive demo data...');

  // Clean existing database records
  await prisma.subscription.deleteMany();
  await prisma.order.deleteMany();
  await prisma.investigation.deleteMany();
  await prisma.detection.deleteMany();
  await prisma.span.deleteMany();
  await prisma.run.deleteMany();
  await prisma.agent.deleteMany();
  // Don't delete users to preserve OAuth sessions
  const existingUser = await prisma.user.findFirst();
  
  let user;
  if (existingUser) {
    user = existingUser;
    console.log('✅ Using existing user:', user.email);
  } else {
    user = await prisma.user.create({
      data: {
        email: 'admin@pathflow.dev',
        name: 'Suyash Developer',
        username: 'suyash',
        passwordHash: 'admin_secret_hash_9942',
        apiKey: 'pf_live_suyash_secret_9942',
      },
    });
    console.log('✅ Created Developer Account:', user.email, '| API Key:', user.apiKey);
  }

  // Create Agent Frameworks
  const researchAgent = await prisma.agent.create({
    data: {
      userId: user.id,
      name: 'ResearchAgent',
      framework: 'LangChain',
      modelFamily: 'Claude 3.5 Sonnet',
      description: 'Deep research and analysis agent',
    },
  });

  const codeAgent = await prisma.agent.create({
    data: {
      userId: user.id,
      name: 'CodeRefactor Agent',
      framework: 'Custom',
      modelFamily: 'Claude 3.5 Sonnet',
      description: 'Code analysis and refactoring agent',
    },
  });

  const browserAgent = await prisma.agent.create({
    data: {
      userId: user.id,
      name: 'AutoBrowser Runner',
      framework: 'CrewAI',
      modelFamily: 'GPT-4o',
      description: 'Browser automation and web scraping agent',
    },
  });

  const supportAgent = await prisma.agent.create({
    data: {
      userId: user.id,
      name: 'SupportTicket Agent',
      framework: 'LangChain',
      modelFamily: 'GPT-4o',
      description: 'Customer support ticket resolution agent',
    },
  });

  // =============================================================
  // RUN 1: Successful run — Clean execution with optimization potential
  // Planner → Search → LLM → Final
  // =============================================================
  const run1 = await prisma.run.create({
    data: {
      id: 'path-1',
      userId: user.id,
      agentId: codeAgent.id,
      title: '[Demo] Resolved Pytest async timeout bug in 12s',
      description: 'Diagnosed async loop closure leak in test_runner.py, reflected on AST context, generated patch, and verified sandbox tests.',
      status: 'completed',
      modelFamily: 'Claude 3.5 Sonnet',
      project: 'code-refactor',
      env: 'production',
      wallClockMs: 12400,
      totalTokens: 18400,
      promptTokens: 5000,
      completionTokens: 13400,
      actionVelocityTps: 112.4,
      totalCostUsd: 0.038,
      totalToolCalls: 4,
      dagDepth: 7,
      isDemo: true,
      version: 'v1.4',
      qualityScore: 87,
      input: JSON.stringify({ prompt: "Fix pytest timeout error in async handler test_auth_flow()", target: "tests/test_auth.py" }),
      output: JSON.stringify({ result: "Generated patch for async loop closure leak. All 14 tests passing.", patch_file: "test_runner.py" }),
      spans: {
        create: [
          {
            spanId: 'span_01',
            name: 'Prompt Ingestion & AST Parsing',
            type: 'agent',
            status: 'SUCCESS',
            latencyMs: 180,
            tokens: 800,
            inputTokens: 400,
            outputTokens: 400,
            cost: 0.0016,
            model: 'claude-3.5-sonnet',
            provider: 'anthropic',
            rawInput: JSON.stringify({ prompt: "Fix pytest timeout error in async handler test_auth_flow()", target: "tests/test_auth.py" }, null, 2),
            rawOutput: JSON.stringify({ parsedAST: { functions: ["test_auth_flow"], imports: ["pytest", "asyncio"] } }, null, 2)
          },
          {
            spanId: 'span_02',
            parentSpanId: 'span_01',
            name: 'SerpAPI Pytest Async Docs Search',
            type: 'tool',
            status: 'SUCCESS',
            latencyMs: 420,
            tokens: 2400,
            inputTokens: 200,
            outputTokens: 2200,
            cost: 0.0048,
            rawInput: JSON.stringify({ query: "pytest-asyncio fixture scope loop closed event loop leak fix" }, null, 2),
            rawOutput: JSON.stringify({ results: [{ title: "pytest-asyncio: event_loop fixture scope", url: "https://docs.pytest.org/..." }] }, null, 2)
          },
          {
            spanId: 'span_03',
            parentSpanId: 'span_02',
            name: 'AST Loop Contention Analysis',
            type: 'llm',
            status: 'SUCCESS',
            latencyMs: 1200,
            tokens: 3400,
            inputTokens: 1800,
            outputTokens: 1600,
            cost: 0.0068,
            model: 'claude-3.5-sonnet',
            provider: 'anthropic',
            rawInput: JSON.stringify({ system: "Analyze the following AST for potential async loop contention issues", code: "async def test_auth_flow(): ..." }, null, 2),
            rawOutput: JSON.stringify({ analysis: "Found unclosed event loop in fixture scope. The loop_scope parameter needs to be set to 'function' to prevent cross-test contamination." }, null, 2)
          },
          {
            spanId: 'span_04',
            parentSpanId: 'span_01',
            name: 'Playwright Sandbox Test Verification',
            type: 'tool',
            status: 'SUCCESS',
            latencyMs: 7600,
            tokens: 3200,
            inputTokens: 800,
            outputTokens: 2400,
            cost: 0.0064,
            rawInput: JSON.stringify({ command: "pytest tests/test_auth.py -v --timeout=30" }, null, 2),
            rawOutput: JSON.stringify({ passed: 14, failed: 0, duration_s: 7.2 }, null, 2)
          },
          {
            spanId: 'span_05',
            parentSpanId: 'span_04',
            name: 'VectorDB Long-Term Memory Recall',
            type: 'retrieval',
            status: 'SUCCESS',
            latencyMs: 2400,
            tokens: 1200,
            inputTokens: 200,
            outputTokens: 1000,
            cost: 0.0024,
            rawInput: JSON.stringify({ query: "similar async fixture bugs in this project" }, null, 2),
            rawOutput: JSON.stringify({ matches: [{ id: "mem_42", content: "Fixed similar issue in test_api.py on 2024-01-15" }] }, null, 2)
          },
          {
            spanId: 'span_06',
            parentSpanId: 'span_05',
            name: 'Claude 3.5 Sonnet Patch Generator',
            type: 'llm',
            status: 'SUCCESS',
            latencyMs: 3800,
            tokens: 6600,
            inputTokens: 3200,
            outputTokens: 3400,
            cost: 0.0132,
            model: 'claude-3.5-sonnet',
            provider: 'anthropic',
            rawInput: JSON.stringify({ system: "Generate a code patch based on the analysis", context: "AST analysis results + similar past fixes" }, null, 2),
            rawOutput: JSON.stringify({ patch: "diff --git a/tests/test_auth.py\n- @pytest.fixture\n+ @pytest.fixture(scope='function')\n  async def event_loop():\n      loop = asyncio.new_event_loop()\n      yield loop\n+     loop.close()" }, null, 2)
          },
          {
            spanId: 'span_07',
            parentSpanId: 'span_06',
            name: 'Final Code Diff & Output',
            type: 'chain',
            status: 'SUCCESS',
            latencyMs: 650,
            tokens: 2400,
            inputTokens: 1200,
            outputTokens: 1200,
            cost: 0.0048,
          }
        ]
      }
    }
  });

  // =============================================================
  // RUN 2: Successful browser automation
  // =============================================================
  const run2 = await prisma.run.create({
    data: {
      id: 'path-2',
      userId: user.id,
      agentId: browserAgent.id,
      title: '[Demo] Autonomous E-Commerce Checkout Pipeline',
      description: 'Extracted product specs, navigated checkout steps via headless browser, filled shipping forms, and executed payment authorization.',
      status: 'completed',
      modelFamily: 'GPT-4o',
      project: 'browser-automation',
      env: 'production',
      wallClockMs: 18200,
      totalTokens: 32100,
      promptTokens: 10000,
      completionTokens: 22100,
      actionVelocityTps: 145.2,
      totalCostUsd: 0.031,
      totalToolCalls: 5,
      dagDepth: 5,
      isDemo: true,
      version: 'v2.1',
      qualityScore: 92,
      input: JSON.stringify({ task: "Purchase item SKU-4821 with express shipping", user_profile: "test_user_01" }),
      output: JSON.stringify({ order_id: "ORD-98421", status: "confirmed", total: "$49.99" }),
      spans: {
        create: [
          {
            spanId: 'span_01',
            name: 'User Intent Parser',
            type: 'llm',
            status: 'SUCCESS',
            latencyMs: 210,
            tokens: 1200,
            inputTokens: 400,
            outputTokens: 800,
            cost: 0.0024,
            model: 'gpt-4o',
            provider: 'openai'
          },
          {
            spanId: 'span_02',
            parentSpanId: 'span_01',
            name: 'Playwright DOM Selector Agent',
            type: 'tool',
            status: 'SUCCESS',
            latencyMs: 11100,
            tokens: 9400,
            inputTokens: 2400,
            outputTokens: 7000,
            cost: 0.0094,
          },
          {
            spanId: 'span_03',
            parentSpanId: 'span_02',
            name: 'Checkout Form Auto-Fill',
            type: 'llm',
            status: 'SUCCESS',
            latencyMs: 4200,
            tokens: 12800,
            inputTokens: 6000,
            outputTokens: 6800,
            cost: 0.0128,
            model: 'gpt-4o',
            provider: 'openai'
          },
          {
            spanId: 'span_04',
            parentSpanId: 'span_03',
            name: 'Stripe Sandbox Payment Exec',
            type: 'tool',
            status: 'SUCCESS',
            latencyMs: 1650,
            tokens: 5200,
            inputTokens: 2000,
            outputTokens: 3200,
            cost: 0.0036,
          },
          {
            spanId: 'span_05',
            parentSpanId: 'span_04',
            name: 'Confirmation Receipt Generator',
            type: 'llm',
            status: 'SUCCESS',
            latencyMs: 1040,
            tokens: 3500,
            inputTokens: 1500,
            outputTokens: 2000,
            cost: 0.0028,
            model: 'gpt-4o',
            provider: 'openai'
          }
        ]
      }
    }
  });

  // =============================================================
  // RUN 3: Failed run — Tool loop + timeout (key demo scenario)
  // Planner → Search → Search → Search → Search → Timeout
  // =============================================================
  const run3 = await prisma.run.create({
    data: {
      id: 'path-3',
      userId: user.id,
      agentId: researchAgent.id,
      title: '[Demo] Deep Research: Market Analysis Breakdown',
      description: 'Multi-step web search with repeated reflection loops. Agent entered a tool selection loop before timing out.',
      status: 'failed',
      modelFamily: 'Claude 3.5 Sonnet',
      project: 'deep-research',
      env: 'staging',
      wallClockMs: 42100,
      totalTokens: 94200,
      promptTokens: 30000,
      completionTokens: 64200,
      actionVelocityTps: 168.0,
      totalCostUsd: 0.142,
      totalToolCalls: 6,
      dagDepth: 6,
      isDemo: true,
      version: 'v1.5',
      qualityScore: 31,
      error: 'RateLimitError: 429 Too Many Requests from SerpAPI endpoint after 4 consecutive searches',
      errorType: 'TOOL_RATE_LIMIT',
      input: JSON.stringify({ query: "Comprehensive market analysis of AI agent observability tools 2024-2025", depth: "deep", sources: ["arxiv", "google_scholar", "web"] }),
      spans: {
        create: [
          {
            spanId: 'span_01',
            name: 'Research Planner',
            type: 'llm',
            status: 'SUCCESS',
            latencyMs: 2400,
            tokens: 14200,
            inputTokens: 4200,
            outputTokens: 10000,
            cost: 0.0284,
            model: 'claude-3.5-sonnet',
            provider: 'anthropic',
            rawInput: JSON.stringify({ system: "Plan a comprehensive market analysis research workflow", query: "AI agent observability tools market 2024-2025" }, null, 2),
            rawOutput: JSON.stringify({ plan: ["1. Search ArXiv papers", "2. Search Google Scholar", "3. Analyze competitors", "4. Synthesize findings"] }, null, 2)
          },
          {
            spanId: 'span_02',
            parentSpanId: 'span_01',
            name: 'WebSearch: ArXiv Papers',
            type: 'tool',
            status: 'SUCCESS',
            latencyMs: 1200,
            tokens: 18400,
            inputTokens: 400,
            outputTokens: 18000,
            cost: 0.0268,
            rawInput: JSON.stringify({ query: "AI agent observability tracing 2024 arxiv", engine: "serpapi" }, null, 2),
            rawOutput: JSON.stringify({ results: 12, top_papers: ["Observability for LLM Agents (2024)", "Trace-based debugging of AI systems"] }, null, 2)
          },
          {
            spanId: 'span_03',
            parentSpanId: 'span_01',
            name: 'WebSearch: Competitor Analysis',
            type: 'tool',
            status: 'SUCCESS',
            latencyMs: 1800,
            tokens: 16000,
            inputTokens: 400,
            outputTokens: 15600,
            cost: 0.0240,
            rawInput: JSON.stringify({ query: "LangSmith Langfuse Arize Phoenix comparison 2024", engine: "serpapi" }, null, 2),
            rawOutput: JSON.stringify({ results: 8, competitors: ["LangSmith", "Langfuse", "Arize Phoenix", "Datadog LLM"] }, null, 2)
          },
          {
            spanId: 'span_04',
            parentSpanId: 'span_01',
            name: 'WebSearch: Market Size Data',
            type: 'tool',
            status: 'SUCCESS',
            latencyMs: 2100,
            tokens: 18000,
            inputTokens: 400,
            outputTokens: 17600,
            cost: 0.0260,
            rawInput: JSON.stringify({ query: "AI observability market size growth 2024 2025", engine: "serpapi" }, null, 2),
            rawOutput: JSON.stringify({ market_size: "$2.1B", growth_rate: "42% CAGR" }, null, 2)
          },
          {
            spanId: 'span_05',
            parentSpanId: 'span_01',
            name: 'WebSearch: Pricing Models',
            type: 'tool',
            status: 'SUCCESS',
            latencyMs: 3200,
            tokens: 19000,
            inputTokens: 400,
            outputTokens: 18600,
            cost: 0.0280,
            rawInput: JSON.stringify({ query: "LangSmith pricing vs Langfuse pricing AI observability", engine: "serpapi" }, null, 2),
            rawOutput: JSON.stringify({ note: "Redundant search — pricing data already in previous results" }, null, 2)
          },
          {
            spanId: 'span_06',
            parentSpanId: 'span_01',
            name: 'WebSearch: Final Synthesis Attempt',
            type: 'tool',
            status: 'FAILED',
            latencyMs: 22600,
            tokens: 4600,
            inputTokens: 400,
            outputTokens: 4200,
            cost: 0.0088,
            retryCount: 3,
            errorType: 'RATE_LIMIT',
            errorMessage: 'RateLimitError: 429 Too Many Requests from SerpAPI endpoint. Exceeded 5 requests/minute.',
            rawInput: JSON.stringify({ query: "AI agent debugging tools comparison detailed analysis", engine: "serpapi" }, null, 2),
            rawOutput: JSON.stringify({ error: "RateLimitError: 429 Too Many Requests from SerpAPI endpoint" }, null, 2),
            diagnosticTag: 'API_RATE_LIMIT',
            diagnosticSummary: 'RateLimitError: SerpAPI search endpoint returned 429 Too Many Requests after 4 consecutive searches. The planner failed to recognize that previous searches already returned sufficient data.'
          }
        ]
      }
    }
  });

  // =============================================================
  // RUN 4: Tool error → Retry → Success
  // =============================================================
  const run4 = await prisma.run.create({
    data: {
      id: 'path-4',
      userId: user.id,
      agentId: supportAgent.id,
      title: '[Demo] Customer Ticket #8842 Resolution',
      description: 'Resolved billing dispute with database lookup, retry on connection timeout, and automated response generation.',
      status: 'completed',
      modelFamily: 'GPT-4o',
      project: 'support-automation',
      env: 'production',
      wallClockMs: 8900,
      totalTokens: 12600,
      promptTokens: 4200,
      completionTokens: 8400,
      actionVelocityTps: 98.4,
      totalCostUsd: 0.024,
      totalToolCalls: 4,
      dagDepth: 5,
      isDemo: true,
      version: 'v3.0',
      qualityScore: 78,
      input: JSON.stringify({ ticket_id: "TKT-8842", subject: "Double charged for subscription", customer: "user_29401" }),
      output: JSON.stringify({ resolution: "Refund issued for duplicate charge. Customer notified via email.", refund_amount: "$14.99" }),
      spans: {
        create: [
          {
            spanId: 'span_01',
            name: 'Ticket Classification',
            type: 'llm',
            status: 'SUCCESS',
            latencyMs: 620,
            tokens: 1800,
            inputTokens: 800,
            outputTokens: 1000,
            cost: 0.0036,
            model: 'gpt-4o',
            provider: 'openai',
            rawInput: JSON.stringify({ ticket: "I was charged twice for my monthly subscription", category_options: ["billing", "technical", "account", "other"] }, null, 2),
            rawOutput: JSON.stringify({ category: "billing", confidence: 0.96, sub_category: "duplicate_charge" }, null, 2)
          },
          {
            spanId: 'span_02',
            parentSpanId: 'span_01',
            name: 'Database: Billing Records Lookup',
            type: 'tool',
            status: 'FAILED',
            latencyMs: 5200,
            tokens: 800,
            inputTokens: 200,
            outputTokens: 600,
            cost: 0.001,
            retryCount: 1,
            errorType: 'CONNECTION_TIMEOUT',
            errorMessage: 'Connection timeout after 5000ms to billing-db-replica.internal:5432',
            rawInput: JSON.stringify({ query: "SELECT * FROM charges WHERE user_id = 'user_29401' AND created_at > NOW() - INTERVAL '30 days'" }, null, 2),
            rawOutput: JSON.stringify({ error: "ConnectionTimeoutError: billing-db-replica.internal:5432" }, null, 2),
            diagnosticTag: 'DB_TIMEOUT',
            diagnosticSummary: 'Database connection timed out on first attempt. Retrying with primary host.'
          },
          {
            spanId: 'span_03',
            parentSpanId: 'span_01',
            name: 'Database: Billing Records Lookup (Retry)',
            type: 'tool',
            status: 'SUCCESS',
            latencyMs: 340,
            tokens: 2200,
            inputTokens: 200,
            outputTokens: 2000,
            cost: 0.002,
            rawInput: JSON.stringify({ query: "SELECT * FROM charges WHERE user_id = 'user_29401' AND created_at > NOW() - INTERVAL '30 days'", host: "billing-db-primary.internal" }, null, 2),
            rawOutput: JSON.stringify({ charges: [{ id: "chg_001", amount: 14.99, date: "2024-01-15" }, { id: "chg_002", amount: 14.99, date: "2024-01-15" }], duplicate_detected: true }, null, 2)
          },
          {
            spanId: 'span_04',
            parentSpanId: 'span_03',
            name: 'Resolution Generator',
            type: 'llm',
            status: 'SUCCESS',
            latencyMs: 1800,
            tokens: 4200,
            inputTokens: 2000,
            outputTokens: 2200,
            cost: 0.0084,
            model: 'gpt-4o',
            provider: 'openai',
            rawInput: JSON.stringify({ context: "Duplicate charge detected: $14.99 on 2024-01-15", policy: "auto_refund_for_duplicates" }, null, 2),
            rawOutput: JSON.stringify({ action: "issue_refund", amount: 14.99, message: "We've identified a duplicate charge of $14.99 and have issued an automatic refund. You should see it within 3-5 business days." }, null, 2)
          },
          {
            spanId: 'span_05',
            parentSpanId: 'span_04',
            name: 'Email Notification',
            type: 'tool',
            status: 'SUCCESS',
            latencyMs: 940,
            tokens: 3600,
            inputTokens: 1000,
            outputTokens: 2600,
            cost: 0.010,
          }
        ]
      }
    }
  });

  // =============================================================
  // RUN 5: Expensive run — Large context with multiple LLM calls
  // =============================================================
  const run5 = await prisma.run.create({
    data: {
      id: 'path-5',
      userId: user.id,
      agentId: researchAgent.id,
      title: '[Demo] Full Codebase Security Audit',
      description: 'Comprehensive security review of 48 source files with vulnerability detection, dependency scanning, and remediation plan.',
      status: 'completed',
      modelFamily: 'Claude 3.5 Sonnet',
      project: 'security-audit',
      env: 'production',
      wallClockMs: 89200,
      totalTokens: 284000,
      promptTokens: 180000,
      completionTokens: 104000,
      actionVelocityTps: 210.5,
      totalCostUsd: 0.840,
      totalToolCalls: 12,
      dagDepth: 8,
      isDemo: true,
      version: 'v1.2',
      qualityScore: 94,
      input: JSON.stringify({ repository: "acme-corp/payments-api", scope: "full", severity_threshold: "medium" }),
      output: JSON.stringify({ vulnerabilities_found: 7, critical: 2, high: 3, medium: 2, remediation_plan: "Generated" }),
      spans: {
        create: [
          {
            spanId: 'span_01',
            name: 'Repository Structure Scanner',
            type: 'tool',
            status: 'SUCCESS',
            latencyMs: 3200,
            tokens: 42000,
            inputTokens: 2000,
            outputTokens: 40000,
            cost: 0.084,
          },
          {
            spanId: 'span_02',
            parentSpanId: 'span_01',
            name: 'Dependency Vulnerability Check',
            type: 'tool',
            status: 'SUCCESS',
            latencyMs: 8400,
            tokens: 18000,
            inputTokens: 2000,
            outputTokens: 16000,
            cost: 0.036,
          },
          {
            spanId: 'span_03',
            parentSpanId: 'span_01',
            name: 'LLM: Auth Flow Analysis',
            type: 'llm',
            status: 'SUCCESS',
            latencyMs: 18200,
            tokens: 64000,
            inputTokens: 48000,
            outputTokens: 16000,
            cost: 0.192,
            model: 'claude-3.5-sonnet',
            provider: 'anthropic',
          },
          {
            spanId: 'span_04',
            parentSpanId: 'span_01',
            name: 'LLM: SQL Injection Scanner',
            type: 'llm',
            status: 'SUCCESS',
            latencyMs: 14800,
            tokens: 52000,
            inputTokens: 40000,
            outputTokens: 12000,
            cost: 0.156,
            model: 'claude-3.5-sonnet',
            provider: 'anthropic',
          },
          {
            spanId: 'span_05',
            parentSpanId: 'span_01',
            name: 'LLM: Secret Exposure Scan',
            type: 'llm',
            status: 'SUCCESS',
            latencyMs: 12400,
            tokens: 48000,
            inputTokens: 38000,
            outputTokens: 10000,
            cost: 0.144,
            model: 'claude-3.5-sonnet',
            provider: 'anthropic',
          },
          {
            spanId: 'span_06',
            parentSpanId: 'span_05',
            name: 'Remediation Plan Generator',
            type: 'llm',
            status: 'SUCCESS',
            latencyMs: 22200,
            tokens: 48000,
            inputTokens: 40000,
            outputTokens: 8000,
            cost: 0.144,
            model: 'claude-3.5-sonnet',
            provider: 'anthropic',
          },
          {
            spanId: 'span_07',
            parentSpanId: 'span_06',
            name: 'Report Formatter',
            type: 'chain',
            status: 'SUCCESS',
            latencyMs: 10000,
            tokens: 12000,
            inputTokens: 10000,
            outputTokens: 2000,
            cost: 0.084,
          }
        ]
      }
    }
  });

  // =============================================================
  // RUN 6: Branching run — Parallel tool execution
  // Planner → [Search, Database, Calculator] → LLM
  // =============================================================
  const run6 = await prisma.run.create({
    data: {
      id: 'path-6',
      userId: user.id,
      agentId: supportAgent.id,
      title: '[Demo] Insurance Claim Multi-Source Verification',
      description: 'Parallel verification across search, database, and calculator tools with final LLM synthesis.',
      status: 'completed',
      modelFamily: 'GPT-4o',
      project: 'insurance-claims',
      env: 'production',
      wallClockMs: 6800,
      totalTokens: 15200,
      promptTokens: 6000,
      completionTokens: 9200,
      actionVelocityTps: 134.2,
      totalCostUsd: 0.032,
      totalToolCalls: 4,
      dagDepth: 3,
      isDemo: true,
      version: 'v2.0',
      qualityScore: 89,
      input: JSON.stringify({ claim_id: "CLM-29401", type: "auto_collision" }),
      output: JSON.stringify({ verified: true, approved_amount: "$4,200", confidence: 0.91 }),
      spans: {
        create: [
          {
            spanId: 'span_01',
            name: 'Claim Analysis Planner',
            type: 'llm',
            status: 'SUCCESS',
            latencyMs: 800,
            tokens: 2400,
            inputTokens: 800,
            outputTokens: 1600,
            cost: 0.0048,
            model: 'gpt-4o',
            provider: 'openai',
          },
          // Three parallel branches from span_01
          {
            spanId: 'span_02',
            parentSpanId: 'span_01',
            name: 'WebSearch: Accident Report',
            type: 'tool',
            status: 'SUCCESS',
            latencyMs: 1400,
            tokens: 3200,
            inputTokens: 400,
            outputTokens: 2800,
            cost: 0.0064,
          },
          {
            spanId: 'span_03',
            parentSpanId: 'span_01',
            name: 'Database: Policy Lookup',
            type: 'tool',
            status: 'SUCCESS',
            latencyMs: 280,
            tokens: 1800,
            inputTokens: 200,
            outputTokens: 1600,
            cost: 0.0036,
          },
          {
            spanId: 'span_04',
            parentSpanId: 'span_01',
            name: 'Calculator: Damage Assessment',
            type: 'tool',
            status: 'SUCCESS',
            latencyMs: 120,
            tokens: 800,
            inputTokens: 400,
            outputTokens: 400,
            cost: 0.0016,
          },
          {
            spanId: 'span_05',
            parentSpanId: 'span_01',
            name: 'LLM: Final Synthesis & Decision',
            type: 'llm',
            status: 'SUCCESS',
            latencyMs: 4200,
            tokens: 7000,
            inputTokens: 4200,
            outputTokens: 2800,
            cost: 0.0156,
            model: 'gpt-4o',
            provider: 'openai',
          }
        ]
      }
    }
  });

  // =============================================================
  // RUN 7: Another failed run for more detection variety
  // =============================================================
  const run7 = await prisma.run.create({
    data: {
      id: 'path-7',
      userId: user.id,
      agentId: codeAgent.id,
      title: '[Demo] Microservice Migration Planner',
      description: 'Attempted to plan microservice migration but encountered excessive retries on database connection and ultimately failed.',
      status: 'failed',
      modelFamily: 'Claude 3.5 Sonnet',
      project: 'code-refactor',
      env: 'staging',
      wallClockMs: 34200,
      totalTokens: 46800,
      promptTokens: 22000,
      completionTokens: 24800,
      actionVelocityTps: 88.2,
      totalCostUsd: 0.094,
      totalToolCalls: 5,
      dagDepth: 5,
      isDemo: true,
      version: 'v1.6',
      qualityScore: 22,
      error: 'MaxRetriesExceededError: Database connection failed after 3 retry attempts',
      errorType: 'MAX_RETRIES',
      input: JSON.stringify({ task: "Plan migration of user-service from monolith to microservice", repo: "acme/backend" }),
      spans: {
        create: [
          {
            spanId: 'span_01',
            name: 'Codebase Analyzer',
            type: 'llm',
            status: 'SUCCESS',
            latencyMs: 4200,
            tokens: 18000,
            inputTokens: 12000,
            outputTokens: 6000,
            cost: 0.036,
            model: 'claude-3.5-sonnet',
            provider: 'anthropic',
          },
          {
            spanId: 'span_02',
            parentSpanId: 'span_01',
            name: 'Database Schema Fetch (Attempt 1)',
            type: 'tool',
            status: 'FAILED',
            latencyMs: 8000,
            tokens: 400,
            cost: 0.001,
            retryCount: 0,
            errorType: 'CONNECTION_TIMEOUT',
            errorMessage: 'Connection to schema-registry timed out after 8000ms',
          },
          {
            spanId: 'span_03',
            parentSpanId: 'span_01',
            name: 'Database Schema Fetch (Attempt 2)',
            type: 'tool',
            status: 'FAILED',
            latencyMs: 8000,
            tokens: 400,
            cost: 0.001,
            retryCount: 1,
            errorType: 'CONNECTION_TIMEOUT',
            errorMessage: 'Connection to schema-registry timed out after 8000ms',
          },
          {
            spanId: 'span_04',
            parentSpanId: 'span_01',
            name: 'Database Schema Fetch (Attempt 3)',
            type: 'tool',
            status: 'FAILED',
            latencyMs: 8000,
            tokens: 400,
            cost: 0.001,
            retryCount: 2,
            errorType: 'CONNECTION_TIMEOUT',
            errorMessage: 'Connection to schema-registry timed out after 8000ms. Max retries exceeded.',
          },
          {
            spanId: 'span_05',
            parentSpanId: 'span_04',
            name: 'Error Handler',
            type: 'chain',
            status: 'FAILED',
            latencyMs: 6000,
            tokens: 27600,
            inputTokens: 8000,
            outputTokens: 19600,
            cost: 0.055,
            errorType: 'ERROR_PROPAGATION',
            errorMessage: 'Upstream dependency (schema-registry) unavailable. Cannot proceed with migration planning.',
          }
        ]
      }
    }
  });

  console.log('✅ Seeded 7 demo runs:', [run1.id, run2.id, run3.id, run4.id, run5.id, run6.id, run7.id].join(', '));
  console.log('🎉 PathFlow database seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
