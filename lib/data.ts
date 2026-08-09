export interface SpanData {
  id: string;
  spanId: string;
  parentSpanId?: string | null;
  name: string;
  type: 'agent' | 'llm' | 'tool' | 'retrieval' | 'embedding' | 'reranker' | 'guardrail' | 'chain' | 'workflow' | 'custom' | 'Prompt' | 'WebSearch' | 'CodeExec' | 'LLMCall' | 'VectorDB' | 'Reflection' | 'Browser' | 'Memory' | 'Output' | string;
  status: 'SUCCESS' | 'FAILED' | 'RETRY' | 'KILLED' | string;
  latencyMs: number;
  tokens: number;
  cost: number;
  rawInput?: string;
  rawOutput?: string;
  diagnosticTag?: 'BAD_TOOL_SCHEMA' | 'VECTOR_RETRIEVAL_EMPTY' | 'PROMPT_DRIFT' | 'CIRCUIT_BREAKER_KILL' | string;
  diagnosticSummary?: string;

  // Extended span fields
  model?: string;
  provider?: string;
  inputTokens?: number;
  outputTokens?: number;
  errorType?: string;
  errorMessage?: string;
  retryCount?: number;
  metadata?: string;
  attributes?: string;
}

export interface PathData {
  id: string;
  title: string;
  description: string;
  status: 'COMPLETED' | 'FAILED' | 'RUNNING' | string;
  durationMs: number;
  tokens: number;
  cost: number;
  tps: number;
  elevationDepth: number;
  modelFamily: string;
  createdAt: string;
  project?: string;
  env?: string;
  agent: {
    id?: string;
    name: string;
    framework: string;
  };
  spans: SpanData[];

  // Extended trace fields
  input?: string;
  output?: string;
  error?: string;
  errorType?: string;
  sessionId?: string;
  endUserId?: string;
  qualityScore?: number;
  version?: string;
  promptVersion?: string;
  gitCommit?: string;
  isDemo?: boolean;
  promptTokens?: number;
  completionTokens?: number;
}

export type CurrencyMode = 'USD' | 'INR';

export const USD_TO_INR_RATE = 85.0;

/**
 * Currency Formatting Helper (USD $ vs INR ₹ Rupees)
 */
export function formatCurrency(costUsd: number, currency: CurrencyMode = 'USD'): string {
  if (!costUsd || costUsd === 0) return '—';
  if (currency === 'INR') {
    const costInr = costUsd * USD_TO_INR_RATE;
    return `₹${costInr.toFixed(2)}`;
  }
  if (costUsd < 0.001) return `<$0.001`;
  return `$${costUsd.toFixed(3)}`;
}

export function formatCostDisplay(costUsd: number, currency: CurrencyMode = 'USD'): { text: string; label: string; isUnavailable: boolean } {
  if (!costUsd || costUsd === 0) {
    return { text: '—', label: 'Pricing unavailable', isUnavailable: true };
  }
  return { text: formatCurrency(costUsd, currency), label: currency, isUnavailable: false };
}

/**
 * Format a Prisma run record into PathData for the frontend.
 */
export function formatRunToPathData(run: any): PathData {
  return {
    id: run.id,
    title: run.title,
    description: run.description || '',
    agent: {
      id: run.agent?.id || '',
      name: run.agent?.name || 'Agent',
      framework: run.agent?.framework || 'Custom',
    },
    status: run.status.toUpperCase(),
    tps: run.actionVelocityTps,
    cost: run.totalCostUsd,
    tokens: run.totalTokens,
    durationMs: run.wallClockMs,
    elevationDepth: run.dagDepth,
    modelFamily: run.modelFamily,
    createdAt: run.createdAt instanceof Date ? run.createdAt.toISOString() : new Date(run.createdAt).toISOString(),
    project: run.project || 'default',
    env: run.env || 'production',
    input: run.input || undefined,
    output: run.output || undefined,
    error: run.error || undefined,
    errorType: run.errorType || undefined,
    sessionId: run.sessionId || undefined,
    endUserId: run.endUserId || undefined,
    qualityScore: run.qualityScore ?? undefined,
    version: run.version || undefined,
    promptVersion: run.promptVersion || undefined,
    gitCommit: run.gitCommit || undefined,
    isDemo: run.isDemo || false,
    promptTokens: run.promptTokens || 0,
    completionTokens: run.completionTokens || 0,
    spans: (run.spans || []).map((s: any) => ({
      id: s.id,
      spanId: s.spanId,
      name: s.name,
      type: s.type,
      status: s.status,
      latencyMs: s.latencyMs,
      tokens: s.tokens,
      cost: s.cost,
      rawInput: s.rawInput || undefined,
      rawOutput: s.rawOutput || undefined,
      diagnosticTag: s.diagnosticTag || undefined,
      diagnosticSummary: s.diagnosticSummary || undefined,
      parentSpanId: s.parentSpanId || undefined,
      model: s.model || undefined,
      provider: s.provider || undefined,
      inputTokens: s.inputTokens || 0,
      outputTokens: s.outputTokens || 0,
      errorType: s.errorType || undefined,
      errorMessage: s.errorMessage || undefined,
      retryCount: s.retryCount || 0,
      metadata: s.metadata || undefined,
      attributes: s.attributes || undefined,
    })),
  };
}

/**
 * Client API Fetchers for Automatic Telemetry Data
 */
export async function fetchRunsFromApi(query: string = '', status: string = ''): Promise<PathData[]> {
  try {
    const params = new URLSearchParams();
    if (query) params.append('q', query);
    if (status && status !== 'ALL') params.append('status', status);

    const url = `/api/paths${params.toString() ? `?${params.toString()}` : ''}`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return [];

    const data = await res.json();
    return data.paths || [];
  } catch (err) {
    console.error('Error fetching execution runs:', err);
    return [];
  }
}

export async function fetchRunByIdFromApi(id: string): Promise<PathData | null> {
  try {
    const res = await fetch(`/api/paths/${id}`, { cache: 'no-store' });
    if (!res.ok) return null;

    const data = await res.json();
    return data.path || null;
  } catch (err) {
    console.error(`Error fetching run ${id}:`, err);
    return null;
  }
}
