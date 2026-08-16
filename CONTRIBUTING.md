# Contributing to FILE CONV

Thank you for considering contributing to FILE CONV! We welcome contributions from students, developers, and open-source enthusiasts.

## How to Add a New Converter / Format

1. **Update Conversion Registry (`backend/app/registry/conversion_registry.py`)**:
   Define the source format, target format, category, MIME types, engine name, and options in `CONVERSION_REGISTRY`.

2. **Implement Converter Engine**:
   Add or update engine logic in `backend/app/converters/`. Ensure all external commands pass argument arrays (`subprocess.run([...])`) for security.

3. **Add Test Fixtures & Unit Tests**:
   Update `backend/tests/test_conversions.py` and run `pytest`.

4. **Submit a Pull Request**:
   Ensure `pytest` passes 100% and `npm run build` in `frontend/` succeeds without errors.
