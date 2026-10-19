"""
Quick DB Connection Tester — run this to check which password works.
Usage: python test_db_connection.py
"""

import sys

# ── Try both passwords ──────────────────────────────────────────────
PASSWORDS_TO_TRY = [
    "Qwemnb@11",   # currently in .env (URL-encoded as Qwemnb%4011)
    "Qwemnb11",    # without @
    "postgres",    # default postgres password
    "admin",       # common admin password
    "password",    # common fallback
]

DB_NAME = "cloudpilot"
DB_USER = "postgres"
DB_HOST = "127.0.0.1"
DB_PORT = 5432

print("=" * 55)
print("  CloudPilot — PostgreSQL Connection Tester")
print("=" * 55)

try:
    import psycopg2
except ImportError:
    print("\n❌ psycopg2 not installed. Run: pip install psycopg2-binary")
    sys.exit(1)

working_password = None
for pw in PASSWORDS_TO_TRY:
    try:
        conn = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            dbname=DB_NAME,
            user=DB_USER,
            password=pw,
            connect_timeout=5
        )
        conn.close()
        print(f"\n✅ SUCCESS! Password that works: '{pw}'")
        working_password = pw
        break
    except psycopg2.OperationalError as e:
        err_msg = str(e).strip().split('\n')[0]
        print(f"❌ Failed with password '{pw}': {err_msg}")

if not working_password:
    print("\n\n⚠️  None of the tried passwords worked.")
    print("   Please open pgAdmin → right-click postgres user → Change Password")
    print("   Then update backend/.env with the new password.")
    print(f"\n   Try connecting manually:")
    print(f"   psql -U postgres -h 127.0.0.1 -d {DB_NAME}")
else:
    # Check if database exists
    try:
        conn = psycopg2.connect(
            host=DB_HOST, port=DB_PORT,
            dbname="postgres",  # connect to default db first
            user=DB_USER, password=working_password, connect_timeout=5
        )
        cur = conn.cursor()
        cur.execute("SELECT datname FROM pg_database WHERE datname = %s;", (DB_NAME,))
        db_exists = cur.fetchone()
        conn.close()

        if db_exists:
            print(f"✅ Database '{DB_NAME}' exists.")
        else:
            print(f"⚠️  Database '{DB_NAME}' does NOT exist yet.")
            print(f"   Creating it now...")
            conn = psycopg2.connect(
                host=DB_HOST, port=DB_PORT,
                dbname="postgres",
                user=DB_USER, password=working_password,
                connect_timeout=5
            )
            conn.autocommit = True
            cur = conn.cursor()
            cur.execute(f"CREATE DATABASE {DB_NAME};")
            conn.close()
            print(f"✅ Database '{DB_NAME}' created!")
    except Exception as e:
        print(f"⚠️  Could not check/create database: {e}")

    # Show the correct .env DATABASE_URL
    from urllib.parse import quote_plus
    encoded_pw = quote_plus(working_password)
    correct_url = f"postgresql://postgres:{encoded_pw}@127.0.0.1:{DB_PORT}/{DB_NAME}"
    print(f"\n📋 Correct DATABASE_URL for your .env:")
    print(f"   {correct_url}")
    
    if working_password != "Qwemnb@11":
        print(f"\n⚠️  Your .env currently has a DIFFERENT password.")
        print(f"   Update backend/.env line 1 to:")
        print(f"   DATABASE_URL={correct_url}")

print("\n" + "=" * 55)
