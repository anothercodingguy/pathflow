"""
PathFlow AI Agent Example: Groq LLM + Calculator Tool Execution

Requirements:
    pip install groq pathflow

Environment Setup:
    export GROQ_API_KEY="gsk_..."
    export PATHFLOW_API_KEY="pf_live_..."
    export PATHFLOW_ENDPOINT="https://pathflow-psi.vercel.app/api/v1"
"""

import os
import json
import time
from typing import Dict, Any

try:
    from groq import Groq
except ImportError:
    print("Groq SDK is not installed. Run: pip install groq", flush=True)
    Groq = None

from pathflow import PathFlow

# Initialize PathFlow client (reads PATHFLOW_API_KEY and PATHFLOW_ENDPOINT from env)
pf = PathFlow()

def calculator(expression: str) -> str:
    """Safely calculate a mathematical expression."""
    try:
        # Simple math evaluator
        allowed_names = {"__builtins__": None}
        return str(eval(expression, allowed_names, {}))
    except Exception as e:
        return f"Error evaluating expression: {e}"

tools = [
    {
        "type": "function",
        "function": {
            "name": "calculator",
            "description": "Calculate a mathematical expression.",
            "parameters": {
                "type": "object",
                "properties": {
                    "expression": {
                        "type": "string",
                        "description": "The mathematical expression to calculate, e.g., '145 * 12'."
                    }
                },
                "required": ["expression"]
            }
        }
    }
]

@pf.trace(
    name="Groq Math & Reasoning Agent",
    project="agent-examples",
    environment="production",
    model_family="Llama 3.3 70B Versatile"
)
def run_agent(user_query: str):
    groq_key = os.getenv("GROQ_API_KEY")
    if not groq_key or not Groq:
        print("GROQ_API_KEY is not set or Groq library is not installed. Running simulated agent execution...", flush=True)
        # Simulation fallback for testing without Groq key
        with pf.span(name="Groq LLM Initial Call", type="LLMCall") as span:
            span.set_model("llama-3.3-70b-versatile")
            span.set_input({"query": user_query})
            span.set_tokens(input_tokens=150, output_tokens=40)
            span.set_cost(0.0002)
            span.set_output({"tool_calls": [{"name": "calculator", "arguments": {"expression": "25 * 4"}}]} )

        with pf.span(name="Calculator Tool", type="Tool") as span:
            span.set_input({"expression": "25 * 4"})
            res = calculator("25 * 4")
            span.set_output({"result": res})

        with pf.span(name="Groq LLM Final Answer", type="LLMCall") as span:
            span.set_model("llama-3.3-70b-versatile")
            span.set_input({"math_result": "100"})
            span.set_tokens(input_tokens=220, output_tokens=30)
            span.set_cost(0.0003)
            final_res = f"The result of 25 * 4 is 100."
            span.set_output({"response": final_res})

        return final_res

    # Real Groq execution
    client = Groq(api_key=groq_key)

    messages = [
        {
            "role": "system",
            "content": "You are a helpful AI agent. Always use the calculator tool for mathematical calculations."
        },
        {
            "role": "user",
            "content": user_query
        }
    ]

    # Span 1: Initial LLM Completion Call
    with pf.span(name="Groq LLM Initial Tool Selection", type="LLMCall") as span:
        span.set_input({"messages": messages})
        span.set_model("llama-3.3-70b-versatile")
        
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            tools=tools,
            tool_choice="auto"
        )
        
        if hasattr(response, "usage") and response.usage:
            span.set_tokens(
                input_tokens=response.usage.prompt_tokens,
                output_tokens=response.usage.completion_tokens
            )
            # Approximate Groq Llama 3.3 70B cost (~$0.59 / 1M tokens)
            span.set_cost((response.usage.total_tokens / 1_000_000) * 0.59)
            
        message = response.choices[0].message
        span.set_output({"message": message.content, "tool_calls": [t.function.name for t in (message.tool_calls or [])]})

    # Span 2: Tool Execution
    if message.tool_calls:
        messages.append(message)
        for tool_call in message.tool_calls:
            if tool_call.function.name == "calculator":
                arguments = json.loads(tool_call.function.arguments)
                expr = arguments.get("expression", "0")

                with pf.span(name="Calculator Tool", type="Tool") as tool_span:
                    tool_span.set_input({"expression": expr})
                    result = calculator(expr)
                    tool_span.set_output({"result": result})

                messages.append({
                    "role": "tool",
                    "tool_call_id": tool_call.id,
                    "content": result
                })

        # Span 3: Final LLM Synthesis
        with pf.span(name="Groq LLM Final Answer Synthesis", type="LLMCall") as span:
            span.set_input({"messages_count": len(messages)})
            span.set_model("llama-3.3-70b-versatile")
            
            response2 = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=messages,
                tools=tools
            )
            
            if hasattr(response2, "usage") and response2.usage:
                span.set_tokens(
                    input_tokens=response2.usage.prompt_tokens,
                    output_tokens=response2.usage.completion_tokens
                )
                span.set_cost((response2.usage.total_tokens / 1_000_000) * 0.59)
                
            final_answer = response2.choices[0].message.content
            span.set_output({"response": final_answer})
            return final_answer

    return message.content

if __name__ == "__main__":
    print("--- Running PathFlow Groq Agent Example ---", flush=True)
    ans = run_agent("What is 145 multiplied by 82?")
    print("\n🤖 Final Agent Answer:", ans, flush=True)
