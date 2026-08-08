from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql://postgres:postgres@localhost:5432/org_knowledge_graph"
    jwt_secret: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 2
    refresh_token_expire_days: int = 7
    bcrypt_rounds: int = 12
    otp_expire_minutes: int = 10
    dean_email: str = "dean@stme.edu"

    # Gmail SMTP — leave blank to fall back to console print
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""  # Gmail App Password (16 chars); leading/trailing whitespace stripped

    @property
    def smtp_password_clean(self) -> str:
        return self.smtp_password.strip()
    smtp_from: str = ""      # defaults to smtp_user if blank

    # CORS — comma-separated origins, e.g. "http://localhost:5173,http://192.168.1.5:5173"
    # Set to "*" to allow all origins (dev only)
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
