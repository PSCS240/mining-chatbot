# -----------------------📦 Imports -----------------------
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from flask_mail import Mail, Message

from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv
import mysql.connector
import bcrypt
import os
import groq
import speech_recognition as sr
from gtts import gTTS
import random
import string

# ----------------------⚙️ Environment Setup ----------------------
load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
MAIL_USERNAME = os.getenv("MAIL_USERNAME")
MAIL_PASSWORD = os.getenv("MAIL_PASSWORD")
DB_PASSWORD = os.getenv("DB_PASSWORD")

if not GROQ_API_KEY:
    raise ValueError("🚨 Missing GROQ_API_KEY! Please set it in your .env file.")
if not MAIL_USERNAME or not MAIL_PASSWORD:
    raise ValueError("🚨 Missing MAIL credentials! Set MAIL_USERNAME and MAIL_PASSWORD.")
if not DB_PASSWORD:
    raise ValueError("🚨 Missing DB_PASSWORD! Set it in your .env file.")

# ----------------------🚀 Flask App Setup ----------------------
app = Flask(__name__)
CORS(app, 
     resources={r"/*": {"origins": "*"}},  # Allow all origins
     supports_credentials=False,  # Disable credentials
     allow_headers=["Content-Type"],
     methods=["GET", "POST", "OPTIONS"]
)

# ----------------------🛢️ MySQL Setup ----------------------
try:
    db = mysql.connector.connect(
        host="localhost",
        user="root",
        password=DB_PASSWORD,
        database="mining_chatbot"
    )
    cursor = db.cursor(dictionary=True)
except mysql.connector.Error as err:
    print("❌ Database connection error:", err)
    exit(1)

# ----------------------📧 Email Setup ----------------------
app.config.update({
    "MAIL_SERVER": "smtp.gmail.com",
    "MAIL_PORT": 587,
    "MAIL_USE_TLS": True,
    "MAIL_USERNAME": MAIL_USERNAME,
    "MAIL_PASSWORD": MAIL_PASSWORD,
    "MAIL_DEFAULT_SENDER": MAIL_USERNAME
})
mail = Mail(app)

# ----------------------🗂️ Utility ----------------------
TEMP_DIR = "temp_audio"
os.makedirs(TEMP_DIR, exist_ok=True)

def speech_to_text(audio_data):
    recognizer = sr.Recognizer()
    try:
        return recognizer.recognize_google(audio_data)
    except sr.UnknownValueError:
        return "Could not understand audio"
    except sr.RequestError:
        return "Could not request results"

def generate_otp():
    return ''.join(random.choices(string.digits, k=6))

# ----------------------🧠 LLM Chatbot ----------------------
@app.route("/chatbot", methods=["POST"])
def chatbot():
    print("Received request:", request.json)  # Debug log
    data = request.json
    question = data.get("question", "").strip()
    email = data.get("email", "").strip()

    if not question:
        return jsonify({"error": "Question is required"}), 400
    if not email:
        return jsonify({"error": "Email is required"}), 400

    try:
        client = groq.Client(api_key=GROQ_API_KEY)
        response = client.chat.completions.create(
            model="llama3-8b-8192",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a helpful chatbot that answers questions related to "
                        "mining industry laws, DGMS circulars, and regulations."
                    )
                },
                {"role": "user", "content": question}
            ]
        )
        answer = response.choices[0].message.content.strip()
        print("Sending response:", answer)  # Debug log
        return jsonify({"response": answer})

    except Exception as e:
        print(f"❌ Chatbot API Error: {str(e)}")
        return jsonify({"error": str(e)}), 500

# ----------------------🎤 Voice Input ----------------------
@app.route("/voice", methods=["POST"])
def voice():
    if "audio" not in request.files:
        return jsonify({"error": "No audio file provided"}), 400

    audio_file = request.files["audio"]
    if not audio_file:
        return jsonify({"error": "Empty audio file"}), 400

    try:
        file_path = os.path.join(TEMP_DIR, "temp_audio.wav")
        audio_file.save(file_path)
        transcript = "Dummy response for testing"  # To be replaced
        return jsonify({"response": transcript})
    except Exception as e:
        return jsonify({"error": f"Voice processing failed: {str(e)}"}), 500

# ----------------------🔐 Auth: Register, Login, Verify ----------------------
@app.route("/register", methods=["POST"])
def register():
    data = request.json
    company_name = data.get("company_name")
    email = data.get("email")
    country_code = data.get("country_code")
    phone_number = data.get("phone_number")
    address = data.get("address")
    password = data.get("password")

    # Combine country code and phone number
    full_phone_number = f"{country_code}{phone_number}" if country_code else phone_number

    if not all([company_name, email, phone_number, address, password]):
        return jsonify({"error": "All fields are required"}), 400

    cursor.execute("SELECT id FROM companies WHERE email = %s", (email,))
    if cursor.fetchone():
        return jsonify({"error": "Email already registered"}), 400

    password_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
    otp = generate_otp()
    otp_expiry = datetime.now().replace(microsecond=0) + timedelta(minutes=1)
    
    print(f"Debug - Registration - OTP: {otp}")
    print(f"Debug - Registration - Expiry time: {otp_expiry}")

    try:
        cursor.execute("""
            INSERT INTO companies (company_name, email, phone_number, address, 
                                 password_hash, verified, otp, otp_expiry)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """, (company_name, email, phone_number, address, password_hash, 
              False, otp, otp_expiry))
        db.commit()

        msg = Message(
            subject="OTP Verification - Mining Industry Chatbot",
            recipients=[email],
            html=f"""
                <p>Hi <b>{company_name}</b>,</p>
                <p>Your OTP for email verification is: <strong>{otp}</strong></p>
                <p>This OTP will expire in 1 minute.</p>
                <p>Best Regards,<br>Mining Chatbot Team</p>
            """
        )
        mail.send(msg)
        return jsonify({
            "success": True,
            "message": "Registration successful. Please verify your email.",
            "email": email
        }), 201

    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 400

@app.route("/verify-otp", methods=["POST"])
def verify_otp():
    data = request.json
    print("Received data:", data)  # Debug log
    
    email = data.get("email")
    otp = data.get("otp")

    print(f"Debug - Received request - Email: {email}, OTP: {otp}")

    if not email or not otp:
        print(f"Debug - Missing fields - Email: {email is None}, OTP: {otp is None}")  # Debug log
        return jsonify({"error": "Email and OTP are required", "success": False}), 400

    try:
        cursor.execute("""
            SELECT id, otp, otp_expiry
            FROM companies 
            WHERE email = %s AND otp = %s
        """, (email, otp))
        result = cursor.fetchone()

        if not result:
            return jsonify({"error": "Invalid OTP", "success": False}), 400

        print(f"Debug - Database values - OTP: {result['otp']}, Expiry: {result['otp_expiry']}")
        
        current_time = datetime.now().replace(microsecond=0)
        stored_expiry = datetime.strptime(str(result['otp_expiry']), '%Y-%m-%d %H:%M:%S')
        
        print(f"Debug - Time comparison - Current: {current_time}, Expiry: {stored_expiry}")

        if current_time > stored_expiry:
            return jsonify({"error": "OTP has expired", "success": False}), 400

        cursor.execute("""
            UPDATE companies 
            SET verified = TRUE, otp = '', otp_expiry = '' 
            WHERE id = %s
        """, (result["id"],))
        db.commit()

        return jsonify({
            "success": True,
            "message": "Email verified successfully! You can now login."
        }), 200

    except mysql.connector.Error as err:
        print(f"Database error: {err}")
        return jsonify({"error": str(err), "success": False}), 500
    except Exception as e:
        print(f"Unexpected error: {e}")
        return jsonify({"error": str(e), "success": False}), 500

@app.route("/verify-credentials", methods=["POST"])
def verify_credentials():
    data = request.json
    email = data.get("email")
    entered_password = data.get("password")
    entered_otp = data.get("otp")

    if not all([email, entered_password, entered_otp]):
        return jsonify({"error": "Email, password and OTP are required"}), 400

    try:
        # Use UNIX_TIMESTAMP for comparison
        cursor.execute("""
            SELECT id, password_hash, otp, UNIX_TIMESTAMP(otp_expiry) as otp_expiry_ts
            FROM companies 
            WHERE email = %s AND verified = FALSE
        """, (email,))
        result = cursor.fetchone()

        if not result:
            return jsonify({"error": "Invalid email or already verified"}), 400

        current_timestamp = int(datetime.now().timestamp())
        if current_timestamp > result["otp_expiry_ts"]:
            return jsonify({"error": "OTP has expired"}), 400

        if result["otp"] != entered_otp:
            return jsonify({"error": "Invalid OTP"}), 400

        if not bcrypt.checkpw(entered_password.encode(), result["password_hash"].encode()):
            return jsonify({"error": "Invalid password"}), 400

        cursor.execute("""
            UPDATE companies 
            SET verified = TRUE, otp = '', otp_expiry = '' 
            WHERE id = %s
        """, (result["id"],))
        db.commit()

        return jsonify({
            "success": True,
            "message": "Account verified successfully! You can now login."
        }), 200

    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 500

@app.route("/verify/<token>", methods=["GET"])
def verify_email(token):
    try:
        cursor.execute("SELECT id FROM companies WHERE verification_token = %s", (token,))
        result = cursor.fetchone()
        if result:
            cursor.execute("UPDATE companies SET verified = TRUE, verification_token = NULL WHERE id = %s", (result["id"],))
            db.commit()
            return jsonify({"message": "Email verified successfully!"}), 200
        else:
            return jsonify({"error": "Invalid or expired token!"}), 400
    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 500

@app.route("/login", methods=["POST"])
def login():
    data = request.json
    email, password = data.get("email"), data.get("password")

    if not email or not password:
        return jsonify({"error": "Email and password are required!"}), 400

    try:
        cursor.execute("SELECT company_name, password_hash FROM companies WHERE email = %s AND verified = TRUE", (email,))
        company = cursor.fetchone()
        if not company or not bcrypt.checkpw(password.encode(), company["password_hash"].encode()):
            return jsonify({"error": "Invalid email or password!"}), 401

        return jsonify({
            "success": True,
            "company_name": company["company_name"],
            "message": "Login successful"
        }), 200

    except Exception as e:
        return jsonify({"error": f"Internal server error: {str(e)}"}), 500

@app.route('/get-user', methods=['GET'])
def get_user():
    email = request.args.get('email')
    if not email:
        return jsonify({"error": "Email is required"}), 400

    try:
        cursor = mysql.connection.cursor(dictionary=True)
        cursor.execute("SELECT company_name FROM companies WHERE email = %s", (email,))
        result = cursor.fetchone()
        cursor.close()

        if result:
            return jsonify({"company_name": result['company_name']})
        else:
            return jsonify({"error": "User not found"}), 404

    except Exception as e:
        return jsonify({"error": f"Internal server error: {str(e)}"}), 500

# ----------------------📨 OTP Resend Endpoint ----------------------
@app.route("/resend-otp", methods=["POST"])
def resend_otp():
    """
    Endpoint to resend OTP for email verification
    Generates new OTP, updates database and sends email
    Returns:
        200: Success message if OTP sent
        400: If email is missing
        500: If any error occurs during process
    """
    # Get email from request
    data = request.json
    email = data.get("email")

    # Validate email
    if not email:
        return jsonify({"error": "Email is required"}), 400

    try:
        # Generate new OTP and set expiry
        otp = generate_otp()
        otp_expiry = datetime.now().replace(microsecond=0) + timedelta(minutes=1)

        # Update database with new OTP
        cursor.execute("""
            UPDATE companies 
            SET otp = %s, otp_expiry = %s 
            WHERE email = %s
        """, (otp, otp_expiry, email))
        db.commit()

        # Send OTP email
        msg = Message(
            subject="New OTP Verification - Mining Industry Chatbot",
            recipients=[email],
            html=f"""
                <p>Your new OTP for email verification is: <strong>{otp}</strong></p>
                <p>This OTP will expire in 1 minute.</p>
                <p>Best Regards,<br>Mining Chatbot Team</p>
            """
        )
        mail.send(msg)

        return jsonify({
            "success": True,
            "message": "New OTP sent successfully"
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ----------------------🚀 Main Application ----------------------
if __name__ == "__main__":
    """
    Main entry point of the application
    Runs the Flask server in production mode (debug=False)
    """
    app.run(debug=False)
