"""
PathFlow Telemetry Secret & Sensitive Data Sanitizer.
"""

import re
from typing import Any, Dict, List, Union

SECRET_KEY_PATTERNS = [
    re.compile(r"api[-_]?key", re.IGNORECASE),
    re.compile(r"secret", re.IGNORECASE),
    re.compile(r"password", re.IGNORECASE),
    re.compile(r"auth(orization)?", re.IGNORECASE),
    re.compile(r"bearer", re.IGNORECASE),
    re.compile(r"token", re.IGNORECASE),
    re.compile(r"private[-_]?key", re.IGNORECASE),
]

SECRET_VALUE_PATTERNS = [
    re.compile(r"pf_live_[a-zA-Z0-9_\-]+"),
    re.compile(r"gsk_[a-zA-Z0-9_\-]+"),
    re.compile(r"sk-[a-zA-Z0-9_\-]{20,}"),
    re.compile(r"Bearer\s+[a-zA-Z0-9_\-\.]+", re.IGNORECASE),
]

def sanitize_value(val: Any) -> Any:
    """
    Recursively sanitize objects, redacting keys and strings containing secrets.
    """
    if val is None:
        return None
        
    if isinstance(val, str):
        cleaned = val
        for pattern in SECRET_VALUE_PATTERNS:
            cleaned = pattern.sub("[REDACTED_SECRET]", cleaned)
        return cleaned

    if isinstance(val, dict):
        sanitized_dict: Dict[str, Any] = {}
        for key, value in val.items():
            key_str = str(key)
            if any(pattern.search(key_str) for pattern in SECRET_KEY_PATTERNS):
                sanitized_dict[key_str] = "[REDACTED_SECRET]"
            else:
                sanitized_dict[key_str] = sanitize_value(value)
        return sanitized_dict

    if isinstance(val, list):
        return [sanitize_value(item) for item in val]

    if isinstance(val, tuple):
        return tuple(sanitize_value(item) for item in val)

    # Return primitive numbers/booleans as-is
    return val
