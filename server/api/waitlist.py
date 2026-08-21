from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from core.database import get_db_pool
from api.venues import get_current_user
import secrets
import hashlib
from datetime import datetime, timedelta, timezone
from core.config import settings
import uuid

router = APIRouter()

class WaitlistJoin(BaseModel):
    category_id: str

@router.post("/events/{event_id}/waitlist", status_code=status.HTTP_201_CREATED)
async def join_waitlist(event_id: str, req: WaitlistJoin, user: dict = Depends(get_current_user)):
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        exists = await conn.fetchval(
            "SELECT 1 FROM waitlist_entries WHERE event_id = $1 AND category_id = $2 AND user_id = $3",
            event_id, req.category_id, user['sub']
        )
        if exists:
            raise HTTPException(status_code=400, detail="Already on waitlist")
            
        await conn.execute(
            "INSERT INTO waitlist_entries (event_id, category_id, user_id) VALUES ($1, $2, $3)",
            event_id, req.category_id, user['sub']
        )
        return {"status": "success"}

@router.post("/waitlist/claim/{token}")
async def claim_waitlist_offer(token: str, user: dict = Depends(get_current_user)):
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        async with conn.transaction():
            offer = await conn.fetchrow(
                """
                SELECT o.id, o.seat_id, o.expires_at, o.status, e.event_id, e.category_id 
                FROM waitlist_offers o
                JOIN waitlist_entries e ON o.waitlist_entry_id = e.id
                WHERE o.token_hash = $1 AND e.user_id = $2
                FOR UPDATE
                """,
                token_hash, user['sub']
            )
            
            if not offer:
                raise HTTPException(status_code=404, detail="Offer not found or invalid user")
            
            now = datetime.now(timezone.utc)
            if offer['status'] != 'PENDING' or offer['expires_at'] < now:
                raise HTTPException(status_code=400, detail="Offer expired or already claimed")
                
            booking_ref = f"WL-{uuid.uuid4().hex[:6].upper()}"
            price = await conn.fetchval("SELECT price FROM event_seat_categories WHERE id = $1", offer['category_id'])
            
            booking_id = await conn.fetchval(
                """
                INSERT INTO bookings (user_id, event_id, booking_reference, status, total_amount)
                VALUES ($1, $2, $3, $4, $5) RETURNING id
                """,
                user['sub'], offer['event_id'], booking_ref, 'CONFIRMED', price
            )
            
            await conn.execute("INSERT INTO booking_seats (booking_id, seat_id, price, category) VALUES ($1, $2, $3, $4)", booking_id, offer['seat_id'], price, 'Waitlist')
            await conn.execute("UPDATE waitlist_offers SET status = 'CLAIMED', claimed_at = $1 WHERE id = $2", now, offer['id'])
            
            await conn.execute(
                "INSERT INTO seat_events (seat_id, booking_id, user_id, event_type, timestamp) VALUES ($1, $2, $3, 'WAITLIST_CLAIM', $4)",
                offer['seat_id'], booking_id, user['sub'], now
            )
            
            return {"status": "success", "booking_reference": booking_ref}
