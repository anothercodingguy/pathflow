"""
PathFlow Python Telemetry SDK Bridge Module.
"""

import sys
import os

# Include sdk-package directory in Python path for repository imports
sdk_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "sdk-package"))
if sdk_dir not in sys.path:
    sys.path.insert(0, sdk_dir)

from pathflow import PathFlow, Span, PathFlowError, ConfigurationError, TelemetryError

__all__ = [
    "PathFlow",
    "Span",
    "PathFlowError",
    "ConfigurationError",
    "TelemetryError",
]

if __name__ == "__main__":
    pf = PathFlow()

    print("--- Testing PathFlow SDK Named Arguments ---")
    @pf.trace(
        name="Support Ticket Agent",
        project="backend-service",
        environment="production"
    )
    def sample_agent_runner(query: str):
        with pf.span(name="Groq Llama 3.3 Completion", type="LLMCall") as s:
            s.set_input({"query": query})
            s.set_tokens(input_tokens=1200, output_tokens=300)
            s.set_cost(0.0025)
            s.set_output({"res": "Resolved"})

        return f"Fixed issue for: {query}"

    output = sample_agent_runner("test_auth.py")
    print("Execution output:", output)
