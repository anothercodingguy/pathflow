"""
PathFlow Main Client & Decorator Interface.
"""

import time
import functools
import json
import urllib.request
import urllib.parse
import os
import sys
from typing import Callable, Any, Dict, Optional, List
from contextvars import ContextVar

from pathflow.spans import Span, get_current_parent_span_id
from pathflow.sanitizer import sanitize_value

# Active run span collector stack
_active_run_spans: ContextVar[List[Span]] = ContextVar("_active_run_spans", default=[])

class PathFlow:
    """
    Main PathFlow Telemetry Client.
    """
    def __init__(
        self,
        api_key: Optional[str] = None,
        endpoint: Optional[str] = None,
        default_project: str = "default",
        default_environment: str = "production"
    ):
        self.api_key = api_key or os.getenv("PATHFLOW_API_KEY")
        
        # Default endpoint points to deployed production service or local fallback
        raw_endpoint = endpoint or os.getenv("PATHFLOW_ENDPOINT", "https://pathflow-psi.vercel.app/api/v1")
        self.endpoint = raw_endpoint.rstrip('/')
        
        self.default_project = os.getenv("PATHFLOW_PROJECT", default_project)
        self.default_env = os.getenv("PATHFLOW_ENV", default_environment)

        if not self.api_key:
            print("[PathFlow Warning] PATHFLOW_API_KEY is not configured. Telemetry dispatch will be skipped.", file=sys.stderr)

    def span(
        self,
        name: str,
        type: str = "LLMCall",
        span_id: Optional[str] = None,
        parent_span_id: Optional[str] = None
    ) -> Span:
        """
        Create a granular telemetry span context manager.
        Usage:
            with pf.span("Groq Completion", type="LLMCall") as s:
                ...
        """
        s = Span(name=name, span_type=type, span_id=span_id, parent_span_id=parent_span_id)
        
        # Register span into active trace run collector if inside a @pf.trace execution
        active_list = _active_run_spans.get()
        if active_list is not None:
            active_list.append(s)
            
        return s

    def trace(
        self,
        name: Optional[str] = None,
        run_title: Optional[str] = None,
        title: Optional[str] = None,
        model_family: str = "Claude 3.5 Sonnet",
        project: Optional[str] = None,
        environment: Optional[str] = None,
        env: Optional[str] = None
    ):
        """
        Zero-friction decorator for observing AI agent execution runs.
        """
        trace_name = name or run_title or title or "AI Agent Execution"
        target_project = project or self.default_project
        target_env = environment or env or self.default_env

        def decorator(func: Callable):
            @functools.wraps(func)
            def wrapper(*args, **kwargs):
                start_time = time.time()
                run_id = f"run_{int(start_time * 1000)}"
                
                # Setup span tracking collector for this execution
                spans_collector: List[Span] = []
                token_reset = _active_run_spans.set(spans_collector)

                # Initialize trace session on server
                if self.api_key:
                    try:
                        res = self._post("/runs/start", {
                            "title": trace_name,
                            "model_family": model_family,
                            "project": target_project,
                            "env": target_env
                        })
                        if res and isinstance(res, dict) and "run_id" in res:
                            run_id = res["run_id"]
                    except Exception as err:
                        print(f"[PathFlow Telemetry] Trace init notice: {err}", file=sys.stderr)

                status = "completed"
                result = None
                exception_msg = None

                try:
                    result = func(*args, **kwargs)
                    return result
                except Exception as e:
                    status = "failed"
                    exception_msg = str(e)
                    raise e
                finally:
                    duration_ms = int((time.time() - start_time) * 1000)
                    
                    # Reset context token
                    _active_run_spans.reset(token_reset)

                    # Build telemetry spans list
                    exported_spans: List[Dict[str, Any]] = []
                    
                    if spans_collector:
                        for s in spans_collector:
                            exported_spans.append(s.to_dict())
                    else:
                        # If no granular spans were created, record single execution span
                        root_span = {
                            "spanId": f"sp_{run_id}_01",
                            "name": trace_name,
                            "type": "LLMCall",
                            "status": "FAILED" if status == "failed" else "SUCCESS",
                            "latencyMs": duration_ms,
                            "tokens": 0,
                            "cost": 0.0,
                            "rawInput": sanitize_value({"args": [str(a) for a in args], "kwargs": {k: str(v) for k, v in kwargs.items()}}),
                        }
                        if result is not None:
                            root_span["rawOutput"] = sanitize_value({"result": str(result)})
                        elif exception_msg:
                            root_span["rawOutput"] = sanitize_value({"error": exception_msg})
                            root_span["diagnosticTag"] = "EXCEPTION"
                            root_span["diagnosticSummary"] = exception_msg

                        exported_spans.append(root_span)

                    # Compute actual total tokens and total cost from spans
                    total_tokens = sum(s.get("tokens", 0) for s in exported_spans)
                    total_cost = sum(s.get("cost", 0.0) for s in exported_spans)

                    log_icon = "🔥" if status == "completed" else "💥"
                    print(f"{log_icon} [PathFlow Telemetry] Trace Finalized: '{trace_name}' | Latency: {duration_ms}ms | Spans: {len(exported_spans)} | Status: {status.upper()}")

                    # Flush telemetry to PathFlow server
                    if self.api_key:
                        try:
                            self._post("/runs/finish", {
                                "run_id": run_id, 
                                "title": trace_name,
                                "wall_clock_ms": duration_ms, 
                                "status": status,
                                "model_family": model_family,
                                "project": target_project,
                                "env": target_env,
                                "total_tokens": total_tokens,
                                "total_cost_usd": total_cost,
                                "spans": exported_spans
                            })
                        except Exception as err:
                            print(f"[PathFlow Telemetry Warning] Flush failed: {err}", file=sys.stderr)

            return wrapper
        return decorator

    def _post(self, path: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        if not self.api_key:
            return {"success": False, "error": "No API key"}

        url = f"{self.endpoint}{path}"
        data = json.dumps(payload).encode('utf-8')
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "User-Agent": "pathflow-python/0.1.0"
        }
        req = urllib.request.Request(url, data=data, headers=headers, method="POST")
        try:
            with urllib.request.urlopen(req, timeout=3.0) as response:
                body = response.read().decode('utf-8')
                return json.loads(body)
        except Exception as e:
            # Telemetry failures must never crash application
            return {"success": False, "error": str(e)}
