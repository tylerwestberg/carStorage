import sqlite3

conn = sqlite3.connect("instance/carStorage.db")
cursor = conn.cursor()

# --- Add columns if needed
try:
    cursor.execute("ALTER TABLE cars ADD COLUMN date_added TEXT;")
except sqlite3.OperationalError:
    pass

try:
    cursor.execute("ALTER TABLE cars ADD COLUMN proj_pickup_date TEXT;")
except sqlite3.OperationalError:
    pass

try:
    cursor.execute("ALTER TABLE users ADD COLUMN phone_number TEXT;")
except sqlite3.OperationalError:
    pass

# --- Update existing cars with ISO date format
cursor.execute("UPDATE cars SET date_added = ?", ("2025-11-03",))

conn.commit()
conn.close()
print("✅ Migration complete: all cars now have ISO date_added (2025-11-03)")
