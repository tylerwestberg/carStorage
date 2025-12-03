import sqlite3

# connect to your database
conn = sqlite3.connect("instance/carStorage.db")
cur = conn.cursor()

# update your admin user
cur.execute("UPDATE users SET is_admin = 1 WHERE email = 'super@super.com';")
conn.commit()

# confirm change
for row in cur.execute("SELECT id, name, email, is_admin FROM users;"):
    print(row)

conn.close()
