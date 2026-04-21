from pydantic_settings import BaseSettings
from typing import Optional
from pathlib import Path

class Settings(BaseSettings):
    MONGO_URI: str = "mongodb://localhost:27017"
    DB_NAME: str = "netsuite_form_builder"
    JWT_SECRET: str = "supersecretkey"
    JWT_EXPIRE_MINUTES: int = 60

    class Config:
        env_file = str(Path(__file__).parent.parent.parent / ".env")
        extra = "ignore"

settings = Settings()
