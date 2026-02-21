import asyncio
import websockets
import json
import base64
import aiohttp
import wave
import os
from datetime import datetime

from config import config
from llm import get_llm_response
from tools import extract_booking
from database import init_db

init_db()

# Deepgram WebSocket endpoint
DEEPGRAM_URL = (
    "wss://api.deepgram.com/v1/listen?"
    "model=nova-2&"
    "language=en-US&"
    "encoding=linear16&"
    "sample_rate=16000"
)

HEADERS = {
    "Authorization": f"Token {config.DEEPGRAM_API_KEY}"
}


async def send_tts(text, client_ws):
    """
    Sends text to Deepgram TTS and returns audio to client.
    """
    url = "https://api.deepgram.com/v1/speak?model=aura-asteria-en"

    headers = {
        "Authorization": f"Token {config.DEEPGRAM_API_KEY}",
        "Content-Type": "application/json"
    }

    async with aiohttp.ClientSession() as session:
        async with session.post(
            url,
            headers=headers,
            json={"text": text}
        ) as resp:

            audio_bytes = await resp.read()
            audio_base64 = base64.b64encode(audio_bytes).decode()

            await client_ws.send(json.dumps({
                "type": "tts_audio",
                "audio": audio_base64
            }))


async def handler(client_ws):
    print("Client connected")

    # Setup recording folder
    os.makedirs("../recordings", exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    recording_path = f"../recordings/conversation_{timestamp}.wav"
    audio_frames = []

    try:
        async with websockets.connect(
            DEEPGRAM_URL,
            additional_headers=HEADERS  # websockets v12+
        ) as dg_ws:

            print("Connected to Deepgram")

            async def receive_from_deepgram():
                async for message in dg_ws:
                    data = json.loads(message)

                    if "channel" in data:
                        transcript = data["channel"]["alternatives"][0]["transcript"]

                        if not transcript.strip():
                            continue

                        print("Transcript:", transcript)

                        # Send transcript to browser
                        await client_ws.send(json.dumps({
                            "type": "transcript",
                            "text": transcript
                        }))

                        # Structured extraction
                        extract_booking(transcript)

                        # LLM
                        try:
                            response = get_llm_response(transcript)
                        except Exception as e:
                            print("LLM Error:", e)
                            response = "Error generating response."

                        # Send text response
                        await client_ws.send(json.dumps({
                            "type": "bot_response",
                            "text": response
                        }))

                        # TTS
                        await send_tts(response, client_ws)

            # Start Deepgram receiver
            asyncio.create_task(receive_from_deepgram())

            # Forward mic audio + record
            async for message in client_ws:
                if isinstance(message, bytes):
                    audio_frames.append(message)
                    await dg_ws.send(message)

    except Exception as e:
        print("DEEPGRAM CONNECTION ERROR:", e)

    finally:
        print("Connection closed")

        # Save recording
        if audio_frames:
            with wave.open(recording_path, 'wb') as wf:
                wf.setnchannels(1)
                wf.setsampwidth(2)  # 16-bit PCM
                wf.setframerate(16000)
                wf.writeframes(b''.join(audio_frames))

            print("Recording saved:", recording_path)


async def main():
    print(f"Server running at ws://{config.HOST}:{config.PORT}")

    async with websockets.serve(handler, config.HOST, config.PORT):
        await asyncio.Future()


if __name__ == "__main__":
    asyncio.run(main())