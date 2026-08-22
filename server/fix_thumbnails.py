import os
import asyncio
import asyncpg

async def run():
    conn = await asyncpg.connect(os.getenv('DATABASE_URL'))
    
    # Try to delete the old event
    try:
        await conn.execute("DELETE FROM events WHERE title = 'Coldplay Concert 2026'")
    except:
        pass
        
    await conn.execute("UPDATE events SET thumbnail_url = 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=600&h=800&fit=crop' WHERE title LIKE '%Coldplay Music%'")
    await conn.execute("UPDATE events SET thumbnail_url = 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&h=800&fit=crop' WHERE title LIKE '%Hamilton%'")
    
    await conn.close()
    print('Fixed thumbnails!')

asyncio.run(run())
