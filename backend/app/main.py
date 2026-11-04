from pathlib import Path
import time
from collections import defaultdict
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from app.api.v1.endpoints.platform_routes import router as v1_router
from app.core.config import settings
from app.db.seed import seed_database
from app.db.session import Base, engine


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    seed_database()
    yield


app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    description=(
        "Production-standard REST API for HomeServe Technologies — Home Services Booking SaaS Platform. "
        "Implements JWT Authentication, RBAC + Resource Ownership Validation, Transactional Double-Booking Lock, "
        "and Razorpay Test Mode HMAC Verification."
    ),
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Simple in-memory rate limiter for auth endpoints & security headers middleware
_rate_buckets: dict[str, list[float]] = defaultdict(list)


@app.middleware("http")
async def security_and_rate_limit_middleware(request: Request, call_next):
    if request.url.path.endswith("/auth/login"):
        client_ip = request.client.host if request.client else "127.0.0.1"
        now = time.time()
        window = [t for t in _rate_buckets[client_ip] if now - t < 60.0]
        if len(window) >= 30:
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={"detail": "Too many login attempts. Please wait a minute."},
            )
        window.append(now)
        _rate_buckets[client_ip] = window

    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    if request.url.path.startswith("/api/"):
        response.headers["Cache-Control"] = "no-store"
    return response


@app.get("/health", tags=["Health Check"])
def health_check():
    return {"status": "healthy", "service": settings.APP_NAME, "version": "1.0.0"}


app.include_router(v1_router, prefix=settings.API_V1_PREFIX)

# Serve bundled React SPA if static_dist exists (for full-stack Render deployment)
_STATIC_DIR = Path(__file__).resolve().parent.parent / "static_dist"
if _STATIC_DIR.exists() and (_STATIC_DIR / "index.html").exists():
    if (_STATIC_DIR / "assets").exists():
        app.mount("/assets", StaticFiles(directory=str(_STATIC_DIR / "assets")), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    def serve_spa(full_path: str):
        candidate = _STATIC_DIR / full_path
        if full_path and candidate.is_file():
            return FileResponse(str(candidate))
        return FileResponse(str(_STATIC_DIR / "index.html"))


