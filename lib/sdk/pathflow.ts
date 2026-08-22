/**
 * PathFlow Node.js & TypeScript Telemetry SDK.
 * Zero-dependency client for tracing AI agent workflows, LLM calls, and tools.
 */

export interface PathFlowConfig {
  apiKey?: string;
  endpoint?: string;
  defaultProject?: string;
  defaultEnv?: string;
  defaultFramework?: string;
}

export interface SpanContext {
  spanId: string;
  parentSpanId?: string | null;
  name: string;
  type: string;
  status: "SUCCESS" | "FAILED";
  latencyMs: number;
  tokens: number;
  cost: number;
  rawInput?: any;
  rawOutput?: any;
  error?: string;
  setInput: (input: any) => void;
  setOutput: (output: any) => void;
  setTokens: (inputTokens: number, outputTokens: number) => void;
  setCost: (costUsd: number) => void;
  setError: (error: string | Error) => void;
}

export interface TraceOptions {
  name: string;
  project?: string;
  env?: string;
  modelFamily?: string;
  sessionId?: string;
  endUserId?: string;
  version?: string;
  promptVersion?: string;
  tags?: Record<string, string>;
}

export class PathFlow {
  private apiKey: string;
  private endpoint: string;
  private project: string;
  private env: string;
  private framework: string;

  constructor(config: PathFlowConfig = {}) {
    this.apiKey = config.apiKey || process.env.PATHFLOW_API_KEY || "";
    const rawEndpoint = config.endpoint || process.env.PATHFLOW_ENDPOINT || (process.env.NEXT_PUBLIC_APP_URL ? `${process.env.NEXT_PUBLIC_APP_URL}/api/v1` : "https://thepathflow.online/app/api/v1");
    this.endpoint = rawEndpoint.replace(/\/$/, "");
    this.project = config.defaultProject || process.env.PATHFLOW_PROJECT || "default";
    this.env = config.defaultEnv || process.env.PATHFLOW_ENV || "production";
    this.framework = config.defaultFramework || "NodeJS";
  }

  /**
   * Execute and trace an asynchronous agent workflow.
   */
  async trace<T>(options: string | TraceOptions, fn: (tracer: { span: (name: string, type?: string) => Promise<{ spanContext: SpanContext; end: () => void }> }) => Promise<T>): Promise<T> {
    const opts: TraceOptions = typeof options === "string" ? { name: options } : options;
    const startTime = Date.now();
    const spans: SpanContext[] = [];

    // Step 1: Start Run
    let runId = `run_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    if (this.apiKey) {
      try {
        const res = await this._post("/runs/start", {
          title: opts.name,
          agent_name: opts.name,
          model_family: opts.modelFamily || "Claude 3.5 Sonnet",
          framework: this.framework,
          project: opts.project || this.project,
          env: opts.env || this.env,
          session_id: opts.sessionId,
          end_user_id: opts.endUserId,
          version: opts.version,
          prompt_version: opts.promptVersion,
        });
        if (res && res.run_id) {
          runId = res.run_id;
        }
      } catch (err) {
        // Fallback local tracking
      }
    }

    const tracer = {
      span: async (name: string, type: string = "LLMCall") => {
        const spanStart = Date.now();
        const spanId = `sp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const ctx: SpanContext = {
          spanId,
          name,
          type,
          status: "SUCCESS",
          latencyMs: 0,
          tokens: 0,
          cost: 0,
          setInput: (inp) => { ctx.rawInput = inp; },
          setOutput: (out) => { ctx.rawOutput = out; },
          setTokens: (inpTok, outTok) => { ctx.tokens = inpTok + outTok; },
          setCost: (c) => { ctx.cost = c; },
          setError: (err) => {
            ctx.status = "FAILED";
            ctx.error = typeof err === "string" ? err : err.message;
          },
        };

        return {
          spanContext: ctx,
          end: async () => {
            ctx.latencyMs = Math.max(1, Date.now() - spanStart);
            spans.push(ctx);

            if (this.apiKey) {
              try {
                await this._post("/runs/step", {
                  run_id: runId,
                  span: {
                    spanId: ctx.spanId,
                    name: ctx.name,
                    type: ctx.type,
                    status: ctx.status,
                    latencyMs: ctx.latencyMs,
                    tokens: ctx.tokens,
                    cost: ctx.cost,
                    rawInput: ctx.rawInput,
                    rawOutput: ctx.rawOutput,
                    errorMessage: ctx.error,
                  },
                });
              } catch {
                // Non-blocking telemetry
              }
            }
          },
        };
      },
    };

    let result: T;
    let status: "SUCCESS" | "FAILED" = "SUCCESS";
    let errorMsg: string | undefined;

    try {
      result = await fn(tracer);
    } catch (err: any) {
      status = "FAILED";
      errorMsg = err?.message || String(err);
      throw err;
    } finally {
      const durationMs = Math.max(1, Date.now() - startTime);
      const totalTokens = spans.reduce((acc, s) => acc + s.tokens, 0);
      const totalCost = spans.reduce((acc, s) => acc + s.cost, 0);

      if (this.apiKey) {
        try {
          await this._post("/runs/finish", {
            run_id: runId,
            status,
            wall_clock_ms: durationMs,
            total_tokens: totalTokens,
            total_cost_usd: totalCost,
            error: errorMsg,
            spans: spans.map((s) => ({
              spanId: s.spanId,
              name: s.name,
              type: s.type,
              status: s.status,
              latencyMs: s.latencyMs,
              tokens: s.tokens,
              cost: s.cost,
              rawInput: s.rawInput,
              rawOutput: s.rawOutput,
            })),
          });
        } catch {
          // Non-blocking finish
        }
      }
    }

    return result;
  }

  /**
   * Helper method to dispatch JSON payloads to PathFlow backend
   */
  private async _post(path: string, payload: any): Promise<any> {
    const url = `${this.endpoint}${path}`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "User-Agent": "pathflow-node/0.1.0",
    };
    if (this.apiKey) {
      headers["Authorization"] = `Bearer ${this.apiKey}`;
    }

    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
    return await res.json();
  }
}

export default PathFlow;
