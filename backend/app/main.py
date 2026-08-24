import asyncio
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.api import routes_health, routes_formats, routes_convert, routes_pdf_tools, routes_ocr, routes_auth
from app.services.cleanup_service import CleanupService

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("main")

async def periodic_cleanup_task():
    while True:
        try:
            await asyncio.sleep(settings.CLEANUP_INTERVAL_MINUTES * 60)
            logger.info("Running periodic temp file cleanup task...")
            CleanupService.cleanup_old_files()
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.error(f"Error in periodic cleanup task: {e}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: spawn background cleanup task
    logger.info(f"Starting {settings.PROJECT_NAME} backend v{settings.VERSION}...")
    cleanup_task = asyncio.create_task(periodic_cleanup_task())
    yield
    # Shutdown: cancel task
    cleanup_task.cancel()
    logger.info("Backend shutdown complete.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url="/api/openapi.json",
    docs_url="/api/docs",
    lifespan=lifespan
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global error handler for clean structured JSON errors
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception(f"Unhandled server error on {request.url}: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected server error occurred during processing.",
                "details": str(exc)
            }
        }
    )

# Include API Routers
app.include_router(routes_health.router, prefix=settings.API_V1_STR, tags=["Health"])
app.include_router(routes_formats.router, prefix=settings.API_V1_STR, tags=["Formats"])
app.include_router(routes_convert.router, prefix=settings.API_V1_STR, tags=["Convert"])
app.include_router(routes_pdf_tools.router, prefix=settings.API_V1_STR, tags=["PDF Tools"])
app.include_router(routes_ocr.router, prefix=settings.API_V1_STR, tags=["OCR & Document Intelligence"])
app.include_router(routes_auth.router, prefix=settings.API_V1_STR, tags=["Auth & Session"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
