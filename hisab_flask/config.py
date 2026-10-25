
import os
from dotenv import load_dotenv
from sqlalchemy.engine import make_url

load_dotenv()


class Config:
    SECRET_KEY = os.environ.get(
        "SECRET_KEY", "dev-secret-key-change-me"
    )

    DATABASE_URL = (
        os.environ.get("DATABASE_URL") or ""
    ).strip()

    # Production database: TiDB Cloud
    if DATABASE_URL:
        try:
            # Convert mysql:// to the SQLAlchemy PyMySQL driver.
            if DATABASE_URL.startswith("mysql://"):
                DATABASE_URL = DATABASE_URL.replace(
                    "mysql://", "mysql+pymysql://", 1
                )

            # Validate the URL without printing credentials.
            parsed_url = make_url(DATABASE_URL)

            print("DATABASE_URL configured: True")
            print("Database driver:", parsed_url.drivername)
            print("Database host:", parsed_url.host)
            print("Database name:", parsed_url.database)

            if parsed_url.drivername != "mysql+pymysql":
                raise ValueError(
                    "DATABASE_URL must use mysql+pymysql."
                )

            if not parsed_url.host or not parsed_url.database:
                raise ValueError(
                    "DATABASE_URL must include a host and database name."
                )

            SQLALCHEMY_DATABASE_URI = DATABASE_URL

        except Exception as e:
            print(
                "DATABASE_URL configuration error:",
                type(e).__name__,
                str(e) if isinstance(e, ValueError) else "",
            )
            raise

    else:
        # Local development only. Never fall back to localhost on Render.
        if (
            os.environ.get("RENDER")
            or os.environ.get("RAILWAY_ENVIRONMENT")
        ):
            raise RuntimeError(
                "DATABASE_URL is missing. Add your TiDB Cloud "
                "connection URL in Render Environment settings."
            )

        DB_USER = os.environ.get("DB_USER", "root")
        DB_PASSWORD = os.environ.get("DB_PASSWORD", "")
        DB_HOST = os.environ.get("DB_HOST", "localhost")
        DB_PORT = int(os.environ.get("DB_PORT", "3306"))
        DB_NAME = os.environ.get("DB_NAME", "hisab_db")

        local_url = make_url(
            "mysql+pymysql://root@localhost/hisab_db"
        ).set(
            username=DB_USER,
            password=DB_PASSWORD,
            host=DB_HOST,
            port=DB_PORT,
            database=DB_NAME,
        )

        SQLALCHEMY_DATABASE_URI = local_url.render_as_string(
            hide_password=False
        )

        print("Using local MySQL configuration.")

    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Email settings
    EMAIL_HOST = os.environ.get(
        "EMAIL_HOST", "smtp-relay.brevo.com"
    )
    EMAIL_PORT = int(os.environ.get("EMAIL_PORT", "587"))
    EMAIL_HOST_USER = os.environ.get("EMAIL_HOST_USER")
    EMAIL_HOST_PASSWORD = os.environ.get("EMAIL_HOST_PASSWORD")
    DEFAULT_FROM_EMAIL = os.environ.get("DEFAULT_FROM_EMAIL")

    # Frontend CORS origins
    CORS_ORIGINS = [
        origin.strip()
        for origin in os.environ.get(
            "CORS_ORIGINS", "http://localhost:5173"
        ).split(",")
        if origin.strip()
    ]
