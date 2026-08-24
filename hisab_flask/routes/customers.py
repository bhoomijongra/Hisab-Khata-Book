import re

from flask import Blueprint, request, jsonify, current_app

from extensions import db
from models import Customer
from auth_utils import token_required
from email_utils import send_email

customers_bp = Blueprint("customers", __name__)

PHONE_RE = re.compile(r"^\d{10}$")
EMAIL_RE = re.compile(r"^\S+@\S+\.\S+$")


def validate_customer_fields(data, partial=False):
    errors = {}
    if "name" in data or not partial:
        name = (data.get("name") or "").strip()
        if len(name) < 2:
            errors["name"] = ["Name must be at least 2 characters."]

    if "phone_number" in data or not partial:
        phone = (data.get("phone_number") or "").strip()
        if not PHONE_RE.match(phone):
            errors["phone_number"] = ["Phone number must be exactly 10 digits."]

    email = data.get("email")
    if email:
        if not EMAIL_RE.match(email):
            errors["email"] = ["Enter a valid email address."]

    return errors


@customers_bp.route("/customers/", methods=["GET", "POST"])
@token_required
def customer_list():
    if request.method == "GET":
        customers = Customer.query.filter_by(merchant_id=request.current_user.id).all()
        return jsonify([c.to_dict() for c in customers])

    data = request.get_json(silent=True) or {}
    errors = validate_customer_fields(data)
    if errors:
        return jsonify(errors), 400

    customer = Customer(
        merchant_id=request.current_user.id,
        name=data["name"].strip(),
        phone_number=data["phone_number"].strip(),
        email=(data.get("email") or "").strip() or None,
    )
    db.session.add(customer)
    db.session.commit()
    return jsonify(customer.to_dict()), 201


def get_owned_customer(customer_id):
    return Customer.query.filter_by(
        id=customer_id, merchant_id=request.current_user.id
    ).first()


@customers_bp.route("/customers/<int:customer_id>/", methods=["GET", "PATCH", "DELETE"])
@token_required
def customer_detail(customer_id):
    customer = get_owned_customer(customer_id)
    if not customer:
        return jsonify({"detail": "Not found."}), 404

    if request.method == "GET":
        return jsonify(customer.to_dict())

    if request.method == "PATCH":
        data = request.get_json(silent=True) or {}
        errors = validate_customer_fields(data, partial=True)
        if errors:
            return jsonify(errors), 400

        if "name" in data:
            customer.name = data["name"].strip()
        if "phone_number" in data:
            customer.phone_number = data["phone_number"].strip()
        if "email" in data:
            customer.email = (data.get("email") or "").strip() or None

        db.session.commit()
        return jsonify(customer.to_dict())

    db.session.delete(customer)
    db.session.commit()
    return "", 204


@customers_bp.route("/customers/<int:customer_id>/send-reminder/", methods=["POST"])
@token_required
def send_reminder(customer_id):
    customer = get_owned_customer(customer_id)
    if not customer:
        return jsonify({"error": "Customer not found"}), 404

    if not customer.email:
        return jsonify({"error": "This customer has no email on file"}), 400

    balance = customer.get_balance()
    if balance <= 0:
        return jsonify({"error": "This customer has no pending dues"}), 400

    body = (
        f"Hi {customer.name},\n\n"
        f"This is a friendly reminder that you have an outstanding balance "
        f"of \u20b9{balance} at our store. Please clear it at your earliest convenience.\n\n"
        f"Thank you!"
    )

    try:
        send_email("Payment Reminder - Hisab", body, customer.email)
    except Exception as exc:
        current_app.logger.error("Failed to send reminder: %s", exc)
        return jsonify({"error": "Failed to send email. Please try again."}), 500

    return jsonify({"message": f"Reminder sent to {customer.email}"})
