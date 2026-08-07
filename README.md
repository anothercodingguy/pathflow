# PathFlow — AI Agent Execution Profiler & Debugger

PathFlow is a high-density, lightweight **Execution Profiler, Debugger, and Performance Analytics Platform for AI Agents** inspired by Chrome DevTools, Perfetto, Jaeger, and Linear.

> *"Understand, debug, compare, and optimize AI agent executions."*

---

## ⚡ Quick Start Onboarding

### 1. Install SDK
```bash
pip install pathflow
```

### 2. Configure Environment Variables
```bash
export PATHFLOW_API_KEY=pf_live_xxxxxxxxx

# Optional (only for self-hosted or custom deployments)
export PATHFLOW_ENDPOINT=https://your-pathflow-domain.com/api/v1
```

### 3. Instrument Your AI Agent
```python
from pathflow import PathFlow

pf = PathFlow()

@pf.trace(
    name="Support Ticket Agent",
    project="backend-service",
    environment="production"
)
def run_agent():
    # Your agent logic here
    pass

if __name__ == "__main__":
    run_agent()
```

> 🛡️ **Assurance**: No changes to your agent logic are required. PathFlow only instruments execution and does not modify agent behavior.

---

## 🔍 What PathFlow Automatically Collects

When your function runs, PathFlow automatically captures:
- Trace
- Spans
- Execution graph
- Duration
- Model
- Provider
- Token usage
- Cost
- Exceptions
- Metadata

**Zero manual logging required.**

---

## 🚀 Run & Inspect

Run your agent normally:

```bash
python agent.py
```

PathFlow automatically captures the execution and sends it securely to your workspace.

Open PathFlow to inspect:
- **Runs Table**: Dense execution profiling table & search filters
- **Execution Graph**: Interactive React Flow DAG with critical path highlighting
- **Timeline**: 0ms → 180ms → 2.1s chronological waterfall view
- **Flame Graph**: Perfetto visual execution duration bars
- **Span Inspector**: Granular telemetry attributes, metadata, and raw input/output JSON
- **Cost Breakdown**: Token & dollar spend attribution by span category
- **Execution Insights**: Automatic bottleneck detection & optimization suggestions
- **Run Comparison**: Side-by-side performance regression diffs

---

## 🛠️ Self-Hosting & Local Profiler Setup

```bash
git clone https://github.com/anothercodingguy/pathflow.git
cd PathFlow
npm install
npx prisma db push
npx tsx prisma/seed.ts
npm run dev
```

Local profiler dashboard running at: `http://localhost:3000`
