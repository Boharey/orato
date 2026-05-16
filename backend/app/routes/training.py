import os
from fastapi import APIRouter, Depends
from ..data.training_modules import MODULES
from ..core.security import get_current_user
from ..db.database import db

router = APIRouter(prefix="/training")

# Thresholds: index 0 always open, index 1 → 10 sessions, index 2 → 20, etc.
REQUIRED_SESSIONS = [0, 10, 20, 30, 40, 50, 60, 70]

@router.get("/modules")
async def training_modules(user=Depends(get_current_user)):
    # Master check
    master_email = os.getenv("MASTER_EMAIL", "").strip()
    user_email = user.get("email", "").strip().lower()
    is_master = (user_email == master_email.lower())

    # Count sessions ≥ 60 seconds
    session_count = await db.evaluations.count_documents({
        "user_id": user["id"],
        "duration": {"$gte": 60}
    })

    modules_out = []
    for mod in MODULES:
        mod_copy = mod.copy()
        sections_out = []
        for i, sec in enumerate(mod.get("sections", [])):
            sec_copy = sec.copy()
            required = REQUIRED_SESSIONS[i] if i < len(REQUIRED_SESSIONS) else REQUIRED_SESSIONS[-1]
            # Only the very first technique is always free; others require sessions
            sec_copy["locked"] = (i > 0 and session_count < required and not is_master)
            sections_out.append(sec_copy)
        mod_copy["sections"] = sections_out
        modules_out.append(mod_copy)

    return {"modules": modules_out}