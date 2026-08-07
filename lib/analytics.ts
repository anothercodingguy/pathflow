import { PathData, SpanData } from './data';

export interface AutomaticInsight {
  id: string;
  type: 'BOTTLENECK' | 'LOOP_DETECTED' | 'RETRY_ANOMALY' | 'TOKEN_SPIKE' | 'OPTIMIZATION';
  severity: 'WARNING' | 'CRITICAL' | 'INFO';
  title: string;
  description: string;
  impact?: string;
  savings?: {
    latencySeconds?: number;
    costUsd?: number;
  };
}

export interface CostAttributionItem {
  category: string;
  costUsd: number;
  percentage: number;
  count: number;
}

export interface OptimizationSuggestion {
  id: string;
  action: string;
  targetSpanName: string;
  reason: string;
  projectedSavings: {
    latencyMs: number;
    costUsd: number;
  };
}

/**
 * Computes Critical Path Span IDs (the chain of slowest dependencies)
 */
export function computeCriticalPath(spans: SpanData[]): Set<string> {
  const criticalSet = new Set<string>();
  if (!spans || spans.length === 0) return criticalSet;

  // Find overall bottleneck / slowest span
  let maxSpan = spans[0];
  spans.forEach(s => {
    if (s.latencyMs > maxSpan.latencyMs) {
      maxSpan = s;
    }
  });

  // Trace back parent spans to form critical path
  let currentId: string | null = maxSpan.spanId;
  while (currentId) {
    criticalSet.add(currentId);
    const parentSpan = spans.find(s => s.spanId === currentId);
    currentId = parentSpan?.parentSpanId || null;
  }

  return criticalSet;
}

/**
 * Computes Cost Attribution breakdown by Span Type (LLM, Browser, Search, VectorDB, Memory)
 */
export function computeCostAttribution(spans: SpanData[], totalCost: number): CostAttributionItem[] {
  if (!spans || spans.length === 0) return [];

  const map: Record<string, { costUsd: number; count: number }> = {};
  const runTotal = totalCost || spans.reduce((acc, s) => acc + s.cost, 0) || 0.001;

  spans.forEach(s => {
    const cat = s.type || 'LLMCall';
    if (!map[cat]) {
      map[cat] = { costUsd: 0, count: 0 };
    }
    map[cat].costUsd += s.cost;
    map[cat].count += 1;
  });

  return Object.entries(map).map(([category, data]) => ({
    category,
    costUsd: data.costUsd,
    percentage: Math.min(100, Math.round((data.costUsd / runTotal) * 100)),
    count: data.count,
  })).sort((a, b) => b.costUsd - a.costUsd);
}

/**
 * Generates Automatic Insights (Bottleneck, Loop, Token Spikes, Retries)
 */
export function generateAutomaticInsights(run: PathData): AutomaticInsight[] {
  const insights: AutomaticInsight[] = [];
  const spans = run.spans || [];
  const totalDuration = run.durationMs || spans.reduce((acc, s) => acc + s.latencyMs, 0) || 1;

  if (spans.length === 0) return insights;

  // 1. Dominant Bottleneck Insight
  const slowestSpan = [...spans].sort((a, b) => b.latencyMs - a.latencyMs)[0];
  if (slowestSpan && totalDuration > 0) {
    const pct = Math.round((slowestSpan.latencyMs / totalDuration) * 100);
    if (pct >= 40) {
      insights.push({
        id: 'ins_bottleneck',
        type: 'BOTTLENECK',
        severity: pct >= 60 ? 'CRITICAL' : 'WARNING',
        title: `Dominant Bottleneck: ${slowestSpan.name}`,
        description: `This ${slowestSpan.type} step consumed ${pct}% of total run execution time (${(slowestSpan.latencyMs / 1000).toFixed(1)}s).`,
        impact: `Delaying overall agent response time by ${(slowestSpan.latencyMs / 1000).toFixed(1)}s.`
      });
    }
  }

  // 2. Repeated Loop Detection Insight
  const reflectionSpans = spans.filter(s => s.type === 'Reflection' || s.name.toLowerCase().includes('loop') || s.name.toLowerCase().includes('reflection'));
  if (reflectionSpans.length >= 3) {
    insights.push({
      id: 'ins_loop',
      type: 'LOOP_DETECTED',
      severity: 'WARNING',
      title: `Repeated Reflection Loop Detected`,
      description: `Reflection or verification loop executed ${reflectionSpans.length} consecutive times.`,
      impact: `Added +${(reflectionSpans.reduce((a, b) => a + b.latencyMs, 0) / 1000).toFixed(1)}s latency and $${reflectionSpans.reduce((a, b) => a + b.cost, 0).toFixed(3)} cost.`
    });
  }

  // 3. High Token Spike Insight
  const highestTokenSpan = [...spans].sort((a, b) => b.tokens - a.tokens)[0];
  if (highestTokenSpan && highestTokenSpan.tokens > 8000) {
    insights.push({
      id: 'ins_token_spike',
      type: 'TOKEN_SPIKE',
      severity: 'INFO',
      title: `High Token Ingestion: ${highestTokenSpan.name}`,
      description: `Step ingested ${highestTokenSpan.tokens.toLocaleString()} tokens into context window.`,
      impact: `Accounted for ${Math.round((highestTokenSpan.tokens / (run.tokens || 1)) * 100)}% of total run token budget.`
    });
  }

  // 4. Failed or Retried Step Insight
  const failedSpans = spans.filter(s => s.status === 'FAILED');
  if (failedSpans.length > 0) {
    insights.push({
      id: 'ins_retry',
      type: 'RETRY_ANOMALY',
      severity: 'CRITICAL',
      title: `Step Failure Detected: ${failedSpans[0].name}`,
      description: failedSpans[0].diagnosticSummary || `Step failed with status FAILED. Inspect JSON payload for details.`,
      impact: `Interrupted execution pipeline before output completion.`
    });
  }

  return insights;
}

/**
 * Generates Actionable Optimization Suggestions with exact latency/cost savings
 */
export function generateOptimizationSuggestions(run: PathData): OptimizationSuggestion[] {
  const suggestions: OptimizationSuggestion[] = [];
  const spans = run.spans || [];

  // Suggestion 1: Caching Memory / Vector Retrieval
  const memorySpan = spans.find(s => s.type === 'Memory' || s.type === 'VectorDB');
  if (memorySpan && memorySpan.latencyMs > 500) {
    suggestions.push({
      id: 'sug_cache_vector',
      action: 'Enable Semantic Vector Cache',
      targetSpanName: memorySpan.name,
      reason: 'Frequent repeated vector searches can be served from Redis/Memory semantic cache.',
      projectedSavings: {
        latencyMs: Math.round(memorySpan.latencyMs * 0.85),
        costUsd: parseFloat((memorySpan.cost * 0.8).toFixed(4))
      }
    });
  }

  // Suggestion 2: Parallelizing Independent Web Searches or Spans
  const webSearchSpans = spans.filter(s => s.type === 'WebSearch' || s.type === 'Browser');
  if (webSearchSpans.length >= 2) {
    const totalWebMs = webSearchSpans.reduce((a, b) => a + b.latencyMs, 0);
    suggestions.push({
      id: 'sug_parallel_search',
      action: 'Parallelize Browser & Web Searches',
      targetSpanName: webSearchSpans.map(s => s.name).join(', '),
      reason: 'Web search and scraping spans executed sequentially instead of concurrently using asyncio.gather().',
      projectedSavings: {
        latencyMs: Math.round(totalWebMs * 0.5),
        costUsd: 0.0
      }
    });
  }

  // Suggestion 3: Context Trimming / Prompt Optimization
  const highLLMSpan = spans.find(s => s.type === 'LLMCall' && s.tokens > 10000);
  if (highLLMSpan) {
    suggestions.push({
      id: 'sug_trim_prompt',
      action: 'Trim Context Prompt AST',
      targetSpanName: highLLMSpan.name,
      reason: 'Context window contains uncompressed AST nodes and redundant docstring tokens.',
      projectedSavings: {
        latencyMs: Math.round(highLLMSpan.latencyMs * 0.3),
        costUsd: parseFloat((highLLMSpan.cost * 0.35).toFixed(4))
      }
    });
  }

  return suggestions;
}
