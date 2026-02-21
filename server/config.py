import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    HOST = "0.0.0.0"
    PORT = 8765

    DEEPGRAM_API_KEY = os.getenv("DEEPGRAM_API_KEY")
    GROQ_API_KEY = os.getenv("GROQ_API_KEY")

    SAMPLE_RATE = 16000

config = Config()