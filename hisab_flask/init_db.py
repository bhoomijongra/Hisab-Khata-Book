"""Run this once to create all database tables.

    python init_db.py

Equivalent to Django's `python manage.py migrate` for this project's needs.
"""

from app import create_app
from extensions import db

app = create_app()

with app.app_context():
    db.create_all()
    print("All tables created successfully.")
