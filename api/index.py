import os
import bcrypt
import psycopg2
from psycopg2 import IntegrityError, OperationalError
from flask import Flask, request, jsonify

app = Flask(__name__)

DEFAULT_DB_URL = (
    "postgresql://postgres.iwwcrggaufbphjaxwybx:RAJALAKSHMI123"
    "@aws-1-ap-south-1.pooler.supabase.com:6543/postgres"
)
DATABASE_URL = os.environ.get("DATABASE_URL", DEFAULT_DB_URL)


def get_conn():
    url = DATABASE_URL
    if "sslmode=" not in url:
        url += "&sslmode=require" if "?" in url else "?sslmode=require"
    return psycopg2.connect(url, connect_timeout=10, prepare_threshold=None)


@app.route("/api/health", methods=["GET"])
def health_check():
    try:
        with get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT COUNT(*) FROM userdata")
                count = cur.fetchone()[0]
        return jsonify({"status": "ok", "database": "connected", "user_count": count}), 200
    except Exception as e:
        print(f"Health check error: {e}")
        return jsonify({"status": "error", "database": "failed", "detail": str(e)}), 500


def verify_password(password, stored_hash):
    if not stored_hash or not password:
        return False
    if isinstance(stored_hash, memoryview):
        stored_hash = stored_hash.tobytes()
    elif isinstance(stored_hash, str):
        stored_hash = stored_hash.strip().encode("utf-8")
    elif not isinstance(stored_hash, bytes):
        return False
    try:
        return bcrypt.checkpw(password.encode("utf-8"), stored_hash)
    except (ValueError, TypeError):
        return False


@app.route("/api/register", methods=["POST"])
@app.route("/api/signup", methods=["POST"])
def register():
    data = request.json or {}
    fname = (data.get("firstName") or "").strip()
    lname = (data.get("lastName") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not email or not password:
        return jsonify({"error": "Missing required fields"}), 400
    if not fname or not lname:
        return jsonify({"error": "First name and last name are required"}), 400

    hashed_pw = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

    try:
        with get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO userdata (email, password_hash, first_name, last_name)
                    VALUES (%s, %s, %s, %s)
                    """,
                    (email, hashed_pw, fname, lname),
                )
                conn.commit()
        return jsonify({"status": "success", "email": email, "hasProfile": False, "role": "student"}), 201
    except IntegrityError as e:
        print(f"Registration integrity error: {e}")
        return jsonify(
            {"error": "This email is already registered. Click 'Sign In' below to log in."}
        ), 400
    except OperationalError as e:
        print(f"Registration DB connection error: {e}")
        return jsonify(
            {"error": "Cannot connect to database. Set DATABASE_URL in Vercel and redeploy."}
        ), 500
    except Exception as e:
        print(f"Registration error: {e}")
        return jsonify({"error": f"Registration failed: {e}"}), 500


@app.route("/api/login", methods=["POST"])
def login():
    data = request.json or {}
    email = data.get("email")
    password = data.get("password")

    email = (email or "").strip()
    password = password or ""

    if not email or not password:
        return jsonify({"error": "Bad request"}), 400

    try:
        with get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT email, password_hash FROM userdata WHERE LOWER(email) = LOWER(%s)",
                    (email,),
                )
                res = cur.fetchone()

        if not res or not verify_password(password, res[1]):
            return jsonify({"error": "Invalid credentials"}), 401

        stored_email = res[0]
        role = "admin" if stored_email.lower() == "rajidce2022@gmail.com" else "student"
        has_profile = False
        try:
            with get_conn() as conn:
                with conn.cursor() as cur:
                    cur.execute(
                        "SELECT 1 FROM student_profiles WHERE student_email = %s",
                        (stored_email,),
                    )
                    has_profile = cur.fetchone() is not None
        except Exception as profile_err:
            print(f"Profile lookup error: {profile_err}")

        return jsonify({"email": stored_email, "role": role, "hasProfile": has_profile}), 200
    except Exception as e:
        print(f"Auth error: {e}")
        return jsonify({"error": "Internal server error"}), 500


@app.route("/api/create-profile", methods=["POST"])
def create_profile():
    data = request.json or {}
    email = (data.get("email") or "").strip()
    institution = (data.get("institutionName") or "").strip()
    dob = data.get("dateOfBirth")
    gender = (data.get("gender") or "").strip()
    roll_number = (data.get("rollNumber") or "").strip()
    grade_class = (data.get("gradeClass") or "").strip()
    section = (data.get("section") or "").strip()
    parent_contact = (data.get("parentContact") or "").strip()

    if not email:
        return jsonify({"error": "Email is required"}), 400
    if not all([institution, dob, gender, roll_number, grade_class, section, parent_contact]):
        return jsonify({"error": "Please fill in all profile fields"}), 400

    try:
        with get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT email FROM userdata WHERE LOWER(email) = LOWER(%s)",
                    (email,),
                )
                user_row = cur.fetchone()
                if not user_row:
                    return jsonify({"error": "User account not found. Please sign up first."}), 400

                stored_email = user_row[0]

                cur.execute(
                    "SELECT 1 FROM student_profiles WHERE student_email = %s",
                    (stored_email,),
                )
                if cur.fetchone():
                    return jsonify({"error": "Profile already exists for this account."}), 400

                cur.execute(
                    """
                    INSERT INTO student_profiles
                    (student_email, institution_name, date_of_birth, gender, roll_number, grade_class, section, parent_contact)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    """,
                    (
                        stored_email,
                        institution,
                        dob,
                        gender,
                        roll_number,
                        grade_class,
                        section,
                        parent_contact,
                    ),
                )
                conn.commit()
        return jsonify({"status": "success"}), 201
    except IntegrityError as e:
        print(f"Profile integrity error: {e}")
        return jsonify({"error": "Could not save profile. Email may not be registered yet."}), 400
    except Exception as e:
        print(f"Database error: {e}")
        return jsonify({"error": f"Failed to save profile: {e}"}), 500


@app.route("/api/get-profile", methods=["GET"])
def get_profile():
    email = request.args.get("email")
    if not email:
        return jsonify({"error": "Email parameter is required"}), 400

    try:
        with get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT u.first_name, u.last_name, s.institution_name, s.roll_number, s.grade_class, s.section, s.parent_contact
                    FROM userdata u
                    JOIN student_profiles s ON u.email = s.student_email
                    WHERE u.email = %s
                    """,
                    (email,),
                )
                row = cur.fetchone()

        if not row:
            return jsonify({"error": "Profile not found"}), 404

        fname, lname, inst, roll, grade, sec, parent = row
        return jsonify(
            {
                "name": f"{fname} {lname}",
                "institution": inst,
                "rollNumber": roll,
                "class": f"{grade} - {sec}",
                "parentContact": parent,
            }
        ), 200
    except Exception as e:
        print(f"Fetch error: {e}")
        return jsonify({"error": "Internal server error"}), 500


@app.route("/api/get-all-profiles", methods=["GET"])
def get_all_profiles():
    try:
        with get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT u.email, u.first_name, u.last_name, s.institution_name, s.roll_number,
                           s.grade_class, s.section, s.parent_contact
                    FROM userdata u
                    LEFT JOIN student_profiles s ON u.email = s.student_email
                    ORDER BY u.created_at DESC
                    """
                )
                rows = cur.fetchall()

        return jsonify(
            [
                {
                    "email": email,
                    "name": f"{fname} {lname}",
                    "institution": inst or "—",
                    "rollNumber": roll or "—",
                    "class": f"{grade} - {sec}" if grade and sec else "—",
                    "parentContact": parent or "—",
                }
                for email, fname, lname, inst, roll, grade, sec, parent in rows
            ]
        ), 200
    except Exception as e:
        print(f"Dashboard error: {e}")
        return jsonify({"error": "Internal server error"}), 500


handler = app
