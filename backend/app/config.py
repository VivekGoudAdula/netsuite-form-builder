from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    MONGO_URI: str = "mongodb://localhost:27017"
    DB_NAME: str = "netsuite_form_builder"
    JWT_SECRET: str = "supersecretkey"
    JWT_EXPIRE_MINUTES: int = 60
    
    # Fixed Admin
    ADMIN_EMAIL: str = "Admin@Netsuiteform.com"
    ADMIN_PASSWORD: str = "Admin@123"

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
