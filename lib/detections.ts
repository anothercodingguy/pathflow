/**
 * PathFlow Detection Engine
 * 
 * Automatically identifies problematic execution patterns in traces.
 * Each detection function analyzes spans and returns structured findings.
 */

import { SpanData, PathData } from './data';

export interface Detection {
  type: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  title: string;
  description: string;
  spanId?: string;
  spanName?: string;
  evidence: string[];
  impact: string;
  recommendation: string;
}

/**
 * Run all detection rules against a trace/run.
 */
export function runDetections(run: PathData): Detection[] {
  const detections: Detection[] = [];
  const spans = run.spans || [];
  if (spans.length === 0) return detections;

  detections.push(...detectToolLoop(spans));
  detections.push(...detectExcessiveRetry(spans));
  detections.push(...detectTimeout(spans, run));
  detections.push(...detectHighLatency(spans, run));
  detections.push(...detectHighCost(run));
  detections.push(...detectTokenExplosion(spans, run));
  detections.push(...detectErrorPropagation(spans));
  detections.push(...detectEmptyToolResponse(spans));
  detections.push(...detectRepeatedLLMDecision(spans));

  return detections;
}

/**
 * 1. Tool Loop Detection
 * Agent repeatedly calls the same tool with similar arguments.
 */
function detectToolLoop(spans: SpanData[]): Detection[] {
  const detections: Detection[] = [];
  const toolSpans = spans.filter(s => s.type === 'tool' || s.type === 'WebSearch' || s.type === 'Browser');
  
  // Group consecutive tool spans by name
  const nameGroups: Record<string, SpanData[]> = {};
  toolSpans.forEach(s => {
    const key = s.name.replace(/\s*\(.*?\)\s*/g, '').replace(/\s*#\d+\s*/g, '').trim();
    if (!nameGroups[key]) nameGroups[key] = [];
    nameGroups[key].push(s);
  });

  // Also check by type for generic tools
  const typeGroups: Record<string, SpanData[]> = {};
  toolSpans.forEach(s => {
    if (!typeGroups[s.type]) typeGroups[s.type] = [];
    typeGroups[s.type].push(s);
  });

  // Check name-based groups
  for (const [name, group] of Object.entries(nameGroups)) {
    if (group.length >= 3) {
      const totalLatency = group.reduce((a, b) => a + b.latencyMs, 0);
      const totalCost = group.reduce((a, b) => a + b.cost, 0);
      detections.push({
        type: 'TOOL_LOOP',
        severity: group.length >= 5 ? 'CRITICAL' : 'HIGH',
        title: `Tool Loop Detected: ${name}`,
        description: `The agent called "${name}" ${group.length} times in a single execution.`,
        spanId: group[group.length - 1].spanId,
        spanName: name,
        evidence: [
          `"${name}" was called ${group.length} times`,
          `Total latency from repeated calls: ${(totalLatency / 1000).toFixed(1)}s`,
          `Total cost from repeated calls: $${totalCost.toFixed(4)}`,
        ],
        impact: `+${(totalLatency / 1000).toFixed(1)}s latency, +$${totalCost.toFixed(4)} cost from repeated tool calls`,
        recommendation: 'Review the planner/tool-selection logic. Add a result-sufficiency check before invoking the tool again, or implement caching for identical queries.',
      });
    }
  }

  // Check type-based groups for WebSearch specifically
  const webSearches = typeGroups['tool']?.filter(s => 
    s.name.toLowerCase().includes('search') || s.name.toLowerCase().includes('web')
  ) || [];
  if (webSearches.length >= 4 && !detections.some(d => d.type === 'TOOL_LOOP')) {
    const totalLatency = webSearches.reduce((a, b) => a + b.latencyMs, 0);
    const totalCost = webSearches.reduce((a, b) => a + b.cost, 0);
    detections.push({
      type: 'TOOL_LOOP',
      severity: 'HIGH',
      title: `Excessive Web Searches: ${webSearches.length} calls`,
      description: `The agent performed ${webSearches.length} web searches in a single execution, suggesting the planner failed to recognize when sufficient data was already available.`,
      spanId: webSearches[webSearches.length - 1].spanId,
      spanName: webSearches[webSearches.length - 1].name,
      evidence: webSearches.map(s => `Search: "${s.name}" (${s.latencyMs}ms)`),
      impact: `+${(totalLatency / 1000).toFixed(1)}s latency, +$${totalCost.toFixed(4)} cost`,
      recommendation: 'Add a search-result deduplication step or limit maximum consecutive searches.',
    });
  }

  return detections;
}

/**
 * 2. Excessive Retry Detection
 * Tool or span failed and was retried multiple times.
 */
function detectExcessiveRetry(spans: SpanData[]): Detection[] {
  const detections: Detection[] = [];
  
  // Check retryCount on individual spans
  const retrySpans = spans.filter(s => (s.retryCount || 0) >= 2);
  retrySpans.forEach(s => {
    detections.push({
      type: 'EXCESSIVE_RETRY',
      severity: (s.retryCount || 0) >= 3 ? 'HIGH' : 'MEDIUM',
      title: `Excessive Retries: ${s.name}`,
      description: `${s.name} was retried ${s.retryCount} times before ${s.status === 'FAILED' ? 'ultimately failing' : 'succeeding'}.`,
      spanId: s.spanId,
      spanName: s.name,
      evidence: [
        `Retry count: ${s.retryCount}`,
        `Final status: ${s.status}`,
        `Error: ${s.errorMessage || s.diagnosticSummary || 'Unknown'}`,
      ],
      impact: `Retries added ~${((s.retryCount || 0) * s.latencyMs / 1000).toFixed(1)}s to execution time`,
      recommendation: 'Implement exponential backoff with jitter, or add a circuit breaker to fail fast.',
    });
  });

  // Also detect by pattern: consecutive spans with same name containing "retry" or "attempt"
  const failedConsecutive: SpanData[][] = [];
  let currentGroup: SpanData[] = [];
  for (const span of spans) {
    if (span.status === 'FAILED') {
      currentGroup.push(span);
    } else {
      if (currentGroup.length >= 2) {
        failedConsecutive.push([...currentGroup]);
      }
      currentGroup = [];
    }
  }
  if (currentGroup.length >= 2) failedConsecutive.push(currentGroup);

  failedConsecutive.forEach(group => {
    if (!detections.some(d => d.spanId === group[0].spanId && d.type === 'EXCESSIVE_RETRY')) {
      const totalMs = group.reduce((a, b) => a + b.latencyMs, 0);
      detections.push({
        type: 'EXCESSIVE_RETRY',
        severity: group.length >= 3 ? 'HIGH' : 'MEDIUM',
        title: `${group.length} Consecutive Failures`,
        description: `${group.length} spans failed consecutively, suggesting a systemic issue.`,
        spanId: group[0].spanId,
        spanName: group[0].name,
        evidence: group.map(s => `${s.name}: ${s.status} (${s.latencyMs}ms)`),
        impact: `${group.length} failed operations wasted ${(totalMs / 1000).toFixed(1)}s`,
        recommendation: 'Check upstream dependencies. Add health checks before retrying.',
      });
    }
  });

  return detections;
}

/**
 * 3. Timeout Detection
 * A span exceeds a configurable threshold (default: 15s).
 */
function detectTimeout(spans: SpanData[], run: PathData, thresholdMs: number = 15000): Detection[] {
  const detections: Detection[] = [];
  
  spans.forEach(s => {
    if (s.latencyMs >= thresholdMs) {
      detections.push({
        type: 'TIMEOUT',
        severity: s.latencyMs >= 30000 ? 'CRITICAL' : 'HIGH',
        title: `Slow Span: ${s.name} (${(s.latencyMs / 1000).toFixed(1)}s)`,
        description: `${s.name} took ${(s.latencyMs / 1000).toFixed(1)}s, exceeding the ${(thresholdMs / 1000).toFixed(0)}s threshold.`,
        spanId: s.spanId,
        spanName: s.name,
        evidence: [
          `Duration: ${(s.latencyMs / 1000).toFixed(1)}s`,
          `Threshold: ${(thresholdMs / 1000).toFixed(0)}s`,
          `Type: ${s.type}`,
          `Status: ${s.status}`,
        ],
        impact: `This span consumed ${Math.round((s.latencyMs / (run.durationMs || 1)) * 100)}% of total execution time`,
        recommendation: s.type === 'tool' || s.type === 'WebSearch' 
          ? 'Add request timeout limits and implement fallback strategies.'
          : 'Consider prompt optimization or model switching for faster inference.',
      });
    }
  });

  return detections;
}

/**
 * 4. High Latency Detection
 * A span is significantly slower than the average span in the trace.
 */
function detectHighLatency(spans: SpanData[], run: PathData): Detection[] {
  const detections: Detection[] = [];
  if (spans.length < 3) return detections;

  const avgLatency = spans.reduce((a, b) => a + b.latencyMs, 0) / spans.length;
  const threshold = avgLatency * 3; // 3x average = outlier

  spans.forEach(s => {
    if (s.latencyMs > threshold && s.latencyMs >= 2000) {
      const pctOfTotal = Math.round((s.latencyMs / (run.durationMs || 1)) * 100);
      if (pctOfTotal >= 40) {
        detections.push({
          type: 'HIGH_LATENCY',
          severity: pctOfTotal >= 60 ? 'CRITICAL' : 'HIGH',
          title: `Bottleneck: ${s.name} consumed ${pctOfTotal}% of execution`,
          description: `${s.name} took ${(s.latencyMs / 1000).toFixed(1)}s, which is ${Math.round(s.latencyMs / avgLatency)}x the average span duration.`,
          spanId: s.spanId,
          spanName: s.name,
          evidence: [
            `Span duration: ${(s.latencyMs / 1000).toFixed(1)}s`,
            `Average span: ${(avgLatency / 1000).toFixed(1)}s`,
            `Multiplier: ${(s.latencyMs / avgLatency).toFixed(1)}x`,
            `Percentage of total: ${pctOfTotal}%`,
          ],
          impact: `Dominates ${pctOfTotal}% of total ${(run.durationMs / 1000).toFixed(1)}s execution`,
          recommendation: 'Consider parallelizing this operation, adding caching, or breaking it into smaller steps.',
        });
      }
    }
  });

  return detections;
}

/**
 * 5. High Cost Detection
 * Run cost exceeds threshold (default: $0.50).
 */
function detectHighCost(run: PathData, thresholdUsd: number = 0.50): Detection[] {
  const detections: Detection[] = [];
  
  if (run.cost >= thresholdUsd) {
    detections.push({
      type: 'HIGH_COST',
      severity: run.cost >= 1.0 ? 'CRITICAL' : run.cost >= 0.50 ? 'HIGH' : 'MEDIUM',
      title: `High Cost Run: $${run.cost.toFixed(3)}`,
      description: `This run cost $${run.cost.toFixed(3)}, exceeding the $${thresholdUsd.toFixed(2)} threshold.`,
      evidence: [
        `Total cost: $${run.cost.toFixed(3)}`,
        `Total tokens: ${run.tokens.toLocaleString()}`,
        `Threshold: $${thresholdUsd.toFixed(2)}`,
      ],
      impact: `$${run.cost.toFixed(3)} per execution. At 100 runs/day = $${(run.cost * 100).toFixed(0)}/day`,
      recommendation: 'Review token usage. Consider prompt compression, model downgrading for non-critical steps, or caching repeated computations.',
    });
  }

  return detections;
}

/**
 * 6. Token Explosion Detection
 * Total token usage or individual span token usage is unusually high.
 */
function detectTokenExplosion(spans: SpanData[], run: PathData, thresholdTokens: number = 50000): Detection[] {
  const detections: Detection[] = [];

  if (run.tokens >= thresholdTokens) {
    const highTokenSpan = [...spans].sort((a, b) => b.tokens - a.tokens)[0];
    detections.push({
      type: 'TOKEN_EXPLOSION',
      severity: run.tokens >= 200000 ? 'CRITICAL' : run.tokens >= 100000 ? 'HIGH' : 'MEDIUM',
      title: `High Token Usage: ${run.tokens.toLocaleString()} tokens`,
      description: `This run consumed ${run.tokens.toLocaleString()} tokens, exceeding the ${thresholdTokens.toLocaleString()} token threshold.`,
      spanId: highTokenSpan?.spanId,
      spanName: highTokenSpan?.name,
      evidence: [
        `Total tokens: ${run.tokens.toLocaleString()}`,
        `Highest span: ${highTokenSpan?.name} (${highTokenSpan?.tokens.toLocaleString()} tokens)`,
        `Highest span percentage: ${Math.round(((highTokenSpan?.tokens || 0) / (run.tokens || 1)) * 100)}%`,
      ],
      impact: `High token usage directly increases cost ($${run.cost.toFixed(3)}) and latency`,
      recommendation: 'Trim context windows, summarize intermediate results, or use retrieval instead of full-context approaches.',
    });
  }

  return detections;
}

/**
 * 7. Error Propagation Detection
 * A failed span causes downstream failures.
 */
function detectErrorPropagation(spans: SpanData[]): Detection[] {
  const detections: Detection[] = [];
  const failedSpans = spans.filter(s => s.status === 'FAILED');
  
  if (failedSpans.length >= 2) {
    // Check if failed spans have parent-child relationships
    const failedIds = new Set(failedSpans.map(s => s.spanId));
    const propagated = failedSpans.filter(s => s.parentSpanId && failedIds.has(s.parentSpanId));
    
    if (propagated.length > 0) {
      // Find the root failure
      const rootFailure = failedSpans.find(s => !s.parentSpanId || !failedIds.has(s.parentSpanId));
      detections.push({
        type: 'ERROR_PROPAGATION',
        severity: 'HIGH',
        title: `Error Propagation: ${failedSpans.length} cascading failures`,
        description: `A failure in "${rootFailure?.name || failedSpans[0].name}" propagated to ${propagated.length} downstream span(s).`,
        spanId: rootFailure?.spanId || failedSpans[0].spanId,
        spanName: rootFailure?.name || failedSpans[0].name,
        evidence: failedSpans.map(s => `${s.name}: ${s.errorMessage || s.status}`),
        impact: `${failedSpans.length} operations failed due to upstream dependency failure`,
        recommendation: 'Add error isolation. Failed upstream steps should not always block downstream execution. Consider fallback strategies.',
      });
    }
  }

  return detections;
}

/**
 * 8. Empty/Invalid Tool Response Detection
 * Tool returns empty or malformed data.
 */
function detectEmptyToolResponse(spans: SpanData[]): Detection[] {
  const detections: Detection[] = [];
  
  const toolSpans = spans.filter(s => 
    s.type === 'tool' || s.type === 'WebSearch' || s.type === 'retrieval'
  );

  toolSpans.forEach(s => {
    const output = s.rawOutput;
    if (s.status === 'SUCCESS' && output) {
      try {
        const parsed = JSON.parse(output);
        const isEmpty = (
          parsed === null ||
          parsed === undefined ||
          (typeof parsed === 'object' && Object.keys(parsed).length === 0) ||
          (Array.isArray(parsed) && parsed.length === 0) ||
          (parsed.results !== undefined && (parsed.results === null || parsed.results === 0 || (Array.isArray(parsed.results) && parsed.results.length === 0)))
        );
        if (isEmpty) {
          detections.push({
            type: 'EMPTY_TOOL_RESPONSE',
            severity: 'MEDIUM',
            title: `Empty Response: ${s.name}`,
            description: `Tool "${s.name}" returned an empty or null response despite reporting SUCCESS.`,
            spanId: s.spanId,
            spanName: s.name,
            evidence: [
              `Tool: ${s.name}`,
              `Status: SUCCESS`,
              `Response: ${output.substring(0, 200)}`,
            ],
            impact: 'Downstream LLM calls may produce lower quality output due to missing tool data',
            recommendation: 'Add validation for tool responses. Retry with modified parameters or use a fallback data source.',
          });
        }
      } catch {
        // Not JSON, skip
      }
    }
  });

  return detections;
}

/**
 * 9. Repeated LLM Decision Detection
 * Detect when the LLM produces very similar reasoning/action patterns.
 */
function detectRepeatedLLMDecision(spans: SpanData[]): Detection[] {
  const detections: Detection[] = [];
  const llmSpans = spans.filter(s => s.type === 'llm' || s.type === 'LLMCall');
  
  if (llmSpans.length < 3) return detections;

  // Check for repeated similar names suggesting loop behavior
  const nameGroups: Record<string, SpanData[]> = {};
  llmSpans.forEach(s => {
    const normalized = s.name.replace(/\s*#\d+\s*/g, '').replace(/\s*\(attempt\s*\d+\)\s*/gi, '').trim();
    if (!nameGroups[normalized]) nameGroups[normalized] = [];
    nameGroups[normalized].push(s);
  });

  for (const [name, group] of Object.entries(nameGroups)) {
    if (group.length >= 3) {
      const totalTokens = group.reduce((a, b) => a + b.tokens, 0);
      const totalCost = group.reduce((a, b) => a + b.cost, 0);
      detections.push({
        type: 'REPEATED_LLM_DECISION',
        severity: 'MEDIUM',
        title: `Repeated LLM Pattern: ${name}`,
        description: `The LLM step "${name}" was invoked ${group.length} times, suggesting a reasoning loop.`,
        spanId: group[group.length - 1].spanId,
        spanName: name,
        evidence: group.map(s => `${s.name}: ${s.tokens} tokens, ${s.latencyMs}ms`),
        impact: `${totalTokens.toLocaleString()} tokens and $${totalCost.toFixed(4)} spent on repeated reasoning`,
        recommendation: 'Add loop detection in the agent orchestrator. Limit maximum LLM re-invocations for the same step.',
      });
    }
  }

  return detections;
}
