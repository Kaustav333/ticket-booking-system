import asyncio
import asyncpg
import random

async def run():
    conn = await asyncpg.connect('postgresql://postgres.wgvohfyhkfcevnjeizhg:Kaustav4$567$@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres')
    
    # Get all events
    events = await conn.fetch("SELECT id, title, category FROM events")
    
    print("Deleting old seats and categories...")
    await conn.execute("DELETE FROM booking_seats")
    await conn.execute("DELETE FROM seat_events")
    await conn.execute("DELETE FROM bookings")
    await conn.execute("DELETE FROM waitlist_offers")
    await conn.execute("DELETE FROM waitlist_entries")
    await conn.execute("DELETE FROM seats")
    await conn.execute("DELETE FROM event_seat_categories")
    
    print("Generating new realistic seating layouts...")
    for evt in events:
        event_id = evt['id']
        category = evt['category']
        
        # Base multiplier based on category
        multiplier = 1.0
        if category == 'Sports': multiplier = 0.5
        elif category == 'Plays': multiplier = 1.5
        elif category == 'Events': multiplier = 2.0
        elif category == 'Stream': multiplier = 0.1
        
        # 1. Create Seat Categories
        vip_cat_id = await conn.fetchval("""
            INSERT INTO event_seat_categories (event_id, name, price)
            VALUES ($1, 'VIP / Premium', $2)
            RETURNING id;
        """, event_id, 2500.00 * multiplier)
        
        gold_cat_id = await conn.fetchval("""
            INSERT INTO event_seat_categories (event_id, name, price)
            VALUES ($1, 'Gold Class', $2)
            RETURNING id;
        """, event_id, 1200.00 * multiplier)
        
        silver_cat_id = await conn.fetchval("""
            INSERT INTO event_seat_categories (event_id, name, price)
            VALUES ($1, 'Silver / General', $2)
            RETURNING id;
        """, event_id, 500.00 * multiplier)
        
        # 2. Create Seats (A-J, 1-15)
        seats_data = []
        for r in range(1, 11):
            row = chr(64 + r) # A, B, C, D, E, F, G, H, I, J
            
            # VIP in front (A-C), Gold in middle (D-G), Silver in back (H-J)
            if r <= 3:
                cat_id = vip_cat_id
            elif r <= 7:
                cat_id = gold_cat_id
            else:
                cat_id = silver_cat_id
                
            for s in range(1, 16):
                seats_data.append((event_id, cat_id, 'Main Arena', row, str(s)))
                
        await conn.executemany("""
            INSERT INTO seats (event_id, category_id, section, row_identifier, seat_identifier)
            VALUES ($1, $2, $3, $4, $5)
        """, seats_data)
        print(f"Created 150 seats for {evt['title']}")
    
    await conn.close()
    print('All seats upgraded!')

asyncio.run(run())
