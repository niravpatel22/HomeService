import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    APP_NAME: str = os.getenv("APP_NAME", "HomeServe Technologies SaaS API")
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    DEBUG: bool = os.getenv("DEBUG", "False").lower() == "true"
    API_V1_PREFIX: str = os.getenv("API_V1_PREFIX", "/api/v1")

    # Supports MySQL (mysql+pymysql://...) and SQLite fallback for local daemon-less verification
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "sqlite:///./homeserve.db",
    )

    JWT_SECRET_KEY: str = os.getenv(
        "JWT_SECRET_KEY",
        "homeserve-super-secret-jwt-signing-key-2026-production-grade-64chars",
    )
    JWT_REFRESH_SECRET_KEY: str = os.getenv(
        "JWT_REFRESH_SECRET_KEY",
        "homeserve-super-secret-refresh-signing-key-2026-production-64chars",
    )
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
    REFRESH_TOKEN_EXPIRE_DAYS: int = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))

    ALLOWED_ORIGINS: list[str] = [
        origin.strip()
        for origin in os.getenv(
            "ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
        ).split(",")
        if origin.strip()
    ]

    DEFAULT_PLATFORM_COMMISSION_PERCENT: float = float(
        os.getenv("DEFAULT_PLATFORM_COMMISSION_PERCENT", "15.0")
    )
    DEFAULT_TAX_PERCENT: float = float(os.getenv("DEFAULT_TAX_PERCENT", "18.0"))

    RAZORPAY_KEY_ID: str = os.getenv("RAZORPAY_KEY_ID", "rzp_test_homeserve_key_id")
    RAZORPAY_KEY_SECRET: str = os.getenv("RAZORPAY_KEY_SECRET", "rzp_test_homeserve_secret")
    RAZORPAY_WEBHOOK_SECRET: str = os.getenv(
        "RAZORPAY_WEBHOOK_SECRET", "rzp_test_homeserve_webhook_secret"
    )

    STORAGE_PROVIDER: str = os.getenv("STORAGE_PROVIDER", "local")
    MAX_UPLOAD_SIZE_MB: int = int(os.getenv("MAX_UPLOAD_SIZE_MB", "5"))


settings = Settings()

