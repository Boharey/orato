# backend/app/routes/scenarios.py

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from ..services.llm_service import generate_scenario_script

router = APIRouter(prefix="/scenarios")

class ScenarioRequest(BaseModel):
    scenario_description: str

@router.post("/generate")
async def generate_scenario(request: ScenarioRequest):
    try:
        result = await generate_scenario_script(request.scenario_description)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))