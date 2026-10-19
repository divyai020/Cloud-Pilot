import psycopg2

test_passwords = [
    'qwemnb@11',
    'Qwemnb@11',
    'qwemnb11',
    'Qwemnb11',
    'qwemnb',
    'Qwemnb',
    'postgres',
    'root',
    'admin'
]

found = False
for p in test_passwords:
    try:
        conn = psycopg2.connect(
            dbname='postgres',
            user='postgres',
            password=p,
            host='127.0.0.1',
            port=5432
        )
        print(f"SUCCESS: The correct password is: {p}")
        conn.close()
        found = True
        break
    except psycopg2.OperationalError as e:
        print(f"Failed for: {p}")

if not found:
    print("None of the test passwords matched.")
