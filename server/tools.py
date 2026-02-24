import re
import sqlite3
from datetime import datetime

DB_PATH = "database/conversations.db"


# ==========================
# INIT DB (SAFE CHECK)
# ==========================

def ensure_table_exists():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS structured_data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            request TEXT,
            detected_date TEXT,
            raw_text TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    conn.commit()
    conn.close()


# ==========================
# EXTRACTION LOGIC
# ==========================

def extract_name(text):
    match = re.search(r"(my name is|i am)\s+([A-Za-z]+)", text, re.IGNORECASE)
    if match:
        return match.group(2)
    return None


def extract_date(text):
    today_keywords = ["today", "tomorrow"]
    for keyword in today_keywords:
        if keyword in text.lower():
            return keyword
    return None


def detect_request(text):
    keywords = [
        "book",
        "schedule",
        "meeting",
        "appointment",
        "order",
        "buy",
        "help",
        "support"
    ]

    for word in keywords:
        if word in text.lower():
            return word

    return None


# ==========================
# MAIN FUNCTION
# ==========================

def extract_structured_data(text):
    """
    Extract structured data from user input and store it in SQLite.
    This function will NEVER crash the server.
    """

    try:

        ensure_table_exists()

        name = extract_name(text)
        date = extract_date(text)
        request = detect_request(text)

        if not any([name, date, request]):
            return  # nothing meaningful to store

        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        cursor.execute("""
            INSERT INTO structured_data (name, request, detected_date, raw_text)
            VALUES (?, ?, ?, ?)
        """, (name, request, date, text))

        conn.commit()
        conn.close()

        print("Structured data saved.")

    except Exception as e:
        print("Structured data extraction error:", e)
