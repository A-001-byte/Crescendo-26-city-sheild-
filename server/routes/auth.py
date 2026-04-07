from datetime import datetime, timedelta, timezone

import jwt
from flask import Blueprint, jsonify, request
from werkzeug.security import check_password_hash, generate_password_hash

from config import config
from models.schemas import LoginRequest, SignupRequest
from models.user_store import create_user, get_user_by_email, get_user_by_identity

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


def _issue_token(user: dict) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user["id"],
        "email": user["email"],
        "username": user["username"],
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(minutes=config.JWT_EXP_MINUTES)).timestamp()),
    }
    return jwt.encode(payload, config.JWT_SECRET, algorithm=config.JWT_ALGORITHM)


@auth_bp.post("/signup")
def signup():
    body = request.get_json(silent=True) or {}
    try:
        payload = SignupRequest(**body)
    except Exception:
        return jsonify({"error": "Invalid request payload"}), 400

    full_name = payload.fullName.strip()
    email = payload.email.strip().lower()
    password = payload.password

    if not full_name or not email or not password:
        return jsonify({"error": "fullName, email, and password are required"}), 400

    if len(password) < 8:
        return jsonify({"error": "Password must be at least 8 characters"}), 400

    if get_user_by_email(email):
        return jsonify({"error": "User already exists"}), 409

    user = create_user(
        full_name=full_name,
        email=email,
        password_hash=generate_password_hash(password),
    )
    token = _issue_token(user)

    return jsonify(
        {
            "token": token,
            "user": {
                "id": user["id"],
                "full_name": user["full_name"],
                "email": user["email"],
                "username": user["username"],
            },
        }
    ), 201


@auth_bp.post("/login")
def login():
    body = request.get_json(silent=True) or {}
    try:
        payload = LoginRequest(**body)
    except Exception:
        return jsonify({"error": "Invalid request payload"}), 400

    identity = payload.identity.strip()
    password = payload.password

    if not identity or not password:
        return jsonify({"error": "identity and password are required"}), 400

    user = get_user_by_identity(identity)
    if not user or not check_password_hash(user.get("password_hash", ""), password):
        return jsonify({"error": "Invalid credentials"}), 401

    token = _issue_token(user)
    return jsonify(
        {
            "token": token,
            "user": {
                "id": user["id"],
                "full_name": user["full_name"],
                "email": user["email"],
                "username": user["username"],
            },
        }
    ), 200