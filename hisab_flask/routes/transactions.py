from decimal import Decimal, InvalidOperation

from flask import Blueprint, request, jsonify

from extensions import db
from models import Transaction, Customer
from auth_utils import token_required

transactions_bp = Blueprint("transactions", __name__)


@transactions_bp.route("/transactions/", methods=["POST"])
@token_required
def create_transaction():
    data = request.get_json(silent=True) or {}
    errors = {}

    customer_id = data.get("customer")
    customer = None
    if not customer_id:
        errors["customer"] = ["This field is required."]
    else:
        customer = Customer.query.filter_by(
            id=customer_id, merchant_id=request.current_user.id
        ).first()
        if not customer:
            errors["customer"] = ["Invalid customer."]

    transaction_type = data.get("transaction_type")
    if transaction_type not in ("credit", "payment"):
        errors["transaction_type"] = ["Must be 'credit' or 'payment'."]

    amount = None
    try:
        amount = Decimal(str(data.get("amount")))
        if amount <= 0:
            errors["amount"] = ["Amount must be greater than 0."]
    except (InvalidOperation, TypeError):
        errors["amount"] = ["Enter a valid amount."]

    if errors:
        return jsonify(errors), 400

    transaction = Transaction(
        customer_id=customer.id,
        transaction_type=transaction_type,
        amount=amount,
        note=(data.get("note") or "").strip() or None,
    )
    db.session.add(transaction)
    db.session.commit()
    return jsonify(transaction.to_dict()), 201


@transactions_bp.route("/transactions/<int:transaction_id>/", methods=["DELETE"])
@token_required
def delete_transaction(transaction_id):
    transaction = (
        Transaction.query.join(Customer)
        .filter(
            Transaction.id == transaction_id,
            Customer.merchant_id == request.current_user.id,
        )
        .first()
    )
    if not transaction:
        return jsonify({"detail": "Not found."}), 404

    db.session.delete(transaction)
    db.session.commit()
    return "", 204
