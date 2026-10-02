from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    """
    Application configuration settings loaded from environment variables or .env file.
    """
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/cloudpilot_db"
    DEBUG: bool = True
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173"

    # JWT Authentication Settings
    JWT_SECRET_KEY: str = "replace_with_a_secure_jwt_secret_key"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 60

    @property
    def cors_origins(self) -> list[str]:
        """
        Parses comma-separated ALLOWED_ORIGINS string into a list for FastAPI CORS middleware.
        """
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"

# Singleton instance of settings to be imported across the app
settings = Settings()
