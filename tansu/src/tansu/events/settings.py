from pydantic import Field, SecretStr
from pydantic_settings import BaseSettings


class BackendDB(BaseSettings):
    host: str = Field("localhost", validation_alias="POSTGRES_HOST")
    port: int = Field(5432, validation_alias="POSTGRES_PORT")
    database: str = Field("tansu_test", validation_alias="POSTGRES_DATABASE")
    username: str = Field("tansu_test", validation_alias="POSTGRES_USER")
    password: SecretStr = Field("tansu_test", validation_alias="POSTGRES_PASSWORD")


BACKEND_CONFIG = BackendDB()
