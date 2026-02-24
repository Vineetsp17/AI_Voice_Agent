import os
import json
import asyncio
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import websockets

from tools import extract_structured_data
from llm import get_llm_response

DEEPGRAM_API_KEY = os.getenv("DEEPGRAM_API_KEY")
PORT = int(os.getenv("PORT", 8000))

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"status": "AI Voice Agent Running"}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("Client connected")

    async with websockets.connect(
        "wss://api.deepgram.com/v1/listen",
        extra_headers={"Authorization": f"Token {DEEPGRAM_API_KEY}"}
    ) as dg_ws:

        async def receive_from_deepgram():
            async for message in dg_ws:
                await websocket.send_text(message)

        asyncio.create_task(receive_from_deepgram())

        while True:
            data = await websocket.receive_bytes()
            await dg_ws.send(data)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=PORT)
