from fastapi import APIRouter
from ..data.training_modules import MODULES
router = APIRouter(prefix="/training")


@router.get("/modules")
async def training_modules():
    return { "modules": MODULES }