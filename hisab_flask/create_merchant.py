"""Interactive script to create a merchant account from the command line.

    python create_merchant.py
"""

from app import create_app
from extensions import db
from models import User

app = create_app()

with app.app_context():
    username = input("Username: ").strip()
    email = input("Email: ").strip()
    password = input("Password (min 8 characters): ").strip()

    if User.query.filter_by(username=username).first():
        print("That username already exists.")
    elif len(password) < 8:
        print("Password must be at least 8 characters.")
    else:
        user = User(username=username, email=email)
        user.set_password(password)
        db.session.add(user)
        db.session.commit()
        print(f"Merchant '{username}' created successfully.")
