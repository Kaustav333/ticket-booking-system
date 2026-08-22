import os
import asyncio
import asyncpg

async def run():
    conn = await asyncpg.connect(os.getenv('DATABASE_URL'))
    await conn.execute('ALTER TABLE events ADD COLUMN IF NOT EXISTS thumbnail_url VARCHAR;')
    await conn.close()
    print('Migration complete')

asyncio.run(run())
