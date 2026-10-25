
import os
from dotenv import load_dotenv
from sqlalchemy.engine import make_url

load_dotenv()


class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-key-change-me")

    DATABASE_URL = (os.environ.get("DATABASE_URL") or "").strip()

    # Use DATABASE_URL on Render or another production host.
    if DATABASE_URL:
        if DATABASE_URL.startswith("mysql://"):
            DATABASE_URL = DATABASE_URL.replace(
                "mysql://", "mysql+pymysql://", 1
            )
        SQLALCHEMY_DATABASE_URI = DATABASE_URL

    else:
        # Local development fallback.
        if os.environ.get("RENDER") or os.environ.get("RAILWAY_ENVIRONMENT"):
            raise RuntimeError(
                "DATABASE_URL is missing. Configure it in your hosting "
                "service's environment variables."
            )

        DB_USER = os.environ.get("DB_USER", "root")
        DB_PASSWORD = os.environ.get("DB_PASSWORD", "")
        DB_HOST = os.environ.get("DB_HOST", "localhost")
        DB_PORT = os.environ.get("DB_PORT", "3306")
        DB_NAME = os.environ.get("DB_NAME", "hisab_db")

        # Safely construct the URL, even if the password has special characters.
        SQLALCHEMY_DATABASE_URI = str(
            make_url("mysql+pymysql://root@localhost/hisab_db").set(
                username=DB_USER,
                password=DB_PASSWORD,
                host=DB_HOST,
                port=int(DB_PORT),
                database=DB_NAME,
            )
        )

    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Email settings
    EMAIL_HOST = os.environ.get("EMAIL_HOST", "smtp-relay.brevo.com")
    EMAIL_PORT = int(os.environ.get("EMAIL_PORT", 587))
    EMAIL_HOST_USER = os.environ.get("EMAIL_HOST_USER")
    EMAIL_HOST_PASSWORD = os.environ.get("EMAIL_HOST_PASSWORD")
    DEFAULT_FROM_EMAIL = os.environ.get("DEFAULT_FROM_EMAIL")

    CORS_ORIGINS = [
        origin.strip()
        for origin in os.environ.get(
            "CORS_ORIGINS", "http://localhost:5173"
        ).split(",")
        if origin.strip()
    ]
 