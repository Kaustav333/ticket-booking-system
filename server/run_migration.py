import asyncio
import asyncpg

async def run():
    conn = await asyncpg.connect('postgresql://postgres.wgvohfyhkfcevnjeizhg:Kaustav4$567$@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres')
    await conn.execute('ALTER TABLE events ADD COLUMN IF NOT EXISTS thumbnail_url VARCHAR;')
    await conn.close()
    print('Migration complete')

asyncio.run(run())
