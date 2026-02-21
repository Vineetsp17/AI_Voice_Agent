import re
from database import save_booking

def extract_booking(text):
    name_match = re.search(r"My name is (\w+)", text, re.IGNORECASE)
    date_match = re.search(r"(tomorrow|today|\d{1,2} \w+)", text, re.IGNORECASE)

    name = name_match.group(1) if name_match else None
    date = date_match.group(1) if date_match else None

    if name and date and "book" in text.lower():
        save_booking(name, "book ticket", date)
        print(f"Saved booking → {name}, {date}")