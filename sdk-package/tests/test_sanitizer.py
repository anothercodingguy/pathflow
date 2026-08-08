import unittest
from pathflow.sanitizer import sanitize_value

class TestSanitizer(unittest.TestCase):
    def test_sanitize_primitive_string(self):
        self.assertEqual(sanitize_value("hello world"), "hello world")
        self.assertEqual(sanitize_value("key is pf_live_secret123"), "key is [REDACTED_SECRET]")
        self.assertEqual(sanitize_value("gsk_secretgroqkey12345"), "[REDACTED_SECRET]")

    def test_sanitize_dict_keys(self):
        raw = {
            "api_key": "pf_live_12345",
            "user": "suyash",
            "password": "my_password_123",
            "nested": {
                "secret": "hidden",
                "normal": "visible"
            }
        }
        sanitized = sanitize_value(raw)
        self.assertEqual(sanitized["api_key"], "[REDACTED_SECRET]")
        self.assertEqual(sanitized["password"], "[REDACTED_SECRET]")
        self.assertEqual(sanitized["user"], "suyash")
        self.assertEqual(sanitized["nested"]["secret"], "[REDACTED_SECRET]")
        self.assertEqual(sanitized["nested"]["normal"], "visible")

    def test_sanitize_lists(self):
        raw = ["normal", "gsk_12345", {"auth_token": "bearer xyz"}]
        sanitized = sanitize_value(raw)
        self.assertEqual(sanitized[0], "normal")
        self.assertEqual(sanitized[1], "[REDACTED_SECRET]")
        self.assertEqual(sanitized[2]["auth_token"], "[REDACTED_SECRET]")

if __name__ == "__main__":
    unittest.main()
