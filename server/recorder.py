import os
import wave
from datetime import datetime

RECORD_DIR = "../recordings"
os.makedirs(RECORD_DIR, exist_ok=True)

class ConversationRecorder:

    def __init__(self):
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        self.filename = f"{RECORD_DIR}/conversation_{timestamp}.wav"
        self.frames = []

    def add_audio(self, audio_bytes):
        self.frames.append(audio_bytes)

    def save(self, sample_rate=16000):
        if not self.frames:
            return

        with wave.open(self.filename, 'wb') as wf:
            wf.setnchannels(1)
            wf.setsampwidth(2)
            wf.setframerate(sample_rate)
            wf.writeframes(b''.join(self.frames))

        print("Recording saved:", self.filename)