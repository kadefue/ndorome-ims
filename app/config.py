# app/config.py
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Application
    APP_NAME: str = "Supa Kariakoo Spare Parts Centre"
    APP_VERSION: str = "2.0.0"
    DEBUG: bool = True

    # Database
    DATABASE_URL: str = "sqlite:///./ndorome_ims.db"
    DATABASE_SQLITE: bool = True  # Set to False for PostgreSQL

    # JWT
    SECRET_KEY: str = "supa-kariakoo-spare-parts-super-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480  # 8 hours

    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:3000", "http://localhost:5174"]

    class Config:
        env_file = ".env"
        
        case_sensitive = True


settings = Settings()
