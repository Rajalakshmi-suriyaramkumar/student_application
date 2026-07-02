import json
import bcrypt
import psycopg2
def handler(event, context):
    body = json.loads(event.get('body', '{}'))
    email = body.get('email')
    password = body.get('password')
    fname = body.get('firstName')
    lname = body.get('lastName')
    if not email or not password:
        return {"statusCode": 400, "body": json.dumps({"error": "Missing required fields"})}
    hashed_pw = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    conn = None
    cur = None
    try:
        conn = psycopg2.connect("postgresql://postgres:School*Pro123#@db.iwwcrggaufbphjaxwybx.supabase.co:5432/postgres")
        cur = conn.cursor()
        query = """INSERT INTO userdata (email, password_hash, first_name, last_name) VALUES (%s, %s, %s, %s); """
        cur.execute(query, (email, hashed_pw, fname, lname))
        conn.commit()
        return {
            "statusCode": 201, 
            "body": json.dumps({"status": "success", "email": email})
        }
    except Exception as e:
        print(f"Registration error: {str(e)}") # Useful for real logging
        return {
            "statusCode": 400, 
            "body": json.dumps({"error":"Registration failed.Email might already exist"})
        }
    finally:
        if cur: cur.close()
        if conn: conn.close()
