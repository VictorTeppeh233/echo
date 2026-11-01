# Contributing to ECHO

Thank you for your interest in contributing to **ECHO**!

## Code of Conduct
We are committed to providing a welcoming and inspiring environment for all contributors.

## How to Contribute
1. **Fork the Repository**: Clone your fork locally.
2. **Create a Feature Branch**: `git checkout -b feature/your-feature-name`.
3. **Follow Architectural Standards**:
   - Maintain 100% local-first privacy. Do not add cloud telemetry or external paid AI APIs.
   - All inference must run through Ollama.
   - Code must be typed (TypeScript in frontend, Pydantic/Type Hints in Python).
4. **Run Tests**:
   ```bash
   cd backend && PYTHONPATH=. .venv/bin/pytest tests/
   cd ../frontend && npm run build
   ```
5. **Submit a Pull Request**: Provide a clear explanation of changes and verification steps.

## Licensing
By contributing to ECHO, you agree that your contributions will be licensed under the project's Apache 2.0 License.
