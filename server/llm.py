from groq import Groq
from config import config

client = Groq(api_key=config.GROQ_API_KEY)

def get_llm_response(text):
    completion = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[
            {"role": "system", "content": "You are a helpful voice assistant."},
            {"role": "user", "content": text}
        ]
    )

    return completion.choices[0].message.content