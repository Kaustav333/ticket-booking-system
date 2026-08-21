import asyncpg
from core.config import settings

class Database:
    def __init__(self):
        self.pool = None

    async def connect(self):
        self.pool = await asyncpg.create_pool(dsn=settings.DATABASE_URL)

    async def disconnect(self):
        if self.pool:
            await self.pool.close()

db = Database()

async def get_db_pool():
    return db.pool
