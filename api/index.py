import os
import bcrypt
import psycopg2
from psycopg2 import IntegrityError, OperationalError
from flask import Flask, request, jsonify, redirect
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
app = Flask(__name__)
ADMIN_EMAIL = "rajidce2022@gmail.com"
NOT_PROVIDED = "—"
DEFAULT_DATABASE_URL = (
    "postgresql://postgres.iwwcrggaufbphjaxwybx:RAJALAKSHMI123"
    "@aws-1-ap-south-1.pooler.supabase.com:6543/postgres")
DATABASE_URL = os.environ.get("DATABASE_URL", DEFAULT_DATABASE_URL)
GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.environ.get("GOOGLE_CLIENT_SECRET", "")
GOOGLE_REDIRECT_URI = os.environ.get("GOOGLE_REDIRECT_URI", "")
GMAIL_SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"]
def connect_to_database():
    connection_url = DATABASE_URL
    if "sslmode=" not in connection_url:
        connection_url += "&sslmode=require" if "?" in connection_url else "?sslmode=require"
    return psycopg2.connect(
        connection_url,
        connect_timeout=10,
        prepare_threshold=None,
    )
def password_matches(plain_password, stored_hash):
    if not stored_hash or not plain_password:
        return False
    if isinstance(stored_hash, memoryview):
        hash_bytes = stored_hash.tobytes()
    elif isinstance(stored_hash, str):
        hash_bytes = stored_hash.strip().encode("utf-8")
    elif isinstance(stored_hash, bytes):
        hash_bytes = stored_hash
    else:
        return False
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hash_bytes)
    except (ValueError, TypeError):
        return False
def hash_password(plain_password):
    return bcrypt.hashpw(plain_password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def validate_strong_password(password):
    if len(password) < 8:
        return "Password must be at least 8 characters."
    if not any(c.isupper() for c in password):
        return "Password must include at least one uppercase letter."
    if not any(c.islower() for c in password):
        return "Password must include at least one lowercase letter."
    if not any(c.isdigit() for c in password):
        return "Password must include at least one number."
    if not any(not c.isalnum() for c in password):
        return "Password must include at least one special character (e.g. @ # $ !)."
    return None

def student_has_profile(cursor, email):
    cursor.execute(
        "SELECT 1 FROM student_profiles WHERE student_email = %s",
        (email,),
    )
    return cursor.fetchone() is not None
def get_user_role(email):
    return "admin" if email.lower() == ADMIN_EMAIL.lower() else "student"
@app.route("/api/health", methods=["GET"])
def health_check():
    try:
        with connect_to_database() as connection:
            with connection.cursor() as cursor:
                cursor.execute("SELECT COUNT(*) FROM userdata")
                total_users = cursor.fetchone()[0]
        return jsonify({
            "status": "ok",
            "database": "connected",
            "user_count": total_users,
        }), 200
    except Exception as error:
        print(f"Health check failed: {error}")
        return jsonify({
            "status": "error",
            "database": "failed",
            "detail": str(error),
        }), 500
@app.route("/api/register", methods=["POST"])
@app.route("/api/signup", methods=["POST"])
def register():
    body = request.json or {}
    first_name = (body.get("firstName") or "").strip()
    last_name = (body.get("lastName") or "").strip()
    email = (body.get("email") or "").strip().lower()
    password = body.get("password") or ""
    if not email or not password:
        return jsonify({"error": "Please enter your email and password."}), 400
    if not first_name or not last_name:
        return jsonify({"error": "Please enter your first and last name."}), 400
    password_error = validate_strong_password(password)
    if password_error:
        return jsonify({"error": password_error}), 400
    password_hash = hash_password(password)
    try:
        with connect_to_database() as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    "INSERT INTO userdata (email, password_hash, first_name, last_name) VALUES (%s, %s, %s, %s)",
                    (email, password_hash, first_name, last_name),
                )
                connection.commit()
        return jsonify({
            "status": "success",
            "email": email,
            "hasProfile": False,
            "role": "student",
        }), 201
    except IntegrityError as error:
        print(f"Registration blocked — email already exists: {error}")
        return jsonify({"error": "This email is already registered. Please sign in instead."}), 400
    except OperationalError as error:
        print(f"Registration failed — database unreachable: {error}")
        return jsonify({"error": "We could not reach the database. Please try again in a moment."}), 500
    except Exception as error:
        print(f"Unexpected registration error: {error}")
        return jsonify({"error": "Sign up failed. Please try again."}), 500
@app.route("/api/login", methods=["POST"])
def login():
    body = request.json or {}
    email = (body.get("email") or "").strip()
    password = body.get("password") or ""
    if not email or not password:
        return jsonify({"error": "Please enter your email and password."}), 400
    try:
        with connect_to_database() as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    "SELECT email, password_hash FROM userdata WHERE LOWER(email) = LOWER(%s)",
                    (email,),
                )
                user = cursor.fetchone()
        if not user or not password_matches(password, user[1]):
            return jsonify({"error": "Incorrect email or password."}), 401
        stored_email = user[0]
        role = get_user_role(stored_email)
        has_profile = False
        try:
            with connect_to_database() as connection:
                with connection.cursor() as cursor:
                    has_profile = student_has_profile(cursor, stored_email)
        except Exception as profile_error:
            print(f"Could not check profile status: {profile_error}")
        return jsonify({
            "email": stored_email,
            "role": role,
            "hasProfile": has_profile,
        }), 200
    except Exception as error:
        print(f"Login error: {error}")
        return jsonify({"error": "Something went wrong during sign in. Please try again."}), 500
@app.route("/api/create-profile", methods=["POST"])
def create_profile():
    body = request.json or {}
    email = (body.get("email") or "").strip()
    school_name = (body.get("institutionName") or "").strip()
    date_of_birth = body.get("dateOfBirth")
    gender = (body.get("gender") or "").strip()
    roll_number = (body.get("rollNumber") or "").strip()
    grade_class = (body.get("gradeClass") or "").strip()
    section = (body.get("section") or "").strip()
    parent_phone = (body.get("parentContact") or "").strip()
    if not email:
        return jsonify({"error": "Your account email is missing. Please sign in again."}), 400
    required_fields = [school_name, date_of_birth, gender, roll_number, grade_class, section, parent_phone]
    if not all(required_fields):
        return jsonify({"error": "Please complete every field on the enrollment form."}), 400
    try:
        with connect_to_database() as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    "SELECT email FROM userdata WHERE LOWER(email) = LOWER(%s)",
                    (email,),
                )
                user = cursor.fetchone()
                if not user:
                    return jsonify({"error": "No account found for this email. Please sign up first."}), 400
                stored_email = user[0]
                if student_has_profile(cursor, stored_email):
                    return jsonify({"error": "You already have a profile. Sign in to view your ID card."}), 400
                cursor.execute(
                    """
                    INSERT INTO student_profiles (
                        student_email, institution_name, date_of_birth, gender,
                        roll_number, grade_class, section, parent_contact
                    )
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    """,
                    (
                        stored_email, school_name, date_of_birth, gender,
                        roll_number, grade_class, section, parent_phone,
                    ),
                )
                connection.commit()
        return jsonify({"status": "success"}), 201
    except IntegrityError as error:
        print(f"Profile save blocked by database rules: {error}")
        return jsonify({"error": "We could not save your profile. Make sure you are signed up first."}), 400
    except Exception as error:
        print(f"Profile save error: {error}")
        return jsonify({"error": "Could not save your profile. Please try again."}), 500
@app.route("/api/get-profile", methods=["GET"])
def get_profile():
    email = request.args.get("email")
    if not email:
        return jsonify({"error": "We need your email to load your profile."}), 400
    try:
        with connect_to_database() as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT u.first_name, u.last_name, s.institution_name,
                           s.roll_number, s.grade_class, s.section, s.parent_contact
                    FROM userdata u
                    JOIN student_profiles s ON u.email = s.student_email
                    WHERE u.email = %s
                    """,
                    (email,),
                )
                profile = cursor.fetchone()
        if not profile:
            return jsonify({"error": "No profile found. Please complete enrollment first."}), 404
        first_name, last_name, school, roll, grade, section, parent_phone = profile
        return jsonify({
            "name": f"{first_name} {last_name}",
            "institution": school,
            "rollNumber": roll,
            "class": f"{grade} - {section}",
            "parentContact": parent_phone,
        }), 200
    except Exception as error:
        print(f"Profile fetch error: {error}")
        return jsonify({"error": "Could not load your profile. Please try again."}), 500
@app.route("/api/get-all-profiles", methods=["GET"])
def get_all_profiles():
    try:
        with connect_to_database() as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT u.email, u.first_name, u.last_name, s.institution_name,
                           s.roll_number, s.grade_class, s.section, s.parent_contact
                    FROM userdata u
                    LEFT JOIN student_profiles s ON u.email = s.student_email
                    ORDER BY u.created_at DESC
                    """
                )
                students = cursor.fetchall()
        return jsonify([
            {
                "email": email,
                "name": f"{first_name} {last_name}",
                "institution": school or NOT_PROVIDED,
                "rollNumber": roll or NOT_PROVIDED,
                "class": f"{grade} - {section}" if grade and section else NOT_PROVIDED,
                "parentContact": parent_phone or NOT_PROVIDED,
            }
            for email, first_name, last_name, school, roll, grade, section, parent_phone in students
        ]), 200
    except Exception as error:
        print(f"Admin dashboard error: {error}")
        return jsonify({"error": "Could not load the student list. Please try again."}), 500

@app.route("/api/delete-user", methods=["DELETE"])
def delete_user():
    body = request.json or {}
    email = (body.get("email") or "").strip()
    if not email:
        return jsonify({"error": "Email is required to delete a user."}), 400
    if email.lower() == ADMIN_EMAIL.lower():
        return jsonify({"error": "The admin account cannot be deleted."}), 400
    try:
        with connect_to_database() as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    "SELECT email FROM userdata WHERE LOWER(email) = LOWER(%s)",
                    (email,),
                )
                user = cursor.fetchone()
                if not user:
                    return jsonify({"error": "User not found."}), 404
                stored_email = user[0]
                cursor.execute(
                    "DELETE FROM student_profiles WHERE student_email = %s",
                    (stored_email,),
                )
                cursor.execute(
                    "DELETE FROM userdata WHERE email = %s",
                    (stored_email,),
                )
                connection.commit()
        return jsonify({"status": "success", "email": stored_email}), 200
    except Exception as error:
        print(f"Delete user error: {error}")
        return jsonify({"error": "Could not delete user. Please try again."}), 500
def is_admin(email):
    return (email or "").strip().lower() == ADMIN_EMAIL.lower()
def get_gmail_flow():
    return Flow.from_client_config(
        {
            "web": {
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
            }
        },
        scopes=GMAIL_SCOPES,
        redirect_uri=GOOGLE_REDIRECT_URI,
    )
def save_gmail_token(admin_email, refresh_token):
    with connect_to_database() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO gmail_tokens (admin_email, refresh_token)
                VALUES (%s, %s)
                ON CONFLICT (admin_email) DO UPDATE
                SET refresh_token = EXCLUDED.refresh_token, updated_at = NOW()
                """,
                (admin_email, refresh_token),
            )
            connection.commit()
def load_gmail_credentials(admin_email):
    with connect_to_database() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT refresh_token FROM gmail_tokens WHERE admin_email = %s",
                (admin_email,),
            )
            row = cursor.fetchone()
    if not row:
        return None
    return Credentials(
        None,
        refresh_token=row[0],
        token_uri="https://oauth2.googleapis.com/token",
        client_id=GOOGLE_CLIENT_ID,
        client_secret=GOOGLE_CLIENT_SECRET,
        scopes=GMAIL_SCOPES,
    )
def build_gmail_query(filter_text, search_in="all"):
    words = (filter_text or "").strip()
    if not words:
        return ""
    if search_in == "subject":
        return f"subject:({words})"
    if search_in == "from":
        return f"from:({words})"
    return words
@app.route("/api/gmail/status", methods=["GET"])
def gmail_status():
    admin_email = request.args.get("adminEmail", "")
    if not is_admin(admin_email):
        return jsonify({"error": "Only admin can access Gmail."}), 403
    connected = load_gmail_credentials(ADMIN_EMAIL) is not None
    return jsonify({"connected": connected}), 200
@app.route("/api/gmail/connect", methods=["GET"])
def gmail_connect():
    admin_email = request.args.get("adminEmail", "")
    if not is_admin(admin_email):
        return jsonify({"error": "Only admin can connect Gmail."}), 403
    if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
        return jsonify({"error": "Google OAuth is not configured on server."}), 500
    flow = get_gmail_flow()
    auth_url, _ = flow.authorization_url(
        access_type="offline",
        include_granted_scopes="true",
        prompt="consent",
    )
    return redirect(auth_url)
@app.route("/api/gmail/callback", methods=["GET"])
def gmail_callback():
    if not GOOGLE_CLIENT_ID:
        return jsonify({"error": "Google OAuth not configured."}), 500
    try:
        flow = get_gmail_flow()
        auth_response = GOOGLE_REDIRECT_URI + "?" + request.query_string.decode()
        flow.fetch_token(authorization_response=auth_response)
        credentials = flow.credentials
        if not credentials.refresh_token:
            return jsonify({"error": "No refresh token received. Try again."}), 400
        save_gmail_token(ADMIN_EMAIL, credentials.refresh_token)
        return redirect("/?view=admin-gmail&gmail=connected")
    except Exception as error:
        print(f"Gmail callback error: {error}")
        return jsonify({"error": str(error)}), 500
@app.route("/api/gmail/messages", methods=["GET"])
def gmail_messages():
    admin_email = request.args.get("adminEmail", "")
    filter_text = request.args.get("filter", "")
    search_in = request.args.get("searchIn", "all")
    if not is_admin(admin_email):
        return jsonify({"error": "Only admin can read Gmail."}), 403
    credentials = load_gmail_credentials(ADMIN_EMAIL)
    if not credentials:
        return jsonify({"error": "Gmail not connected. Click Connect Gmail first."}), 401
    try:
        service = build("gmail", "v1", credentials=credentials)
        query = build_gmail_query(filter_text, search_in)
        result = service.users().messages().list(
            userId="me", q=query, maxResults=20
        ).execute()
        messages = []
        for item in result.get("messages", []):
            msg = service.users().messages().get(
                userId="me",
                id=item["id"],
                format="metadata",
                metadataHeaders=["From", "Subject", "Date"],
            ).execute()
            headers = {
                h["name"]: h["value"]
                for h in msg.get("payload", {}).get("headers", [])
            }
            messages.append({
                "id": item["id"],
                "from": headers.get("From", ""),
                "subject": headers.get("Subject", ""),
                "date": headers.get("Date", ""),
                "snippet": msg.get("snippet", ""),
            })
        return jsonify(messages), 200
    except Exception as error:
        print(f"Gmail fetch error: {error}")
        return jsonify({"error": "Failed to fetch emails from Gmail."}), 500

handler = app
