import re

from flask import Blueprint, request, jsonify

from extensions import db
from models import User, Token

auth_bp = Blueprint("auth", __name__)

EMAIL_RE = re.compile(r"^\S+@\S+\.\S+$")


@auth_bp.route("/register/", methods=["POST"])
def register():
    data = request.get_json(silent=True) or {}
    username = (data.get("username") or "").strip()
    email = (data.get("email") or "").strip()
    password = data.get("password") or ""

    errors = {}
    if len(username) < 3:
        errors["username"] = ["Username must be at least 3 characters."]
    elif User.query.filter_by(username=username).first():
        errors["username"] = ["A user with that username already exists."]

    if not EMAIL_RE.match(email):
        errors["email"] = ["Enter a valid email address."]

    if len(password) < 8:
        errors["password"] = ["Password must be at least 8 characters."]

    if errors:
        return jsonify(errors), 400

    user = User(username=username, email=email)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    token = Token.get_or_create(user)
    return jsonify({"token": token.key, "username": user.username})


@auth_bp.route("/login/", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    username = data.get("username") or ""
    password = data.get("password") or ""

    user = User.query.filter_by(username=username).first()
    if user and user.check_password(password):
        token = Token.get_or_create(user)
        return jsonify({"token": token.key, "username": user.username})

    return jsonify({"error": "Invalid credentials"}), 400
