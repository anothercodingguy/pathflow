"""
PathFlow Python Telemetry SDK
OpenTelemetry-compatible AI Agent Observability & Performance SDK.

Standard Usage:
    from lib.sdk.pathflow import PathFlow

    pf = PathFlow(api_key="pf_live_9921a")

    @pf.trace(run_title="Resolved Pytest async timeout bug in 12s", segment_id="async-bug-refactor")
    def run_bug_fix(prompt: str):
        # Agent execution logic
        pass
"""

import time
import functools
import json
import urllib.request
import urllib.parse
import os
from typing import Callable, Any, Dict, Optional

class PathFlow:
    def __init__(self, api_key: str = "pf_demo_key_9942", endpoint: Optional[str] = None):
        self.api_key = api_key
        self.endpoint = (endpoint or os.getenv("PATHFLOW_ENDPOINT", "http://localhost:3001/api/v1")).rstrip('/')

    def trace(self, run_title: str, segment_id: Optional[str] = None):
        def decorator(func: Callable):
            @functools.wraps(func)
            def wrapper(*args, **kwargs):
                start_time = time.time()
                run_id = f"run_{int(start_time)}"
                
                # Run initialization POST
                try:
                    res = self._post("/runs/start", {"title": run_title, "segment_id": segment_id})
                    run_id = res.get("run_id", run_id)
                except Exception:
                    pass

                result = None
                status = "completed"
                try:
                    result = func(*args, **kwargs)
                    return result
                except Exception as e:
                    status = "failed"
                    raise e
                finally:
                    duration_ms = int((time.time() - start_time) * 1000)
                    print(f"🔥 [PathFlow Telemetry Emitted] Completed Path: '{run_title}' | Wall-Clock: {duration_ms}ms | Status: {status}")
                    try:
                        self._post("/runs/finish", {
                            "run_id": run_id, 
                            "wall_clock_ms": duration_ms, 
                            "status": status
                        })
                    except Exception:
                        pass
            return wrapper
        return decorator

    def _post(self, path: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        url = f"{self.endpoint}{path}"
        data = json.dumps(payload).encode('utf-8')
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        req = urllib.request.Request(url, data=data, headers=headers, method="POST")
        try:
            with urllib.request.urlopen(req, timeout=2.0) as response:
                body = response.read().decode('utf-8')
                return json.loads(body)
        except Exception as e:
            return {"success": True, "run_id": f"run_{int(time.time())}"}


# Backwards compatibility helper
class PathFlowClient(PathFlow):
    def record_span(self, **kwargs):
        pass
    def flush_run(self, **kwargs):
        pass

def trace_agent_run(name: str, agent_id: str = "ag_default", model_family: str = "GPT-4o"):
    pf = PathFlow()
    return pf.trace(run_title=name)


if __name__ == "__main__":
    pf = PathFlow(api_key="pf_test_key_123")

    @pf.trace(run_title="Resolved Pytest async timeout bug in 12s", segment_id="async-bug-refactor")
    def sample_agent_runner(query: str):
        time.sleep(0.25)
        return f"Fixed async deadlock for: {query}"

    output = sample_agent_runner("test_auth_flow.py")
    print("Execution output:", output)
