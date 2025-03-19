from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from flask_mail import Mail, Message
import mysql.connector
import bcrypt
import secrets
import os
from dotenv import load_dotenv
import speech_recognition as sr
from gtts import gTTS
import uuid
# from .env import BASE_URL
import groq

# Load environment variables
load_dotenv()

# Environment Variables Check
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
MAIL_USERNAME = os.getenv("MAIL_USERNAME")
MAIL_PASSWORD = os.getenv("MAIL_PASSWORD")
DB_PASSWORD = os.getenv("DB_PASSWORD")
BASE_URL = os.getenv("BASE_URL", "https://your-production-domain.com")

if not GROQ_API_KEY:
    raise ValueError("🚨 Missing GROQ_API_KEY! Please set it in your .env file.")
if not MAIL_USERNAME or not MAIL_PASSWORD:
    raise ValueError("🚨 Missing MAIL credentials! Set MAIL_USERNAME and MAIL_PASSWORD.")
if not DB_PASSWORD:
    raise ValueError("🚨 Missing DB_PASSWORD! Set it in your .env file.")

# Flask App Setup
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True, allow_headers=["Content-Type"])

# MySQL Connection
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

# SMTP Configuration for Email
app.config.update({
    "MAIL_SERVER": "smtp.gmail.com",
    "MAIL_PORT": 587,
    "MAIL_USE_TLS": True,
    "MAIL_USERNAME": MAIL_USERNAME,
    "MAIL_PASSWORD": MAIL_PASSWORD,
    "MAIL_DEFAULT_SENDER": MAIL_USERNAME
})
mail = Mail(app)

# Directory for audio files
TEMP_DIR = "temp_audio"
os.makedirs(TEMP_DIR, exist_ok=True)

# 🎤 Convert Speech to Text
def speech_to_text(audio_data):
    recognizer = sr.Recognizer()
    try:
        return recognizer.recognize_google(audio_data)
    except sr.UnknownValueError:
        return "Could not understand audio"
    except sr.RequestError:
        return "Could not request results"

@app.route("/ask", methods=["POST"])
def ask():
    data = request.get_json()
    question = data.get("question", "")

    if not question:
        return jsonify({"error": "No question provided"}), 400

    try:
        client = groq.Client(api_key=GROQ_API_KEY)
        response = client.chat.completions.create(
            model="llama3-8b-8192",
            messages=[
                {"role": "system", "content": "You are a helpful assistant for mining laws."},
                {"role": "user", "content": question}
            ]
        )
        return jsonify({"response": response.choices[0].message.content})

    except Exception as e:
        return jsonify({"error": f"Chatbot error: {str(e)}"}), 500


# 🔊 Convert Text to Speech
def text_to_speech(text):
    try:
        filename = os.path.join(TEMP_DIR, f"response_{uuid.uuid4()}.mp3")
        tts = gTTS(text=text, lang='en')
        tts.save(filename)
        return filename
    except Exception as e:
        print(f"Error in text_to_speech: {e}")
        return None

# 🎤 Voice Input Handling (Now with LLaMA integration)
@app.route("/voice", methods=["POST"])
def voice():
    if "audio" not in request.files:
        return jsonify({"error": "No audio file provided"}), 400

    audio_file = request.files["audio"]
    
    if not audio_file:
        return jsonify({"error": "Empty audio file"}), 400

    try:
        # Process audio here (example: save or transcribe)
        file_path = "temp_audio.wav"
        audio_file.save(file_path)

        # Example: Speech-to-text (if using OpenAI Whisper, etc.)
        transcript = "Dummy response for testing"  # Replace with actual processing

        return jsonify({"response": transcript})

    except Exception as e:
        return jsonify({"error": f"Voice processing failed: {str(e)}"}), 500


# 🤖 Chatbot API
@app.route("/chatbot", methods=["POST"])
def chatbot():
    data = request.json
    question = data.get("question")

    if not question:
        return jsonify({"error": "Question is required"}), 400

    try:
        client = groq.Client(api_key=GROQ_API_KEY)
        response = client.chat.completions.create(
            model="llama3-8b-8192",
            messages=[
                {"role": "system", "content": "You are a helpful chatbot."},
                {"role": "user", "content": question}
            ]
        )
        return jsonify({"response": response.choices[0].message.content}), 200

    except Exception as e:
        return jsonify({"error": f"Chatbot error: {str(e)}"}), 500

# 🏢 Register Company
@app.route("/register", methods=["POST"])
def register():
    data = request.json
    company_name = data.get("company_name")
    email = data.get("email")
    phone_number = data.get("phone_number")
    address = data.get("address")
    password = data.get("password")

    if not all([company_name, email, phone_number, address, password]):
        return jsonify({"error": "All fields are required"}), 400

    cursor.execute("SELECT id FROM companies WHERE email = %s", (email,))
    if cursor.fetchone():
        return jsonify({"error": "Email already registered"}), 400

    password_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

    try:
        cursor.execute("""
            INSERT INTO companies (company_name, email, phone_number, address, password_hash, verified)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (company_name, email, phone_number, address, password_hash, True))
        db.commit()

        # ✅ Send a welcome email
        msg = Message(
            subject="Welcome to Mining Industry Chatbot",
            recipients=[email],
            html=f"""
                <p>Hi <b>{company_name}</b>,</p>
                <p>Welcome to the Mining Industry Chatbot! You can now start using the chatbot to get answers about mining laws and regulations.</p>
                <p>We’re here to help you 24/7!</p>
                <p>Best Regards,<br>Mining Chatbot Team</p>
            """
        )
        mail.send(msg)

        print(f"✅ Welcome email sent to: {email}")

        return jsonify({"message": "Registration successful! Check your email for a welcome message."}), 201

    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 400

# ✅ Verify Email
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

# 🔐 Login
@app.route("/login", methods=["POST"])
def login():
    data = request.json
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"error": "Email and password are required!"}), 400

    try:
        # ✅ Fetch company name and password hash from the database
        cursor.execute("SELECT company_name, password_hash FROM companies WHERE email = %s AND verified = TRUE", (email,))
        company = cursor.fetchone()

        if not company or not bcrypt.checkpw(password.encode(), company["password_hash"].encode()):
            return jsonify({"error": "Invalid email or password!"}), 401

        # ✅ Return company_name on successful login
        return jsonify({
            "success": True,
            "company_name": company["company_name"],
            "message": "Login successful"
        }), 200

    except Exception as e:
        return jsonify({"error": f"Internal server error: {str(e)}"}), 500

    
@app.route("/get-user", methods=["GET"])
def get_user():
    email = request.args.get("email")

    if not email:
        return jsonify({"error": "Email is required"}), 400

    try:
        cursor.execute("SELECT company_name FROM companies WHERE email = %s", (email,))
        user = cursor.fetchone()

        if user:
            print("✅ User fetched:", user)  # Debug log
            return jsonify({"user_name": user["company_name"]}), 200
        else:
            return jsonify({"error": "User not found"}), 404

    except mysql.connector.Error as err:
        return jsonify({"error": f"Database error: {str(err)}"}), 500


# Run the Flask App
if __name__ == "__main__":
    app.run(debug=False)  # 🔒 Set `debug=False` in production
