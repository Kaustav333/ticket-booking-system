from apscheduler.schedulers.asyncio import AsyncIOScheduler
from core.database import db
import logging
import secrets
import hashlib
from datetime import datetime, timezone, timedelta

logger = logging.getLogger(__name__)

async def expire_holds_job():
    if not db.pool:
        return
    
    async with db.pool.acquire() as conn:
        async with conn.transaction():
            # Find expired holds
            rows = await conn.fetch(
                """
                SELECT id 
                FROM bookings 
                WHERE status = 'HELD' 
                AND id IN (
                    SELECT booking_id 
                    FROM seat_events 
                    WHERE event_type = 'HOLD' 
                    AND expires_at < NOW()
                )
                FOR UPDATE SKIP LOCKED
                """
            )
            
            if not rows:
                return
            
            booking_ids = [r['id'] for r in rows]
            
            # Update bookings to CANCELLED
            await conn.execute(
                "UPDATE bookings SET status = 'CANCELLED', updated_at = NOW() WHERE id = ANY($1)",
                booking_ids
            )
            
            seats = await conn.fetch(
                "SELECT seat_id, booking_id FROM seat_events WHERE booking_id = ANY($1) AND event_type = 'HOLD'",
                booking_ids
            )
            
            expire_records = [(s['seat_id'], s['booking_id'], None, 'EXPIRE', datetime.now(timezone.utc)) for s in seats]
            await conn.copy_records_to_table(
                'seat_events',
                columns=['seat_id', 'booking_id', 'user_id', 'event_type', 'timestamp'],
                records=expire_records
            )

async def expire_waitlist_offers_job():
    """Expires waitlist offers that were not claimed in time, penalizes the user."""
    if not db.pool:
        return
    async with db.pool.acquire() as conn:
        async with conn.transaction():
            rows = await conn.fetch(
                """
                SELECT o.id, o.waitlist_entry_id 
                FROM waitlist_offers o
                WHERE o.status = 'PENDING' AND o.expires_at < NOW()
                FOR UPDATE SKIP LOCKED
                """
            )
            if not rows:
                return
                
            offer_ids = [r['id'] for r in rows]
            entry_ids = [r['waitlist_entry_id'] for r in rows]
            
            # Expire offers
            await conn.execute("UPDATE waitlist_offers SET status = 'EXPIRED' WHERE id = ANY($1)", offer_ids)
            
            # Penalize users (demote priority by incrementing no_show_count)
            await conn.execute("UPDATE waitlist_entries SET expired_offers_count = expired_offers_count + 1 WHERE id = ANY($1)", entry_ids)

async def allocate_waitlist_job():
    """
    Finds seats that are AVAILABLE (latest event is RELEASE, EXPIRE, CANCEL, WAITLIST_OFFER_EXPIRE)
    and maps them to waitlist entries using the fairness formula.
    Priority Score = joined_at_epoch_ms + (expired_offers_count * 86400000)
    """
    if not db.pool:
        return
    async with db.pool.acquire() as conn:
        async with conn.transaction():
            # Find available seats that have an active waitlist queue for their category
            # This is complex in SQL, but for demonstration:
            available_seats = await conn.fetch(
                """
                SELECT v.seat_id, s.event_id, s.category_id 
                FROM seat_status_view v
                JOIN seats s ON v.seat_id = s.id
                WHERE v.status IN ('RELEASE', 'EXPIRE', 'CANCEL', 'WAITLIST_OFFER_EXPIRE')
                """
            )
            
            if not available_seats:
                return
                
            for seat in available_seats:
                # Find the highest priority user for this category
                # 86400 seconds = 1 day penalty per missed offer
                winner = await conn.fetchrow(
                    """
                    SELECT id, user_id FROM waitlist_entries 
                    WHERE event_id = $1 AND category_id = $2 AND status = 'WAITING'
                    ORDER BY (EXTRACT(EPOCH FROM joined_at) + (expired_offers_count * 86400)) ASC
                    LIMIT 1
                    FOR UPDATE SKIP LOCKED
                    """,
                    seat['event_id'], seat['category_id']
                )
                
                if winner:
                    token = secrets.token_urlsafe(32)
                    token_hash = hashlib.sha256(token.encode()).hexdigest()
                    expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)
                    
                    # Create Offer
                    await conn.execute(
                        """
                        INSERT INTO waitlist_offers (waitlist_entry_id, seat_id, token_hash, expires_at)
                        VALUES ($1, $2, $3, $4)
                        """,
                        winner['id'], seat['seat_id'], token_hash, expires_at
                    )
                    
                    # Update status
                    await conn.execute("UPDATE waitlist_entries SET status = 'OFFERED' WHERE id = $1", winner['id'])
                    
                    # Reserve seat for offer
                    await conn.execute(
                        "INSERT INTO seat_events (seat_id, user_id, event_type, expires_at) VALUES ($1, $2, 'WAITLIST_OFFER', $3)",
                        seat['seat_id'], winner['user_id'], expires_at
                    )
                    
                    # (Mock) Send email with token to winner['user_id']
                    claim_link = f"http://localhost:5173/claim/{token}"
                    print(f"EMAIL SENT TO {winner['user_id']}: A seat is available! Claim within 15 mins: {claim_link}")
                    logger.info(f"Waitlist offer sent for seat {seat['seat_id']} to user {winner['user_id']}")

scheduler = AsyncIOScheduler()

def start_scheduler():
    scheduler.add_job(expire_holds_job, 'interval', seconds=5)
    scheduler.add_job(expire_waitlist_offers_job, 'interval', seconds=5)
    scheduler.add_job(allocate_waitlist_job, 'interval', seconds=5)
    scheduler.start()
