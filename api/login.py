import json
import bcrypt
import psycopg2
def handler(event, context):
    body = json.loads(event.get('body', '{}'))
    email = body.get('email')
    password = body.get('password')
    if not email or not password:
        return {"statusCode": 400, "body": json.dumps({"error": "Bad request"})}
    try:
        with psycopg2.connect("postgresql://postgres.iwwcrggaufbphjaxwybx:RAJALAKSHMI123@aws-1-ap-south-1.pooler.supabase.com:6543/postgres") as conn:
            with conn.cursor() as cur:
                cur.execute('SELECT password_hash FROM userdata WHERE email = %s;', (email,))
                res = cur.fetchone()
                if not res or not bcrypt.checkpw(password.encode('utf-8'), res[0].encode('utf-8')):
                    return {"statusCode": 401, "body": json.dumps({"error": "Invalid credentials"})}
                role = "admin" if email == "rajidce2022@gmail.com" else "student"
                cur.execute('SELECT 1 FROM student_profiles WHERE student_email = %s;', (email,))
                has_profile = cur.fetchone() is not None
                return {
                    "statusCode": 200, 
                    "body": json.dumps({ "auth": True, "email": email,"role": role, "hasProfile": has_profile   
                    }) }
    except Exception as e:
        print(f"Auth error: {e}")
        return {"statusCode": 500, "body": json.dumps({"error": "Internal server error"})}
