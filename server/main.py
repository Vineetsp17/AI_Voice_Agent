import os
import asyncio
import websockets
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

# ✅ Correct package-style imports for Render
from server.tools import extract_structured_data

# =========================
# Environment Variables
# =========================
DEEPGRAM_API_KEY = os.getenv("DEEPGRAM_API_KEY")
PORT = int(os.getenv("PORT", 8000))

if not DEEPGRAM_API_KEY:
    raise Exception("DEEPGRAM_API_KEY not set in environment variables")

# =========================
# FastAPI App
# =========================
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================
# Health Check Route
# =========================
@app.get("/")
async def health_check():
    return {"status": "AI Voice Agent Backend Running"}

# =========================
# WebSocket Endpoint
# =========================
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("Client connected")

    try:
        async with websockets.connect(
            "wss://api.deepgram.com/v1/listen",
            extra_headers={
                "Authorization": f"Token {DEEPGRAM_API_KEY}"
            },
        ) as dg_ws:

            print("Connected to Deepgram")

            async def receive_from_deepgram():
                try:
                    async for message in dg_ws:
                        await websocket.send_text(message)
                except Exception as e:
                    print("Deepgram receive error:", e)

            deepgram_task = asyncio.create_task(receive_from_deepgram())

            while True:
                try:
                    data = await websocket.receive_bytes()
                    await dg_ws.send(data)
                except WebSocketDisconnect:
                    print("Client disconnected")
                    break

            deepgram_task.cancel()

    except Exception as e:
        print("WebSocket error:", e)
