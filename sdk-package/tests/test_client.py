import unittest
from unittest.mock import patch, MagicMock
import os
from pathflow import PathFlow

class TestPathFlowClient(unittest.TestCase):
    def test_init_from_env(self):
        with patch.dict(os.environ, {
            "PATHFLOW_API_KEY": "pf_live_test_key_123",
            "PATHFLOW_ENDPOINT": "http://test-server/api/v1",
            "PATHFLOW_PROJECT": "test-project",
            "PATHFLOW_ENV": "test-env"
        }):
            pf = PathFlow()
            self.assertEqual(pf.api_key, "pf_live_test_key_123")
            self.assertEqual(pf.endpoint, "http://test-server/api/v1")
            self.assertEqual(pf.default_project, "test-project")
            self.assertEqual(pf.default_env, "test-env")

    def test_trace_decorator_success(self):
        pf = PathFlow(api_key="pf_live_test_key")
        
        with patch.object(pf, "_post", return_value={"success": True, "run_id": "run_999"}) as mock_post:
            @pf.trace(name="Test Decorator", project="unit-test", environment="test")
            def sample_function(x, y):
                return x + y

            result = sample_function(10, 20)
            self.assertEqual(result, 30)
            self.assertTrue(mock_post.called)

    def test_trace_decorator_failure_does_not_crash(self):
        pf = PathFlow(api_key="pf_live_test_key")
        
        with patch.object(pf, "_post", side_effect=Exception("HTTP Network Timeout")) as mock_post:
            @pf.trace(name="Failed Decorator")
            def failing_agent():
                raise ValueError("Agent calculation error")

            # Exception raised by wrapped agent must propagate to caller
            with self.assertRaises(ValueError):
                failing_agent()

            self.assertTrue(mock_post.called)

    def test_nested_spans_in_trace(self):
        pf = PathFlow(api_key="pf_live_test_key")
        
        captured_payloads = []
        def mock_post_impl(path, payload):
            if path == "/runs/finish":
                captured_payloads.append(payload)
            return {"success": True, "run_id": "run_100"}

        with patch.object(pf, "_post", side_effect=mock_post_impl):
            @pf.trace(name="Nested Agent Run")
            def complex_agent():
                with pf.span(name="Step 1: Search", type="Tool") as s1:
                    s1.set_tokens(input_tokens=100, output_tokens=20)
                    s1.set_cost(0.001)
                    
                    with pf.span(name="Step 2: Sub-LLM", type="LLMCall") as s2:
                        s2.set_tokens(input_tokens=500, output_tokens=150)
                        s2.set_cost(0.005)

                return "Done"

            res = complex_agent()
            self.assertEqual(res, "Done")
            self.assertEqual(len(captured_payloads), 1)
            
            finish_payload = captured_payloads[0]
            self.assertEqual(finish_payload["total_tokens"], 770)
            self.assertEqual(finish_payload["total_cost_usd"], 0.006)
            self.assertEqual(len(finish_payload["spans"]), 2)

if __name__ == "__main__":
    unittest.main()
