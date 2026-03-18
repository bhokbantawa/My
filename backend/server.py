from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime
import base64
import tempfile

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Import LLM integration
from emergentintegrations.llm.chat import LlmChat, UserMessage

# OpenAI for Whisper
import openai

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'sahayak_db')]

# Get Emergent LLM Key
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')

# Create the main app
app = FastAPI(title="Sahayak API", description="Nepali AI Assistant Backend")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============== Models ==============

class ChatMessage(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    role: str  # "user" or "assistant"
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    language: str = "nepali"  # "nepali" or "english"

class ChatSession(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    messages: List[ChatMessage] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    language: str = "nepali"
    context: Optional[str] = None  # "general", "cooking", "health"

class ChatResponse(BaseModel):
    response: str
    session_id: str
    message_id: str

class Reminder(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: Optional[str] = None
    due_date: datetime
    category: str = "general"  # "bill", "task", "event", "general"
    completed: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ReminderCreate(BaseModel):
    title: str
    description: Optional[str] = None
    due_date: datetime
    category: str = "general"

class RecipeSuggestionRequest(BaseModel):
    ingredients: List[str]
    language: str = "nepali"

class Recipe(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    name_nepali: Optional[str] = None
    ingredients: List[str]
    steps: List[str]
    prep_time: str
    cook_time: str
    servings: int
    category: str  # "nepali", "indian", "general"
    difficulty: str  # "easy", "medium", "hard"

class HealthAdviceRequest(BaseModel):
    symptoms: str
    language: str = "nepali"

class TranscriptionResponse(BaseModel):
    text: str
    language: str

class DailyTip(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    category: str  # "health", "money", "cooking"
    tip_nepali: str
    tip_english: str
    date: datetime = Field(default_factory=datetime.utcnow)

# ============== System Prompts ==============

SYSTEM_PROMPTS = {
    "general": """तपाईं "सहायक" हुनुहुन्छ, एक मैत्रीपूर्ण नेपाली AI सहायक। तपाईं नेपाली र अंग्रेजी दुबै भाषामा बोल्न सक्नुहुन्छ।

You are "Sahayak", a friendly Nepali AI assistant. You can speak both Nepali and English.

Guidelines:
- Be helpful, friendly, and respectful
- Use simple language that everyone can understand
- If the user writes in Nepali, respond in Nepali (using Devanagari script)
- If the user writes in English, respond in English
- Keep responses concise and practical
- Be culturally aware of Nepali customs and traditions""",

    "cooking": """तपाईं "सहायक" को खाना पकाउने सहायक हुनुहुन्छ। तपाईं नेपाली खानाहरूमा विशेषज्ञ हुनुहुन्छ।

You are the cooking assistant of "Sahayak". You are an expert in Nepali cuisine.

Guidelines:
- Suggest recipes based on available ingredients
- Specialize in Nepali dishes (dal bhat, momo, sel roti, gundruk, etc.)
- Provide step-by-step instructions that are easy to follow
- Include cooking tips and variations
- Consider dietary restrictions if mentioned
- Use simple measurements (cups, spoons) that are easy to understand""",

    "health": """तपाईं "सहायक" को स्वास्थ्य सल्लाहकार हुनुहुन्छ। तपाईं सामान्य स्वास्थ्य सल्लाह र घरेलु उपचारहरू दिनुहुन्छ।

You are the health advisor of "Sahayak". You provide general health advice and home remedies.

IMPORTANT GUIDELINES:
- Only provide general wellness advice and home remedies
- NEVER diagnose medical conditions
- ALWAYS recommend consulting a doctor for serious symptoms
- Suggest when to seek immediate medical attention
- Include traditional Nepali home remedies when appropriate (haldi, adhuwa, tulsi, etc.)
- Be cautious and emphasize that you are not a substitute for professional medical advice
- For emergencies, always advise going to the nearest hospital immediately"""
}

# ============== Helper Functions ==============

async def get_llm_response(message: str, context: str = "general", session_id: str = None) -> str:
    """Get response from LLM using emergentintegrations"""
    try:
        system_message = SYSTEM_PROMPTS.get(context, SYSTEM_PROMPTS["general"])
        
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=session_id or str(uuid.uuid4()),
            system_message=system_message
        )
        chat.with_model("openai", "gpt-5.2")
        
        user_message = UserMessage(text=message)
        response = await chat.send_message(user_message)
        
        return response
    except Exception as e:
        logger.error(f"LLM Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")

async def transcribe_audio(audio_data: bytes, filename: str) -> str:
    """Transcribe audio using OpenAI Whisper"""
    try:
        # Initialize OpenAI client with Emergent key
        openai_client = openai.OpenAI(api_key=EMERGENT_LLM_KEY)
        
        # Save audio to temp file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_file:
            temp_file.write(audio_data)
            temp_path = temp_file.name
        
        try:
            # Transcribe using Whisper
            with open(temp_path, "rb") as audio_file:
                transcript = openai_client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file,
                    language="ne"  # Nepali, but Whisper will auto-detect
                )
            return transcript.text
        finally:
            # Clean up temp file
            os.unlink(temp_path)
            
    except Exception as e:
        logger.error(f"Transcription Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Transcription error: {str(e)}")

# ============== API Routes ==============

@api_router.get("/")
async def root():
    return {"message": "Sahayak API - Nepali AI Assistant", "status": "running"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "service": "sahayak-api"}

# ============== Chat Endpoints ==============

@api_router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Send a message and get AI response"""
    try:
        # Get or create session
        session_id = request.session_id or str(uuid.uuid4())
        
        # Determine context
        context = request.context or "general"
        
        # Get LLM response
        response_text = await get_llm_response(
            message=request.message,
            context=context,
            session_id=session_id
        )
        
        # Create message records
        user_msg = ChatMessage(
            role="user",
            content=request.message,
            language=request.language
        )
        
        assistant_msg = ChatMessage(
            role="assistant",
            content=response_text,
            language=request.language
        )
        
        # Save to database
        await db.chat_messages.insert_one({
            "session_id": session_id,
            **user_msg.dict()
        })
        await db.chat_messages.insert_one({
            "session_id": session_id,
            **assistant_msg.dict()
        })
        
        return ChatResponse(
            response=response_text,
            session_id=session_id,
            message_id=assistant_msg.id
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Chat Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/chat/history/{session_id}")
async def get_chat_history(session_id: str):
    """Get chat history for a session"""
    messages = await db.chat_messages.find(
        {"session_id": session_id}
    ).sort("timestamp", 1).to_list(100)
    
    return [
        {
            "id": msg.get("id", ""),
            "role": msg.get("role", ""),
            "content": msg.get("content", ""),
            "timestamp": msg.get("timestamp", ""),
            "language": msg.get("language", "nepali")
        }
        for msg in messages
    ]

# ============== Voice/Transcription Endpoints ==============

@api_router.post("/transcribe", response_model=TranscriptionResponse)
async def transcribe(file: UploadFile = File(...)):
    """Transcribe audio to text using Whisper"""
    try:
        # Read audio file
        audio_data = await file.read()
        
        # Transcribe
        text = await transcribe_audio(audio_data, file.filename)
        
        # Detect language (simple heuristic)
        has_devanagari = any('\u0900' <= char <= '\u097F' for char in text)
        language = "nepali" if has_devanagari else "english"
        
        return TranscriptionResponse(text=text, language=language)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Transcription endpoint error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/transcribe/base64", response_model=TranscriptionResponse)
async def transcribe_base64(data: dict):
    """Transcribe base64 encoded audio to text"""
    try:
        audio_base64 = data.get("audio", "")
        if not audio_base64:
            raise HTTPException(status_code=400, detail="No audio data provided")
        
        # Decode base64
        audio_data = base64.b64decode(audio_base64)
        
        # Transcribe
        text = await transcribe_audio(audio_data, "audio.wav")
        
        # Detect language
        has_devanagari = any('\u0900' <= char <= '\u097F' for char in text)
        language = "nepali" if has_devanagari else "english"
        
        return TranscriptionResponse(text=text, language=language)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Base64 transcription error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ============== Cooking Endpoints ==============

@api_router.post("/cooking/suggest")
async def suggest_recipes(request: RecipeSuggestionRequest):
    """Get recipe suggestions based on ingredients"""
    try:
        ingredients_str = ", ".join(request.ingredients)
        
        prompt = f"""Based on these ingredients: {ingredients_str}

Suggest 2-3 recipes I can make, preferring Nepali dishes when possible.
For each recipe, provide:
1. Recipe name (in Nepali and English)
2. List of ingredients needed
3. Step-by-step cooking instructions
4. Approximate cooking time
5. Serving size

Focus on simple, practical recipes that are easy to follow."""

        response = await get_llm_response(
            message=prompt,
            context="cooking",
            session_id=str(uuid.uuid4())
        )
        
        return {"suggestions": response, "ingredients": request.ingredients}
        
    except Exception as e:
        logger.error(f"Recipe suggestion error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/cooking/chat")
async def cooking_chat(request: ChatRequest):
    """Chat specifically about cooking"""
    request.context = "cooking"
    return await chat(request)

# ============== Health Advice Endpoints ==============

@api_router.post("/health/advice")
async def get_health_advice(request: HealthAdviceRequest):
    """Get health advice and home remedies"""
    try:
        prompt = f"""The user describes: {request.symptoms}

Please provide:
1. General advice for managing these symptoms
2. Safe home remedies (especially traditional Nepali remedies if applicable)
3. When to see a doctor
4. Any warning signs to watch for

Remember: Always advise professional medical consultation for serious symptoms."""

        response = await get_llm_response(
            message=prompt,
            context="health",
            session_id=str(uuid.uuid4())
        )
        
        return {"advice": response, "disclaimer": "This is general health information only. Please consult a healthcare professional for proper diagnosis and treatment."}
        
    except Exception as e:
        logger.error(f"Health advice error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/health/chat")
async def health_chat(request: ChatRequest):
    """Chat specifically about health"""
    request.context = "health"
    return await chat(request)

# ============== Reminders Endpoints ==============

@api_router.post("/reminders", response_model=Reminder)
async def create_reminder(reminder: ReminderCreate):
    """Create a new reminder"""
    try:
        reminder_obj = Reminder(**reminder.dict())
        await db.reminders.insert_one(reminder_obj.dict())
        return reminder_obj
    except Exception as e:
        logger.error(f"Create reminder error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/reminders", response_model=List[Reminder])
async def get_reminders(completed: Optional[bool] = None, category: Optional[str] = None):
    """Get all reminders with optional filters"""
    query = {}
    if completed is not None:
        query["completed"] = completed
    if category:
        query["category"] = category
    
    reminders = await db.reminders.find(query).sort("due_date", 1).to_list(100)
    return [Reminder(**r) for r in reminders]

@api_router.get("/reminders/{reminder_id}", response_model=Reminder)
async def get_reminder(reminder_id: str):
    """Get a specific reminder"""
    reminder = await db.reminders.find_one({"id": reminder_id})
    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")
    return Reminder(**reminder)

@api_router.put("/reminders/{reminder_id}", response_model=Reminder)
async def update_reminder(reminder_id: str, reminder: ReminderCreate):
    """Update a reminder"""
    result = await db.reminders.update_one(
        {"id": reminder_id},
        {"$set": reminder.dict()}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Reminder not found")
    
    updated = await db.reminders.find_one({"id": reminder_id})
    return Reminder(**updated)

@api_router.patch("/reminders/{reminder_id}/complete")
async def toggle_reminder_complete(reminder_id: str):
    """Toggle reminder completion status"""
    reminder = await db.reminders.find_one({"id": reminder_id})
    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")
    
    new_status = not reminder.get("completed", False)
    await db.reminders.update_one(
        {"id": reminder_id},
        {"$set": {"completed": new_status}}
    )
    
    return {"id": reminder_id, "completed": new_status}

@api_router.delete("/reminders/{reminder_id}")
async def delete_reminder(reminder_id: str):
    """Delete a reminder"""
    result = await db.reminders.delete_one({"id": reminder_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Reminder not found")
    return {"message": "Reminder deleted", "id": reminder_id}

# ============== Daily Tips Endpoints ==============

DAILY_TIPS = [
    {
        "category": "health",
        "tip_nepali": "दिनको कम्तिमा 8 गिलास पानी पिउनुहोस्। यसले शरीरलाई हाइड्रेटेड राख्छ।",
        "tip_english": "Drink at least 8 glasses of water daily. It keeps your body hydrated."
    },
    {
        "category": "cooking",
        "tip_nepali": "भात पकाउनु अघि चामललाई 30 मिनेट भिजाउनुहोस्। यसले भात नरम र स्वादिलो बनाउँछ।",
        "tip_english": "Soak rice for 30 minutes before cooking. It makes rice softer and tastier."
    },
    {
        "category": "money",
        "tip_nepali": "हरेक महिना आफ्नो आम्दानीको कम्तिमा 10% बचत गर्नुहोस्।",
        "tip_english": "Save at least 10% of your income every month."
    },
    {
        "category": "health",
        "tip_nepali": "बिहान खाली पेटमा न्यानो पानी पिउनाले पाचन शक्ति बढ्छ।",
        "tip_english": "Drinking warm water on an empty stomach in the morning improves digestion."
    },
    {
        "category": "cooking",
        "tip_nepali": "दाल पकाउँदा एक चिम्टी हल्दी हाल्नुहोस्। यसले स्वाद र स्वास्थ्य दुवै बढाउँछ।",
        "tip_english": "Add a pinch of turmeric while cooking dal. It enhances both taste and health benefits."
    }
]

@api_router.get("/tips/daily")
async def get_daily_tip(category: Optional[str] = None):
    """Get a daily tip"""
    import random
    
    tips = DAILY_TIPS
    if category:
        tips = [t for t in DAILY_TIPS if t["category"] == category]
    
    if not tips:
        tips = DAILY_TIPS
    
    tip = random.choice(tips)
    return DailyTip(**tip)

@api_router.get("/tips/all")
async def get_all_tips():
    """Get all tips"""
    return [DailyTip(**tip) for tip in DAILY_TIPS]

# Include the router in the main app
app.include_router(api_router)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
