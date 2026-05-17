from pydantic_settings import BaseSettings
from pathlib import Path

class Settings(BaseSettings):
    MONGO_URI: str = "mongodb://localhost:27017"
    DB_NAME: str = "netsuite_form_builder"
    JWT_SECRET: str = "supersecretkey"
    JWT_EXPIRE_MINUTES: int = 60

    NETSUITE_BASE_URL: str = "https://6738288-sb1.restlets.api.netsuite.com"
    NETSUITE_GET_SCRIPT: str = "customscript_rg_get_rest_pai"
    NETSUITE_POST_SCRIPT: str = "customscript_rg_post_rest_pai"
    NETSUITE_DEPLOY: str = "1"

    NETSUITE_CONSUMER_KEY: str = ""
    NETSUITE_CONSUMER_SECRET: str = ""
    NETSUITE_ACCESS_TOKEN: str = ""
    NETSUITE_TOKEN: str = ""
    NETSUITE_TOKEN_SECRET: str = ""
    NETSUITE_REALM: str = "6738288_SB1"

    NETSUITE_CURRENCY_SCRIPT: str = "customscript_rg_restapi_currency_fetch"
    NETSUITE_CURRENCY_DEPLOY: str = "1"

    NETSUITE_HSN_SCRIPT: str = "customscript_rg_restapi_hsncode_fetch"
    NETSUITE_HSN_DEPLOY: str = "1"

    NETSUITE_LOCATION_SCRIPT: str = "customscript_rg_restapi_location_fetch"
    NETSUITE_LOCATION_DEPLOY: str = "1"

    class Config:
        env_file = str(Path(__file__).parent.parent.parent / ".env")
        extra = "ignore"

settings = Settings()
