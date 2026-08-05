export interface SpanData {
  id: string;
  spanId: string;
  parentSpanId: string | null;
  name: string;
  type: 'Prompt' | 'WebSearch' | 'CodeExec' | 'LLMCall' | 'VectorDB' | 'Reflection' | 'Browser' | 'Memory' | 'Output';
  status: 'SUCCESS' | 'FAILED' | 'RETRY';
  latencyMs: number;
  tokens: number;
  cost: number;
  rawInput?: string;
  rawOutput?: string;
}

export interface PathData {
  id: string;
  title: string;
  description: string;
  status: 'COMPLETED' | 'FAILED' | 'RUNNING';
  durationMs: number;
  tokens: number;       // CONTEXT
  cost: number;         // COMPUTE
  tps: number;          // VELOCITY
  elevationDepth: number; // REASONING (tree depth)
  reactions: {
    useful: number;     // ⭐ Useful
    efficient: number;  // 🔥 Efficient
    clever: number;     // 🧠 Clever
    fast: number;       // ⚡ Fast
  };
  isForkable: boolean;
  modelFamily: string;
  skillSegment: string;
  createdAt: string;
  user: {
    name: string;
    username: string;
    avatar: string;
    location: string;
    title: string;
    topSkillPercentile: string;
  };
  agent: {
    name: string;
    version: string;
    framework: string;
  };
  spans: SpanData[];
}

export interface LeaderboardEntry {
  id: string;
  segmentSlug: string;
  segmentTitle: string;
  agentName: string;
  userName: string;
  userAvatar: string;
  modelFamily: string;
  latencyMs: number;
  tps: number;
  cost: number;
  accuracyScore: number; // Success rate
  efficiencyScore: number; // Multi-factor score
  rank: number;
  isKom: boolean;
}

export const MOCK_PATHS: PathData[] = [
  {
    id: 'path-1',
    title: 'Resolved Pytest async timeout bug in 12s',
    description: 'Diagnosed async loop closure leak in test_runner.py, reflected on AST context, generated patch, and verified sandbox tests.',
    status: 'COMPLETED',
    durationMs: 12400,
    tokens: 18400,
    cost: 0.038,
    tps: 112.4,
    elevationDepth: 5,
    reactions: {
      useful: 84,
      efficient: 128,
      clever: 62,
      fast: 45
    },
    isForkable: true,
    modelFamily: 'Claude 3.5 Sonnet',
    skillSegment: 'Code Generation',
    createdAt: '12 minutes ago',
    user: {
      name: 'Suyash',
      username: 'suyash',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      location: 'San Francisco, CA',
      title: 'AI Engineer',
      topSkillPercentile: 'Top 0.8%'
    },
    agent: {
      name: 'Claude Sonnet 5',
      version: 'v5.0',
      framework: 'LangChain'
    },
    spans: [
      {
        id: 's1',
        spanId: 'span_01',
        parentSpanId: null,
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
        id: 's2',
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
        id: 's3',
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
        id: 's4',
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
        id: 's5',
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
        id: 's6',
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
        id: 's7',
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
  },
  {
    id: 'path-2',
    title: 'Autonomous E-Commerce Checkout Pipeline',
    description: 'Extracted product specs, navigated checkout steps via headless browser, filled shipping forms, and executed payment authorization.',
    status: 'COMPLETED',
    durationMs: 18200,
    tokens: 32100,
    cost: 0.031,
    tps: 145.2,
    elevationDepth: 6,
    reactions: {
      useful: 142,
      efficient: 215,
      clever: 98,
      fast: 110
    },
    isForkable: true,
    modelFamily: 'GPT-4o',
    skillSegment: 'Browser Automation',
    createdAt: '45 minutes ago',
    user: {
      name: 'Sarah Chen',
      username: 'schen',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
      location: 'New York, NY',
      title: 'Automation Lead',
      topSkillPercentile: 'Top 1%'
    },
    agent: {
      name: 'AutoCheckout v4',
      version: 'v4.0',
      framework: 'AutoGPT'
    },
    spans: [
      {
        id: 's21',
        spanId: 'span_01',
        parentSpanId: null,
        name: 'User Intent Parser',
        type: 'Prompt',
        status: 'SUCCESS',
        latencyMs: 210,
        tokens: 1200,
        cost: 0.0024
      },
      {
        id: 's22',
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
        id: 's23',
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
        id: 's24',
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
        id: 's25',
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
  },
  {
    id: 'path-3',
    title: 'Deep Research: Quantum Computing Market Breakdown',
    description: '31-step recursive web search, reflection loops, memory retrieval, and multi-document synthesis.',
    status: 'COMPLETED',
    durationMs: 42100,
    tokens: 94200,
    cost: 0.142,
    tps: 168.0,
    elevationDepth: 8,
    reactions: {
      useful: 310,
      efficient: 184,
      clever: 245,
      fast: 89
    },
    isForkable: true,
    modelFamily: 'Claude 3.5 Sonnet',
    skillSegment: 'Tool Selection',
    createdAt: '2 hours ago',
    user: {
      name: 'Suyash',
      username: 'suyash',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      location: 'San Francisco, CA',
      title: 'AI Engineer',
      topSkillPercentile: 'Top 0.8%'
    },
    agent: {
      name: 'DeepResearch Bot',
      version: 'v3.1',
      framework: 'CrewAI'
    },
    spans: [
      {
        id: 's31',
        spanId: 'span_01',
        parentSpanId: null,
        name: 'Initial Research Prompt',
        type: 'Prompt',
        status: 'SUCCESS',
        latencyMs: 340,
        tokens: 14200,
        cost: 0.0284
      },
      {
        id: 's32',
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
        id: 's33',
        spanId: 'span_03',
        parentSpanId: 'span_02',
        name: 'Hypothesis Verification Loop',
        type: 'Reflection',
        status: 'SUCCESS',
        latencyMs: 4200,
        tokens: 24000,
        cost: 0.0380
      },
      {
        id: 's34',
        spanId: 'span_04',
        parentSpanId: 'span_03',
        name: 'ChromaDB Citation Retrieval',
        type: 'Memory',
        status: 'SUCCESS',
        latencyMs: 850,
        tokens: 12000,
        cost: 0.0180
      },
      {
        id: 's35',
        spanId: 'span_05',
        parentSpanId: 'span_04',
        name: 'Final Synthesis Output',
        type: 'Output',
        status: 'SUCCESS',
        latencyMs: 2600,
        tokens: 25600,
        cost: 0.0308
      }
    ]
  }
];

export const MOCK_LEADERBOARDS: LeaderboardEntry[] = [
  {
    id: 'lb-1',
    segmentSlug: 'browser-login',
    segmentTitle: 'Browser Login & Session Handling',
    agentName: 'AutoCheckout v4',
    userName: 'Sarah Chen',
    userAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    modelFamily: 'GPT-4o',
    latencyMs: 18200,
    tps: 145.2,
    cost: 0.031, // Low cost = high efficiency score!
    accuracyScore: 99.4,
    efficiencyScore: 98.6, // Score = Success * Efficiency * Novelty * Difficulty
    rank: 1,
    isKom: true
  },
  {
    id: 'lb-2',
    segmentSlug: 'browser-login',
    segmentTitle: 'Browser Login & Session Handling',
    agentName: 'FastAgent B',
    userName: 'David Kim',
    userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    modelFamily: 'Claude 3.5 Sonnet',
    latencyMs: 10200, // Faster latency but 10x higher cost ($0.70)
    tps: 180.0,
    cost: 0.700, // High cost penalizes total score
    accuracyScore: 99.4,
    efficiencyScore: 74.2, // Ranked lower despite being faster!
    rank: 2,
    isKom: false
  },
  {
    id: 'lb-3',
    segmentSlug: 'json-parsing',
    segmentTitle: 'Strict Schema JSON Parsing',
    agentName: 'Claude Sonnet 5',
    userName: 'Suyash',
    userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    modelFamily: 'Claude 3.5 Sonnet',
    latencyMs: 12400,
    tps: 112.4,
    cost: 0.038,
    accuracyScore: 100.0,
    efficiencyScore: 99.2,
    rank: 1,
    isKom: true
  },
  {
    id: 'lb-4',
    segmentSlug: 'sql-agent',
    segmentTitle: 'Zero-Shot SQL Schema Migration',
    agentName: 'SchemaArchitect',
    userName: 'Suyash',
    userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    modelFamily: 'GPT-4o',
    latencyMs: 7800,
    tps: 132.0,
    cost: 0.029,
    accuracyScore: 98.0,
    efficiencyScore: 97.4,
    rank: 1,
    isKom: true
  }
];

export function getPathById(id: string): PathData | undefined {
  return MOCK_PATHS.find(p => p.id === id || p.id === `path-${id.replace('run-', '')}`) || MOCK_PATHS[0];
}
