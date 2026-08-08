"""
PathFlow Span Tracking & Context Management.
"""

import time
from contextvars import ContextVar
from typing import Optional, Dict, Any, List, Union
from pathflow.sanitizer import sanitize_value

# Active span context stack managed via thread-safe ContextVar
_current_span_stack: ContextVar[List["Span"]] = ContextVar("_current_span_stack", default=[])

class Span:
    """
    Represents an OpenTelemetry-compatible span inside a trace execution graph.
    """
    def __init__(
        self,
        name: str,
        span_type: str = "LLMCall",
        span_id: Optional[str] = None,
        parent_span_id: Optional[str] = None
    ):
        self.span_id = span_id or f"sp_{int(time.time() * 1000000)}"
        self.parent_span_id = parent_span_id
        self.name = name
        self.type = span_type
        self.status = "SUCCESS"
        self.start_time = time.time()
        self.end_time: Optional[float] = None
        self.latency_ms: int = 0
        
        # Real measured metrics (defaults to 0 or None if not set)
        self.tokens: int = 0
        self.cost: float = 0.0
        self.model: Optional[str] = None
        
        self.raw_input: Optional[Any] = None
        self.raw_output: Optional[Any] = None
        self.diagnostic_tag: Optional[str] = None
        self.diagnostic_summary: Optional[str] = None

    def __enter__(self):
        self.start_time = time.time()
        stack = _current_span_stack.get().copy()
        if stack and not self.parent_span_id:
            self.parent_span_id = stack[-1].span_id
        stack.append(self)
        _current_span_stack.set(stack)
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.end_time = time.time()
        self.latency_ms = int((self.end_time - self.start_time) * 1000)
        if exc_type is not None:
            self.status = "FAILED"
            self.diagnostic_tag = "EXCEPTION"
            self.diagnostic_summary = str(exc_val)
            
        stack = _current_span_stack.get().copy()
        if stack and stack[-1].span_id == self.span_id:
            stack.pop()
            _current_span_stack.set(stack)
        return False  # Do not suppress user exceptions

    def set_input(self, data: Any) -> "Span":
        self.raw_input = sanitize_value(data)
        return self

    def set_output(self, data: Any) -> "Span":
        self.raw_output = sanitize_value(data)
        return self

    def set_tokens(self, input_tokens: int = 0, output_tokens: int = 0, total_tokens: Optional[int] = None) -> "Span":
        if total_tokens is not None:
            self.tokens = int(total_tokens)
        else:
            self.tokens = int(input_tokens) + int(output_tokens)
        return self

    def set_cost(self, cost_usd: float) -> "Span":
        self.cost = float(cost_usd)
        return self

    def set_model(self, model_name: str) -> "Span":
        self.model = model_name
        return self

    def set_status(self, status: str) -> "Span":
        self.status = status.upper()
        return self

    def set_diagnostic(self, tag: str, summary: str) -> "Span":
        self.diagnostic_tag = tag
        self.diagnostic_summary = summary
        return self

    def to_dict(self) -> Dict[str, Any]:
        """
        Export span as OpenTelemetry-compatible JSON dictionary.
        """
        payload: Dict[str, Any] = {
            "spanId": self.span_id,
            "parentSpanId": self.parent_span_id,
            "name": self.name,
            "type": self.type,
            "status": self.status,
            "latencyMs": self.latency_ms,
            "tokens": self.tokens,
            "cost": self.cost,
        }
        if self.raw_input is not None:
            payload["rawInput"] = self.raw_input
        if self.raw_output is not None:
            payload["rawOutput"] = self.raw_output
        if self.diagnostic_tag:
            payload["diagnosticTag"] = self.diagnostic_tag
        if self.diagnostic_summary:
            payload["diagnosticSummary"] = self.diagnostic_summary
        return payload

def get_current_parent_span_id() -> Optional[str]:
    stack = _current_span_stack.get()
    return stack[-1].span_id if stack else None
