import asyncio
import websockets
import json
import os
import base64
import wave
from dotenv import load_dotenv
from groq import Groq
from deepgram import DeepgramClient
from database import init_db
from tools import extract_structured_data

load_dotenv()

# ========================
# ENV CONFIG
# ========================

DEEPGRAM_API_KEY = os.getenv("DEEPGRAM_API_KEY")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

PORT = int(os.environ.get("PORT", 8765))

deepgram = DeepgramClient(api_key=DEEPGRAM_API_KEY)
groq_client = Groq(api_key=GROQ_API_KEY)

init_db()

# ========================
# LLM FUNCTION
# ========================

def get_llm_response(user_text):
    completion = groq_client.chat.completions.create(
        model="llama3-8b-8192",
        messages=[{"role": "user", "content": user_text}],
    )
    return completion.choices[0].message.content


# ========================
# HANDLER
# ========================

async def handler(websocket):

    print("Client connected")

    try:

        async for message in websocket:

            # =====================
            # If audio bytes
            # =====================
            if isinstance(message, bytes):

                # Send to Deepgram REST STT (simpler & stable)
                response = deepgram.listen.prerecorded.v("1").transcribe_file(
                    {
                        "buffer": message,
                        "mimetype": "audio/wav"
                    }
                )

                transcript = response["results"]["channels"][0]["alternatives"][0]["transcript"]

                if transcript.strip():

                    # Send transcript to frontend
                    await websocket.send(json.dumps({
                        "type": "transcript",
                        "text": transcript
                    }))

                    # LLM Response
                    bot_response = get_llm_response(transcript)

                    await websocket.send(json.dumps({
                        "type": "bot_response",
                        "text": bot_response
                    }))

                    # TTS
                    tts_response = deepgram.speak.v("1").generate(
                        {"text": bot_response},
                        {"model": "aura-asteria-en"}
                    )

                    audio_bytes = tts_response.stream.getvalue()
                    audio_base64 = base64.b64encode(audio_bytes).decode()

                    await websocket.send(json.dumps({
                        "type": "tts_audio",
                        "audio": audio_base64
                    }))

                    # Structured extraction
                    extract_structured_data(transcript)

    except Exception as e:
        print("Error:", e)

    finally:
        print("Client disconnected")


# ========================
# SERVER START
# ========================

async def main():
    async with websockets.serve(handler, "0.0.0.0", PORT):
        print(f"Server running on port {PORT}")
        await asyncio.Future()

if __name__ == "__main__":
    asyncio.run(main())

