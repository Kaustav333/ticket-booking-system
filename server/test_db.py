import os
import os
import asyncio
import asyncpg
async def main():
    conn = await asyncpg.connect(os.getenv('DATABASE_URL'))
    events = await conn.fetch("SELECT * FROM events")
    print(events)
    await conn.close()
asyncio.run(main())
