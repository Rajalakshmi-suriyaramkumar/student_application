import json
import psycopg2
def handler(event, context):
    params = event.get('queryStringParameters') or {}
    email = params.get('email')
    if not email:
        return {"statusCode": 400, "body": json.dumps({"error": "Email parameter is required"})}
    try:
        with psycopg2.connect("postgresql://postgres:School*Pro123#@db.iwwcrggaufbphjaxwybx.supabase.co:5432/postgres") as conn:
            with conn.cursor() as cur:
                query = """SELECT u.first_name, u.last_name, s.institution_name, s.roll_number, s.grade_class, s.section, s.parent_contact FROM userdata u JOIN student_profiles s ON u.email = s.student_email WHERE u.email = %s;""" 
                cur.execute(query, (email,))
                row = cur.fetchone()
        if not row:
            return {"statusCode": 404, "body": json.dumps({"error": "Profile not found"})}  
        fname, lname, inst, roll, grade, sec, parent = row
        return {
            "statusCode":200, 
            "body":json.dumps({ "name":f"{fname} {lname}","institution":inst,"rollNumber":roll,"class":f"{grade} - {sec}","parentContact":parent
            })
        }
    except Exception as e:
        print(f"Fetch error: {e}")
        return {"statusCode": 500, "body": json.dumps({"error": "Internal server error"})}
