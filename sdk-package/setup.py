from setuptools import setup, find_packages

setup(
    name="pathflow",
    version="0.1.0",
    description="Lightweight, zero-config AI Agent Execution Profiler and Telemetry SDK for PathFlow",
    long_description=open("README.md", "r", encoding="utf-8").read(),
    long_description_content_type="text/markdown",
    author="PathFlow Team",
    author_email="support@pathflow.dev",
    url="https://github.com/anothercodingguy/pathflow",
    license="MIT",
    packages=find_packages(),
    python_requires=">=3.9",
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3",
    ],
)
