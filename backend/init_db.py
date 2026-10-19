import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

conn = psycopg2.connect(
    dbname='postgres',
    user='postgres',
    password='Qwemnb@11',
    host='127.0.0.1',
    port=5432
)
conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
cur = conn.cursor()

# Check or create 'cloudpilot' database
cur.execute("SELECT 1 FROM pg_database WHERE datname='cloudpilot'")
if not cur.fetchone():
    cur.execute("CREATE DATABASE cloudpilot")
    print("Database 'cloudpilot' created successfully!")
else:
    print("Database 'cloudpilot' already exists!")

cur.close()
conn.close()
