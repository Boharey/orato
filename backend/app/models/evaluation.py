from pydantic import BaseModel, ConfigDict
from typing import Optional

class EvaluationResult(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    wpm: float
    filler_count: int
    filler_percentage: float
    eye_contact_percentage: float
    long_pauses: int
    confidence_score: float
    video_data: Optional[str] = None
    created_at: str

    # New fields 
    transcript: Optional[str] = None
    blink_count: Optional[int] = None
    attention_score: Optional[float] = None
    gaze_on_screen_pct: Optional[float] = None