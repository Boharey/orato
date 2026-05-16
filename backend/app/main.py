import os
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware

from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.core.limiter import limiter
from app.routes import auth, training, analytics, evaluation, streak, calibration, scenarios

app = FastAPI()

# Serve annotated videos
import os
from fastapi.staticfiles import StaticFiles
os.makedirs("static/annotated", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

# Attach rate limiter to the app
# Attach rate limiter to the app
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Include routers
app.include_router(auth.router, prefix="/api")
app.include_router(training.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")
app.include_router(evaluation.router, prefix="/api")
app.include_router(streak.router, prefix="/api")
app.include_router(calibration.router, prefix="/api")
app.include_router(scenarios.router, prefix="/api")

# Tighten CORS – only allow your frontend origin
frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_url],   # was: ["*"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)