from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
import base64

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer()
SECRET_KEY = os.environ.get('JWT_SECRET', 'your-secret-key-change-in-production')
ALGORITHM = "HS256"

# Models
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    email: str
    name: str
    created_at: str

class TokenResponse(BaseModel):
    token: str
    user: UserResponse

class AnalyticsData(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    wpm: Optional[List[dict]] = []
    fillers: Optional[List[dict]] = []
    eye_gaze: Optional[List[dict]] = []
    pronunciation: Optional[List[dict]] = []

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

class StreakData(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    dates: List[str]
    current_streak: int

# Helper functions
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str) -> str:
    payload = {
        'user_id': user_id,
        'exp': datetime.now(timezone.utc) + timedelta(days=7)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get('user_id')
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        user = await db.users.find_one({'id': user_id}, {'_id': 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# Auth routes
@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserRegister):
    # Check if user exists
    existing = await db.users.find_one({'email': user_data.email}, {'_id': 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user_id = str(uuid.uuid4())
    user = {
        'id': user_id,
        'email': user_data.email,
        'password': hash_password(user_data.password),
        'name': user_data.name,
        'created_at': datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user)
    
    # Create token
    token = create_token(user_id)
    
    user_response = UserResponse(
        id=user['id'],
        email=user['email'],
        name=user['name'],
        created_at=user['created_at']
    )
    
    return TokenResponse(token=token, user=user_response)

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one({'email': credentials.email}, {'_id': 0})
    if not user or not verify_password(credentials.password, user['password']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(user['id'])
    
    user_response = UserResponse(
        id=user['id'],
        email=user['email'],
        name=user['name'],
        created_at=user['created_at']
    )
    
    return TokenResponse(token=token, user=user_response)

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user = Depends(get_current_user)):
    return UserResponse(
        id=current_user['id'],
        email=current_user['email'],
        name=current_user['name'],
        created_at=current_user['created_at']
    )

# Training modules
@api_router.get("/training/modules")
async def get_training_modules():
    modules = [
        {
            "id": "pace-rhythm",
            "title": "Pace & Rhythm Training",
            "description": "Master the art of speaking at an optimal pace with natural rhythm and flow.",
            "sections": [
                {
                    "heading": "Understanding Your Speaking Pace",
                    "points": [
                        "Optimal speaking pace is 140-160 words per minute for presentations",
                        "Vary your pace to maintain engagement and emphasize key points",
                        "Use pauses strategically to let information sink in",
                        "Practice with a metronome to develop consistent rhythm"
                    ],
                    "video": "https://www.youtube.com/embed/HAnw168huqA"
                },
                {
                    "heading": "Practice Exercises",
                    "points": [
                        "Read aloud for 2 minutes and count your words to calculate WPM",
                        "Record yourself and identify areas where you rush or drag",
                        "Practice tongue twisters to improve articulation at speed",
                        "Use breathing exercises to maintain steady pace"
                    ]
                }
            ]
        },
        {
            "id": "filler-reduction",
            "title": "Filler Reduction",
            "description": "Eliminate unnecessary filler words like 'um', 'uh', 'like', and 'you know' from your speech.",
            "sections": [
                {
                    "heading": "Common Filler Words",
                    "points": [
                        "Identify your personal filler words through recording analysis",
                        "Replace fillers with purposeful pauses",
                        "Practice mindful speaking by thinking before you speak",
                        "Use the 'pause and breathe' technique when you feel a filler coming"
                    ],
                    "video": "https://www.youtube.com/embed/y3d7XlXr-V8"
                },
                {
                    "heading": "Reduction Strategies",
                    "points": [
                        "Slow down your speech to reduce nervous fillers",
                        "Prepare and outline your thoughts before speaking",
                        "Embrace silence - pauses are powerful",
                        "Practice speaking on random topics to build confidence"
                    ]
                }
            ]
        },
        {
            "id": "eye-contact",
            "title": "Eye Contact & Presence",
            "description": "Develop strong eye contact and commanding presence to connect with your audience.",
            "sections": [
                {
                    "heading": "Building Confident Presence",
                    "points": [
                        "Maintain eye contact for 3-5 seconds with individuals in the audience",
                        "Use the triangle technique: shift gaze between eyes and mouth",
                        "Practice with video calls to build comfort with camera eye contact",
                        "Stand or sit with confident posture to enhance presence"
                    ],
                    "video": "https://www.youtube.com/embed/xiK_klHxAx4"
                },
                {
                    "heading": "Overcoming Discomfort",
                    "points": [
                        "Start by looking at foreheads if direct eye contact feels intense",
                        "Practice with friends or family in low-stakes conversations",
                        "Use mirror practice to become comfortable with your own gaze",
                        "Remember: the audience wants you to succeed"
                    ]
                }
            ]
        },
        {
            "id": "pronunciation",
            "title": "Pronunciation & Articulation",
            "description": "Speak with clarity and precision through improved pronunciation and articulation.",
            "sections": [
                {
                    "heading": "Clear Articulation Techniques",
                    "points": [
                        "Practice opening your mouth wider when speaking",
                        "Enunciate consonants clearly, especially at word endings",
                        "Use jaw and tongue exercises to improve flexibility",
                        "Record and compare your pronunciation with native speakers"
                    ],
                    "video": "https://www.youtube.com/embed/dRdqGvwhk0s"
                },
                {
                    "heading": "Daily Practice Routine",
                    "points": [
                        "Read poetry aloud focusing on each syllable",
                        "Practice difficult words slowly, then gradually increase speed",
                        "Use pronunciation apps for feedback on problem sounds",
                        "Record yourself daily and track improvement over time"
                    ]
                }
            ]
        }
    ]
    return {"modules": modules}

# Analytics routes
@api_router.get("/analytics/{user_id}", response_model=AnalyticsData)
async def get_analytics(user_id: str, current_user = Depends(get_current_user)):
    if current_user['id'] != user_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    analytics = await db.analytics.find_one({'user_id': user_id}, {'_id': 0})
    if not analytics:
        # Return default empty analytics
        analytics = {
            'user_id': user_id,
            'wpm': [],
            'fillers': [],
            'eye_gaze': [],
            'pronunciation': []
        }
    
    return AnalyticsData(**analytics)

@api_router.post("/analytics/{user_id}")
async def update_analytics(user_id: str, data: dict, current_user = Depends(get_current_user)):
    if current_user['id'] != user_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    await db.analytics.update_one(
        {'user_id': user_id},
        {'$set': data},
        upsert=True
    )
    
    return {"message": "Analytics updated successfully"}

# Evaluation routes
@api_router.post("/evaluation/upload")
async def upload_evaluation_video(video: UploadFile = File(...), current_user = Depends(get_current_user)):
    # Read video data
    video_data = await video.read()
    video_base64 = base64.b64encode(video_data).decode('utf-8')
    
    return {"video_id": str(uuid.uuid4()), "video_data": video_base64}

@api_router.post("/evaluation/analyze", response_model=EvaluationResult)
async def analyze_evaluation(data: dict, current_user = Depends(get_current_user)):
    # Mock analysis - in production, this would call ML models
    import random
    
    evaluation_id = str(uuid.uuid4())
    user_id = current_user['id']
    
    # Generate mock metrics
    wpm = random.uniform(120, 180)
    filler_count = random.randint(5, 25)
    filler_percentage = random.uniform(2, 8)
    eye_contact = random.uniform(60, 95)
    long_pauses = random.randint(1, 8)
    confidence = random.uniform(70, 95)
    
    result = {
        'id': evaluation_id,
        'user_id': user_id,
        'wpm': round(wpm, 1),
        'filler_count': filler_count,
        'filler_percentage': round(filler_percentage, 1),
        'eye_contact_percentage': round(eye_contact, 1),
        'long_pauses': long_pauses,
        'confidence_score': round(confidence, 1),
        'video_data': data.get('video_data'),
        'created_at': datetime.now(timezone.utc).isoformat()
    }
    
    # Save to database
    await db.evaluations.insert_one(result)
    
    # Update streak
    today = datetime.now(timezone.utc).date().isoformat()
    streak_data = await db.streaks.find_one({'user_id': user_id}, {'_id': 0})
    
    if streak_data:
        dates = streak_data.get('dates', [])
        if today not in dates:
            dates.append(today)
            dates.sort()
            
            # Calculate current streak
            current_streak = 1
            for i in range(len(dates) - 1, 0, -1):
                prev_date = datetime.fromisoformat(dates[i - 1]).date()
                curr_date = datetime.fromisoformat(dates[i]).date()
                diff = (curr_date - prev_date).days
                if diff == 1:
                    current_streak += 1
                else:
                    break
            
            await db.streaks.update_one(
                {'user_id': user_id},
                {'$set': {'dates': dates, 'current_streak': current_streak}}
            )
    else:
        await db.streaks.insert_one({
            'user_id': user_id,
            'dates': [today],
            'current_streak': 1
        })
    
    # Update analytics
    analytics = await db.analytics.find_one({'user_id': user_id}, {'_id': 0})
    if analytics:
        wpm_data = analytics.get('wpm', [])
        fillers_data = analytics.get('fillers', [])
        eye_gaze_data = analytics.get('eye_gaze', [])
    else:
        wpm_data = []
        fillers_data = []
        eye_gaze_data = []
    
    wpm_data.append({'date': today, 'value': round(wpm, 1)})
    fillers_data.append({'date': today, 'value': filler_count})
    eye_gaze_data.append({'date': today, 'value': round(eye_contact, 1)})
    
    await db.analytics.update_one(
        {'user_id': user_id},
        {'$set': {
            'wpm': wpm_data,
            'fillers': fillers_data,
            'eye_gaze': eye_gaze_data
        }},
        upsert=True
    )
    
    return EvaluationResult(**result)

@api_router.get("/evaluation/history", response_model=List[EvaluationResult])
async def get_evaluation_history(current_user = Depends(get_current_user)):
    evaluations = await db.evaluations.find(
        {'user_id': current_user['id']},
        {'_id': 0}
    ).sort('created_at', -1).limit(20).to_list(20)
    
    return [EvaluationResult(**e) for e in evaluations]

@api_router.get("/streak/{user_id}", response_model=StreakData)
async def get_streak(user_id: str, current_user = Depends(get_current_user)):
    if current_user['id'] != user_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    streak = await db.streaks.find_one({'user_id': user_id}, {'_id': 0})
    if not streak:
        streak = {
            'user_id': user_id,
            'dates': [],
            'current_streak': 0
        }
    
    return StreakData(**streak)

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()