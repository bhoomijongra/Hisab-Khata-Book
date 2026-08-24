import smtplib
from email.mime.text import MIMEText

from flask import current_app


def send_email(subject, body, to_email):
    """Sends a plain-text email via the configured SMTP server (Brevo).
    Raises an exception on failure -- callers should catch it."""

    msg = MIMEText(body)
    msg["Subject"] = subject
    msg["From"] = current_app.config["DEFAULT_FROM_EMAIL"]
    msg["To"] = to_email

    with smtplib.SMTP(current_app.config["EMAIL_HOST"], current_app.config["EMAIL_PORT"]) as server:
        server.starttls()
        server.login(
            current_app.config["EMAIL_HOST_USER"],
            current_app.config["EMAIL_HOST_PASSWORD"],
        )
        server.sendmail(
            current_app.config["DEFAULT_FROM_EMAIL"], [to_email], msg.as_string()
        )
