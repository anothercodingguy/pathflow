export interface SpanData {
  id: string;
  spanId: string;
  parentSpanId?: string | null;
  name: string;
  type: 'Prompt' | 'WebSearch' | 'CodeExec' | 'LLMCall' | 'VectorDB' | 'Reflection' | 'Browser' | 'Memory' | 'Output' | string;
  status: 'SUCCESS' | 'FAILED' | 'RETRY' | 'KILLED' | string;
  latencyMs: number;
  tokens: number;
  cost: number;
  rawInput?: string;
  rawOutput?: string;
  diagnosticTag?: 'BAD_TOOL_SCHEMA' | 'VECTOR_RETRIEVAL_EMPTY' | 'PROMPT_DRIFT' | 'CIRCUIT_BREAKER_KILL' | string;
  diagnosticSummary?: string;
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
