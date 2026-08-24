from functools import wraps

from flask import request, jsonify

from models import Token


def token_required(f):
    """Reads 'Authorization: Token <key>' header, attaches the matching
    User to flask.g.current_user, or returns 401 if missing/invalid."""

    @wraps(f)
    def wrapper(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Token "):
            return jsonify({"detail": "Authentication credentials were not provided."}), 401

        key = auth_header.split("Token ", 1)[1].strip()
        token = Token.query.filter_by(key=key).first()
        if not token:
            return jsonify({"detail": "Invalid token."}), 401

        request.current_user = token.user
        return f(*args, **kwargs)

    return wrapper
