import asyncio
import asyncpg
import random

async def run():
    conn = await asyncpg.connect('postgresql://postgres.wgvohfyhkfcevnjeizhg:Kaustav4$567$@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres')
    
    # Check current venues
    v_sydney = await conn.fetchval("SELECT id FROM venues WHERE location = 'Sydney' LIMIT 1")
    
    v_mumbai = await conn.fetchval("""
        INSERT INTO venues (name, location) VALUES ('Jio World Centre', 'Mumbai') RETURNING id
    """)
    v_delhi = await conn.fetchval("""
        INSERT INTO venues (name, location) VALUES ('JLN Stadium', 'Delhi') RETURNING id
    """)
    v_blr = await conn.fetchval("""
        INSERT INTO venues (name, location) VALUES ('Chinnaswamy Stadium', 'Bengaluru') RETURNING id
    """)
    
    venues = [v_sydney, v_mumbai, v_delhi, v_blr]
    
    events = await conn.fetch("SELECT id FROM events")
    
    for evt in events:
        new_v = random.choice(venues)
        await conn.execute("UPDATE events SET venue_id = $1 WHERE id = $2", new_v, evt['id'])
        
    print("Randomized event locations!")
    await conn.close()

asyncio.run(run())
