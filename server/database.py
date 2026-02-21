import sqlite3
import os

DB_DIR = "../database"
DB_PATH = f"{DB_DIR}/conversations.db"

def init_db():
    os.makedirs(DB_DIR, exist_ok=True)

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS bookings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            request TEXT,
            date TEXT
        )
    """)

    conn.commit()
    conn.close()

def save_booking(name, request, date):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute(
        "INSERT INTO bookings (name, request, date) VALUES (?, ?, ?)",
        (name, request, date)
    )

    conn.commit()
    conn.close()