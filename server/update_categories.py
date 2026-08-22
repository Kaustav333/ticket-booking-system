import asyncio
import asyncpg

async def run():
    conn = await asyncpg.connect('postgresql://postgres.wgvohfyhkfcevnjeizhg:Kaustav4$567$@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres')
    
    # 1. Add column if not exists
    try:
        await conn.execute("ALTER TABLE events ADD COLUMN category VARCHAR DEFAULT 'Events'")
    except asyncpg.exceptions.DuplicateColumnError:
        pass

    # 2. Update existing rows to match some categories
    await conn.execute("UPDATE events SET category = 'Movies' WHERE title LIKE '%Spiderman%'")
    await conn.execute("UPDATE events SET category = 'Plays' WHERE title LIKE '%Hamilton%'")
    await conn.execute("UPDATE events SET category = 'Events' WHERE title LIKE '%Coldplay%' OR title LIKE '%Zakir%'")

    await conn.close()
    print('Category column added and data updated!')

asyncio.run(run())
