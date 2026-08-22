import os
import os
import asyncio
import asyncpg
import bcrypt
from datetime import datetime, timedelta

async def seed():
    conn = await asyncpg.connect(os.getenv('DATABASE_URL'))
    
    print("Connected to DB. Seeding more events...")
    
    # Get user
    user_id = await conn.fetchval("SELECT id FROM users WHERE email=$1", "kaustavkalita9954@gmail.com")
    
    # Get venue
    venue_id = await conn.fetchval("SELECT id FROM venues LIMIT 1")
    
    # 3. Create Events
    events_to_create = [
        {
            "title": "Inception - IMAX Re-release",
            "category": "Movies",
            "thumbnail_url": "https://picsum.photos/seed/inception/600/800",
            "days_offset": 5
        },
        {
            "title": "Formula 1: Abu Dhabi Grand Prix",
            "category": "Sports",
            "thumbnail_url": "https://picsum.photos/seed/f1/600/800",
            "days_offset": 30
        },
        {
            "title": "The Phantom of the Opera",
            "category": "Plays",
            "thumbnail_url": "https://picsum.photos/seed/phantom/600/800",
            "days_offset": 12
        },
        {
            "title": "Trek to Valley of Flowers",
            "category": "Activities",
            "thumbnail_url": "https://picsum.photos/seed/trek/600/800",
            "days_offset": 45
        },
        {
            "title": "Tech Conference 2026",
            "category": "Stream",
            "thumbnail_url": "https://picsum.photos/seed/tech/600/800",
            "days_offset": 3
        },
        {
            "title": "Tomorrowland 2026",
            "category": "Events",
            "thumbnail_url": "https://picsum.photos/seed/tomorrowland/600/800",
            "days_offset": 60
        },
        {
            "title": "Interstellar - 10th Anniversary",
            "category": "Movies",
            "thumbnail_url": "https://picsum.photos/seed/interstellar/600/800",
            "days_offset": 8
        },
        {
            "title": "IPL Final 2026",
            "category": "Sports",
            "thumbnail_url": "https://picsum.photos/seed/ipl/600/800",
            "days_offset": 15
        }
    ]

    for evt in events_to_create:
        start_time = datetime.now() + timedelta(days=evt["days_offset"])
        end_time = start_time + timedelta(hours=3)
        
        event_id = await conn.fetchval("""
            INSERT INTO events (organiser_id, venue_id, title, category, start_time, end_time, thumbnail_url, payment_details, payment_qr_url)
            VALUES ($1, $2, $3, $4, $5, $6, $7, 'Bank: XYZ\nAcc: 123456', 'https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_mobile_English_Wikipedia.svg')
            RETURNING id;
        """, user_id, venue_id, evt["title"], evt["category"], start_time, end_time, evt["thumbnail_url"])
        print(f"Created Event: {evt['title']} ({event_id})")
        
        # 4. Create Seat Categories
        vip_cat_id = await conn.fetchval("""
            INSERT INTO event_seat_categories (event_id, name, price)
            VALUES ($1, 'VIP', 250.00)
            RETURNING id;
        """, event_id)
        
        gen_cat_id = await conn.fetchval("""
            INSERT INTO event_seat_categories (event_id, name, price)
            VALUES ($1, 'General', 100.00)
            RETURNING id;
        """, event_id)
        
        # 5. Create Seats (2 rows, 5 seats each)
        seats_data = []
        for r in range(1, 3):
            row = chr(64 + r) # A, B
            cat_id = vip_cat_id if r == 1 else gen_cat_id
            for s in range(1, 11):
                seats_data.append((event_id, cat_id, 'Main', row, str(s)))
                
        await conn.executemany("""
            INSERT INTO seats (event_id, category_id, section, row_identifier, seat_identifier)
            VALUES ($1, $2, $3, $4, $5)
        """, seats_data)
    
    await conn.close()
    print("Seeding Complete.")

if __name__ == "__main__":
    asyncio.run(seed())
