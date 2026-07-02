import json
import bcrypt
import psycopg2
def handler(event, context):
    body = json.loads(event.get('body', '{}'))
    fname = body.get('firstName')
    lname = body.get('lastName')
    email = body.get('email')
    password = body.get('password')
    
    if not email or not password:
        return {"statusCode": 400, "body": json.dumps({"error": "Missing required fields"})}
    hashed_pw = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    conn = None
    cur = None
    try:
        conn = psycopg2.connect("postgresql://postgres.iwwcrggaufbphjaxwybx:RAJALAKSHMI123@aws-1-ap-south-1.pooler.supabase.com:6543/postgres")
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
