from dataclasses import dataclass
import os

@dataclass(frozen=True)
class Settings:
    mode: str = os.getenv('STOCKMASTER_MODE', 'local')
    version: str = '3.1'
    build: str = '15.4B1'

settings = Settings()
