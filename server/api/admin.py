from fastapi import APIRouter, Depends
from core.database import get_db_pool
from api.venues import require_admin

router = APIRouter()

@router.get("/metrics")
async def get_dashboard_metrics(admin: dict = Depends(require_admin)):
    """
    Admin Observability Dashboard derives metrics entirely from the event log.
    """
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        # Holds / Sec (Last 5 mins)
        holds_sec = await conn.fetchval(
            "SELECT COUNT(*) / 300.0 FROM seat_events WHERE event_type = 'HOLD' AND timestamp > NOW() - INTERVAL '5 minutes'"
        )
        
        # Confirmations / Sec
        confirms_sec = await conn.fetchval(
            "SELECT COUNT(*) / 300.0 FROM seat_events WHERE event_type = 'CONFIRM' AND timestamp > NOW() - INTERVAL '5 minutes'"
        )
        
        # Active holds
        active_holds = await conn.fetchval(
            "SELECT COUNT(*) FROM seat_status_view WHERE status = 'HOLD' AND expires_at > NOW()"
        )
        
        # TTL Expirations Total
        expired = await conn.fetchval(
            "SELECT COUNT(*) FROM seat_events WHERE event_type = 'EXPIRE'"
        )
        
        # Cancellations
        cancellations = await conn.fetchval(
            "SELECT COUNT(*) FROM seat_events WHERE event_type = 'CANCEL'"
        )
        
        # Waitlist Size
        waitlist_size = await conn.fetchval(
            "SELECT COUNT(*) FROM waitlist_entries WHERE status = 'WAITING'"
        )
        
        # Waitlist Offer Conversion
        total_offers = await conn.fetchval("SELECT COUNT(*) FROM waitlist_offers")
        claimed_offers = await conn.fetchval("SELECT COUNT(*) FROM waitlist_offers WHERE status = 'CLAIMED'")
        conversion = (claimed_offers / total_offers) * 100 if total_offers > 0 else 0
        
        # Total Revenue
        revenue = await conn.fetchval("SELECT SUM(total_amount) FROM bookings WHERE status = 'CONFIRMED'")
        
        return {
            "holds_per_second": holds_sec,
            "confirmations_per_second": confirms_sec,
            "active_holds": active_holds,
            "ttl_expirations": expired,
            "cancellations": cancellations,
            "waitlist_size": waitlist_size,
            "waitlist_conversion_rate": conversion,
            "revenue": float(revenue) if revenue else 0
        }

@router.post("/execute-schema-update")
async def execute_schema_update():
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        try:
            await conn.execute("ALTER TABLE events ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3,1);")
            await conn.execute("ALTER TABLE events ADD COLUMN IF NOT EXISTS category VARCHAR DEFAULT 'Movie';")
            return {"status": "success", "message": "Added average_rating and category columns"}
        except Exception as e:
            return {"status": "error", "message": str(e)}

@router.post("/seed-demo-events")
async def seed_demo_events():
    pool = await get_db_pool()
    import random
    from datetime import datetime, timedelta
    
    movie_titles = ["The Matrix", "Inception", "Interstellar", "Avengers: Endgame", "Avatar", "Titanic", "Gladiator", "The Dark Knight", "Joker", "Dune", "Oppenheimer", "Barbie", "Spider-Man: No Way Home", "Black Panther", "Mad Max: Fury Road", "Jurassic Park", "Star Wars: A New Hope", "The Lord of the Rings", "Harry Potter", "The Hunger Games", "Twilight", "Fast & Furious", "Mission: Impossible", "James Bond", "Pirates of the Caribbean", "Transformers", "X-Men", "Deadpool", "Logan", "Wonder Woman", "Aquaman", "Justice League", "The Flash", "Batman v Superman", "Man of Steel", "The Suicide Squad", "Guardians of the Galaxy", "Thor: Ragnarok", "Captain America: Civil War", "Iron Man", "Doctor Strange", "Ant-Man", "Black Widow", "Shang-Chi", "Eternals", "The Marvels", "Blade Runner 2049", "Arrival", "Gravity", "The Martian", "Ex Machina"]
    categories = ["Movie", "Concert", "Play", "Live"]
    
    async with pool.acquire() as conn:
        # Get admin user and a venue
        user_id = await conn.fetchval("SELECT id FROM users LIMIT 1")
        if not user_id: return {"error": "No users found"}
        
        venue_id = await conn.fetchval("SELECT id FROM venues LIMIT 1")
        if not venue_id: return {"error": "No venues found"}

        for i in range(50):
            title = random.choice(movie_titles) + f" {i}"
            category = random.choice(categories)
            rating = round(random.uniform(6.5, 9.9), 1)
            start_time = datetime.now() + timedelta(days=random.randint(1, 30))
            end_time = start_time + timedelta(hours=3)
            
            # Using picsum for reliable placeholder images
            thumbnail_url = f"https://picsum.photos/seed/{title.replace(' ', '')}/600/800"
            
            event_id = await conn.fetchval("""
                INSERT INTO events (organiser_id, venue_id, title, start_time, end_time, thumbnail_url, average_rating, category)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING id;
            """, user_id, venue_id, title, start_time, end_time, thumbnail_url, rating, category)
            
            cat_id = await conn.fetchval("""
                INSERT INTO event_seat_categories (event_id, name, price)
                VALUES ($1, 'General', $2)
                RETURNING id;
            """, event_id, random.choice([10.0, 15.0, 20.0, 50.0]))
            
            seats_data = []
            for r in range(1, 4):
                for s in range(1, 11):
                    seats_data.append((event_id, cat_id, 'Main', chr(64 + r), str(s)))
            await conn.executemany("""
                INSERT INTO seats (event_id, category_id, section, row_identifier, seat_identifier)
                VALUES ($1, $2, $3, $4, $5)
            """, seats_data)
            
    return {"status": "success", "message": "Seeded 50 demo events!"}

@router.post("/fix-images")
async def fix_images():
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        try:
            # Replaces fakeimg.pl URLs with picsum.photos URLs in the db
            rows = await conn.fetch("SELECT id, title FROM events WHERE thumbnail_url LIKE '%fakeimg.pl%'")
            for row in rows:
                new_url = f"https://picsum.photos/seed/{row['title'].replace(' ', '')}/600/800"
                await conn.execute("UPDATE events SET thumbnail_url = $1 WHERE id = $2", new_url, row['id'])
            return {"status": "success", "message": f"Fixed {len(rows)} images."}
        except Exception as e:
            return {"status": "error", "message": str(e)}

@router.post("/fix-real-posters")
async def fix_real_posters():
    pool = await get_db_pool()
    
    # Pre-curated list of real high-quality movie posters to guarantee they look great
    real_posters = {
        "Inception": "https://m.media-amazon.com/images/M/MV5BMjAxMzY3NjcxNF5BMl5BanBnXkFtZTcwNTI5OTM0Mw@@._V1_FMjpg_UX1000_.jpg",
        "The Dark Knight": "https://m.media-amazon.com/images/M/MV5BMTMxNTMwODM0NF5BMl5BanBnXkFtZTcwODAyMTk2Mw@@._V1_FMjpg_UX1000_.jpg",
        "Interstellar": "https://m.media-amazon.com/images/M/MV5BZjdkOTU3MDktN2IxOS0fromN2IxOS00NDQxLWIxYWUtZWIxYWUtZTE0ZjA4MzFjZWIxXkEyXkFqcGdeQXVyMTQxNzMzNDI@._V1_FMjpg_UX1000_.jpg",
        "The Matrix": "https://m.media-amazon.com/images/M/MV5BNzQzOTk3OTAtNDQ0Zi00ZTVkLWI0MTEtMDllZjNkYzNjNTc4L2ltYWdlXkEyXkFqcGdeQXVyNjU0OTQ0OTY@._V1_FMjpg_UX1000_.jpg",
        "Avatar": "https://m.media-amazon.com/images/M/MV5BZDA0OGQxNTItMDZkMC00N2UyLTg3MzMtYTJmNjg3Nzk5MzRiXkEyXkFqcGdeQXVyNDUzOTQ5MjY@._V1_FMjpg_UX1000_.jpg",
        "Titanic": "https://m.media-amazon.com/images/M/MV5BMDdmZGU3NDPhNjhlYi00ZTQzLThlZGMtMmNlODQ2MmU4YzZlXkEyXkFqcGdeQXVyMTQxNzMzNDI@._V1_FMjpg_UX1000_.jpg",
        "Gladiator": "https://m.media-amazon.com/images/M/MV5BMDliMmNhNDEtODUyOS00MzMzLWE2NzctOTFiYzU1N2ZjZDlkXkEyXkFqcGdeQXVyNjU0OTQ0OTY@._V1_FMjpg_UX1000_.jpg",
        "Joker": "https://m.media-amazon.com/images/M/MV5BNGVjNWI4ZGUtNzE0MS00YTJmLWE0ZDctN2ZiYTk2YmI3NTYyXkEyXkFqcGdeQXVyMTkxNjUyNQ@@._V1_FMjpg_UX1000_.jpg",
        "Oppenheimer": "https://m.media-amazon.com/images/M/MV5BMDBmYTZjNjUtN2M1MS00MTQ2LTk2ODgtNzc2M2QyZGE5NTVjXkEyXkFqcGdeQXVyNzAwMjU2MTY@._V1_FMjpg_UX1000_.jpg",
        "Barbie": "https://m.media-amazon.com/images/M/MV5BOWIwZGY0OTYtZjUzYy00NzRmLTg5YjMtNTFlZDE1YTFmNjhiXkEyXkFqcGdeQXVyMTUzMTg2ODkz._V1_FMjpg_UX1000_.jpg",
        "Dune": "https://m.media-amazon.com/images/M/MV5BN2FjNmEyNWMtMzM2MC00MjM2LWE3NDctYmZkZjRiZTMwZTI4XkEyXkFqcGdeQXVyMDM2NDM2MQ@@._V1_FMjpg_UX1000_.jpg",
        "Jurassic Park": "https://m.media-amazon.com/images/M/MV5BMjM2MDgxMDg0Nl5BMl5BanBnXkFtZTgwNTM2OTM5NDE@._V1_FMjpg_UX1000_.jpg",
        "Harry Potter": "https://m.media-amazon.com/images/M/MV5BNmQ0ODBhMjUtNDRhOC00MGQzLTk5MTAtZDliODg5NmU5MTExXkEyXkFqcGdeQXVyNzkwMjQ5NzM@._V1_FMjpg_UX1000_.jpg",
        "The Lord of the Rings": "https://m.media-amazon.com/images/M/MV5BN2EyZjM3NzUtNWUzMi00MTgxLWI0NTctMzY4M2VlOTdjZWRiXkEyXkFqcGdeQXVyNDUzOTQ5MjY@._V1_FMjpg_UX1000_.jpg",
    }
    
    # Fallback to TMDB high quality generic placeholder if movie is not in dictionary
    default_poster = "https://m.media-amazon.com/images/M/MV5BMTczNTI2ODUwOF5BMl5BanBnXkFtZTcwMTU0NTIzMw@@._V1_FMjpg_UX1000_.jpg" # Iron Man as fallback
    
    async with pool.acquire() as conn:
        try:
            rows = await conn.fetch("SELECT id, title, category FROM events")
            updated = 0
            for row in rows:
                if row['category'] != 'Movie': continue
                
                # Strip the appended number like "The Matrix 0" -> "The Matrix"
                clean_title = " ".join([w for w in row['title'].split() if not w.isdigit()])
                
                art_url = real_posters.get(clean_title, default_poster)
                await conn.execute("UPDATE events SET thumbnail_url = $1 WHERE id = $2", art_url, row['id'])
                updated += 1
                    
            return {"status": "success", "message": f"Updated {updated} events with real movie posters!"}
        except Exception as e:
            return {"status": "error", "message": str(e)}
#   T r i g g e r   r e b u i l d  
 