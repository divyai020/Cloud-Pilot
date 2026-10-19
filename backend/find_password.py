"""
CloudPilot — PostgreSQL Password Finder
Add your possible passwords to the list below, then run:
  python find_password.py
"""

# ─── ADD ALL YOUR POSSIBLE PASSWORDS HERE ────────────────────────────
MY_POSSIBLE_PASSWORDS = [
         # currently in .env
  
    "qwemnb@11",
    "Qwemnb@11",
    "Qwemnb@12"
    "qwemnb@12"
    # ← Add more of your guesses here
]
# ─────────────────────────────────────────────────────────────────────

DB_USER = "postgres"
DB_HOST = "127.0.0.1"
DB_PORT = 5432

print("=" * 55)
print("  CloudPilot — Password Finder")
print("=" * 55)
print(f"  Testing {len(MY_POSSIBLE_PASSWORDS)} password(s)...\n")

try:
    import psycopg2
except ImportError:
    print("Installing psycopg2...")
    import subprocess, sys
    subprocess.check_call([sys.executable, "-m", "pip", "install", "psycopg2-binary", "-q"])
    import psycopg2

working = None
for pw in MY_POSSIBLE_PASSWORDS:
    try:
        conn = psycopg2.connect(
            host=DB_HOST, port=DB_PORT,
            dbname="postgres",   # connect to default db
            user=DB_USER, password=pw,
            connect_timeout=4
        )
        conn.close()
        print(f"✅ FOUND IT! Your password is: '{pw}'")
        working = pw
        break
    except psycopg2.OperationalError as e:
        msg = str(e).strip().split('\n')[0][:60]
        print(f"  ✗ '{pw}' → {msg}")

print()
if working:
    from urllib.parse import quote_plus
    encoded = quote_plus(working)
    url = f"postgresql://postgres:{encoded}@127.0.0.1:{DB_PORT}/cloudpilot"
    print("─" * 55)
    print("📋 Copy this to your backend/.env  (line 1):")
    print(f"\n   DATABASE_URL={url}\n")
    print("─" * 55)

    # Also check if cloudpilot DB exists
    try:
        conn = psycopg2.connect(
            host=DB_HOST, port=DB_PORT, dbname="postgres",
            user=DB_USER, password=working, connect_timeout=4
        )
        conn.autocommit = True
        cur = conn.cursor()
        cur.execute("SELECT 1 FROM pg_database WHERE datname='cloudpilot';")
        if cur.fetchone():
            print("✅ Database 'cloudpilot' already exists — ready to use!")
        else:
            print("⚠️  Database 'cloudpilot' not found. Creating it...")
            cur.execute("CREATE DATABASE cloudpilot;")
            print("✅ Database 'cloudpilot' created successfully!")
        conn.close()
    except Exception as e:
        print(f"Could not check DB: {e}")
else:
    print("❌ None of the passwords worked.")
    print("   Add more guesses to MY_POSSIBLE_PASSWORDS list above.")
    print("   OR reset password via pgAdmin → Login/Group Roles → postgres → Properties → Definition → Password")

print("=" * 55)
