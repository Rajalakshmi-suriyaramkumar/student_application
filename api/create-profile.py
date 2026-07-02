import json
import psycopg2
def handler(event, context):
    body=json.loads(event.get('body', '{}'))
    email=body.get('email')
    inst_name=body.get('institutionName')
    dob=body.get('dateOfBirth')
    gender=body.get('gender')
    roll_no=body.get('rollNumber')
    grade=body.get('gradeClass')
    section=body.get('section')
    parent_phone=body.get('parentContact')
    if not email:
        return {"statusCode": 400, "body": json.dumps({"error": "Email is required"})}
    try:
        with psycopg2.connect("postgresql://postgres:School*Pro123#@db.iwwcrggaufbphjaxwybx.supabase.co:5432/postgres") as conn:
            with conn.cursor() as cur:
                query = """
                    INSERT INTO student_profiles 
                    (student_email, institution_name, date_of_birth, gender, roll_number, grade_class, section, parent_contact) 
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s);
                """
                cur.execute(query, (email, inst_name, dob, gender, roll_no, grade, section, parent_phone))
                conn.commit()
        return {"statusCode": 201, "body": json.dumps({"status": "success"})}
    except Exception as e:
        print(f"Database error: {e}")
        return {"statusCode": 500, "body": json.dumps({"error": "Failed to save profile"})}
