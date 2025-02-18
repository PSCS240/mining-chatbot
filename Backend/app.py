from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_mail import Mail, Message
import mysql.connector
import bcrypt
import secrets
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# ✅ SMTP Configuration
app.config["MAIL_SERVER"] = "smtp.gmail.com"
app.config["MAIL_PORT"] = 587
app.config["MAIL_USE_TLS"] = True
app.config["MAIL_USERNAME"] = os.getenv("MAIL_USERNAME")
app.config["MAIL_PASSWORD"] = os.getenv("MAIL_PASSWORD")
app.config["MAIL_DEFAULT_SENDER"] = os.getenv("MAIL_USERNAME")

mail = Mail(app)

# ✅ MySQL Connection with Error Handling
try:
    db = mysql.connector.connect(
        host="localhost",
        user="root",
        password=os.getenv("DB_PASSWORD"),
        database="mining_chatbot"
    )
    cursor = db.cursor(dictionary=True)
except mysql.connector.Error as err:
    print("❌ Database connection error:", err)
    exit(1)

# ✅ Route: Register Company (Fixing Token and Email Sending)
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

    # Check if email already exists
    cursor.execute("SELECT id FROM companies WHERE email = %s", (email,))
    if cursor.fetchone():
        return jsonify({"error": "Email already registered"}), 400

    # Hash password
    password_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

    # Generate verification token
    verification_token = secrets.token_hex(16)
    print(f"✅ Generated Token for {email}: {verification_token}")  # Debugging

    try:
        # Insert into database
        cursor.execute("""
            INSERT INTO companies (company_name, email, phone_number, address, password_hash, verification_token, verified)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (company_name, email, phone_number, address, password_hash, verification_token, False))
        db.commit()

        # ✅ Generate verification link dynamically
        verification_link = f"{request.host_url}verify/{verification_token}"
        print(f"📩 Sending verification email: {verification_link}")  # Debugging

        # ✅ Send Verification Email with HTML Formatting
        try:
            msg = Message(
                subject="Verify Your Account",
                recipients=[email],
                html=f"""
                    <h3>Welcome to Mining Chatbot</h3>
                    <p>Click the link below to verify your account:</p>
                    <p><a href="{verification_link}" style="color:blue; font-size:16px; font-weight:bold;">Verify Email</a></p>
                    <br>
                    <p>If you can't click the link, copy and paste this URL into your browser:</p>
                    <p style="font-weight:bold;">{verification_link}</p>
                """,
                body=f"Click the link to verify your account: {verification_link}"
            )
            mail.send(msg)
            print("✅ Verification email sent successfully!")

        except Exception as e:
            print(f"❌ Error sending email: {e}")
            return jsonify({"error": "Failed to send verification email"}), 500

        return jsonify({"message": "Registration successful! Check your email for verification."}), 201

    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 400

# ✅ Route: Verify Email (Fixing Token Issue)
@app.route("/verify/<token>", methods=["GET"])
def verify_email(token):
    try:
        # Check if the token exists
        cursor.execute("SELECT id FROM companies WHERE verification_token = %s", (token,))
        result = cursor.fetchone()

        if result:
            # ✅ Fix: Only set token to NULL after successful verification
            cursor.execute("UPDATE companies SET verified = TRUE, verification_token = NULL WHERE id = %s", (result["id"],))
            db.commit()
            return jsonify({"message": "Email verified successfully!"}), 200
        else:
            return jsonify({"error": "Invalid or expired token!"}), 400

    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 500

# ✅ Route: Login (Fixed Condition)
@app.route("/login", methods=["POST"])
def login():
    data = request.json

    # Ensure email and password are provided
    if not data or "email" not in data or "password" not in data:
        return jsonify({"error": "Email and password are required!"}), 400

    email = data["email"]
    password = data["password"]

    try:
        cursor = db.cursor()

        # Fetch user by email
        cursor.execute("SELECT password_hash FROM companies WHERE email = %s AND verified = TRUE", (email,))
        company = cursor.fetchone()
        cursor.close()

        # If no company found or not verified
        if not company:
            return jsonify({"error": "Account not found or not verified!"}), 404

        stored_hashed_password = company[0]  # Use index 0 because only 'password_hash' is selected

        # Compare entered password with stored hashed password
        if bcrypt.checkpw(password.encode(), stored_hashed_password.encode()):
            return jsonify({"success": True, "message": "Login successful"}), 200
        else:
            return jsonify({"error": "Invalid email or password!"}), 401

    except Exception as e:
        return jsonify({"error": f"Internal server error: {str(e)}"}), 500


if __name__ == "__main__":
    app.run(debug=True)