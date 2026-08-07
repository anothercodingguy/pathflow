# PathFlow — AI Agent Execution Profiler & Intelligence Platform

PathFlow is a high-density, lightweight **Execution Profiler, Debugger, and Performance Analytics Engine for AI Agents** inspired by Chrome DevTools, Perfetto, Jaeger, and Linear.

Understand **what happened**, **why it happened**, **why it was slow**, and **how to optimize** your AI agent executions with zero friction.

---

## ⚡ 10-Second Quick Start Flow

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **Python**: v3.9+ (for instrumenting Python AI agents)

---

### Step 1: Clone Repository & Install Dependencies

```bash
git clone https://github.com/anothercodingguy/pathflow.git
cd PathFlow
npm install
```

---

### Step 2: Database Setup & Initial Seeding

PathFlow uses SQLite with Prisma ORM out-of-the-box (zero external database setup required):

```bash
# Push Prisma database schema to local SQLite dev.db
npx prisma db push

# Seed production sample agent traces
npx tsx prisma/seed.ts
```

---

### Step 3: Launch PathFlow Local Server

Start the PathFlow execution profiling dashboard & telemetry ingestion server:

```bash
npm run dev
```

PathFlow Profiler UI will be live at: **`http://localhost:3000`**

---

### Step 4: Install PathFlow Python SDK in your AI Agent Project

In your AI Agent codebase (LangChain, CrewAI, OpenAI Agents, or Custom Python scripts):

```bash
pip install pathflow
```

*Note: If testing locally from the repository, PathFlow SDK is included in `lib/sdk/pathflow.py`.*

---

### Step 5: Instrument Your AI Agent (`@pf.trace`)

Add the `@pf.trace()` decorator to your agent's entrypoint function:

```python
from pathflow import PathFlow

pf = PathFlow(
    endpoint="http://localhost:3000/api/v1",
    api_key="pf_live_suyash_secret_9942"  # Found in PathFlow Settings
)

@pf.trace("Customer Support Ticket Resolution", project="support-bot", env="production")
def run_agent(user_query: str):
    # Your LLM calls, tool execution, browser automation logic
    return "Ticket resolved successfully"

if __name__ == "__main__":
    run_agent("How do I update my billing email address?")
```

---

### Step 6: Profile & Debug Agent Execution

1. Run your Python AI agent script:
   ```bash
   python main.py
   ```
2. Open **`http://localhost:3000/runs`** to inspect real-time execution telemetry:
   - **Dense Execution Table**: Filter by `status:error`, `model:gpt-4o`, `cost>0.05`, `duration>5000`.
   - **Timeline Waterfall**: 0ms → 180ms → 2.1s breakdown.
   - **Interactive DAG & Flame Graph**: Identify execution bottlenecks & critical paths.
   - **Span Inspector**: Inspect raw input/output payloads, model tokens, latency, and cost per span.
   - **Compare Runs**: Perform side-by-side performance regression analysis.

---

## 🛠️ Environment Variables

Create a `.env` file in the root directory (optional):

```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="your-development-secret-key-12345"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## 🚀 Production Deployment Options

### Option A: Vercel / Railway / Render
Deploy PathFlow as a Next.js application to Vercel or Railway with zero configuration.

### Option B: Docker Container
```bash
docker build -t pathflow .
docker run -p 3000:3000 pathflow
```

---

## 📜 Information Architecture

- **`http://localhost:3000/runs`**: Main execution profiling table & search filters
- **`http://localhost:3000/runs/[id]`**: Split-pane Trace Workspace, DAG, Flame Graph & Span Inspector
- **`http://localhost:3000/compare`**: Side-by-side execution diff & regression engine
- **`http://localhost:3000/settings`**: API Keys, SDK instructions, endpoints, and workspace setup
