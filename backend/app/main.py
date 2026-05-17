import os
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.core.limiter import limiter
from app.routes import auth, training, analytics, evaluation, streak, calibration, scenarios

app = FastAPI()

# ── CORS must be added BEFORE static files mount ──────────────────────────────
# If CORS middleware is added after, static file responses (/static/annotated/*)
# won't include Access-Control-Allow-Origin headers → browser silently blocks video
frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Rate limiter ──────────────────────────────────────────────────────────────
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ── Static files (annotated videos) ──────────────────────────────────────────
os.makedirs("static/annotated", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth.router,        prefix="/api")
app.include_router(training.router,    prefix="/api")
app.include_router(analytics.router,   prefix="/api")
app.include_router(evaluation.router,  prefix="/api")
app.include_router(streak.router,      prefix="/api")
app.include_router(calibration.router, prefix="/api")
app.include_router(scenarios.router,   prefix="/api")