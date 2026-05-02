from fastapi import APIRouter

router = APIRouter(prefix="/training")


@router.get("/modules")
async def training_modules():
    return {
        "modules": [
            {
                "id": "pace-rhythm",
                "title": "Pace & Rhythm Training",
                "description": "Improve speaking flow and speed",
            },
            {
                "id": "filler-reduction",
                "title": "Filler Reduction",
                "description": "Remove um/uh words",
            },
            {
                "id": "eye-contact",
                "title": "Eye Contact",
                "description": "Improve presence",
            },
            {
                "id": "pronunciation",
                "title": "Pronunciation",
                "description": "Clear articulation",
            },
        ]
    }