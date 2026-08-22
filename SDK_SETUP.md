# PathFlow Python SDK Setup & Publishing Documentation

This document explains the internal architecture, building, testing, local installation, PyPI publishing workflow, and provider integration model for the PathFlow Python Telemetry SDK (`pathflow`).

---

## 1. How the SDK Works

The `pathflow` SDK is a lightweight, zero-dependency OpenTelemetry-compatible tracing library for Python AI agents.

1. **Decorator (`@pf.trace`)**:
   - Measures wall-clock execution time of the outer agent entrypoint function using Python's `time.time()`.
   - Dispatches a telemetry initialization request (`POST /api/v1/runs/start`) on entry.
   - Collects all granular spans generated during function execution.
   - Aggregates total token counts and total dollar cost from all recorded spans.
   - Redacts sensitive credentials (API keys, passwords, bearer tokens) using `pathflow.sanitizer`.
   - Dispatches the complete trace payload (`POST /api/v1/runs/finish`) on exit.
   - **Resilience**: Any network or HTTP telemetry error is caught internally and printed as a non-fatal warning—ensuring that **telemetry issues never crash host application logic**.

2. **Context Manager (`with pf.span(...)`)**:
   - Thread-safe and async-safe span tracking powered by Python's `contextvars.ContextVar`.
   - Automatically maintains parent-child span hierarchy (`spanId`, `parentSpanId`).
   - Allows attaching exact tokens (`span.set_tokens()`), costs (`span.set_cost()`), models (`span.set_model()`), input parameters (`span.set_input()`), and output responses (`span.set_output()`).

---

## 2. How to Build the SDK Package

The SDK source files are located under `sdk-package/`.

To build the sdist (`.tar.gz`) and wheel (`.whl`) packages:

```bash
cd sdk-package
python3 -m build
```

The generated artifacts will be located in `sdk-package/dist/`:
- `dist/pathflow-0.1.0-py3-none-any.whl`
- `dist/pathflow-0.1.0.tar.gz`

---

## 3. How to Test it Locally

Run the unit test suite:

```bash
PYTHONPATH=sdk-package python3 -m unittest discover -s sdk-package/tests
```

All 10 unit tests cover:
- Client initialization & environment variable resolution
- `@pf.trace` decorator success & error propagation
- Resilience against telemetry HTTP network timeouts
- Nested parent/child span context management
- Secret redaction (`pf_live_...`, `gsk_...`, `sk-...`, `Bearer `)

---

## 4. How to Install the Local Wheel

To install the built wheel package locally on your machine:

```bash
pip install sdk-package/dist/pathflow-0.1.0-py3-none-any.whl
```

Verify installation:

```bash
python3 -c "from pathflow import PathFlow, __version__; print('PathFlow Version:', __version__)"
```

---

## 5. How to Create a PyPI Account

1. Go to [https://pypi.org/account/register/](https://pypi.org/account/register/).
2. Fill in your name, email, username, and password.
3. Verify your email address.
4. Enable Two-Factor Authentication (2FA) under Account Settings (required by PyPI for publishing).

---

## 6. How to Create a PyPI API Token

1. Log into your PyPI account.
2. Go to **Account Settings** → **API Tokens**.
3. Click **Add API token**.
4. Set Token Name: `pathflow-publisher`.
5. Set Scope: **Entire account (all projects)** (or project-specific if `pathflow` exists).
6. Click **Generate token**.
7. Copy the generated secret token (starts with `pypi-`).

---

## 7. How to Upload with Twine

Once you have your PyPI API token, run:

```bash
cd sdk-package
python3 -m twine upload dist/*
```

When prompted:
- **Username**: `__token__`
- **Password**: `pypi-your-secret-api-token-here`

---

## 8. How to Install the Published Package

Once published to PyPI, developers can install `pathflow` directly via pip:

```bash
pip install pathflow
```

---

## 9. How to Test with Your Groq Agent

1. Set your environment variables:
   ```bash
   export GROQ_API_KEY="gsk_..."
   export PATHFLOW_API_KEY="pf_live_secret_key"
   export PATHFLOW_ENDPOINT="https://thepathflow.online/app/api/v1"
   ```

2. Run the Groq agent example script:
   ```bash
   python3 examples/groq_agent.py
   ```

3. Open **`https://thepathflow.online/app/runs`** to view your Groq execution trace, span waterfall, tokens, and cost metrics live!

---

## 10. How Telemetry Flows from Developer PC to PathFlow

```
[ Developer's PC ]
       │
  agent.py (@pf.trace)
       │
  with pf.span("Groq LLM") ───────► (Extracts duration, tokens, cost)
       │
  Secret Sanitizer ────────────────► (Redacts API keys & secrets)
       │
  HTTP POST (Bearer Header)
       │
       ▼
[ PathFlow Production Endpoint (Vercel) ]
       │
  POST /api/v1/runs/start ─────────► (Initializes Run record in SQLite/Prisma)
  POST /api/v1/runs/finish ────────► (Persists finalized Spans & Metrics)
       │
       ▼
[ PathFlow Profiler Dashboard UI ]
  • Runs Table (/runs)
  • Timeline Waterfall (/runs/[id])
  • Interactive DAG Graph
  • Perfetto Flame Graph
  • Span Inspector & Raw Payloads
  • Compare Diff Engine (/compare)
```

---

## 11. What Telemetry is Currently Captured

- **Trace Metrics**: Title, wall-clock duration (`latencyMs`), project tag, environment tag, completion status (`COMPLETED` / `FAILED`).
- **Span Attributes**: Span Name, Type (`LLMCall`, `Tool`, `Prompt`, `Memory`, `Browser`), Status (`SUCCESS` / `FAILED`), Duration, Parent/Child span relationship (`parentSpanId`).
- **Usage Metrics**: Tokens (`input_tokens`, `output_tokens`, `total_tokens`), Cost (`cost_usd`).
- **Payloads**: Sanitized raw input parameters, raw output responses, and exception tracebacks.

---

## 12. What is NOT Automatically Captured

- **Arbitrary LLM Calls without Spans**: Without wrappers or explicit `with pf.span(...)` blocks, outer `@pf.trace` captures function wall-clock time and success/failure, but cannot automatically guess third-party SDK token usage unless passed via span methods.
- **Real-Time Streaming**: Spans are collected during execution and dispatched at trace completion (`POST /api/v1/runs/finish`).

---

## 13. How to Add Manual Spans

Simply wrap any block of code using `with pf.span(...)`:

```python
with pf.span(name="Database Vector Query", type="Memory") as span:
    span.set_input({"query_vector_dim": 1536})
    results = db.search(...)
    span.set_output({"results_count": len(results)})
```

---

## 14. How to Add Future Provider Integrations

To add automatic wrappers for providers (such as OpenAI, Anthropic, or Groq), extend `pathflow.spans` with a provider wrapper class:

```python
def instrument_groq(client, pf: PathFlow):
    # Wrap client.chat.completions.create to automatically wrap with pf.span(...)
    ...
```

Keep provider wrappers optional so that `pathflow` core has **zero required third-party dependencies**.
