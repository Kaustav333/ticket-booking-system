import asyncio
import asyncpg
import bcrypt
from datetime import datetime, timedelta

async def seed():
    conn = await asyncpg.connect("postgresql://postgres.wgvohfyhkfcevnjeizhg:Kaustav4%24567%24@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres")
    
    print("Connected to DB. Seeding...")
    
    # 1. Create a User
    # Hash password with bcrypt directly
    salt = bcrypt.gensalt()
    password_hash = bcrypt.hashpw("password123".encode('utf-8'), salt).decode('utf-8')
    
    user_id = await conn.fetchval("""
        INSERT INTO users (email, password_hash, name, role)
        VALUES ($1, $2, $3, 'admin')
        ON CONFLICT (email) DO UPDATE SET password_hash = $2
        RETURNING id;
    """, "kaustavkalita9954@gmail.com", password_hash, "Kaustav")
    
    if user_id is None:
        user_id = await conn.fetchval("SELECT id FROM users WHERE email=$1", "kaustavkalita9954@gmail.com")
        print(f"User already existed, fetched ID: {user_id}")
    else:
        print(f"Created/Updated User: {user_id}")
    
    # 2. Create a Venue
    venue_id = await conn.fetchval("""
        INSERT INTO venues (name, location)
        VALUES ('Grand Arena', 'Sydney')
        RETURNING id;
    """)
    print(f"Created Venue: {venue_id}")
    
    # 3. Create Events
    events_to_create = [
        {
            "title": "Coldplay Music Of The Spheres",
            "thumbnail_url": "https://images.unsplash.com/photo-1540039155733-d7696d4eb98b?w=600&h=800&fit=crop",
            "days_offset": 7
        },
        {
            "title": "Zakir Khan Live",
            "thumbnail_url": "https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=600&h=800&fit=crop",
            "days_offset": 14
        },
        {
            "title": "Spiderman: Brand New Day",
            "thumbnail_url": "https://images.unsplash.com/photo-1635805737707-575885ab0820?w=600&h=800&fit=crop",
            "days_offset": 2
        },
        {
            "title": "Hamilton - The Musical",
            "thumbnail_url": "https://images.unsplash.com/photo-1507676184212-d0c30a3c3738?w=600&h=800&fit=crop",
            "days_offset": 21
        }
    ]

    for evt in events_to_create:
        start_time = datetime.now() + timedelta(days=evt["days_offset"])
        end_time = start_time + timedelta(hours=3)
        event_id = await conn.fetchval("""
            INSERT INTO events (organiser_id, venue_id, title, start_time, end_time, thumbnail_url, payment_details, payment_qr_url)
            VALUES ($1, $2, $3, $4, $5, $6, 'Bank: XYZ\nAcc: 123456', 'https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_mobile_English_Wikipedia.svg')
            RETURNING id;
        """, user_id, venue_id, evt["title"], start_time, end_time, evt["thumbnail_url"])
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
