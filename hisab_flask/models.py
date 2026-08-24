import secrets
from datetime import datetime, timezone
from decimal import Decimal

from werkzeug.security import generate_password_hash, check_password_hash

from extensions import db


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(150), unique=True, nullable=False)
    email = db.Column(db.String(254), nullable=True)
    password_hash = db.Column(db.String(255), nullable=False)

    customers = db.relationship(
        "Customer", backref="merchant", lazy=True, cascade="all, delete-orphan"
    )

    def set_password(self, raw_password):
        self.password_hash = generate_password_hash(raw_password)

    def check_password(self, raw_password):
        return check_password_hash(self.password_hash, raw_password)


class Token(db.Model):
    """Mirrors Django REST Framework's authtoken model: one permanent
    random token per user, sent as 'Authorization: Token <key>'."""

    __tablename__ = "tokens"

    id = db.Column(db.Integer, primary_key=True)
    key = db.Column(db.String(64), unique=True, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), unique=True, nullable=False)

    user = db.relationship("User", backref=db.backref("token", uselist=False))

    @staticmethod
    def generate_key():
        return secrets.token_hex(20)

    @classmethod
    def get_or_create(cls, user):
        existing = cls.query.filter_by(user_id=user.id).first()
        if existing:
            return existing
        token = cls(key=cls.generate_key(), user_id=user.id)
        db.session.add(token)
        db.session.commit()
        return token


class Customer(db.Model):
    __tablename__ = "customers"

    id = db.Column(db.Integer, primary_key=True)
    merchant_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    phone_number = db.Column(db.String(10), nullable=False)
    email = db.Column(db.String(254), nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    transactions = db.relationship(
        "Transaction", backref="customer", lazy=True, cascade="all, delete-orphan"
    )

    def get_balance(self):
        credit_total = sum(
            (t.amount for t in self.transactions if t.transaction_type == "credit"),
            Decimal("0"),
        )
        payment_total = sum(
            (t.amount for t in self.transactions if t.transaction_type == "payment"),
            Decimal("0"),
        )
        return credit_total - payment_total

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "phone_number": self.phone_number,
            "email": self.email,
            "balance": float(self.get_balance()),
            "transactions": [
                t.to_dict()
                for t in sorted(self.transactions, key=lambda t: t.date)
            ],
        }


class Transaction(db.Model):
    __tablename__ = "transactions"

    id = db.Column(db.Integer, primary_key=True)
    customer_id = db.Column(db.Integer, db.ForeignKey("customers.id"), nullable=False)
    transaction_type = db.Column(db.String(10), nullable=False)  # 'credit' | 'payment'
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    note = db.Column(db.String(200), nullable=True)
    date = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            "id": self.id,
            "customer": self.customer_id,
            "transaction_type": self.transaction_type,
            "amount": str(self.amount),
            "note": self.note,
            "date": self.date.isoformat() + "Z",
        }
