from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware

from app.routes import auth, training, analytics, evaluation, streak, calibration

app = FastAPI()

app.include_router(auth.router, prefix="/api")
app.include_router(training.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")
app.include_router(evaluation.router, prefix="/api")
app.include_router(streak.router, prefix="/api")
app.include_router(calibration.router, prefix="/api")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)