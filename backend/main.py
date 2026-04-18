# Root-level entry point for Render deployment.
# Render runs `uvicorn main:app` by default, but the actual app lives
# in the `app/` package. This shim re-exports it so both commands work:
#   - uvicorn main:app          (Render default)
#   - uvicorn app.main:app      (local dev)
from app.main import app  # noqa: F401
