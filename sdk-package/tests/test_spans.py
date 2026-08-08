import unittest
import time
from pathflow.spans import Span

class TestSpans(unittest.TestCase):
    def test_span_initialization(self):
        span = Span(name="Test Span", span_type="Tool")
        self.assertEqual(span.name, "Test Span")
        self.assertEqual(span.type, "Tool")
        self.assertEqual(span.status, "SUCCESS")
        self.assertEqual(span.tokens, 0)
        self.assertEqual(span.cost, 0.0)

    def test_span_metrics(self):
        span = Span(name="Metrics Span")
        span.set_tokens(input_tokens=100, output_tokens=50)
        span.set_cost(0.0015)
        span.set_model("gpt-4o")
        span.set_input({"query": "test"})
        span.set_output({"res": "ok"})

        d = span.to_dict()
        self.assertEqual(d["tokens"], 150)
        self.assertEqual(d["cost"], 0.0015)
        self.assertEqual(d["rawInput"], {"query": "test"})
        self.assertEqual(d["rawOutput"], {"res": "ok"})

    def test_span_context_manager(self):
        with Span(name="Parent", span_type="LLMCall") as parent:
            time.sleep(0.01)
            with Span(name="Child", span_type="Tool") as child:
                self.assertEqual(child.parent_span_id, parent.span_id)
        
        self.assertTrue(parent.latency_ms >= 0)
        self.assertTrue(child.latency_ms >= 0)

if __name__ == "__main__":
    unittest.main()
