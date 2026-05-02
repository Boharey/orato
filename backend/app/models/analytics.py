from pydantic import BaseModel, ConfigDict
from typing import List, Optional

class AnalyticsData(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    wpm: Optional[List[dict]] = []
    fillers: Optional[List[dict]] = []
    eye_gaze: Optional[List[dict]] = []
    pronunciation: Optional[List[dict]] = []

