from pydantic import BaseModel, ConfigDict
from typing import List

class StreakData(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    dates: List[str]
    current_streak: int
    longest_streak: int = 0
