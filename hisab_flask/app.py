from flask import Flask, jsonify
from flask_cors import CORS

from config import Config
from extensions import db
from routes.auth import auth_bp
from routes.customers import customers_bp
from routes.transactions import transactions_bp


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)
    CORS(app, origins=Config.CORS_ORIGINS, supports_credentials=True)

    app.register_blueprint(auth_bp, url_prefix="/api")
    app.register_blueprint(customers_bp, url_prefix="/api")
    app.register_blueprint(transactions_bp, url_prefix="/api")

    @app.route("/")
    def index():
        return jsonify({"status": "Hisab Flask API is running"})

    return app


app = create_app()

if __name__ == "__main__":
    app.run(debug=True, port=8000)
