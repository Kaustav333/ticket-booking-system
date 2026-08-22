from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import List
from datetime import datetime, timedelta, timezone
from core.database import get_db_pool
from core.config import settings
from api.venues import get_current_user
import uuid
import qrcode
import io

router = APIRouter()

class HoldRequest(BaseModel):
    event_id: str
    seat_ids: List[str]

class ConfirmRequest(BaseModel):
    payment_token: str # mock

@router.post("/hold")
async def hold_seats(req: HoldRequest, user: dict = Depends(get_current_user)):
    """
    Atomic Multi-Seat Hold using SELECT ... FOR UPDATE.
    Guarantees no partial holds.
    """
    if not req.seat_ids:
        raise HTTPException(status_code=400, detail="No seats requested")
        
    pool = await get_db_pool()
    # Sort seat IDs to prevent deadlocks when locking multiple rows
    sorted_seat_ids = sorted(req.seat_ids)
    
    async with pool.acquire() as conn:
        async with conn.transaction():
            # 1. Lock the requested seats
            await conn.execute("SELECT id FROM seats WHERE id = ANY($1) FOR UPDATE", sorted_seat_ids)
            
            # 2. Check their current status in the view
            # Using NOW() to check if holds/offers have expired
            status_rows = await conn.fetch(
                """
                SELECT seat_id, status, expires_at 
                FROM seat_status_view 
                WHERE seat_id = ANY($1)
                """,
                sorted_seat_ids
            )
            
            status_map = {str(r['seat_id']): dict(r) for r in status_rows}
            now = datetime.now(timezone.utc)
            
            # 3. Verify availability
            for s_id in sorted_seat_ids:
                curr = status_map.get(s_id)
                if curr:
                    if curr['status'] in ('CONFIRM', 'WAITLIST_CLAIM'):
                        raise HTTPException(status_code=409, detail=f"Seat {s_id} is already booked")
                    if curr['status'] in ('HOLD', 'WAITLIST_OFFER') and curr['expires_at'] and curr['expires_at'] > now:
                        raise HTTPException(status_code=409, detail=f"Seat {s_id} is currently unavailable")
            
            # 4. If all clear, create booking entity & insert HOLD events
            booking_ref = f"TKT-{uuid.uuid4().hex[:6].upper()}"
            
            # Calculate total amount (mocked simplification for this snippet, typically fetch prices here)
            prices = await conn.fetch(
                "SELECT id, (SELECT price FROM event_seat_categories WHERE id = seats.category_id) as price FROM seats WHERE id = ANY($1)",
                sorted_seat_ids
            )
            total_amount = sum([p['price'] or 0 for p in prices])
            
            booking_id = await conn.fetchval(
                """
                INSERT INTO bookings (user_id, event_id, booking_reference, status, total_amount)
                VALUES ($1, $2, $3, $4, $5) RETURNING id
                """,
                user['sub'], req.event_id, booking_ref, 'HELD', total_amount
            )
            
            expires_at = now + timedelta(minutes=settings.HOLD_TTL_MINUTES)
            
            # Insert booking_seats
            b_seats_records = [(booking_id, p['id'], p['price'], 'Default') for p in prices]
            await conn.copy_records_to_table('booking_seats', columns=['booking_id', 'seat_id', 'price', 'category'], records=b_seats_records)
            
            # Insert seat_events
            events_records = [(s_id, booking_id, user['sub'], 'HOLD', now, expires_at) for s_id in sorted_seat_ids]
            await conn.copy_records_to_table(
                'seat_events', 
                columns=['seat_id', 'booking_id', 'user_id', 'event_type', 'timestamp', 'expires_at'], 
                records=events_records
            )
            
            return {
                "status": "success", 
                "booking_id": booking_id,
                "booking_reference": booking_ref,
                "expires_at": expires_at
            }

@router.post("/{booking_id}/confirm")
async def confirm_booking(booking_id: str, req: ConfirmRequest, user: dict = Depends(get_current_user)):
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        async with conn.transaction():
            # Lock the booking to prevent race with TTL sweeper
            booking = await conn.fetchrow("SELECT * FROM bookings WHERE id = $1 FOR UPDATE", booking_id)
            if not booking:
                raise HTTPException(status_code=404, detail="Booking not found")
            if str(booking['user_id']) != user['sub']:
                raise HTTPException(status_code=403, detail="Not your booking")
            if booking['status'] != 'HELD':
                raise HTTPException(status_code=400, detail="Booking is not in HELD state")
                
            # Verify the holds haven't expired
            holds = await conn.fetch("SELECT seat_id, expires_at FROM seat_events WHERE booking_id = $1 AND event_type = 'HOLD'", booking_id)
            now = datetime.now(timezone.utc)
            if not holds or any(h['expires_at'] < now for h in holds):
                raise HTTPException(status_code=400, detail="Hold has expired")
                
            # Payment mock...
            
            # Update booking
            await conn.execute("UPDATE bookings SET status = 'CONFIRMED', updated_at = $1 WHERE id = $2", now, booking_id)
            
            # Insert CONFIRM events
            confirm_records = [(h['seat_id'], booking_id, user['sub'], 'CONFIRM', now, None) for h in holds]
            await conn.copy_records_to_table(
                'seat_events',
                columns=['seat_id', 'booking_id', 'user_id', 'event_type', 'timestamp', 'expires_at'],
                records=confirm_records
            )
            
            # Generate QR Code for ticket
            qr = qrcode.QRCode(version=1, box_size=10, border=5)
            qr.add_data(booking['booking_reference'])
            qr.make(fit=True)
            img = qr.make_image(fill_color="black", back_color="white")
            
            # In a real app, save 'img' to GCS/S3 and attach URL to email.
            # Simulate Email Sending
            print(f"EMAIL SENT TO {user['sub']}: Your ticket is confirmed. Ref: {booking['booking_reference']}")
            
            return {"status": "success", "booking_reference": booking['booking_reference']}

@router.get("/history")
async def get_booking_history(user: dict = Depends(get_current_user)):
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT id, event_id, booking_reference, status, total_amount, created_at FROM bookings WHERE user_id = $1 ORDER BY created_at DESC",
            user['sub']
        )
        return [dict(row) for row in rows]

@router.get("/{booking_id}")
async def get_booking(booking_id: str, user: dict = Depends(get_current_user)):
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        booking = await conn.fetchrow(
            "SELECT id, event_id, booking_reference, status, total_amount, created_at FROM bookings WHERE id = $1 AND user_id = $2",
            booking_id, user['sub']
        )
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")
        
        # Get seats and expiration
        seats = await conn.fetch(
            """
            SELECT bs.seat_id, bs.price, bs.category, s.section, s.row_identifier, s.seat_identifier, se.expires_at
            FROM booking_seats bs
            JOIN seats s ON s.id = bs.seat_id
            LEFT JOIN seat_events se ON se.booking_id = bs.booking_id AND se.event_type = 'HOLD'
            WHERE bs.booking_id = $1
            """,
            booking_id
        )
        
        expires_at = seats[0]['expires_at'] if seats and seats[0]['expires_at'] else None
        
        return {
            **dict(booking),
            "expires_at": expires_at,
            "seats": [dict(s) for s in seats]
        }

@router.post("/{booking_id}/cancel")
async def cancel_booking(booking_id: str, user: dict = Depends(get_current_user)):
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        async with conn.transaction():
            booking = await conn.fetchrow("SELECT * FROM bookings WHERE id = $1 FOR UPDATE", booking_id)
            if not booking:
                raise HTTPException(status_code=404, detail="Booking not found")
            if str(booking['user_id']) != user['sub']:
                raise HTTPException(status_code=403, detail="Not your booking")
            if booking['status'] != 'CONFIRMED':
                raise HTTPException(status_code=400, detail="Only confirmed bookings can be cancelled")
            
            now = datetime.now(timezone.utc)
            await conn.execute("UPDATE bookings SET status = 'CANCELLED', updated_at = $1 WHERE id = $2", now, booking_id)
            
            seats = await conn.fetch("SELECT seat_id FROM booking_seats WHERE booking_id = $1", booking_id)
            cancel_records = [(s['seat_id'], booking_id, user['sub'], 'CANCEL', now, None) for s in seats]
            
            await conn.copy_records_to_table(
                'seat_events',
                columns=['seat_id', 'booking_id', 'user_id', 'event_type', 'timestamp', 'expires_at'],
                records=cancel_records
            )
            
            return {"status": "success"}
