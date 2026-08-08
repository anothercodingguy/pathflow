"""
PathFlow Telemetry Exceptions.
"""

class PathFlowError(Exception):
    """Base exception class for PathFlow SDK errors."""
    pass

class ConfigurationError(PathFlowError):
    """Raised when SDK configuration (API key or Endpoint) is invalid."""
    pass

class TelemetryError(PathFlowError):
    """Raised when telemetry dispatch fails internally."""
    pass
