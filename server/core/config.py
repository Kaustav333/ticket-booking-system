from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://ticket_user:ticket_password@localhost:5432/ticket_booking"
    JWT_SECRET: str = "supersecretkey"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    HOLD_TTL_MINUTES: int = 10
    WAITLIST_OFFER_TTL_MINUTES: int = 15

    class Config:
        env_file = ".env"

settings = Settings()
