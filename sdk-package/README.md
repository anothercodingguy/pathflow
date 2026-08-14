# PathFlow Python Telemetry SDK

`pathflow` is a zero-config, lightweight **AI Agent Telemetry and Profiling SDK** for [PathFlow](https://pathflow.dev).

It automatically captures execution traces, DAG parent/child span trees, duration timing, model details, token counts, cost attribution, and exceptions for AI agents—with zero friction and zero changes to your core agent logic.

---

## 🚀 Installation

```bash
pip install pathflow
```

---

## ⚙️ Configuration

Set your credentials via environment variables:

```bash
export PATHFLOW_API_KEY="pf_live_..."

# Optional (only if self-hosting or using custom endpoint)
export PATHFLOW_ENDPOINT="https://app.pathflow.dev/api/v1"
```

Or pass them explicitly into the constructor:

```python
from pathflow import PathFlow

pf = PathFlow(
    api_key="pf_live_...",
    endpoint="https://app.pathflow.dev/api/v1"
)
```

---

## ⚡ Basic Usage: Function Decorator

Wrap your main agent function with `@pf.trace()`:

```python
from pathflow import PathFlow

pf = PathFlow()

@pf.trace(
    name="Customer Support Resolution Agent",
    project="backend-service",
    environment="production"
)
def run_agent(user_query: str):
    # Your agent code here
    return "Issue resolved"

if __name__ == "__main__":
    run_agent("How do I reset my password?")
```

> **Note**: Telemetry dispatching runs safely in the background. Telemetry errors will **never** interrupt or crash your agent application logic.

---

## 🔍 Granular Spans & Context Management

Create granular parent/child spans around LLM completions, database queries, and tool executions using `with pf.span(...)`:

```python
from pathflow import PathFlow

pf = PathFlow()

@pf.trace(name="Deep Research Agent", project="analytics")
def research_agent(topic: str):
    # 1. Search Tool Span
    with pf.span(name="Web Search", type="Tool") as span:
        span.set_input({"query": topic})
        results = ["Doc 1", "Doc 2"]
        span.set_output({"docs_found": len(results)})

    # 2. LLM Completion Span
    with pf.span(name="Groq Llama 3.3 LLM", type="LLMCall") as span:
        span.set_input({"prompt": topic})
        span.set_model("llama-3.3-70b-versatile")
        
        # Attach exact tokens and cost if available
        span.set_tokens(input_tokens=1400, output_tokens=350)
        span.set_cost(0.0028)
        
        response = "Synthesized analysis..."
        span.set_output({"response": response})

    return response
```

---

## 🔒 Secret Sanitization

PathFlow automatically redacts sensitive patterns (such as API keys `sk-`, `gsk_`, `pf_live_`, `Bearer `, passwords, and authorization tokens) from stringified raw inputs and outputs before transmission.

---

## 📜 License

MIT License. See [LICENSE](LICENSE) for details.
